'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { ArrowLeft, Map as MapIcon, Info, MapPin } from 'lucide-react';
import Script from 'next/script';

export default function PetaPengawasan() {
  const [lokasi, setLokasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any>({});

    const fetchLokasi = async () => {
      try {
        // Fetch pengawasan_lapangans
        const { data: pengawasanData, error: pengawasanError } = await supabase.from('pengawasan_lapangans')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('latitude', '')
          .neq('longitude', '');
        
        if (pengawasanError) throw pengawasanError;

        // Fetch dokumens (Perizinan)
        const { data: dokumensData, error: dokumensError } = await supabase.from('dokumens')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('latitude', '')
          .neq('longitude', '');
        
        if (dokumensError) {
          // If column doesn't exist yet, this will fail. We catch and ignore it for now.
          console.warn('Dokumens error (maybe latitude column missing):', dokumensError);
        }

        // Add a flag to differentiate them
        const pengawasanList = (pengawasanData || []).map(item => ({ ...item, isPengawasan: true }));
        const perizinanList = (dokumensData || []).map(item => ({ ...item, isPengawasan: false }));

        setLokasi([...pengawasanList, ...perizinanList]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLokasi();
  }, []);

  const initMap = () => {
    // Pastikan script leaflet sudah dimuat (L exists) dan map belum di-init
    if (typeof window === 'undefined' || !(window as any).L || mapInstance.current) return;

    const L = (window as any).L;
    
    // Set View ke area Sragen
    mapInstance.current = L.map('map').setView([-7.4245, 111.0234], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance.current);

    // Render markers setelah map siap
    renderMarkers(L);
  };

  const renderMarkers = (L: any) => {
    if (!mapInstance.current || lokasi.length === 0) return;

      let markerColor = '#10b981'; // Emerald (Taat - default pengawasan)
      if (item.isPengawasan) {
        if (item.status_ketaatan === 'Kurang Taat' || item.status_ketaatan === 'Taat Bersyarat') {
          markerColor = '#f59e0b'; // Amber
        } else if (item.status_ketaatan === 'Tidak Taat') {
          markerColor = '#ef4444'; // Rose
        } else if (!item.status_ketaatan) {
          markerColor = '#64748b'; // Slate (Belum Dinilai)
        }
      } else {
        // Perizinan marker
        markerColor = '#3b82f6'; // Blue for Perizinan
      }

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${markerColor}; width:18px; height:18px; border-radius:50%; border:3px solid #0f172a; box-shadow: 4px 4px 0px rgba(15, 23, 42, 1);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const bapLink = item.file_bap ? `<a href="${item.file_bap}" target="_blank" style="display:inline-block; margin-top:12px; padding:6px 12px; background:#14b8a6; color:#0f172a; font-weight:900; text-decoration:none; border:2px solid #0f172a; border-radius:8px; text-transform:uppercase; font-size:10px; box-shadow: 2px 2px 0 0 #0f172a;">Lihat File BAP &rarr;</a>` : '';

      const popupContent = item.isPengawasan ? `
        <div style="font-family: inherit; max-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 900; background: #f1f5f9; padding: 2px 6px; border: 2px solid #0f172a; border-radius: 4px; display: inline-block; margin-bottom: 8px;">PENGAWASAN • ${item.token || '-'}</div>
          <h4 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${item.nama_kegiatan}</h4>
          <p style="font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase;">${item.kategori || 'Umum'}</p>
          <div style="background: #f8fafc; border: 2px solid #0f172a; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 4px;"><strong>PEMRAKARSA:</strong><br/>${item.nama_pemrakarsa}</div>
            <div style="font-size: 10px;"><strong>STATUS:</strong><br/><span style="color:${markerColor}; font-weight:900;">${(item.status_ketaatan || 'BELUM DINILAI').toUpperCase()}</span></div>
          </div>
          ${bapLink}
        </div>
      ` : `
        <div style="font-family: inherit; max-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 900; background: #dbeafe; color: #1e3a8a; padding: 2px 6px; border: 2px solid #1e3a8a; border-radius: 4px; display: inline-block; margin-bottom: 8px;">PERIZINAN</div>
          <h4 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${item.nama_kegiatan}</h4>
          <p style="font-size: 10px; font-weight: 800; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase;">${item.jenis_dokumen || 'UMUM'}</p>
          <div style="background: #f8fafc; border: 2px solid #0f172a; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 4px;"><strong>PEMRAKARSA:</strong><br/>${item.nama_pemrakarsa}</div>
            <div style="font-size: 10px;"><strong>STATUS:</strong><br/><span style="color:${markerColor}; font-weight:900;">DIARSIPKAN</span></div>
          </div>
          <a href="/perizinan/arsip/${item.id}" target="_blank" style="display:inline-block; margin-top:12px; padding:6px 12px; background:#3b82f6; color:#ffffff; font-weight:900; text-decoration:none; border:2px solid #0f172a; border-radius:8px; text-transform:uppercase; font-size:10px; box-shadow: 2px 2px 0 0 #0f172a;">Lihat Detail Arsip &rarr;</a>
        </div>
      `;

      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng], { icon: customIcon })
         .addTo(mapInstance.current)
         .bindPopup(popupContent);
        
        markersRef.current[item.id] = marker;
      }
    });
  };

  // Re-render markers if data changes and map is ready
  useEffect(() => {
    if (mapInstance.current && (window as any).L && lokasi.length > 0) {
      renderMarkers((window as any).L);
    }
  }, [lokasi]);

  return (
    <div className="flex-1 flex flex-col bg-transparent p-4 lg:p-6 min-h-0">
      
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" onLoad={initMap} />

      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          border: 4px solid #0f172a;
          border-radius: 16px;
          box-shadow: 6px 6px 0 0 #0f172a;
        }
        .leaflet-popup-tip {
          border-top: 4px solid #0f172a;
          border-left: 4px solid #0f172a;
        }
        /* Styling Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0f172a; 
          border-radius: 8px;
        }
      `}} />

      <div className="w-full flex-1 flex flex-col mx-auto space-y-4 min-h-0">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
          <Link href="/" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-sky-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-400 border-4 border-slate-900 flex items-center justify-center text-slate-900 shadow-[4px_4px_0_0_#0f172a] shrink-0">
              <MapIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 uppercase">Peta Sebaran Ketaatan</h2>
              <p className="text-sm font-bold text-slate-600 mt-1">Visualisasi spasial titik lokasi pengawasan dan perizinan.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 min-h-0">
          
          <div className="lg:col-span-1 bg-white p-4 lg:p-5 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] flex flex-col gap-4 min-h-0">
            
            <div className="shrink-0">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-4">Indikator Ketaatan</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block"></span>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block"></span>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Kurang Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block"></span>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Tidak Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-400 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block"></span>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Belum Dinilai</div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t-4 border-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-500 border-4 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block"></span>
                  <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Arsip Perizinan</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="shrink-0 text-xs font-black text-slate-900 uppercase tracking-widest border-b-4 border-slate-900 pb-2 mb-4">Daftar Lokasi (Berkoordinat)</h4>
              
              <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-black text-slate-500 uppercase animate-pulse">Memuat data...</p>
                  </div>
                ) : lokasi.length === 0 ? (
                  <div className="text-center py-6 border-4 border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <p className="text-xs font-black text-slate-500 uppercase">Belum ada koordinat tersimpan.</p>
                  </div>
                ) : (
                  lokasi.map(lok => {
                    let warnaTitik = lok.isPengawasan ? 'bg-slate-400' : 'bg-blue-500';
                    if (lok.isPengawasan) {
                      if (lok.status_ketaatan === 'Taat') warnaTitik = 'bg-emerald-500';
                      else if (lok.status_ketaatan === 'Kurang Taat' || lok.status_ketaatan === 'Taat Bersyarat') warnaTitik = 'bg-amber-500';
                      else if (lok.status_ketaatan === 'Tidak Taat') warnaTitik = 'bg-rose-500';
                    }

                    return (
                      <div 
                        key={lok.id} 
                        onClick={() => {
                          if (markersRef.current[lok.id] && mapInstance.current) {
                            mapInstance.current.setView([parseFloat(lok.latitude), parseFloat(lok.longitude)], 15);
                            markersRef.current[lok.id].openPopup();
                          }
                        }}
                        className={`flex items-start gap-3 p-3 bg-slate-50 border-2 ${lok.isPengawasan ? 'border-slate-900' : 'border-blue-800 bg-blue-50'} rounded-xl hover:bg-sky-100 hover:shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer`}
                      >
                        <span className={`w-4 h-4 mt-0.5 shrink-0 rounded-full border-2 border-slate-900 ${warnaTitik} inline-block`}></span>
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900 uppercase leading-tight mb-1">{lok.nama_kegiatan}</p>
                          <div className="flex justify-between items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lok.isPengawasan ? lok.kategori || 'Umum' : lok.jenis_dokumen || 'PERIZINAN'}</p>
                            {lok.isPengawasan ? (
                              <p className="text-[10px] font-black text-slate-900 uppercase">{lok.status_ketaatan || 'Belum Dinilai'} {lok.total_skor ? `(${lok.total_skor})` : ''}</p>
                            ) : (
                              <p className="text-[10px] font-black text-blue-800 uppercase">DIARSIPKAN</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="shrink-0 bg-sky-200 border-4 border-slate-900 p-4 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
              <p className="text-xs text-slate-900 font-bold flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" /> 
                Klik titik pada peta untuk melihat hasil pengawasan dan file BAP.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-2 rounded-3xl border-4 border-slate-900 shadow-[12px_12px_0_0_#0f172a] overflow-hidden flex flex-col min-h-0">
            <div id="map" className="w-full flex-1 rounded-2xl z-0 min-h-[300px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
