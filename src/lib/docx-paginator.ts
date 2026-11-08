/**
 * Utility to align docx-preview rendered sections with Microsoft Word page layout.
 * Ensures:
 * 1. Faithfully preserves and respects the user's Word template layout, sections, and footers.
 * 2. Kop Surat logo and typography strictly follow the Word docx template.
 * 3. Exact font ('Arial', 'Arial Narrow', 'Arial Nova Cond') and font sizes are honored throughout body and footers.
 * 4. Signature sections (Demikian Berita Acara, Pihak Usaha & Tim Pengawas), Dokumentasi, and LB3 stay together on their respective pages (never split).
 * 5. Long tables split cleanly with preserved column widths without jumping.
 * 6. Footers (paraf tables for checklist, page numbers only for signatures) stay anchored at the bottom.
 * 7. Completely empty/blank pages are automatically pruned.
 */

export function paginateDocxContainer(container: HTMLElement): number {
  if (!container) return 0;

  // 1. Remove any completely blank sections (empty article, no text, no tables/images)
  const initialSections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  for (const sec of initialSections) {
    const art = sec.querySelector<HTMLElement>('article');
    const text = (art?.textContent || '').trim();
    const hasVisuals = !!sec.querySelector('table, img, canvas, svg');
    if (text.length === 0 && !hasVisuals) {
      sec.remove();
    }
  }

  // 2. Align Kop Surat Logo and text styling exactly as in Word template
  const firstSection = container.querySelector<HTMLElement>('section.docx');
  if (firstSection) {
    alignKopSurat(firstSection);
  }

  // 3. Separate "Demikian Berita Acara" into its own page/section if grouped with preceding content
  separateDemikianSection(container);

  // 4. Remove any blank sections again after separation
  for (const sec of Array.from(container.querySelectorAll<HTMLElement>('section.docx'))) {
    const art = sec.querySelector<HTMLElement>('article');
    const text = (art?.textContent || '').trim();
    const hasVisuals = !!sec.querySelector('table, img, canvas, svg');
    if (text.length === 0 && !hasVisuals) {
      sec.remove();
    }
  }

  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  if (sections.length === 0) return 0;

  // 5. Discover footers across sections
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
      continue;
    }

    const textContent = (article.textContent || '').trim();
    const hasVisuals = !!section.querySelector('table, img, canvas, svg');
    if (textContent.length === 0 && !hasVisuals) {
      section.remove();
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
      if (isSignatureSec) {
        // On signature page, strip paraf table from footer if present
        const tables = Array.from(activeFooter.querySelectorAll('table'));
        tables.forEach(tbl => {
          if (/Paraf/i.test(tbl.textContent || '')) tbl.remove();
        });
      }
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

    // Section exceeds 1 A4 page: split children (Table B) into multiple A4 sheets
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

  // 6. Update Footer Page Numbers ("Halaman X dari Y") safely
  updateAllPageNumbersAndFooters(allFinalPages);

  return allFinalPages.length;
}

function separateDemikianSection(container: HTMLElement) {
  const sections = Array.from(container.querySelectorAll<HTMLElement>('section.docx'));
  for (const sec of sections) {
    const article = sec.querySelector<HTMLElement>('article');
    if (!article) continue;
    const children = Array.from(article.children) as HTMLElement[];
    const demikianIdx = children.findIndex(c => /Demikian Berita Acara/i.test(c.textContent || ''));
    if (demikianIdx > 0) {
      // Check if elements BEFORE demikianIdx have any real content!
      const elementsBefore = children.slice(0, demikianIdx);
      const textBefore = elementsBefore.map(e => e.textContent || '').join('').trim();
      const hasMediaBefore = elementsBefore.some(e => e.querySelector('table, img, canvas, svg'));

      if (textBefore.length === 0 && !hasMediaBefore) {
        // The elements before Demikian were just empty spacing!
        elementsBefore.forEach(e => e.remove());
        continue;
      }

      // Elements from demikianIdx onwards belong to the signature page
      const elementsToMove = children.slice(demikianIdx);
      const newSec = document.createElement('section');
      newSec.className = sec.className;
      newSec.style.cssText = sec.style.cssText;

      const headerEl = sec.querySelector<HTMLElement>('header');
      if (headerEl) {
        newSec.appendChild(headerEl.cloneNode(true));
      }

      const newArt = document.createElement('article');
      newArt.className = article.className;
      newArt.style.cssText = article.style.cssText;
      elementsToMove.forEach(el => newArt.appendChild(el));
      newSec.appendChild(newArt);

      // Signature page gets a clean page-only footer (no paraf table)
      const footer = sec.querySelector<HTMLElement>('footer');
      if (footer) {
        const newFooter = footer.cloneNode(true) as HTMLElement;
        const parafTable = newFooter.querySelector('table');
        if (parafTable && /Paraf/i.test(parafTable.textContent || '')) {
          parafTable.remove();
        }
        newSec.appendChild(newFooter);
      }

      sec.after(newSec);
    }
  }
}

