/**
 * Utility to align docx-preview rendered sections with Microsoft Word page layout.
 * Ensures:
 * 1. Faithfully preserves and respects the user's Word template layout, sections, and footers.
 * 2. Kop Surat logo is aligned to the left margin instead of centered.
 * 3. Exact font ('Arial Nova Cond') and font sizes are honored throughout body and footers.
 * 4. Signature sections (Pihak Usaha & Tim Pengawas), Dokumentasi, and LB3 stay together on their respective pages (never split).
 * 5. Long tables (Section 1) split cleanly with preserved column widths without jumping.
 * 6. Footers (paraf tables for checklist, page numbers only for signatures) stay anchored at the bottom.
 */

export function paginateDocxContainer(container: HTMLElement): number {
  if (!container) return 0;

  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  if (sections.length === 0) return 0;

  // 1. Align Kop Surat Logo to the left margin (as in Word's floating anchor)
  alignKopSuratLogo(sections[0]);

  // 2. Discover footers across sections
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

    // Measure rendered width and calculate exact A4 aspect ratio height (210mm x 297mm)
    const sectionWidth = section.offsetWidth || 794;
    const a4Height = Math.round(sectionWidth * (297 / 210));

    // Measure top padding
    const comp = window.getComputedStyle(section);
    const padTop = parseFloat(comp.paddingTop) || 45;

    // Determine footer for this section
    let activeFooter = section.querySelector<HTMLElement>('footer');
    const isSignatureSec = isSignaturesSection(section);

    if (activeFooter) {
      currentRunningFooterTemplate = activeFooter.cloneNode(true) as HTMLElement;
    } else {
      // Inherit appropriate footer if section links to previous in Word
      const fallbackFooter = isSignatureSec ? lastDiscoveredPageOnlyFooter : currentRunningFooterTemplate || lastDiscoveredParafFooter;
      activeFooter = fallbackFooter.cloneNode(true) as HTMLElement;
      section.appendChild(activeFooter);
    }

    // Check if section should NEVER be split (Signature pages, Dokumentasi, LB3, etc.)
    if (shouldNeverSplit(section)) {
      applyA4Styles(section, a4Height);
      allFinalPages.push(section);
      continue;
    }

    // Reserved height for bottom footer + margins so text never overlaps footer
    const footerReservation = 75;
    const maxArticleHeight = a4Height - padTop - footerReservation;

    // Check if section already fits within 1 A4 page
    if (article.scrollHeight <= maxArticleHeight + 25) {
      applyA4Styles(section, a4Height);
      allFinalPages.push(section);
      continue;
    }

    // Section 1 exceeds 1 A4 page: split children (Table B) into multiple A4 sheets
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
      table.style.width = '100%';

      // Preserve explicit column widths from the source table
      const firstRow = srcTable.querySelector('tr');
      if (firstRow) {
        const cells = Array.from(firstRow.children) as HTMLElement[];
        const colgroup = document.createElement('colgroup');
        cells.forEach(cell => {
          const col = document.createElement('col');
          if (cell.offsetWidth > 0) {
            col.style.width = `${cell.offsetWidth}px`;
          } else if (cell.style.width) {
            col.style.width = cell.style.width;
          }
          colgroup.appendChild(col);
        });
        table.appendChild(colgroup);
      }

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

  // 3. Update Footer Page Numbers ("Halaman X dari Y") safely
  updateAllPageNumbersAndFooters(allFinalPages);

  return allFinalPages.length;
}

function alignKopSuratLogo(firstSection?: HTMLElement) {
  if (!firstSection) return;
  const kopImg = firstSection.querySelector<HTMLImageElement>(
    'article > p:first-of-type img, article > p:nth-of-type(1) img, article > p:nth-of-type(2) img'
  );
  if (kopImg) {
    const drawingDiv = kopImg.closest<HTMLElement>('div');
    if (drawingDiv) {
      drawingDiv.style.position = 'absolute';
      drawingDiv.style.left = '20mm';
      drawingDiv.style.top = '14mm';
      drawingDiv.style.zIndex = '10';
      drawingDiv.style.display = 'block';
    }
    kopImg.style.maxWidth = '65px';
    kopImg.style.height = 'auto';
  }
}

function applyA4Styles(el: HTMLElement, a4Height: number) {
  el.style.minHeight = `${a4Height}px`;
  el.style.position = 'relative';
  el.style.boxSizing = 'border-box';
}

function shouldNeverSplit(section: HTMLElement): boolean {
  const text = section.textContent || '';
  return (
    /Demikian Berita Acara/i.test(text) ||
    /Pelaksanaan dan temuan fakta/i.test(text) ||
    /Tim Pejabat Pengawas Lingkungan Hidup/i.test(text) ||
    /Dokumentasi/i.test(text) ||
    /Limbah Bahan Berbahaya dan Beracun/i.test(text)
  );
}

function isSignaturesSection(section: HTMLElement): boolean {
  const text = section.textContent || '';
  return (
    /Demikian Berita Acara/i.test(text) ||
    /Pelaksanaan dan temuan fakta/i.test(text) ||
    /Tim Pejabat Pengawas Lingkungan Hidup/i.test(text)
  );
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

    // Safe leaf-level Footer Page Number Update
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
