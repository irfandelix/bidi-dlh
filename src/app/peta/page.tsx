'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  MapPin, 
  Search, 
  Layers, 
  Navigation, 
  ExternalLink, 
  Maximize2, 
  X, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText,
  Building2,
  Compass
} from 'lucide-react';
import Script from 'next/script';
import LottieLoader from '@/components/LottieLoader';

export default function PetaSebaranPage() {
  const supabase = createClient();
  const [lokasi, setLokasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [kategoriFilter, setKategoriFilter] = useState<'semua' | 'pengawasan' | 'perizinan' | 'pengaduan'>('semua');
  const [ketaatanFilter, setKetaatanFilter] = useState<'semua' | 'taat' | 'kurang_taat' | 'tidak_taat'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayerGroup = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // 1. Fetch Data dari Database (Pengawasan, Perizinan, Pengaduan)
  useEffect(() => {
    const fetchLokasi = async () => {
      try {
        setLoading(true);

        // Fetch Pengawasan Lapangan
        const { data: pengawasanData, error: pengawasanError } = await supabase
          .from('pengawasan_lapangans')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('latitude', '')
          .neq('longitude', '');

        if (pengawasanError) {
          console.warn('Pengawasan fetch error:', pengawasanError);
        }

        // Fetch Dokumens (Perizinan Terbit)
        let dokumensData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('dokumens')
            .select('*')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .neq('latitude', '')
            .neq('longitude', '');
          if (!error && data) dokumensData = data;
        } catch (e) {
          console.warn('Dokumens coords not ready:', e);
        }

        // Fetch Pengaduans (jika ada koordinat)
        let pengaduanData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('pengaduans')
            .select('*')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .neq('latitude', '')
            .neq('longitude', '');
          if (!error && data) pengaduanData = data;
        } catch (e) {
          console.warn('Pengaduan coords not ready:', e);
        }

        const pengawasanList = (pengawasanData || []).map((item: any) => ({
          ...item,
          tipe: 'pengawasan',
          uniqueKey: `pengawasan-${item.id}`
        }));

        const perizinanList = (dokumensData || []).map((item: any) => ({
          ...item,
          tipe: 'perizinan',
          uniqueKey: `perizinan-${item.id}`
        }));

        const pengaduanList = (pengaduanData || []).map((item: any) => ({
          ...item,
          tipe: 'pengaduan',
          uniqueKey: `pengaduan-${item.id}`
        }));

        setLokasi([...pengawasanList, ...perizinanList, ...pengaduanList]);
      } catch (err) {
        console.error('Gagal memuat titik peta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLokasi();
  }, []);

  // 2. Leaflet Script Ready Detection (Anti-Blank saat navigasi Next.js)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).L) {
      setLeafletLoaded(true);
    }
  }, []);

  // 3. Inisialisasi Peta Leaflet dengan Lifecycle Cleanup yang Aman
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Jika peta sudah ada di instance, hindari double initialization
    if (mapInstance.current) return;

    try {
      // Pusat Kabupaten Sragen [-7.4245, 111.0234]
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-7.4245, 111.0234], 11);

      // Custom Zoom Control di kanan atas
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // LayerGroup untuk marker agar mudah dibersihkan saat filter berubah
      const layerGroup = L.layerGroup().addTo(map);
      markersLayerGroup.current = layerGroup;
      mapInstance.current = map;
      setMapReady(true);
    } catch (err) {
      console.error('Gagal menginisialisasi Leaflet Map:', err);
    }

    // Cleanup saat unmount untuk mencegah "Map container is already initialized"
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayerGroup.current = null;
        setMapReady(false);
      }
    };
  }, [leafletLoaded]);

  // 4. Perhitungan Metrik Statistik
  const metrics = useMemo(() => {
    const total = lokasi.length;
    const pengawasan = lokasi.filter(l => l.tipe === 'pengawasan').length;
    const perizinan = lokasi.filter(l => l.tipe === 'perizinan').length;
    const pengaduan = lokasi.filter(l => l.tipe === 'pengaduan').length;

    const taat = lokasi.filter(l => l.tipe === 'pengawasan' && l.status_ketaatan === 'Taat').length;
    const kurangTaat = lokasi.filter(l => l.tipe === 'pengawasan' && (l.status_ketaatan === 'Kurang Taat' || l.status_ketaatan === 'Taat Bersyarat')).length;
    const tidakTaat = lokasi.filter(l => l.tipe === 'pengawasan' && l.status_ketaatan === 'Tidak Taat').length;

    return { total, pengawasan, perizinan, pengaduan, taat, kurangTaat, tidakTaat };
  }, [lokasi]);

  // 5. Data yang Difilter & Dicari
  const filteredLokasi = useMemo(() => {
    return lokasi.filter(item => {
      // Filter Kategori/Modul
      if (kategoriFilter !== 'semua' && item.tipe !== kategoriFilter) {
        return false;
      }

      // Filter Ketaatan (hanya aktif jika pengawasan)
      if (ketaatanFilter !== 'semua' && item.tipe === 'pengawasan') {
        if (ketaatanFilter === 'taat' && item.status_ketaatan !== 'Taat') return false;
        if (ketaatanFilter === 'kurang_taat' && item.status_ketaatan !== 'Kurang Taat' && item.status_ketaatan !== 'Taat Bersyarat') return false;
        if (ketaatanFilter === 'tidak_taat' && item.status_ketaatan !== 'Tidak Taat') return false;
      }

      // Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = (item.nama_kegiatan || item.perihal || '').toLowerCase();
        const pemrakarsa = (item.nama_pemrakarsa || item.nama_pelapor || '').toLowerCase();
        const terlapor = (item.nama_terlapor || '').toLowerCase();
        const lokasiText = (item.lokasi_kegiatan || item.lokasi_aduan || '').toLowerCase();
        const token = (item.token || '').toLowerCase();
        const kategori = (item.kategori || '').toLowerCase();

        return (
          nama.includes(q) ||
          pemrakarsa.includes(q) ||
          terlapor.includes(q) ||
          lokasiText.includes(q) ||
          token.includes(q) ||
          kategori.includes(q)
        );
      }

      return true;
    });
  }, [lokasi, kategoriFilter, ketaatanFilter, searchQuery]);

  // 6. Sinkronisasi Markers ke Leaflet saat Filter/Data Berubah
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !markersLayerGroup.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Bersihkan marker sebelumnya
    markersLayerGroup.current.clearLayers();
    markersRef.current = {};

    filteredLokasi.forEach(item => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      // Tentukan warna marker
      let markerColor = '#64748b'; // Default Slate
      let badgeLabel = 'Pengawasan';

      if (item.tipe === 'pengawasan') {
        if (item.status_ketaatan === 'Taat') {
          markerColor = '#10b981'; // Emerald
          badgeLabel = 'Taat';
        } else if (item.status_ketaatan === 'Kurang Taat' || item.status_ketaatan === 'Taat Bersyarat') {
          markerColor = '#f59e0b'; // Amber
          badgeLabel = 'Kurang Taat';
        } else if (item.status_ketaatan === 'Tidak Taat') {
          markerColor = '#ef4444'; // Red
          badgeLabel = 'Tidak Taat';
        } else {
          markerColor = '#94a3b8'; // Slate
          badgeLabel = 'Belum Dinilai';
        }
      } else if (item.tipe === 'perizinan') {
        markerColor = '#3b82f6'; // Blue
        badgeLabel = 'Perizinan Terbit';
      } else if (item.tipe === 'pengaduan') {
        markerColor = '#a855f7'; // Purple
        badgeLabel = 'Pengaduan';
      }

      // Buat Icon Custom Elegan
      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.35);
            transition: transform 0.2s ease;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12]
      });

      // Tautan Navigasi Google Maps
      const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      // Konten Popup Modern
      const popupHtml = `
        <div style="font-family: inherit; width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 9px; font-weight: 800; background: ${markerColor}20; color: ${markerColor}; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; border: 1px solid ${markerColor}40;">
              ${badgeLabel}
            </span>
            ${item.token ? `<span style="font-size: 9px; font-mono; font-weight: 700; color: #64748b;">${item.token}</span>` : ''}
          </div>

          <h4 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; line-height: 1.3;">
            ${item.nama_kegiatan || item.perihal || 'Kegiatan Tanpa Judul'}
          </h4>

          <p style="font-size: 10px; font-weight: 600; color: #64748b; margin: 0 0 10px 0;">
            📍 ${item.lokasi_kegiatan || item.lokasi_aduan || 'Lokasi tidak dicantumkan'}
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; margin-bottom: 10px; font-size: 10px;">
            ${item.nama_pemrakarsa ? `<div style="margin-bottom: 3px; color: #475569;"><strong>Pemrakarsa:</strong> <span style="color: #0f172a;">${item.nama_pemrakarsa}</span></div>` : ''}
            ${item.nama_pelapor ? `<div style="margin-bottom: 3px; color: #475569;"><strong>Pelapor:</strong> <span style="color: #0f172a;">${item.nama_pelapor}</span></div>` : ''}
            <div style="color: #475569;"><strong>Koordinat:</strong> <span style="font-family: monospace; color: #0f172a;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span></div>
          </div>

          <div style="display: flex; gap: 6px; flex-direction: column;">
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              background: #0f172a;
              color: #ffffff;
              font-weight: 800;
              font-size: 10px;
              text-transform: uppercase;
              text-decoration: none;
              padding: 7px 10px;
              border-radius: 8px;
              text-align: center;
            ">
              🧭 Buka di Google Maps
            </a>

            ${item.file_bap ? `
              <a href="${item.file_bap}" target="_blank" rel="noopener noreferrer" style="
                display: block;
                background: #10b981;
                color: #ffffff;
                font-weight: 800;
                font-size: 10px;
                text-transform: uppercase;
                text-decoration: none;
                padding: 6px 10px;
                border-radius: 8px;
                text-align: center;
              ">
                📄 Unduh Dokumen BAP
              </a>
            ` : ''}

            ${item.tipe === 'perizinan' ? `
              <a href="/perizinan/arsip/${item.id}" target="_blank" style="
                display: block;
                background: #3b82f6;
                color: #ffffff;
                font-weight: 800;
                font-size: 10px;
                text-transform: uppercase;
                text-decoration: none;
                padding: 6px 10px;
                border-radius: 8px;
                text-align: center;
              ">
                📂 Buka Arsip Perizinan
              </a>
            ` : ''}

            ${item.tipe === 'pengaduan' ? `
              <a href="/pengaduan/detail/${item.id}" target="_blank" style="
                display: block;
                background: #a855f7;
                color: #ffffff;
                font-weight: 800;
                font-size: 10px;
                text-transform: uppercase;
                text-decoration: none;
                padding: 6px 10px;
                border-radius: 8px;
                text-align: center;
              ">
                🔍 Detail Pengaduan
              </a>
            ` : ''}
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(markersLayerGroup.current)
        .bindPopup(popupHtml);

      markersRef.current[item.uniqueKey] = marker;
    });
  }, [filteredLokasi, mapReady]);

  // Helper Fit All Bounds
  const handleFitAllBounds = () => {
    if (!mapInstance.current || filteredLokasi.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    const coords = filteredLokasi
      .map(item => [parseFloat(item.latitude), parseFloat(item.longitude)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  // Helper Fokus ke Salah Satu Titik dari Sidebar
  const handleFocusItem = (item: any) => {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    setSelectedId(item.uniqueKey);

    if (mapInstance.current) {
      mapInstance.current.flyTo([lat, lng], 15, { duration: 0.8 });
      const marker = markersRef.current[item.uniqueKey];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen p-4 lg:p-6 space-y-4">
      
      {/* Leaflet Stylesheet & Script Ingestion */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <Script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
        strategy="afterInteractive" 
        onLoad={() => setLeafletLoaded(true)} 
      />

      {/* Custom Styles for Popup and Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 6px;
        }
        .leaflet-popup-content {
          margin: 10px 12px;
          line-height: 1.4;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Tombol Kembali & Judul */}
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="w-12 h-12 rounded-2xl bg-white text-slate-800 border border-slate-200 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-400 border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm shrink-0">
              <MapIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Peta Sebaran Ketaatan & Titik Lokasi
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase">
                Visualisasi Geospasial Pengawasan, Perizinan & Aduan Lingkungan Hidup Kab. Sragen
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Cepat Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFitAllBounds}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-sm hover:-translate-y-0.5 transition-all"
            title="Fokuskan peta ke seluruh titik yang ada"
          >
            <Maximize2 size={15} />
            <span className="hidden sm:inline">Fokus Seluruh Titik</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER: SIDEBAR + MAP */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px] h-full">
        
        {/* SIDEBAR FILTER & DAFTAR TITIK (Col 1-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-md flex flex-col gap-4 overflow-hidden">
          
          {/* Kartu Ringkasan Metrik Mini */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Taat</span>
              <span className="text-lg font-black font-mono text-emerald-800">{metrics.taat}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Kurang Taat</span>
              <span className="text-lg font-black font-mono text-amber-800">{metrics.kurangTaat}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Tidak Taat</span>
              <span className="text-lg font-black font-mono text-rose-800">{metrics.tidakTaat}</span>
            </div>
          </div>

          {/* Filter Modul Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Filter Modul Sumber:
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setKategoriFilter('semua')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  kategoriFilter === 'semua' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setKategoriFilter('pengawasan')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  kategoriFilter === 'pengawasan' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Was ({metrics.pengawasan})
              </button>
              <button
                type="button"
                onClick={() => setKategoriFilter('perizinan')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  kategoriFilter === 'perizinan' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Izin ({metrics.perizinan})
              </button>
              <button
                type="button"
                onClick={() => setKategoriFilter('pengaduan')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  kategoriFilter === 'pengaduan' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aduan ({metrics.pengaduan})
              </button>
            </div>
          </div>

          {/* Sub-Filter Status Ketaatan */}
          {(kategoriFilter === 'semua' || kategoriFilter === 'pengawasan') && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Status Ketaatan Pengawasan:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setKetaatanFilter('semua')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                    ketaatanFilter === 'semua' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setKetaatanFilter('taat')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                    ketaatanFilter === 'taat' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  Taat
                </button>
                <button
                  type="button"
                  onClick={() => setKetaatanFilter('kurang_taat')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                    ketaatanFilter === 'kurang_taat' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  Kurang Taat
                </button>
                <button
                  type="button"
                  onClick={() => setKetaatanFilter('tidak_taat')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${
                    ketaatanFilter === 'tidak_taat' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  Tidak Taat
                </button>
              </div>
            </div>
          )}

          {/* Search Box Real-Time */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari usaha, kegiatan, pemrakarsa, lokasi..."
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Daftar Titik Berkoordinat */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Titik Terpilih ({filteredLokasi.length})
              </span>
              <span className="text-[10px] font-bold text-slate-400">Klik untuk fokus titik</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px]">
              {loading ? (
                <div className="text-center py-12">
                  <LottieLoader size={80} text="MEMUAT KOORDINAT..." />
                </div>
              ) : filteredLokasi.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                  <MapPin size={24} className="mx-auto text-slate-400" />
                  <p className="text-xs font-black text-slate-700 uppercase">Tidak ada titik yang cocok</p>
                  <p className="text-[10px] text-slate-400 font-semibold normal-case">
                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada data dengan koordinat yang tersimpan.'}
                  </p>
                </div>
              ) : (
                filteredLokasi.map((item) => {
                  const isSelected = selectedId === item.uniqueKey;
                  let colorClass = 'bg-slate-400';
                  let statusText = 'Belum Dinilai';

                  if (item.tipe === 'pengawasan') {
                    if (item.status_ketaatan === 'Taat') {
                      colorClass = 'bg-emerald-500';
                      statusText = 'Taat';
                    } else if (item.status_ketaatan === 'Kurang Taat' || item.status_ketaatan === 'Taat Bersyarat') {
                      colorClass = 'bg-amber-500';
                      statusText = 'Kurang Taat';
                    } else if (item.status_ketaatan === 'Tidak Taat') {
                      colorClass = 'bg-rose-500';
                      statusText = 'Tidak Taat';
                    }
                  } else if (item.tipe === 'perizinan') {
                    colorClass = 'bg-blue-500';
                    statusText = 'Perizinan';
                  } else if (item.tipe === 'pengaduan') {
                    colorClass = 'bg-purple-500';
                    statusText = 'Aduan';
                  }

                  return (
                    <div
                      key={item.uniqueKey}
                      onClick={() => handleFocusItem(item)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-100 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${colorClass} border border-white shadow-sm shrink-0 mt-1`}></span>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-slate-900 truncate uppercase">
                            {item.nama_kegiatan || item.perihal || 'Kegiatan Tanpa Judul'}
                          </h5>
                          <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                            📍 {item.lokasi_kegiatan || item.lokasi_aduan || 'Lokasi belum dicantumkan'}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[9px] font-bold">
                            <span className="text-slate-400 uppercase font-mono">{item.kategori || item.tipe}</span>
                            <span className="uppercase font-black text-slate-700">{statusText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* MAP CONTAINER (Col 5-12) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-3 shadow-md flex flex-col relative overflow-hidden">
          
          {/* Petunjuk & Indikator Floating Atas */}
          <div className="absolute top-6 left-6 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-2xl shadow-md pointer-events-none hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700">
            <Compass size={16} className="text-sky-600 animate-spin-slow" />
            <span>Klik titik untuk membuka rincian & navigasi Google Maps</span>
          </div>

          {/* Wadah Peta Leaflet */}
          <div 
            ref={mapContainerRef} 
            id="map" 
            className="w-full h-full min-h-[500px] rounded-2xl z-0 overflow-hidden bg-slate-100"
          ></div>

        </div>

      </div>

    </div>
  );
}
