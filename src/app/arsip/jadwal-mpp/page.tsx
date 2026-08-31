'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Calendar as CalendarIcon, Save, Settings } from 'lucide-react';
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
    fetch('/api/tim-penilai?hierarki=13')
      .then(res => res.json())
      .then(res => {
        setOfficers(res.data || []);
        setLoading(false);
      });
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

  // Load schedule from local storage
  useEffect(() => {
    const key = `jadwal_mpp_${selectedYear}_${selectedMonth}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSchedule(JSON.parse(saved));
    } else {
      setSchedule({});
    }
  }, [selectedYear, selectedMonth]);

  const saveToLocalStorage = (newSchedule: Record<string, boolean>) => {
    const key = `jadwal_mpp_${selectedYear}_${selectedMonth}`;
    localStorage.setItem(key, JSON.stringify(newSchedule));
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
    saveToLocalStorage(newSchedule);
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
    saveToLocalStorage(newSchedule);
  };

  const months = [
    'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
    'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
  ];

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4 print:p-0 print:m-0 print:max-w-full">
      
      {/* UI Controls (Hidden on Print) */}
      <div className="print:hidden space-y-6">
        <Link href="/arsip" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 uppercase tracking-wide">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="bg-surface border border-outline-variant rounded-[2rem] p-8 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 w-full xl:w-auto text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-purple-400 border border-outline-variant flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <CalendarIcon size={28} className="text-on-surface" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-on-surface">Jadwal Jaga Petugas MPP</h1>
              <p className="text-on-surface-variant text-sm font-bold uppercase mt-1">Atur penugasan loket MPP DLH</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-end gap-4 items-center w-full xl:w-auto ml-auto">
            <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-on-surface font-bold px-3 py-2 outline-none"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <div className="w-px bg-outline-variant my-2 mx-1"></div>
              <input 
                type="number" 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-on-surface font-bold px-3 py-2 outline-none w-20"
              />
            </div>

            <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl p-2 items-center">
              <select 
                value={startOfficerId} 
                onChange={(e) => setStartOfficerId(e.target.value === '' ? '' : Number(e.target.value))}
                className="bg-transparent text-blue-900 text-sm font-bold px-2 py-1 outline-none max-w-[150px]"
              >
                <option value="">-- Mulai Dari --</option>
                {officers.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
              </select>
              <button 
                onClick={generateOtomatis}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-colors text-xs uppercase tracking-widest whitespace-nowrap"
              >
                Isi Otomatis
              </button>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <Link href="/pengaturan/tim-penilai" title="Pengaturan Petugas (Set Hierarki = 13)" className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant px-4 py-2 rounded-xl text-sm font-bold text-on-surface uppercase tracking-widest transition-colors shadow-sm cursor-pointer">
                <Settings size={18} /> Atur Petugas
              </Link>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl shadow-sm transition-colors uppercase tracking-widest text-sm cursor-pointer"
              >
                <Printer size={18} /> Cetak
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="bg-white print:bg-transparent rounded-2xl border border-slate-200 print:border-none p-8 print:p-0 overflow-x-auto print:overflow-visible">
        
        {/* Header */}
        <div className="text-center font-bold text-black uppercase mb-8 leading-snug">
          <h2 className="text-lg">JADWAL PETUGAS GERAI MAL PELAYANAN PUBLIK</h2>
          <h2 className="text-lg">DINAS LINGKUNGAN HIDUP</h2>
          <h2 className="text-lg">KABUPATEN SRAGEN</h2>
        </div>

        <div className="flex font-bold text-black text-sm mb-4 gap-4 uppercase">
          <div className="w-16">BULAN</div>
          <div className="w-32">{months[selectedMonth]}</div>
          <div>{selectedYear}</div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border-2 border-black text-xs text-black">
          <thead>
            <tr>
              <th className="border-2 border-black py-2 px-2 w-12" rowSpan={2}>No.</th>
              <th className="border-2 border-black py-2 px-4 w-48" rowSpan={2}>Nama</th>
              <th className="border-2 border-black py-1 text-center" colSpan={31}>Tanggal</th>
            </tr>
            <tr>
              {Array.from({length: 31}).map((_, i) => (
                <th key={i} className={`border border-black py-1 text-center w-6 ${i + 1 > daysInMonth ? 'bg-black text-black border-black' : ''}`}>
                  {i + 1 <= daysInMonth ? i + 1 : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {officers.map((officer, index) => (
              <tr key={officer.id}>
                <td className="border border-black text-center py-2">{index + 1}</td>
                <td className="border border-black px-2">{officer.nama}</td>
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
                      className={`border border-black print:border-black cursor-pointer print:cursor-auto ${bgColorClass} print-exact-color`}
                      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    ></td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Area */}
        <div className="mt-6 flex justify-between items-start text-black">
          {/* Legend */}
          <div className="text-xs">
            <div className="font-bold mb-2">Keterangan :</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-4 bg-green-500 border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Bertugas</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-4 bg-white border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Tidak Bertugas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-red-600 border border-black print-exact-color" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
              <span>: Libur</span>
            </div>
          </div>

          {/* Signature */}
          <div className="text-sm text-center mr-12 pt-8">
            <div className="mb-20">
              <p>Mengetahui</p>
              <p>Kepala Bidang Perencanaan, Pengaduan,</p>
              <p>dan Peningkatan Kapasitas Lingkungan Hidup</p>
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
