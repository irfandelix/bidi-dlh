/**
 * Utility to paginate docx-preview rendered sections into strict A4 pages.
 * Ensures:
 * 1. Every sheet is bounded to exact physical A4 paper dimensions (210mm x 297mm).
 * 2. Tables and paragraphs cleanly split across A4 sheets without overflowing.
 * 3. Footers are pinned to the bottom of EVERY sheet and guaranteed to be visible.
 * 4. Paraf footers (Pihak Usaha & Tim Pengawas) appear on pages up to Dokumentasi,
 *    and clean page-number footers appear on the final signature pages.
 * 5. Accurate page numbers ("Halaman X dari Y") are rendered in the footer.
 */

export function paginateDocxContainer(container: HTMLElement): number {
  if (!container) return 0;

  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  if (sections.length === 0) return 0;

  // Track footers discovered from the document
  let parafFooterTemplate: HTMLElement | null = null;
  let pageOnlyFooterTemplate: HTMLElement | null = null;

  // First pass: locate footer templates from existing sections
  for (const sec of sections) {
    const f = sec.querySelector<HTMLElement>('footer');
    if (f) {
      const text = f.textContent || '';
      if (/Paraf/i.test(text)) {
        if (!parafFooterTemplate) parafFooterTemplate = f.cloneNode(true) as HTMLElement;
      } else {
        if (!pageOnlyFooterTemplate) pageOnlyFooterTemplate = f.cloneNode(true) as HTMLElement;
      }
    }
  }

  // Fallback default footer templates if not yet discovered
  if (!pageOnlyFooterTemplate) {
    pageOnlyFooterTemplate = createDefaultPageNumberFooter();
  }
  if (!parafFooterTemplate) {
    parafFooterTemplate = pageOnlyFooterTemplate.cloneNode(true) as HTMLElement;
  }

  const allFinalPages: HTMLElement[] = [];

  for (const section of sections) {
    const article = section.querySelector<HTMLElement>('article');
    if (!article) {
      allFinalPages.push(section);
      continue;
    }

    // Measure rendered width of section
    const sectionWidth = section.offsetWidth || 794;
    // A4 aspect ratio: height = width * (297 / 210)
    const a4Height = Math.round(sectionWidth * (297 / 210));

    // Measure paddings
    const comp = window.getComputedStyle(section);
    const padTop = parseFloat(comp.paddingTop) || 45;

    // Determine footer for this section
    let activeFooter = section.querySelector<HTMLElement>('footer');
    const isSignatureSection = isSignaturesSection(section);

    if (!activeFooter) {
      const templateToUse = isSignatureSection ? pageOnlyFooterTemplate : parafFooterTemplate;
      activeFooter = templateToUse.cloneNode(true) as HTMLElement;
      section.appendChild(activeFooter);
    } else {
      // If signature section had paraf footer, swap to page-only footer
      if (isSignatureSection && /Paraf/i.test(activeFooter.textContent || '')) {
        const cleanFooter = pageOnlyFooterTemplate.cloneNode(true) as HTMLElement;
        activeFooter.replaceWith(cleanFooter);
        activeFooter = cleanFooter;
      }
    }

    // Reserved height for footer + bottom margin to prevent body overlap
    const footerReservation = 125; // 125px ensures body content never overlaps the pinned footer
    const maxArticleHeight = a4Height - padTop - footerReservation;

    // Check if section already fits within 1 A4 page
    if (article.scrollHeight <= maxArticleHeight + 15) {
      applyA4Styles(section, a4Height);
      allFinalPages.push(section);
      continue;
    }

    // Section exceeds 1 A4 page! Split into multiple pages
    const originalChildren = Array.from(article.children) as HTMLElement[];
    article.innerHTML = '';

    let currentPage = section;
    let currentArticle = article;
    applyA4Styles(currentPage, a4Height);
    allFinalPages.push(currentPage);

    function createNextPage(): HTMLElement {
      const newPage = document.createElement('section');
      newPage.className = section.className;
      newPage.style.cssText = section.style.cssText;
      applyA4Styles(newPage, a4Height);

      const headerEl = section.querySelector<HTMLElement>('header');
      if (headerEl) {
        newPage.appendChild(headerEl.cloneNode(true));
      }

      const newArt = document.createElement('article');
      newArt.style.cssText = article.style.cssText;
      newArt.className = article.className;
      newPage.appendChild(newArt);

      // Clone footer for the new page
      const footerToClone = isSignatureSection ? pageOnlyFooterTemplate : parafFooterTemplate;
      if (footerToClone) {
        newPage.appendChild(footerToClone.cloneNode(true));
      }

      currentPage.after(newPage);
      currentPage = newPage;
      currentArticle = newArt;
      allFinalPages.push(newPage);
      return newPage;
    }

    function createTableShell(srcTable: HTMLTableElement): { table: HTMLTableElement; tbody: HTMLElement } {
      const table = srcTable.cloneNode(false) as HTMLTableElement;
      table.style.cssText = srcTable.style.cssText;
      table.className = srcTable.className;

      const colgroups = srcTable.querySelectorAll('colgroup');
      colgroups.forEach(cg => table.appendChild(cg.cloneNode(true)));

      const thead = srcTable.querySelector('thead');
      if (thead) table.appendChild(thead.cloneNode(true));

      const origTbody = srcTable.querySelector('tbody');
      const tbody = origTbody ? (origTbody.cloneNode(false) as HTMLElement) : document.createElement('tbody');
      table.appendChild(tbody);
      return { table, tbody };
    }

    for (const child of originalChildren) {
      if (child.tagName !== 'TABLE') {
        currentArticle.appendChild(child);
        if (currentArticle.scrollHeight > maxArticleHeight && currentArticle.children.length > 1) {
          currentArticle.removeChild(child);
          createNextPage();
          currentArticle.appendChild(child);
        }
      } else {
        // Table element
        const srcTable = child as HTMLTableElement;
        currentArticle.appendChild(srcTable);
        if (currentArticle.scrollHeight <= maxArticleHeight) {
          // Table completely fits on current page
          continue;
        }

        // Table exceeds current page space
        currentArticle.removeChild(srcTable);

        const rows = Array.from(srcTable.querySelectorAll('tr'));
        let { table: activeTable, tbody: activeTbody } = createTableShell(srcTable);
        currentArticle.appendChild(activeTable);

        for (const row of rows) {
          activeTbody.appendChild(row);
          if (currentArticle.scrollHeight > maxArticleHeight && activeTbody.children.length > 1) {
            activeTbody.removeChild(row);
            createNextPage();
            const next = createTableShell(srcTable);
            activeTable = next.table;
            activeTbody = next.tbody;
            activeTbody.appendChild(row);
            currentArticle.appendChild(activeTable);
          }
        }
      }
    }
  }

  // Update Page Number Badges and Footer Page Texts across all final sheets
  updateAllPageNumbersAndFooters(allFinalPages);

  return allFinalPages.length;
}

