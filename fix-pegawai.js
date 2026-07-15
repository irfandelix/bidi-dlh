const fs = require('fs');
const path = require('path');

const dirs = [
  'pemeriksaan-revisi',
  'pemeriksaan-substansi',
  'verifikasi-lapangan'
];

const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan';

for (const dir of dirs) {
  const filePath = path.join(basePath, dir, '[id]', 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace dummy data with useState
    content = content.replace(/\/\/ Dummy data pegawai \([^)]+\)\s*const daftarPegawai = \[[^\]]*\];/g, 'const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);');

    // Update useEffect
    const oldUseEffect = `  useEffect(() => {
    fetch(\`/api/perizinan/\${unwrappedParams.id}\`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setLoading(false);
      });
  }, [unwrappedParams.id]);`;

    const newUseEffect = `  useEffect(() => {
    Promise.all([
      fetch(\`/api/perizinan/\${unwrappedParams.id}\`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      // Urutkan berdasarkan urutan_hierarki
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);`;

    content = content.replace(oldUseEffect, newUseEffect);

    // Update table rendering for jabatan / kategori if it exists
    // Looking for p.jabatan or similar
    content = content.replace(/\{p\.jabatan\}/g, '{p.jabatan_dinas || p.kategori || \'-\'}');

    // Just in case verifikasi lapangan doesn't have p.jabatan but we want to render it if it has
    // Actually, looking at the image, Verifikasi Lapangan might also need "JABATAN / KATEGORI". Let's check if the table has it.
    // If not, it's fine.

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}
