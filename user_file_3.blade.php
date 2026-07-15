<USER_REQUEST>
@extends('layouts.lapangan')

@section('content')

@php
// Memecah nama tim tugas untuk dinamisasi tanda tangan dan paraf
$timTugasString = $agenda->tim_tugas ?? '';
$timTugasArray = strpos($timTugasString, '|') !== false ? explode('|', $timTugasString) : explode(',', $timTugasString);
$timTugasArray = array_values(array_filter(array_map('trim', $timTugasArray)));

// CHECKLIST ASLI SPPG MILIKMU
$templateSPPG = [
    [
        'bab' => '2. Pemeriksaan Pengelolaan Air Limbah',
        'items' => [
            ['no' => 'a', 'point' => 'Sumber limbah'],
            ['no' => 'b', 'point' => 'Kondisi fisik IPAL grey water'],
            ['no' => 'c', 'point' => 'Data pantau analisa air limbah domestik'],
            ['no' => 'd', 'point' => 'Pengelolaan sludge septictank'],
            ['no' => 'e', 'point' => 'Pengelolaan IPAL'],
        ]
    ],
    [
        'bab' => '3. Pemeriksaan Pengelolaan Limbah Bahan Berbahaya dan Beracun (LB3)',
        'items' => [
            ['no' => 'a', 'point' => 'Sumber LB3'],
            ['no' => 'b', 'point' => 'Jenis LB3'],
            ['no' => 'c', 'point' => 'Kondisi TPS LB3'],
            ['no' => 'd', 'point' => 'Pengelolaan LB3'],
        ]
    ],
    [
        'bab' => '4. Pemeriksaan Pengelolaan Sampah Domestik',
        'items' => [
            ['no' => 'a', 'point' => 'Sumber Sampah Domestik'],
            ['no' => 'b', 'point' => 'Jenis Sampah Domestik'],
            ['no' => 'c', 'point' => 'Kondisi TPS Sampah Domestik'],
            ['no' => 'd', 'point' => 'Pengelolaan sampah domestik'],
        ]
    ]
];
@endphp

