const fs = require('fs');
const path = require('path');
const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src';

// 1. Create Jilidan Page
const jilidanContent = `'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookCopy, Info, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function JilidanPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [petugasList, setPetugasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch doc
      const { data: docData } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
      setDoc(docData);

      // Fetch petugas (hierarki 13)
      const { data: petugasData } = await supabase.from('pegawais').select('*').eq('hierarki', 13);
      if (petugasData) {
        setPetugasList(petugasData);
      }

      setLoading(false);
    };
    fetchData();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const tglJilidan = formData.get('tanggal_penerimaan_jilidan');
    const petugasMpp = formData.get('petugas_mpp');
    
    let status_tahapan = 'Menunggu Jilidan';
    if (tglJilidan && petugasMpp) {
      status_tahapan = 'Penerimaan Jilidan';
    }

    const payload = {
      tanggal_penerimaan_jilidan: tglJilidan,
      petugas_mpp: petugasMpp,
      status_tahapan,
    };

    try {
      const res = await fetch(\`/api/perizinan/\${unwrappedParams.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Data Jilidan Berhasil Disimpan!');
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-900 font-black flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> MEMUAT...</div>;
  if (!doc) return <div className="text-center py-20 text-rose-600 font-black bg-rose-100 border-4 border-slate-900 m-8 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">DATA TIDAK DITEMUKAN!</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 font-black uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-orange-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <BookCopy size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Penerimaan Jilidan Final</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Konfirmasi penerimaan dokumen fisik jilidan #{String(doc.no_urut || doc.id).padStart(3, '0')}</p>
        </div>
      </div>
      
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
        
        {/* Info Box NeoBrutalism */}
        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-[4px_4px_0_0_#0f172a]">
          <Info className="text-slate-900 mt-1" size={24} />
          <div>
            <h4 className="font-black text-slate-900 uppercase text-sm md:text-base leading-tight">{doc.nama_kegiatan}</h4>
            <p className="text-xs text-slate-700 font-bold mt-2 uppercase">{doc.nama_pemrakarsa} • {doc.jenis_dokumen}</p>
            <p className="text-xs font-black bg-amber-300 text-slate-900 px-2 py-1 rounded border-2 border-slate-900 inline-block mt-2 shadow-[2px_2px_0_0_#0f172a] uppercase">No. Registrasi: {doc.nomor_checklist || 'Belum ada'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6 border-4 border-slate-900 bg-emerald-100 rounded-2xl shadow-[4px_4px_0_0_#0f172a] mb-8">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg uppercase tracking-wide">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-[2px_2px_0_0_#ffffff]">1</span> Jilidan Final
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Tanggal Penerimaan Jilidan</label>
                <input type="date" name="tanggal_penerimaan_jilidan" defaultValue={doc.tanggal_penerimaan_jilidan || new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
                <p className="text-[10px] text-slate-700 mt-2 font-bold uppercase">* Kosongkan jika belum menyerahkan jilidan buku final.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Siapa Menerima (Petugas MPP)</label>
                <select name="petugas_mpp" defaultValue={doc.petugas_mpp || ''} className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none appearance-none cursor-pointer">
                  <option value="">-- Pilih Petugas MPP --</option>
                  {petugasList.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-4 border-slate-900 flex justify-end mt-8">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-orange-400 hover:bg-orange-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Simpan Penerimaan Jilidan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(basePath, 'app', 'perizinan', 'jilidan', '[id]', 'page.tsx'), jilidanContent, 'utf-8');

// 2. Modify Arsip Page to remove Jilidan block and fix the status logic
const arsipPath = path.join(basePath, 'app', 'perizinan', 'arsip', '[id]', 'page.tsx');
if (fs.existsSync(arsipPath)) {
  let content = fs.readFileSync(arsipPath, 'utf-8');
  
  // Remove Jilidan block
  content = content.replace(/\{\/\* Bagian Jilidan \*\/\}\s*<div className="space-y-4 p-6 border-4 border-slate-900 bg-emerald-100 rounded-2xl shadow-\[4px_4px_0_0_#0f172a\] mb-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

  // Update handleSubmit payload to not touch Jilidan
  content = content.replace(/const tglJilidan = formData\.get\('tanggal_penerimaan_jilidan'\);[\s\S]*?const payload = \{[\s\S]*?tanggal_penerimaan_jilidan: tglJilidan,[\s\S]*?lokasi_arsip: formData.get\('lokasi_arsip'\),[\s\S]*?status_tahapan,[\s\S]*?arsip_fisik: JSON\.stringify\(fisik\),[\s\S]*?\};/, `
    let status_tahapan = 'Diarsipkan'; // Or Arsip

    const payload = {
      status_tahapan,
      arsip_fisik: JSON.stringify(fisik),
    };`);
  
  // Also we might need to add a "Lokasi Arsip/Lemari" field to the Arsip page since we removed it from Jilidan?
  // Let's add it to the Arsip page payload if needed, but actually the user said:
  // "ini harusnya cuma jilidan final aja lokasi penyimpanan diganti siapa menerima di petugas_mpp"
  // and "arsip yang bawah itu harusnya masuk ke bagian arsipp"
  // So maybe the Lokasi Arsip field should be in Arsip page?
  // I will add a simple input for Lokasi Arsip below the checkboxes in Arsip page.
  
  const lokasiUI = `
          {/* LOKASI ARSIP */}
          <div className="mt-8 p-6 bg-slate-100 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">Lokasi Arsip / Lemari</label>
            <input type="text" name="lokasi_arsip" defaultValue={doc.lokasi_arsip || ''} placeholder="Contoh: Lemari A, Rak 3"
              className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
          </div>
  `;
  
  if (!content.includes('LOKASI ARSIP')) {
    content = content.replace(/\{\/\* TOMBOL AKSI \*\/\}/, lokasiUI + '\n          {/* TOMBOL AKSI */}');
  }

  // Ensure Lokasi Arsip is saved in Arsip Page
  content = content.replace(/status_tahapan,\s*arsip_fisik:/, "lokasi_arsip: formData.get('lokasi_arsip'),\n      status_tahapan,\n      arsip_fisik:");

  fs.writeFileSync(arsipPath, content, 'utf-8');
}

// 3. Update daftar/page.tsx routing
const daftarPath = path.join(basePath, 'app', 'perizinan', 'daftar', 'page.tsx');
if (fs.existsSync(daftarPath)) {
  let content = fs.readFileSync(daftarPath, 'utf-8');
  content = content.replace(/'\/perizinan\/arsip' \}, \/\/ For Jilidan Final/, "'/perizinan/jilidan' },");
  content = content.replace(/id: 11,[\s\S]*?link: '\/perizinan\/arsip' \},/, "id: 11, title: '11. Jilidan Final', shortTitle: 'Jilidan', statuses: ['Penerimaan Jilidan', 'Menunggu Jilidan'], color: 'orange', icon: FileText, link: '/perizinan/jilidan' },");
  
  fs.writeFileSync(daftarPath, content, 'utf-8');
}

console.log('Fixed jilidan routing and UI');