function alignKopSurat(firstSection?: HTMLElement) {
  if (!firstSection) return;

  const kopImg = firstSection.querySelector<HTMLImageElement>(
    'article > p:first-of-type img, article > p:nth-of-type(1) img, article > p:nth-of-type(2) img'
  );

  if (kopImg) {
    const parentP = kopImg.closest<HTMLElement>('p');
    if (parentP) {
      parentP.style.position = 'relative';
    }
    const drawingDiv = kopImg.closest<HTMLElement>('div');
    if (drawingDiv) {
      drawingDiv.style.position = 'absolute';
      drawingDiv.style.left = '0px';
      drawingDiv.style.top = '2px';
      drawingDiv.style.width = '64px';
      drawingDiv.style.height = '74px';
      drawingDiv.style.zIndex = '10';
      drawingDiv.style.display = 'block';
    }
    kopImg.style.width = '64px';
    kopImg.style.height = '74px';
    kopImg.style.maxWidth = '64px';
    kopImg.style.maxHeight = '74px';
    kopImg.style.objectFit = 'contain';
    kopImg.style.display = 'block';
  }

  // Format Kop text paragraphs strictly matching the Word docx template
  const article = firstSection.querySelector<HTMLElement>('article');
  if (!article) return;

  const paragraphs = Array.from(article.querySelectorAll<HTMLElement>('p'));
  for (const p of paragraphs) {
    const text = (p.textContent || '').trim();
    if (/PEMERINTAH KABUPATEN SRAGEN/i.test(text)) {
      p.style.fontFamily = 'Arial, sans-serif';
      p.style.fontSize = '14pt';
      p.style.fontWeight = 'normal';
      p.style.textAlign = 'center';
      p.style.lineHeight = '1.3';
      p.style.margin = '0 0 2px 0';
      p.querySelectorAll<HTMLElement>('span').forEach(s => {
        s.style.fontFamily = 'Arial, sans-serif';
        s.style.fontSize = '14pt';
        s.style.fontWeight = 'normal';
      });
    } else if (/DINAS LINGKUNGAN HIDUP/i.test(text)) {
      p.style.fontFamily = 'Arial, sans-serif';
      p.style.fontSize = '14pt';
      p.style.fontWeight = 'bold';
      p.style.textAlign = 'center';
      p.style.lineHeight = '1.3';
      p.style.margin = '0 0 4px 0';
      p.querySelectorAll<HTMLElement>('span').forEach(s => {
        s.style.fontFamily = 'Arial, sans-serif';
        s.style.fontSize = '14pt';
        s.style.fontWeight = 'bold';
      });
    } else if (/Ronggowarsito/i.test(text)) {
      p.style.fontFamily = "'Arial Narrow', Arial, sans-serif";
      p.style.fontSize = '10pt';
      p.style.fontWeight = 'normal';
      p.style.textAlign = 'center';
      p.style.lineHeight = '1.25';
      p.style.margin = '0 0 2px 0';
      p.querySelectorAll<HTMLElement>('span').forEach(s => {
        s.style.fontFamily = "'Arial Narrow', Arial, sans-serif";
        s.style.fontSize = '10pt';
        s.style.fontWeight = 'normal';
      });
    } else if (/Telepon|Faksimile/i.test(text)) {
      p.style.fontFamily = "'Arial Narrow', Arial, sans-serif";
      p.style.fontSize = '10pt';
      p.style.fontWeight = 'normal';
      p.style.textAlign = 'center';
      p.style.lineHeight = '1.25';
      p.style.margin = '0 0 6px 0';
      p.querySelectorAll<HTMLElement>('span').forEach(s => {
        s.style.fontFamily = "'Arial Narrow', Arial, sans-serif";
        s.style.fontSize = '10pt';
        s.style.fontWeight = 'normal';
      });
    } else if (p.style.borderBottom || p.style.borderBottomWidth) {
      // Horizontal double dividing line matching Word's thinThickSmallGap
      p.style.borderBottom = '3.5px double #000000';
      p.style.marginTop = '6px';
      p.style.marginBottom = '14px';
      p.style.width = '100%';
    }
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
