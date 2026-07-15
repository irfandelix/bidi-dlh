const fs = require('fs');
const path = require('path');
const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan\\daftar\\page.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Pagination State
content = content.replace(
  'const [activeStage, setActiveStage] = useState<any>(allStage);',
  'const [activeStage, setActiveStage] = useState<any>(allStage);\n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 10;'
);

// 2. Change setActiveStage calls to also reset currentPage
content = content.replace(
  /onClick=\{\(\) => setActiveStage\(stage\)\}/g,
  'onClick={() => { setActiveStage(stage); setCurrentPage(1); }}'
);
content = content.replace(
  /onClick=\{\(\) => setActiveStage\(allStage\)\}/g,
  'onClick={() => { setActiveStage(allStage); setCurrentPage(1); }}'
);

// 3. Add Pagination logic after activeDocs
const paginationLogic = `
  // Pagination
  const totalPages = Math.ceil(activeDocs.length / itemsPerPage);
  const paginatedDocs = activeDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
`;
content = content.replace(
  /return \(/,
  `${paginationLogic}\n  return (`
);

// 4. Use paginatedDocs instead of activeDocs in map
content = content.replace(
  /activeDocs\.map\(\(d\)/,
  'paginatedDocs.map((d)'
);

// 5. Add Pagination Controls after table div
const paginationControls = `
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-100 border-t-4 border-slate-900 p-6 flex items-center justify-between">
            <span className="text-sm font-black text-slate-700 uppercase">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-black uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-indigo-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>`;

content = content.replace(
  /<\/table>\n\s*<\/div>\n\s*<\/div>/,
  '</table>\n        </div>\n' + paginationControls
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Pagination added to daftar/page.tsx');