<div x-data="bapSPPG()" class="min-h-screen bg-slate-50 font-sans pb-24 relative">

    <div class="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
            <a href="/pengawasan/agenda" class="text-slate-400 hover:text-slate-600">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </a>
            <div class="flex-1">
                <h2 class="text-base font-black text-slate-800 leading-tight">BAP Sektor SPPG</h2>
                <p class="text-[10px] font-bold text-teal-600 uppercase tracking-widest">KAB. SRAGEN</p>
            </div>
            <span class="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                Langkah <span x-text="step"></span>/5
            </span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-teal-500 h-1.5 rounded-full transition-all duration-500 ease-out" :style="'width: ' + ((step / 5) * 100) + '%'"></div>
        </div>
    </div>

    <!-- UPDATE ACTION MENGARAH KE UPDATE BAP -->
    <form action="/pengawasan/ba/update/{{ $agenda->id }}" method="POST" enctype="multipart/form-data" class="p-4" id="formBap">
        @csrf
        @method('PUT')

        <div x-cloak x-show="step === 1" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-x-4">
            
            <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
                <h3 class="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-3">Tim Pengawas Lapangan</h3>
                <div class="bg-white p-3 rounded-lg text-sm border border-indigo-100 shadow-sm">
                    <p class="font-bold text-slate-800">{{ $agenda->tim_tugas }}</p>
                    <p class="text-slate-500 text-xs">Tim Pengawas Lingkungan Hidup | DLH Kab. Sragen</p>
                </div>
            </div>

            <h3 class="font-bold text-slate-700 mb-4 border-l-4 border-teal-500 pl-3">A & B. Identitas Fasilitas</h3>

            <div class="space-y-4">
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Fasilitas / SPPG</label>
                        <input type="text" value="{{ $agenda->nama_pemrakarsa }}" readonly class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-100 mb-2">
                        
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">KBLI & Lokasi</label>
                        <input type="text" name="bap[kbli]" placeholder="Ketik Kode KBLI..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:border-teal-500">
                        <textarea name="bap[alamat]" rows="2" placeholder="Alamat lengkap lokasi SPPG..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500"></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun Beroperasi</label>
                            <input type="number" name="bap[tahun_operasi]" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Permodalan</label>
                            <input type="text" name="bap[status_permodalan]" placeholder="Pemerintah/Swasta..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Penanggung Jawab Fasilitas</label>
                        <div class="flex gap-2">
                            <input type="text" name="bap[pj_nama]" placeholder="Nama Lengkap" class="w-2/3 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                            <input type="text" name="bap[pj_jabatan]" placeholder="Jabatan" class="w-1/3 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">No. Telp / Fax</label>
                        <input type="text" name="bap[telepon]" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                    </div>
                </div>

                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">Koordinat & Batas Wilayah</label>
                    <div class="flex gap-2">
                        <input type="text" x-model="koordinat" name="bap[koordinat]" readonly placeholder="Ketuk pin GPS 👉" class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-600">
                        <button type="button" @click="getLocation()" class="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-md">
                            <i data-lucide="map-pin" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mt-3">
                        <input type="text" name="bap[batas_utara]" placeholder="Batas Utara..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                        <input type="text" name="bap[batas_selatan]" placeholder="Batas Selatan..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                        <input type="text" name="bap[batas_barat]" placeholder="Batas Barat..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                        <input type="text" name="bap[batas_timur]" placeholder="Batas Timur..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                    </div>

                    <label class="block text-[10px] font-bold text-slate-500 uppercase mt-4">Luas Area (Dibagi 2)</label>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="text" name="bap[luas_total]" placeholder="Total Lahan..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                        <input type="text" name="bap[luas_terbangun]" placeholder="Luas Terbangun..." class="px-3 py-2 border border-slate-200 rounded-lg text-xs">
                    </div>
                </div>
            </div>
        </div>

        <div x-cloak x-show="step === 2" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-x-4">
            <h3 class="font-bold text-slate-700 mb-4 border-l-4 border-teal-500 pl-3">B. Operasional & Utilitas</h3>
            
            <div class="space-y-4">
                
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kapasitas Kegiatan</label>
                        <input type="text" name="bap[kapasitas_kegiatan]" placeholder="Kapasitas Kegiatan (Misal: 1000 Porsi/Hari)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Populasi (Pekerja & Pengunjung)</label>
                        <input type="text" name="bap[jumlah_karyawan_pengunjung]" placeholder="Jumlah Pekerja dan Pengunjung per hari..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                    </div>

                    <div class="grid grid-cols-1 gap-3">
                        <textarea name="bap[shift_kerja]" rows="2" placeholder="Jam Shift Kerja/Hari..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500"></textarea>
                        <input type="number" name="bap[hari_kerja_minggu]" placeholder="Jumlah hari kerja dalam 1 minggu (Hari)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500">
                    </div>
                </div>

                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pengelolaan Air & Limbah Cair</label>
                    <textarea name="bap[teknologi_air_limbah]" rows="2" placeholder="Teknologi Pengelolaan Pembuangan Air Limbah (Grease trap, Septictank, dll)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:border-teal-500"></textarea>
                    <input type="text" name="bap[volume_air_limbah]" placeholder="Volume Air Limbah (Liter/Hari)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:border-teal-500">
                    
                    <textarea name="bap[pemanfaatan_air_tanah]" rows="2" placeholder="Pemanfaatan Air Tanah (Sumur/PDAM)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:border-teal-500"></textarea>
                    <input type="number" name="bap[penggunaan_air_liter]" placeholder="Jumlah Penggunaan Air Dalam Satu Hari (L/Hari)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-2 focus:border-teal-500">
                    
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1 mt-2">Penggunaan Energi</label>
                    <textarea name="bap[penggunaan_energi]" rows="2" placeholder="Penggunaan Energi (LPG, Listrik PLN, Genset)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500"></textarea>
                </div>

                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <h4 class="text-xs font-bold text-slate-600 border-b border-slate-200 pb-2">Dokumen Perizinan</h4>
                    <textarea name="bap[dokumen_dimiliki]" rows="2" placeholder="Dokumen yang dimiliki (UKL-UPL, SPPL)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500"></textarea>
                    <textarea name="bap[persetujuan_lingkungan]" rows="2" placeholder="Persetujuan Lingkungan (Nomor & Tanggal)..." class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-teal-500"></textarea>
                </div>
            </div>
        </div>

        <div x-cloak x-show="step === 3" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-x-4">
            <h3 class="font-bold text-slate-700 mb-4 border-l-4 border-amber-500 pl-3">C. Hasil Pengawasan SPPG</h3>

            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">1. Persetujuan Lingkungan</h4>
                <div class="space-y-3">
                    <template x-for="(dok, index) in listDokumen" :key="dok.id">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-400" x-text="(index + 1) + '.'"></span>
                            <input type="text" name="bap[persetujuan_lingkungan_list][]" placeholder="Nama Dokumen/Izin..." class="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                            <button type="button" @click="hapusDokumen(index)" x-show="listDokumen.length > 1" class="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </template>
                    <button type="button" @click="tambahDokumen()" class="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Tambah Dokumen Izin
                    </button>
                </div>
            </div>

            <div class="space-y-6">
                <template x-for="(kategori, catIndex) in checklistSPPG" :key="catIndex">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        
                        <div class="bg-slate-100 border-b border-slate-200 px-4 py-3">
                            <h4 class="font-black text-slate-700 text-sm" x-text="kategori.bab"></h4>
                        </div>

                        <div class="p-4 space-y-6">
                            <template x-for="(item, itemIndex) in kategori.items" :key="itemIndex">
                                <div class="border-b border-dashed border-slate-200 pb-4 last:border-0 last:pb-0">
                                    
                                    <div class="flex gap-2 mb-3">
                                        <span class="font-bold text-slate-400" x-text="item.no + '.'"></span>
                                        <p class="font-bold text-slate-800 text-sm" x-text="item.point"></p>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pl-5">
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kondisi Eksisting</label>
                                            <textarea :name="'tabel_c['+catIndex+'][items]['+itemIndex+'][kondisi]'" 
                                                      rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-amber-500" placeholder="Ketik hasil temuan riil..."></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan</label>
                                            <textarea :name="'tabel_c['+catIndex+'][items]['+itemIndex+'][keterangan]'" 
                                                      rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-amber-500" placeholder="Kosongkan jika tidak ada catatan..."></textarea>
                                        </div>
                                    </div>
                                    
                                    <input type="hidden" :name="'tabel_c['+catIndex+'][bab]'" :value="kategori.bab">
                                    <input type="hidden" :name="'tabel_c['+catIndex+'][items]['+itemIndex+'][point]'" :value="item.point">
                                </div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <div x-cloak x-show="step === 4" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-x-4">
            <h3 class="font-bold text-slate-700 mb-4 border-l-4 border-indigo-500 pl-3">D. Dokumentasi & Penutup</h3>
            
            <!-- Bukti Foto -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Bukti Foto Lapangan (Bab 5)</h4>
                
                <div class="space-y-3">
                    <template x-for="(foto, index) in listFoto" :key="foto.id">
                        <div class="p-4 border border-indigo-100 rounded-xl bg-indigo-50 relative shadow-sm">
                            <button type="button" @click="hapusFoto(index)" x-show="listFoto.length > 1" class="absolute top-3 right-3 text-rose-500 hover:text-rose-700 p-1 bg-white rounded-md shadow-sm">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                            <div class="space-y-3 pr-8">
                                <div>
                                    <label class="block text-xs font-bold text-indigo-700 mb-1">Pilih Foto</label>
                                    <input type="file" :name="`dokumentasi[${index}][file]`" accept="image/*" capture="environment" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-indigo-700 mb-1">Keterangan Foto</label>
                                    <input type="text" :name="`dokumentasi[${index}][keterangan]`" placeholder="Contoh: Tampak IPAL Grey Water..." class="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm bg-white">
                                </div>
                            </div>
                        </div>
                    </template>
                    <button type="button" @click="tambahFoto()" class="w-full py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i> Tambah Foto Lainnya
                    </button>
                </div>
            </div>

            <!-- Informasi Tambahan -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Informasi Tambahan & Rekam Jejak</h4>

                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Riwayat Ketaatan</label>
                <textarea name="bap[riwayat_ketaatan]" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-3 focus:border-indigo-500" placeholder="Jelaskan riwayat ketaatan fasilitas ini..."></textarea>
                
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nilai Investasi</label>
                <textarea name="bap[nilai_investasi]" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-3 focus:border-indigo-500" placeholder="Ketik nominal investasi..."></textarea>

                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inspeksi Terakhir</label>
                <textarea name="bap[inspeksi_terakhir]" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500" placeholder="Contoh: Oleh DLH Tahun 2024..."></textarea>
            </div>
            
            <!-- Saran Masukan -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Saran / Masukan Tambahan</h4>
                <div class="space-y-3">
                    <template x-for="(saran, index) in listSaran" :key="saran.id">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-400" x-text="(index + 1) + '.'"></span>
                            <input type="text" :name="`saran[]`" placeholder="Ketik saran perbaikan kesling..." class="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50">
                            <button type="button" @click="hapusSaran(index)" x-show="listSaran.length > 1" class="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </template>
                    <button type="button" @click="tambahSaran()" class="w-full py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Tambah Poin Saran
                    </button>
                </div>
            </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Rincian & Kesimpulan Penilaian</h4>

            <div class="space-y-3 mb-6">
                <template x-for="(komponen, index) in komponenPenilaian" :key="index">
                    <div class="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm">
                        
                        <div class="flex-none bg-slate-100 text-slate-500 font-black px-3 py-2 rounded-lg text-sm flex items-center justify-center min-w-[50px] border border-slate-200">
                            <span x-text="'C.' + (index + 1)"></span>
                        </div>
                        
                        <div class="flex-1">
                            <input type="text" x-model="komponen.nama" :name="`rincian_skoring[${index}][nama]`" 
                                class="w-full bg-transparent border-0 border-b border-dashed border-slate-300 focus:border-indigo-500 focus:ring-0 px-0 py-1 text-sm font-bold text-slate-700" placeholder="Ketik rincian (Misal: Dokumen Izin)...">
                        </div>
                        
                        <div class="w-full md:w-32 flex items-center gap-2">
                            <input type="number" min="0" x-model.number="komponen.nilai" :name="`rincian_skoring[${index}][nilai]`" 
                                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-black text-amber-600 focus:border-amber-500 focus:ring-0 text-lg shadow-inner bg-slate-50" placeholder="0">
                            
                            <button type="button" @click="komponenPenilaian.splice(index, 1)" x-show="komponenPenilaian.length > 1" class="text-rose-400 hover:text-rose-600 p-2 md:p-1 rounded-lg hover:bg-rose-50 transition-colors" title="Hapus Komponen">
                                <i data-lucide="trash-2" class="w-5 h-5 md:w-4 md:h-4"></i>
                            </button>
                        </div>

                    </div>
                </template>

                <button type="button" @click="komponenPenilaian.push({nama: '', nilai: null}); setTimeout(() => { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 100);" class="w-full py-3 border border-dashed border-indigo-300 rounded-xl text-indigo-500 font-bold text-xs hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Tambah Komponen Nilai Baru
                </button>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                
                <div x-show="totalSkor > 100" class="absolute inset-0 bg-rose-50 border-2 border-rose-500 rounded-xl animate-pulse"></div>

                <div class="relative z-10">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nilai Rata-Rata Pengawasan</p>
                    <div class="flex items-end gap-2">
                        <span class="text-4xl font-black" :class="totalSkor > 100 ? 'text-rose-600' : 'text-amber-500'" x-text="totalSkor"></span>
                        <span class="text-sm font-medium text-slate-400 mb-1">/ 100 Max</span>
                    </div>
                    <p x-show="totalSkor > 100" class="text-[10px] font-bold text-rose-600 mt-2 bg-rose-100 px-2 py-1 rounded inline-block">
                        <i data-lucide="alert-circle" class="w-3 h-3 inline pb-0.5"></i> Ada nilai melebihi 100!
                    </p>
                </div>
                
                <div class="text-right w-full md:w-auto relative z-10">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Ketaatan</p>
                    <div class="px-5 py-2.5 rounded-lg font-black text-sm uppercase tracking-wider text-center"
                        :class="{
                            'bg-slate-100 text-slate-500 border border-slate-200': finalStatus === 'Belum Ada Nilai',
                            'bg-rose-600 text-white shadow-md': finalStatus === 'CEK INPUT',
                            'bg-rose-50 text-rose-600 border border-rose-200': finalStatus === 'Tidak Taat',
                            'bg-amber-50 text-amber-600 border border-amber-200': finalStatus === 'Taat dengan Catatan',
                            'bg-emerald-50 text-emerald-600 border border-emerald-200': finalStatus === 'Taat'
                        }" 
                        x-text="finalStatus">
                    </div>
                </div>
            </div>
            
            <input type="hidden" name="total_skor" :value="totalSkor">
            <input type="hidden" name="status_ketaatan" :value="finalStatus">
        </div>

        <!-- ====================================== -->
        <!-- STEP 5 : PENANDATANGANAN BA PENGAWASAN -->
        <!-- ====================================== -->
        <div x-cloak x-show="step === 5" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-x-4">
            <h3 class="font-bold text-slate-700 mb-4 border-l-4 border-rose-500 pl-3">E. Pengesahan BAP Lapangan</h3>
            
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div class="mb-4">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Pihak Fasilitas / SPPG</span>
                    <p class="text-[10px] text-slate-400">Tanda tangan & paraf penanggung jawab fasilitas.</p>
                </div>

                <label class="block text-xs font-bold text-rose-700 mb-1 mt-4">Tanda Tangan Penanggung Jawab</label>
                <div class="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden mb-2 bg-slate-50 relative">
                    <canvas id="canvas-ttd" class="w-full h-48 touch-none"></canvas>
                </div>
                <button type="button" @click="clearTtd()" class="text-xs text-rose-500 mb-4 font-bold flex items-center gap-1 hover:text-rose-700">
                    <i data-lucide="refresh-ccw" class="w-3 h-3"></i> Hapus / Ulangi TTD
                </button>
                <input type="hidden" name="bap[ttd_pemrakarsa]" id="input-ttd">

                <hr class="border-slate-200 my-4">

                <label class="block text-xs font-bold text-rose-700 mb-1">Paraf (Untuk Footer Halaman)</label>
                <div class="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden mb-2 bg-slate-50 relative">
                    <canvas id="canvas-paraf" class="w-full h-24 touch-none"></canvas>
                </div>
                <button type="button" @click="clearParaf()" class="text-xs text-rose-500 mb-4 font-bold flex items-center gap-1 hover:text-rose-700">
                    <i data-lucide="refresh-ccw" class="w-3 h-3"></i> Hapus / Ulangi Paraf
                </button>
                <input type="hidden" name="bap[paraf_pemrakarsa]" id="input-paraf">

                <hr class="border-slate-300 my-6 border-2">

                <!-- TIM PENGAWAS (FORMAT GRID 2 KOLOM) -->
                <div class="mb-4">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Tim Pengawas Lingkungan Hidup</span>
                    <p class="text-[10px] text-slate-400">Tanda tangan & paraf anggota tim.</p>
                </div>

                @foreach($timTugasArray as $idx => $nama)
                    <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-3 shadow-sm">
                        <label class="block text-xs font-black text-emerald-800 mb-2">{{ $idx + 1 }}. {{ $nama }}</label>
                        
                        <div class="grid grid-cols-2 gap-3">
                            
                            <div>
                                <label class="block text-[9px] font-bold text-emerald-600 uppercase mb-0.5">Tanda Tangan</label>
                                <div class="border border-dashed border-emerald-300 rounded-lg overflow-hidden bg-white h-20 relative">
                                    <canvas id="canvas-tim-{{ $idx }}" class="w-full h-full touch-none"></canvas>
                                </div>
                                <button type="button" @click="clearTim({{ $idx }})" class="text-[9px] text-rose-500 font-bold mt-1 uppercase hover:text-rose-700 transition-colors">Hapus TTD</button>
                            </div>

                            <div>
                                <label class="block text-[9px] font-bold text-emerald-600 uppercase mb-0.5">Paraf</label>
                                <div class="border border-dashed border-emerald-300 rounded-lg overflow-hidden bg-white h-20 relative">
                                    <canvas id="canvas-paraf-tim-{{ $idx }}" class="w-full h-full touch-none"></canvas>
                                </div>
                                <button type="button" @click="clearParafTim({{ $idx }})" class="text-[9px] text-rose-500 font-bold mt-1 uppercase hover:text-rose-700 transition-colors">Hapus Paraf</button>
                            </div>

                        </div>
                    </div>
                @endforeach
                
                <input type="hidden" name="bap[ttd_tim]" id="input-ttd-tim">
                <input type="hidden" name="bap[paraf_tim]" id="input-paraf-tim">
            </div>
        </div>

    </form>

    <div class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 flex justify-between gap-3 z-50">
        <button type="button" x-show="step > 1" @click="step--" class="w-1/3 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100">
            Kembali
        </button>
        <button type="button" x-show="step < 5" @click="step++" class="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-teal-600">
            Selanjutnya
        </button>
        <button type="submit" form="formBap" x-show="step === 5" class="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i> Simpan BAP SPPG
        </button>
    </div>

