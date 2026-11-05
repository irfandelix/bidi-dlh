'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Printer, 
  Calendar as CalendarIcon, 
  Save, 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Users, 
  CheckCircle2, 
  CalendarCheck,
  Wand2
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function JadwalMPPPage() {
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<any[]>([]);
  
  // State for Month and Year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Schedule state: { "officerId_YYYY_MM_DD": true/false }
  const [schedule, setSchedule] = useState<Record<string, boolean>>({});
  
  // Holidays state: array of "YYYY-MM-DD"
  const [holidays, setHolidays] = useState<string[]>([]);
  
  useEffect(() => {
    // Fetch officers
    fetch('/api/pengaturan/petugas-mpp')
      .then(res => res.json())
      .then(response => {
        if (response && response.data) {
          setOfficers(response.data);
        }
      })
      .catch(err => console.error('Gagal mengambil petugas MPP', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch holidays when year changes
  useEffect(() => {
    fetch(`/api/hari-libur?year=${selectedYear}`)
      .then(res => res.json())
      .then(response => {
        if (response && Array.isArray(response.data)) {
          setHolidays(response.data);
        }
      })
      .catch(err => console.error('Gagal mengambil hari libur', err));
  }, [selectedYear]);

  // Load schedule from database
  useEffect(() => {
    setLoading(true);
    fetch(`/api/arsip/jadwal-mpp?year=${selectedYear}&month=${selectedMonth}`)
      .then(res => res.json())
      .then(response => {
        if (response && response.data) {
          const newSchedule: Record<string, boolean> = {};
          response.data.forEach((row: any) => {
            // row.tanggal is 'YYYY-MM-DD'
            const day = parseInt(row.tanggal.split('-')[2], 10);
            const key = `${row.officer_id}_${selectedYear}_${selectedMonth}_${day}`;
            newSchedule[key] = true;
          });
          setSchedule(newSchedule);
        }
      })
      .catch(err => console.error('Gagal mengambil jadwal MPP', err))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  const [saving, setSaving] = useState(false);

  const saveToDatabase = async () => {
    setSaving(true);
    try {
      const assignments = [];
      const m = selectedMonth + 1;
      const monthStr = String(m).padStart(2, '0');
      
      for (const key in schedule) {
        if (schedule[key]) {
          const parts = key.split('_');
          const officerId = parseInt(parts[0]);
          const keyYear = parseInt(parts[1]);
          const keyMonth = parseInt(parts[2]);
          const day = parseInt(parts[3]);
          
          if (keyYear === selectedYear && keyMonth === selectedMonth) {
            const dateStr = `${selectedYear}-${monthStr}-${String(day).padStart(2, '0')}`;
            assignments.push({ officer_id: officerId, tanggal: dateStr });
          }
        }
      }

      const res = await fetch('/api/arsip/jadwal-mpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          assignments
        })
      });
      
      if (!res.ok) throw new Error('Gagal menyimpan ke database');
      alert('Jadwal berhasil disimpan secara permanen ke database!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan jadwal.');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  
  const isWeekend = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isHoliday = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.includes(dateStr) || isWeekend(day);
  };

  const toggleSchedule = (officerId: number, day: number) => {
    if (isHoliday(day)) return; // Libur tidak bisa ditugaskan
    const key = `${officerId}_${selectedYear}_${selectedMonth}_${day}`;
    const newSchedule = {
      ...schedule,
      [key]: !schedule[key]
    };
    setSchedule(newSchedule);
  };

  const [startOfficerId, setStartOfficerId] = useState<number | ''>('');

  const generateOtomatis = () => {
    if (officers.length === 0) return;
    
    let currentOfficerIdx = officers.findIndex(o => o.id === Number(startOfficerId));
    if (currentOfficerIdx === -1) currentOfficerIdx = 0;

    const newSchedule: Record<string, boolean> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      if (!isHoliday(day)) {
        const officer = officers[currentOfficerIdx];
        const key = `${officer.id}_${selectedYear}_${selectedMonth}_${day}`;
        newSchedule[key] = true;
        
        // Giliran selanjutnya
        currentOfficerIdx = (currentOfficerIdx + 1) % officers.length;
      }
    }

    setSchedule(newSchedule);
  };

  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  // Hitung jumlah hari kerja & total shift terisi
  const workdaysCount = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (!isHoliday(day)) count++;
    }
    return count;
  }, [daysInMonth, selectedYear, selectedMonth, holidays]);

  const assignedCount = useMemo(() => {
    let count = 0;
    for (const key in schedule) {
      if (schedule[key]) {
        const parts = key.split('_');
        if (parseInt(parts[1]) === selectedYear && parseInt(parts[2]) === selectedMonth) {
          count++;
        }
      }
    }
    return count;
  }, [schedule, selectedYear, selectedMonth]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={150} text="MEMUAT JADWAL MPP..." /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 pb-20 print:p-0 print:m-0 print:max-w-full">
      
      {/* UI Controls (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        
        {/* Header NeoBrutalism */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md text-slate-900 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <Link 
              href="/arsip" 
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
              title="Kembali ke Hub Pusat Arsip"
            >
              <ArrowLeft size={22} />
            </Link>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
                Jadwal Jaga Petugas MPP
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                Atur rotasi penugasan loket Mal Pelayanan Publik DLH Kab. Sragen & cetak jadwal resmi.
              </p>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5 relative z-10">
            <Link 
              href="/pengaturan/petugas-mpp" 
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <Settings size={15} /> Atur Petugas
            </Link>
            <button 
              onClick={saveToDatabase}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {saving ? <LottieLoader size={16} /> : <Save size={15} />} Simpan
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <Printer size={15} /> Cetak Jadwal
            </button>
          </div>
        </div>

        {/* Filter & Generator Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
          
          {/* Month & Year Picker */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-slate-900 text-xs font-bold px-3 py-2 outline-none cursor-pointer uppercase"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              
              <div className="h-6 w-px bg-slate-200 mx-1"></div>

              <div className="flex items-center px-2 gap-1.5">
                <span className="font-bold text-slate-900 text-xs">{selectedYear}</span>
                <div className="flex flex-col">
                  <button 
                    onClick={() => setSelectedYear(y => y + 1)} 
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="Tahun Depan"
                  >
                    <ChevronUp size={12} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setSelectedYear(y => y - 1)} 
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="Tahun Sebelumnya"
                  >
                    <ChevronDown size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Assign Generator */}
            <div className="flex items-center gap-2 bg-purple-50/60 border border-purple-200 rounded-xl p-1">
              <select 
                value={startOfficerId} 
                onChange={(e) => setStartOfficerId(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-transparent text-purple-900 text-xs font-bold px-2.5 py-1.5 outline-none max-w-[160px] cursor-pointer"
              >
                <option value="">-- Mulai Dari Petugas --</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
              </select>
              <button 
                onClick={generateOtomatis}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Wand2 size={13} /> Isi Otomatis
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Users size={14} className="text-slate-500" />
              <span>Petugas: <strong className="text-slate-900">{officers.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
              <CalendarCheck size={14} className="text-slate-500" />
              <span>Hari Kerja: <strong className="text-slate-900">{workdaysCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg font-bold">
              <CheckCircle2 size={14} />
              <span>Shift Terisi: {assignedCount}</span>
            </div>
          </div>
        </div>

        {/* Info Legend Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-slate-500">Petunjuk:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-green-500 rounded border border-black"></div>
            <span>Klik kolom untuk bertugas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-white rounded border border-black"></div>
            <span>Tidak bertugas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-600 rounded border border-black"></div>
            <span>Hari libur / weekend (otomatis)</span>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="bg-white print:bg-transparent rounded-2xl border border-slate-200 print:border-none p-6 md:p-8 print:p-0 overflow-x-auto print:overflow-visible shadow-sm print:shadow-none">
        
        {/* Document Header */}
        <div className="text-center font-bold text-black uppercase mb-6 leading-tight">
          <h2 className="text-base md:text-lg">JADWAL PETUGAS GERAI MAL PELAYANAN PUBLIK</h2>
          <h2 className="text-base md:text-lg">DINAS LINGKUNGAN HIDUP KABUPATEN SRAGEN</h2>
        </div>

        <div className="flex font-bold text-black text-xs md:text-sm mb-3 gap-4 uppercase">
          <div className="w-16">BULAN</div>
          <div className="w-28">: {months[selectedMonth]}</div>
          <div>{selectedYear}</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-xs text-black">
            <thead>
              <tr>
                <th className="border-2 border-black py-2 px-2 w-10 text-center" rowSpan={2}>No.</th>
                <th className="border-2 border-black py-2 px-3 min-w-[160px] text-left" rowSpan={2}>Nama Petugas</th>
                <th className="border-2 border-black py-1 text-center" colSpan={31}>Tanggal</th>
              </tr>
              <tr>
                {Array.from({length: 31}).map((_, i) => (
                  <th key={i} className={`border border-black py-1 text-center w-6 text-[11px] ${i + 1 > daysInMonth ? 'bg-black text-black border-black' : ''}`}>
                    {i + 1 <= daysInMonth ? i + 1 : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officers.map((officer, index) => (
                <tr key={officer.id}>
                  <td className="border border-black text-center py-1.5 text-xs font-semibold">{index + 1}</td>
                  <td className="border border-black px-2.5 py-1.5 text-xs font-medium whitespace-nowrap">{officer.nama}</td>
                  {Array.from({length: 31}).map((_, i) => {
                    const day = i + 1;
                    const key = `${officer.id}_${selectedYear}_${selectedMonth}_${day}`;
                    const isActive = schedule[key];
                    const isHol = isHoliday(day);
                    const isInvalid = day > daysInMonth;
                    
                    let bgColorClass = 'bg-white';
                    if (isInvalid) bgColorClass = 'bg-black print:bg-black';
                    else if (isHol) bgColorClass = 'bg-red-600 print:bg-red-600';
                    else if (isActive) bgColorClass = 'bg-green-500 print:bg-green-500';

                    return (
                      <td 
                        key={i} 
                        onClick={() => !isInvalid && toggleSchedule(officer.id, day)}
                        className={`border border-black print:border-black cursor-pointer print:cursor-auto ${bgColorClass} print-exact-color h-7 min-w-[24px] text-center transition-colors`}
                        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        title={!isInvalid && !isHol ? `${officer.nama} - Tgl ${day}: ${isActive ? 'Bertugas' : 'Klik untuk jadwalkan'}` : undefined}
                      ></td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Area */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start text-black gap-6">
          {/* Legend */}
          <div className="text-xs">
            <div className="font-bold mb-2">Keterangan :</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-3.5 bg-green-500 border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Bertugas</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-3.5 bg-white border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Tidak Bertugas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-3.5 bg-red-600 border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Libur / Akhir Pekan</span>
            </div>
          </div>

          {/* Signature */}
          <div className="text-xs md:text-sm text-center sm:mr-8 pt-4 sm:pt-6">
            <div className="mb-16">
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Bidang Perencanaan, Pengaduan,</p>
              <p className="font-semibold">dan Peningkatan Kapasitas Lingkungan Hidup</p>
            </div>
            <div className="font-bold border-b border-black pb-0.5 inline-block">
              Lukman Farid, S.Hut., M.T.
            </div>
            <div>NIP. 19710426 199903 008</div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-exact-color {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
