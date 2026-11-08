/**
 * Utility to paginate docx-preview rendered sections into strict A4 pages.
 * Ensures:
 * 1. Faithfully preserves and respects the user's Word template layout, sections, and footers.
 * 2. Every sheet is bounded to exact physical A4 paper dimensions (210mm x 297mm).
 * 3. Tables and paragraphs cleanly split across A4 sheets without overflowing or clipping.
 * 4. Footers from the template (paraf tables for checklist/documentation, page number only for signatures)
 *    are pinned to the bottom of EVERY sheet and guaranteed to be visible.
 * 5. Leaf-level page number text ("Halaman X dari Y") is updated accurately without altering paraf images or tables.
 */

export function paginateDocxContainer(container: HTMLElement): number {
  if (!container) return 0;

  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  if (sections.length === 0) return 0;

  // Track discovered footers across sections as templates
  let lastDiscoveredParafFooter: HTMLElement | null = null;
  let lastDiscoveredPageOnlyFooter: HTMLElement | null = null;

  for (const sec of sections) {
    const f = sec.querySelector<HTMLElement>('footer');
    if (f) {
      if (/Paraf/i.test(f.textContent || '')) {
        if (!lastDiscoveredParafFooter) lastDiscoveredParafFooter = f.cloneNode(true) as HTMLElement;
      } else {
        if (!lastDiscoveredPageOnlyFooter) lastDiscoveredPageOnlyFooter = f.cloneNode(true) as HTMLElement;
      }
    }
  }

  if (!lastDiscoveredPageOnlyFooter) {
    lastDiscoveredPageOnlyFooter = createDefaultPageNumberFooter();
  }
  if (!lastDiscoveredParafFooter) {
    lastDiscoveredParafFooter = lastDiscoveredPageOnlyFooter.cloneNode(true) as HTMLElement;
  }

  const allFinalPages: HTMLElement[] = [];
  let currentRunningFooterTemplate: HTMLElement | null = lastDiscoveredParafFooter;

  for (const section of sections) {
    const article = section.querySelector<HTMLElement>('article');
    if (!article) {
      allFinalPages.push(section);
      continue;
    }

    // Measure rendered width and calculate exact A4 aspect ratio height
    const sectionWidth = section.offsetWidth || 794;
    const a4Height = Math.round(sectionWidth * (297 / 210));

    // Measure top padding
    const comp = window.getComputedStyle(section);
    const padTop = parseFloat(comp.paddingTop) || 45;

    // Determine footer for this section:
    // Prefer the section's own rendered footer from docx-preview
    let activeFooter = section.querySelector<HTMLElement>('footer');
    const isSignatureSec = isSignaturesSection(section);

    if (activeFooter) {
      currentRunningFooterTemplate = activeFooter.cloneNode(true) as HTMLElement;
    } else {
      // If docx-preview did not render a footer for this section (e.g. linked to previous),
      // inherit the appropriate footer
      const fallbackFooter = isSignatureSec ? lastDiscoveredPageOnlyFooter : currentRunningFooterTemplate || lastDiscoveredParafFooter;
      activeFooter = fallbackFooter.cloneNode(true) as HTMLElement;
      section.appendChild(activeFooter);
    }

    // Reserved height for bottom footer + margins so text never overlaps footer
    const footerReservation = 130;
    const maxArticleHeight = a4Height - padTop - footerReservation;

    // Check if section already fits within 1 A4 page
    if (article.scrollHeight <= maxArticleHeight + 15) {
      applyA4Styles(section, a4Height);
      allFinalPages.push(section);
      continue;
    }

    // Section exceeds 1 A4 page: split children into multiple A4 sheets
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

      // Clone this section's specific footer to the new page
      if (activeFooter) {
        newPage.appendChild(activeFooter.cloneNode(true));
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
        // Table element: split rows cleanly across pages
        const srcTable = child as HTMLTableElement;
        currentArticle.appendChild(srcTable);
        if (currentArticle.scrollHeight <= maxArticleHeight) {
          continue;
        }

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
    <div style="width: 100%; text-align: center; font-size: 9pt; color: #475569; font-family: 'Arial Nova Cond', 'Arial Narrow', Arial, sans-serif;">
      <p style="margin: 0;"><span style="font-family: 'Arial Nova Cond', 'Arial Narrow', Arial, sans-serif; font-size: 9pt; color: #475569;">Halaman 1 dari 1</span></p>
    </div>
  `;
  return footer;
}

function updateAllPageNumbersAndFooters(pages: HTMLElement[]) {
  const total = pages.length;

  pages.forEach((page, index) => {
    const pageNum = index + 1;

    // 1. Top-Right Sheet Badge
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

    // 2. Safe leaf-level Footer Page Number Update
    // NEVER overwrite table / td / wrapper div containing paraf signatures!
    const footer = page.querySelector<HTMLElement>('footer');
    if (footer) {
      const allParagraphs = Array.from(footer.querySelectorAll<HTMLElement>('p'));
      let updated = false;

      // Search for specific <p> that has "Halaman" and NOT "Paraf"
      for (const p of allParagraphs) {
        if (p.textContent && /Halaman/i.test(p.textContent) && !/Paraf/i.test(p.textContent)) {
          const firstSpan = p.querySelector('span');
          const fontFamily = firstSpan?.style.fontFamily || p.style.fontFamily || "'Arial Nova Cond', 'Arial Narrow', Arial, sans-serif";
          const fontSize = firstSpan?.style.fontSize || p.style.fontSize || "9pt";
          const color = firstSpan?.style.color || p.style.color || "#475569";

          p.innerHTML = `<span style="font-family: ${fontFamily}; font-size: ${fontSize}; color: ${color};">Halaman ${pageNum} dari ${total}</span>`;
          updated = true;
          break;
        }
      }

      // If not updated, check table center cell (td) if it does not contain "Paraf"
      if (!updated) {
        const centerTd = footer.querySelector<HTMLElement>('table tr td:nth-child(2)');
        if (centerTd && !/Paraf/i.test(centerTd.textContent || '')) {
          centerTd.innerHTML = `<span style="font-family: 'Arial Nova Cond', 'Arial Narrow', Arial, sans-serif; font-size: 9pt; color: #475569;">Halaman ${pageNum} dari ${total}</span>`;
        }
      }
    }
  });
}