function applyA4Styles(el: HTMLElement, a4Height: number) {
  el.style.height = `${a4Height}px`;
  el.style.minHeight = `${a4Height}px`;
  el.style.maxHeight = `${a4Height}px`;
  el.style.overflow = 'hidden';
  el.style.position = 'relative';
  el.style.boxSizing = 'border-box';
}

function isSignaturesSection(section: HTMLElement): boolean {
  const text = section.textContent || '';
  return /Demikian Berita Acara/i.test(text) || /Tim Pejabat Pengawas Lingkungan Hidup/i.test(text);
}

function createDefaultPageNumberFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div style="width: 100%; text-align: center; font-size: 8.5pt; color: #64748b; font-family: Arial, sans-serif;">
      <p style="margin: 0;">Halaman 1 dari 1</p>
    </div>
  `;
  return footer;
}

function updateAllPageNumbersAndFooters(pages: HTMLElement[]) {
  const total = pages.length;

  pages.forEach((page, index) => {
    const pageNum = index + 1;

    // 1. Update/Add Page Number Badge at top-right
    let badge = page.querySelector<HTMLElement>('.bap-page-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'bap-page-badge';
      badge.style.cssText = `
        position: absolute;
        top: 10px;
        right: 14px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #64748b;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 3px 8px;
        pointer-events: none;
        user-select: none;
        z-index: 40;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      `;
      page.appendChild(badge);
    }
    badge.textContent = `Halaman ${pageNum} dari ${total}`;

    // 2. Update Footer page number text
    const footer = page.querySelector<HTMLElement>('footer');
    if (footer) {
      const candidates = Array.from(footer.querySelectorAll<HTMLElement>('p, td, span, div'));
      let found = false;
      for (const el of candidates) {
        if (el.textContent && /Halaman\s*.*dari/i.test(el.textContent)) {
          el.textContent = `Halaman ${pageNum} dari ${total}`;
          found = true;
          break;
        }
      }
      if (!found) {
        // If no "Halaman ... dari ..." element found, check center td
        const centerTd = footer.querySelector('table tr td:nth-child(2)');
        if (centerTd) {
          centerTd.textContent = `Halaman ${pageNum} dari ${total}`;
        }
      }
    }
  });
}
