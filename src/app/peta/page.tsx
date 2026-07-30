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

  useEffect(() => {
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

        // Fetch pengaduans (if exists)
        const { data: pengaduanData, error: pengaduanError } = await supabase.from('pengaduans')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('latitude', '')
          .neq('longitude', '');
        
        if (pengaduanError) {
          console.warn('Pengaduan error (maybe table not ready):', pengaduanError);
        }

        // Add a flag to differentiate them
        // @ts-ignore
        const pengawasanList = (pengawasanData || []).map((item: any) => ({ ...item, isPengawasan: true }));
        // @ts-ignore
        const perizinanList = (dokumensData || []).map((item: any) => ({ ...item, isPengawasan: false }));
        // @ts-ignore
        const pengaduanList = (pengaduanData || []).map((item: any) => ({ ...item, isPengaduan: true }));

        setLokasi([...pengawasanList, ...perizinanList, ...pengaduanList]);
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

    lokasi.forEach(item => {
      let markerColor = '#10b981'; // Emerald (Taat - default pengawasan)
      if (item.isPengawasan) {
        if (item.status_ketaatan === 'Kurang Taat' || item.status_ketaatan === 'Taat Bersyarat') {
          markerColor = '#f59e0b'; // Amber
        } else if (item.status_ketaatan === 'Tidak Taat') {
          markerColor = '#f43f5e'; // Rose
        } else if (!item.status_ketaatan) {
          markerColor = '#94a3b8'; // Slate (Belum Dinilai)
        }
      } else if (item.isPengaduan) {
        // Pengaduan marker
        markerColor = '#a855f7'; // Purple for Pengaduan
      } else {
        // Perizinan marker
        markerColor = '#4f46e5'; // Indigo for Perizinan
      }

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${markerColor}; width:16px; height:16px; border-radius:50%; border:2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const bapLink = item.file_bap ? `<a href="${item.file_bap}" target="_blank" style="display:inline-block; margin-top:12px; padding:6px 12px; background:#10b981; color:#ffffff; font-weight:700; text-decoration:none; border-radius:6px; text-transform:uppercase; font-size:10px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">Lihat File BAP &rarr;</a>` : '';

      let popupContent = '';
      
      if (item.isPengaduan) {
        popupContent = `
        <div style="font-family: inherit; max-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; background: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">PENGADUAN LINGKUNGAN</div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${item.nama_kegiatan || item.perihal || 'DETAIL PENGADUAN'}</h4>
          <p style="font-size: 10px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase;">${item.lokasi_kegiatan || 'LOKASI BELUM DITENTUKAN'}</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 4px; color:#475569"><strong>PELAPOR:</strong><br/><span style="color:#0f172a">${item.pelapor || item.nama_pemrakarsa || '-'}</span></div>
            <div style="font-size: 10px; color:#475569"><strong>STATUS:</strong><br/><span style="color:${markerColor}; font-weight:700;">${(item.status || item.status_ketaatan || 'BELUM DIPROSES').toUpperCase()}</span></div>
          </div>
        </div>
        `;
      } else if (item.isPengawasan) {
        popupContent = `
        <div style="font-family: inherit; max-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">PENGAWASAN • ${item.token || '-'}</div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${item.nama_kegiatan}</h4>
          <p style="font-size: 10px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase;">${item.kategori || 'Umum'}</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 4px; color:#475569"><strong>PEMRAKARSA:</strong><br/><span style="color:#0f172a">${item.nama_pemrakarsa}</span></div>
            <div style="font-size: 10px; color:#475569"><strong>STATUS:</strong><br/><span style="color:${markerColor}; font-weight:700;">${(item.status_ketaatan || 'BELUM DINILAI').toUpperCase()}</span></div>
          </div>
          ${bapLink}
        </div>
        `;
      } else {
        popupContent = `
        <div style="font-family: inherit; max-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">PERIZINAN TERBIT</div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase;">${item.nama_kegiatan || '-'}</h4>
          <p style="font-size: 10px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase;">${item.lokasi_kegiatan || 'LOKASI BELUM DIISI'}</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px;">
            <div style="font-size: 10px; margin-bottom: 4px; color:#475569"><strong>SK / PKPLH:</strong><br/><span style="color:#0f172a">${item.nomor_sk || 'BELUM TERBIT'}</span></div>
            <div style="font-size: 10px; margin-bottom: 4px; color:#475569"><strong>TAHUN TERBIT:</strong><br/><span style="color:#0f172a">${item.tahun || '-'}</span></div>
            <div style="font-size: 10px; color:#475569"><strong>STATUS:</strong><br/><span style="color:${markerColor}; font-weight:700;">DIARSIPKAN</span></div>
          </div>
          <a href="/perizinan/arsip/${item.id}" target="_blank" style="display:inline-block; margin-top:12px; padding:6px 12px; background:#4f46e5; color:#ffffff; font-weight:700; text-decoration:none; border-radius:6px; text-transform:uppercase; font-size:10px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">Lihat Detail Arsip &rarr;</a>
        </div>
        `;
      }

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
          border: none;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .leaflet-popup-tip {
          /* Default leafleft tip is fine */
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
          <Link href="/" className="w-12 h-12 rounded-xl bg-surface text-on-surface border border-outline-variant flex items-center justify-center hover:bg-sky-400 hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-400 border border-outline-variant flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-shadow shrink-0">
              <MapIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-on-surface uppercase">Peta Sebaran Ketaatan</h2>
              <p className="text-sm font-bold text-on-surface-variant mt-1">Visualisasi spasial titik lokasi pengawasan dan perizinan.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 min-h-0">
          
          <div className="lg:col-span-1 bg-surface p-4 lg:p-5 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 min-h-0">
            
            <div className="shrink-0">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest border-b-4 border-outline-variant pb-2 mb-4">Indikator Ketaatan</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b-4 border-outline-variant">
                  <span className="w-5 h-5 rounded-full bg-purple-500 border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Pengaduan</div>
                </div>
                <div className="flex items-center gap-3 pb-4 mb-4 border-b-4 border-outline-variant">
                  <span className="w-5 h-5 rounded-full bg-blue-500 border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Perizinan Terbit</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Kurang Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500 border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Tidak Taat</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-400 border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block"></span>
                  <div className="text-xs font-bold text-on-surface uppercase tracking-widest">Belum Dinilai</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="shrink-0 text-xs font-bold text-on-surface uppercase tracking-widest border-b-4 border-outline-variant pb-2 mb-4">Daftar Lokasi (Berkoordinat)</h4>
              
              <div className="h-64 lg:h-auto lg:flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-on-surface-variant uppercase animate-pulse">Memuat data...</p>
                  </div>
                ) : lokasi.length === 0 ? (
                  <div className="text-center py-6 border-4 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
                    <p className="text-xs font-bold text-on-surface-variant uppercase">Belum ada koordinat tersimpan.</p>
                  </div>
                ) : (
                  lokasi.map(lok => {
                    let warnaTitik = lok.isPengaduan ? 'bg-purple-500' : (lok.isPengawasan ? 'bg-slate-400' : 'bg-blue-500');
                    if (lok.isPengawasan) {
                      if (lok.status_ketaatan === 'Taat') warnaTitik = 'bg-secondary text-on-secondary';
                      else if (lok.status_ketaatan === 'Kurang Taat' || lok.status_ketaatan === 'Taat Bersyarat') warnaTitik = 'bg-amber-500';
                      else if (lok.status_ketaatan === 'Tidak Taat') warnaTitik = 'bg-rose-500';
                    }

                    return (
                      <div 
                        key={lok.id} 
                        onClick={() => {
                          const marker = markersRef.current[lok.id];
                          if (marker && mapInstance.current) {
                            mapInstance.current.setView(marker.getLatLng(), 15);
                            marker.openPopup();
                          }
                        }}
                        className="group flex flex-col p-3 border border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors bg-surface shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${warnaTitik} border border-outline-variant shrink-0`}></span>
                          <span className="text-[10px] font-bold text-on-surface truncate uppercase flex-1">
                            {lok.isPengaduan ? (lok.nama_kegiatan || lok.perihal || 'Pengaduan') : (lok.nama_kegiatan || 'Tanpa Nama')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pl-6">
                          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">{lok.kategori || 'UMUM'}</span>
                          <span className="text-[8px] font-bold text-on-surface uppercase">
                            {lok.isPengaduan ? (lok.status || lok.status_ketaatan || 'BELUM DIPROSES') : (lok.isPengawasan ? (lok.status_ketaatan || 'BELUM DINILAI') : 'DIARSIPKAN')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="hidden lg:block shrink-0 bg-sky-200 border border-outline-variant p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow mt-4 mb-2">
              <p className="text-xs text-on-surface font-bold flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" /> 
                Klik titik pada peta untuk melihat hasil pengawasan dan file BAP.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            <div className="lg:hidden shrink-0 bg-sky-200 border border-outline-variant p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-2 mt-2">
              <p className="text-xs text-on-surface font-bold flex items-start gap-2">
                <Info size={16} className="shrink-0 mt-0.5" /> 
                Klik titik pada peta untuk melihat hasil pengawasan dan file BAP.
              </p>
            </div>
            <div className="flex-1 bg-surface p-2 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col min-h-0">
              <div id="map" className="w-full flex-1 rounded-2xl z-0 min-h-[300px]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
