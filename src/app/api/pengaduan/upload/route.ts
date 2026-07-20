import { NextResponse } from 'next/server';
import { getOrCreateFolder, uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderName = formData.get('folderName') as string;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }
    if (!folderName) {
      return NextResponse.json({ error: 'Nama folder spesifik aduan tidak diberikan' }, { status: 400 });
    }

    const PENGADUAN_ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_PENGADUAN;
    if (!PENGADUAN_ROOT_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID_PENGADUAN belum diatur di .env.local');
    }

    // 1. Dapatkan atau buat folder spesifik aduan di dalam Folder Pengaduan Utama
    // sanitize folder name to avoid invalid characters
    const safeFolderName = folderName.replace(/[^a-zA-Z0-9 -]/g, '').substring(0, 50);
    const spesifikAduanFolderId = await getOrCreateFolder(`Aduan - ${safeFolderName}`, PENGADUAN_ROOT_ID);

    // 2. Siapkan file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload file ke GDrive
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${file.name}`;
    const mimeType = file.type || 'application/octet-stream';
    
    const driveFileId = await uploadFileToDrive(buffer, fileName, spesifikAduanFolderId, mimeType);
    
    // 4. Return link GDrive
    const publicUrl = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`;

    return NextResponse.json({ url: publicUrl, id: driveFileId }, { status: 200 });
  } catch (error: any) {
    console.error('Pengaduan Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat upload' }, { status: 500 });
  }
}
