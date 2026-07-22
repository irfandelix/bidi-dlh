import { NextResponse } from 'next/server';
import { uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Siapkan file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file ke GDrive
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${file.name}`;
    
    // Asumsikan mimeType sesuai dengan file
    const mimeType = file.type || 'application/octet-stream';
    
    const driveFileId = await uploadFileToDrive(buffer, fileName, 'Arsip Perizinan', mimeType);
    
    // Return link GDrive (view link)
    const publicUrl = `https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`;

    return NextResponse.json({ url: publicUrl, id: driveFileId }, { status: 200 });
  } catch (error: any) {
    console.error('Perizinan Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server saat upload' }, { status: 500 });
  }
}