</div>

<!-- SCRIPT ALPINE DAN SIGNATURE PAD (FIX SPPG) -->
<script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>

<script>
    const templateData = {!! json_encode($templateSPPG) !!};

    function bapSPPG() {
        return {
            step: 1,
            koordinat: '{{ $agenda->latitude ? $agenda->latitude.", ".$agenda->longitude : "" }}',
            checklistSPPG: templateData,
            
            // Variabel Skoring
            komponenPenilaian: [{nama: '', nilai: null}],
            
            listFoto: [{ id: Date.now() }],
            listSaran: [{ id: Date.now() }],
            listDokumen: [{ id: Date.now() }],

            padTtd: null,
            padParaf: null,
            padsTim: [], 
            padsParafTim: [], 
            timCount: {{ count($timTugasArray ?? []) }}, 

            init() {
                this.$watch('step', (value) => {
                    if (value === 5) {
                        this.$nextTick(() => { this.initSignaturePads(); });
                    }
                });

                const form = document.querySelector('form#formBap');
                if (form) {
                    form.addEventListener('submit', (e) => {
                        if (this.padTtd && !this.padTtd.isEmpty()) document.getElementById('input-ttd').value = this.padTtd.toDataURL('image/png');
                        if (this.padParaf && !this.padParaf.isEmpty()) document.getElementById('input-paraf').value = this.padParaf.toDataURL('image/png');

                        let timTtdData = [];
                        this.padsTim.forEach((pad) => { timTtdData.push(!pad.isEmpty() ? pad.toDataURL('image/png') : null); });
                        document.getElementById('input-ttd-tim').value = JSON.stringify(timTtdData);

                        let timParafData = [];
                        this.padsParafTim.forEach((pad) => { timParafData.push(!pad.isEmpty() ? pad.toDataURL('image/png') : null); });
                        document.getElementById('input-paraf-tim').value = JSON.stringify(timParafData);
                    });
                }
            },

            initSignaturePads() {
                const cvsTtd = document.getElementById('canvas-ttd');
                const cvsParaf = document.getElementById('canvas-paraf');

                if (!this.padTtd && cvsTtd && cvsParaf) {
                    this.padTtd = new SignaturePad(cvsTtd, { penColor: "#0f172a" });
                    this.padParaf = new SignaturePad(cvsParaf, { penColor: "#0f172a" });
                    window.addEventListener("resize", () => {
                        if (this.step === 5) { this.resizeCanvas(cvsTtd, this.padTtd); this.resizeCanvas(cvsParaf, this.padParaf); }
                    });
                }
                if (cvsTtd) this.resizeCanvas(cvsTtd, this.padTtd);
                if (cvsParaf) this.resizeCanvas(cvsParaf, this.padParaf);

                for (let i = 0; i < this.timCount; i++) {
                    let cvsTim = document.getElementById('canvas-tim-' + i);
                    if (cvsTim && !this.padsTim[i]) {
                        let pad = new SignaturePad(cvsTim, { penColor: "#047857" }); 
                        this.padsTim[i] = pad;
                        window.addEventListener("resize", () => { if (this.step === 5) this.resizeCanvas(cvsTim, pad); });
                    }
                    if (cvsTim) this.resizeCanvas(cvsTim, this.padsTim[i]);

                    let cvsParafTim = document.getElementById('canvas-paraf-tim-' + i);
                    if (cvsParafTim && !this.padsParafTim[i]) {
                        let padParaf = new SignaturePad(cvsParafTim, { penColor: "#047857" }); 
                        this.padsParafTim[i] = padParaf;
                        window.addEventListener("resize", () => { if (this.step === 5) this.resizeCanvas(cvsParafTim, padParaf); });
                    }
                    if (cvsParafTim) this.resizeCanvas(cvsParafTim, this.padsParafTim[i]);
                }
            },

            // Fungsi Rata-Rata Skoring
            get totalSkor() {
                let komponenTerisi = this.komponenPenilaian.filter(item => item.nilai !== null && item.nilai !== '');
                
                if (komponenTerisi.length === 0) return 0;

                let sum = komponenTerisi.reduce((total, item) => {
                    return total + (parseFloat(item.nilai) || 0);
                }, 0);

                let rataRata = sum / komponenTerisi.length;
                return Math.round(rataRata * 100) / 100;
            },

            // Penentuan Status Otomatis
            get finalStatus() {
                let skor = this.totalSkor;
                    
                if (skor === null || skor === 0 || isNaN(skor)) {
                    return 'Belum Ada Nilai';
                }
                    
                if (skor > 100) {
                    return 'CEK INPUT';
                }
                    
                if (skor >= 70) {
                    return 'Taat';
                } else if (skor >= 50 && skor < 70) {
                    return 'Taat dengan Catatan';
                } else {
                    return 'Tidak Taat';
                }
            },

            resizeCanvas(canvas, pad) {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                const data = pad ? pad.toData() : null;
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                if (pad && data) pad.fromData(data);
            },

            clearTtd() { if (this.padTtd) this.padTtd.clear(); },
            clearParaf() { if (this.padParaf) this.padParaf.clear(); },
            clearTim(index) { if (this.padsTim[index]) this.padsTim[index].clear(); },
            clearParafTim(index) { if (this.padsParafTim[index]) this.padsParafTim[index].clear(); },

            tambahFoto() { this.listFoto.push({ id: Date.now() }); setTimeout(() => { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 100); },
            hapusFoto(index) { this.listFoto.splice(index, 1); },
            tambahSaran() { this.listSaran.push({ id: Date.now() }); setTimeout(() => { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 100); },
            hapusSaran(index) { this.listSaran.splice(index, 1); },
            tambahDokumen() { this.listDokumen.push({ id: Date.now() }); setTimeout(() => { if(typeof lucide !== 'undefined') lucide.createIcons(); }, 100); },
            hapusDokumen(index) { this.listDokumen.splice(index, 1); },

            getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => { this.koordinat = position.coords.latitude.toFixed(6) + ', ' + position.coords.longitude.toFixed(6); },
                        (error) => { alert('Gagal akses GPS. Pastikan izin lokasi HP aktif.'); },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                } else { alert('GPS Tidak didukung.'); }
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        if(typeof lucide !== 'undefined') { lucide.createIcons(); }
    });
</script>

<style>
    [x-cloak] { display: none !important; }
</style>

@endsection

terakhir sppg.blade.php
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-15T20:33:51+07:00.
</ADDITIONAL_METADATA>