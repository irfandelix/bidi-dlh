/**
 * Utility to paginate docx-preview rendered sections into strict A4 pages.
 * docx-preview does not break tables or overflow content by A4 height,
 * which results in 2-3 pages combining into a single tall sheet.
 * This paginator measures each section, splits tables and paragraphs across A4 sheets,
 * and ensures every rendered sheet has exact A4 paper dimensions (210mm x 297mm).
 */

export function paginateDocxContainer(container: HTMLElement): number {
  if (!container) return 0;

  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  if (sections.length === 0) return 0;

  // Track all final pages
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

    // Measure paddings & margins
    const comp = window.getComputedStyle(section);
    const padTop = parseFloat(comp.paddingTop) || 0;
    const padBottom = parseFloat(comp.paddingBottom) || 0;
    const headerEl = section.querySelector<HTMLElement>('header');
    const footerEl = section.querySelector<HTMLElement>('footer');
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const footerHeight = footerEl ? footerEl.offsetHeight : 0;

    // Available height for article content on a single A4 page
    // Give a 20px safety buffer to prevent overflow clipping
    const maxArticleHeight = a4Height - padTop - padBottom - headerHeight - footerHeight - 20;

    // Check if section already fits within 1 A4 page
    if (article.scrollHeight <= maxArticleHeight + 15) {
      applyA4Styles(section, a4Height);
      allFinalPages.push(section);
      continue;
    }

    // It exceeds A4 height! Split into multiple pages
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

      if (headerEl) {
        newPage.appendChild(headerEl.cloneNode(true));
      }

      const newArt = document.createElement('article');
      newArt.style.cssText = article.style.cssText;
      newArt.className = article.className;
      newPage.appendChild(newArt);

      if (footerEl) {
        newPage.appendChild(footerEl.cloneNode(true));
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

  // Update Page Number Badges on each sheet
  updatePageBadges(allFinalPages);

  return allFinalPages.length;
}

function applyA4Styles(el: HTMLElement, a4Height: number) {
  el.style.height = `${a4Height}px`;
  el.style.minHeight = `${a4Height}px`;
  el.style.maxHeight = `${a4Height}px`;
  el.style.overflow = 'hidden';
  el.style.boxSizing = 'border-box';
}

function updatePageBadges(pages: HTMLElement[]) {
  const total = pages.length;
  pages.forEach((page, index) => {
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
        z-index: 20;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      `;
      page.style.position = 'relative';
      page.appendChild(badge);
    }
    badge.textContent = `Halaman ${index + 1} dari ${total}`;
  });
}
