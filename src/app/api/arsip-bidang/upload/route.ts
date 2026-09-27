import { NextResponse } from 'next/server';
import { getOrCreateFolder, uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const namaKegiatan = formData.get('nama_kegiatan') as string;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }
    
    if (!namaKegiatan) {
      return NextResponse.json({ error: 'Nama Kegiatan tidak boleh kosong' }, { status: 400 });
    }

    const ARSIP_ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_ARSIP;
    if (!ARSIP_ROOT_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID_ARSIP belum diatur di .env.local');
    }

    // 1. Dapatkan atau buat folder dengan Nama Kegiatan di dalam Folder Arsip
    // Karena ini arsip bidang, mungkin lebih rapi dimasukkan ke dalam subfolder "Arsip Bidang" dulu, tapi user minta langsung.
    // Kita ikuti permintaan user: di dalam folder ARSIP_ROOT_ID langsung ada folder Nama Kegiatan
    const arsipBidangRoot = await getOrCreateFolder('Arsip Bidang', ARSIP_ROOT_ID);
    const kegiatanFolderId = await getOrCreateFolder(namaKegiatan.replace(/[/\\?%*:|"<>]/g, '-'), arsipBidangRoot);

    // 2. Siapkan file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload file ke GDrive
    const fileName = file.name; // Keep original name since it's grouped in a folder
    const mimeType = file.type || 'application/octet-stream';
    
    const driveFileId = await uploadFileToDrive(buffer, fileName, kegiatanFolderId, mimeType);
    
    // 4. Return link GDrive
    return NextResponse.json({ url: driveFileId, id: driveFileId, folder_id: kegiatanFolderId }, { status: 200 });
  } catch (error: any) {
    console.error('Arsip Bidang Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat upload' }, { status: 500 });
  }
}
