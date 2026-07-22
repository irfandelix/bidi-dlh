import { NextResponse } from 'next/server';
import { getOrCreateFolder, uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const ARSIP_ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_ARSIP;
    if (!ARSIP_ROOT_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID_ARSIP belum diatur di .env.local');
    }

    // 1. Dapatkan atau buat folder "Arsip Masuk" di dalam Folder Arsip
    const arsipMasukFolderId = await getOrCreateFolder('Arsip Masuk', ARSIP_ROOT_ID);

    // 2. Siapkan file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload file ke GDrive
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${file.name}`;
    
    // Asumsikan mimeType sesuai dengan file, untuk PDF application/pdf, docx application/vnd.openxmlformats-officedocument.wordprocessingml.document
    const mimeType = file.type || 'application/octet-stream';
    
    const driveFileId = await uploadFileToDrive(buffer, fileName, arsipMasukFolderId, mimeType);
    
    // 4. Return link GDrive (view link)
    const publicUrl = driveFileId;

    return NextResponse.json({ url: publicUrl, id: driveFileId }, { status: 200 });
  } catch (error: any) {
    console.error('Arsip Masuk Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat upload' }, { status: 500 });
  }
}
