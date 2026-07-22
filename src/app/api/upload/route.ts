import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'arsip_dokumen';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    
    // Gunakan folderName dari request jika ada, atau gunakan default
    const folderName = formData.get('folderName') as string || bucket || 'Arsip Umum';

    const driveFileId = await uploadFileToDrive(buffer, fileName, folderName, mimeType);
    if (!driveFileId) {
      throw new Error('Gagal mengupload file ke Google Drive');
    }
    const publicUrl = `https://drive.google.com/open?id=${driveFileId}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat upload' }, { status: 500 });
  }
}
