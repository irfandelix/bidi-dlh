import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function uploadToDrive(file: File, folderId: string, description: string = 'Dokumentasi Lapangan') {
  // Use Pengawasan credentials if available, otherwise fallback to Perizinan credentials
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID_PENGAWASAN || process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET_PENGAWASAN || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN_PENGAWASAN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials not configured properly.');
  }

  // 1. Get Access Token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error('Failed to get Google Drive access token: ' + (tokenData.error_description || tokenData.error));
  }

  const accessToken = tokenData.access_token;

  // 2. Prepare metadata and multipart body
  const metadata = {
    name: file.name,
    parents: [folderId],
    description: description
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // 3. Upload File
  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  const uploadData = await uploadResponse.json();
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to Google Drive: ' + (uploadData.error?.message || 'Unknown error'));
  }

  return uploadData.id;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const action = formData.get('action');

    if (action === 'submit_bap') {
      const pengawasan_id = formData.get('pengawasan_id') as string;
      if (!pengawasan_id) throw new Error('ID Pengawasan tidak ditemukan.');

      // 1. Ambil folder ID Pengawasan
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID_PENGAWASAN;
      if (!folderId) throw new Error('Folder ID Google Drive untuk Pengawasan belum disetel di .env.local');

      // 2. Kumpulkan semua foto dokumentasi
      const paths = [];
      const keys = Array.from(formData.keys());
      for (const key of keys) {
        if (key.startsWith('dokumentasi[')) {
          const file = formData.get(key) as File;
          if (file && file.size > 0) {
            // Upload ke Drive
            const driveFileId = await uploadToDrive(file, folderId, 'Foto Dokumentasi Pengawasan');
            paths.push({
              path: driveFileId,
              keterangan: 'Dokumentasi Lapangan' // Default fallback
            });
          }
        }
      }

      // 3. Ambil data eksisting BAP untuk update dokumentasi
      const { data: rawAgenda, error: agendaError } = await supabase
        .from('pengawasan_lapangans')
        .select('*')
        .eq('id', pengawasan_id)
        .single();
      const agenda = rawAgenda as any;
      
      if (agendaError) throw agendaError;

      let fotoLama = [];
      // @ts-ignore
      if (agenda.file_dokumentasi) {
        fotoLama = typeof agenda.file_dokumentasi === 'string' 
          ? JSON.parse(agenda.file_dokumentasi) 
          : agenda.file_dokumentasi;
      }
      
      const file_dokumentasi = [...fotoLama, ...paths];

      // 4. Update data ke tabel pengawasan_lapangans (koordinat, status, foto)
      const lat = formData.get('latitude') as string;
      const lng = formData.get('longitude') as string;
      const status_ketaatan = formData.get('status_ketaatan') as string;
      
      const { error: updateError } = await supabase
        .from('pengawasan_lapangans')
        // @ts-ignore
        .update({
          latitude: lat || agenda.latitude,
          longitude: lng || agenda.longitude,
          status_ketaatan: status_ketaatan || agenda.status_ketaatan,
          file_dokumentasi: file_dokumentasi
        })
        .eq('id', pengawasan_id);

      if (updateError) throw updateError;

      // 5. Update/Create ke tabel bap_pengawasans
      // BAP data logic goes here. We parse dynamic fields starting with bap_
      const bapData: any = { pengawasan_id: parseInt(pengawasan_id) };
      for (const key of keys) {
        if (key.startsWith('bap_')) {
          const dbKey = key.replace('bap_', '');
          bapData[dbKey] = formData.get(key);
        }
      }
      
      // Update or create BAP record
      const { data: rawExistingBap, error: existingBapError } = await supabase
        .from('bap_pengawasans')
        .select('id')
        .eq('pengawasan_id', pengawasan_id)
        .maybeSingle();
      const existingBap = rawExistingBap as any;

      if (existingBap) {
        const { error: bapUpdateError } = await supabase
          .from('bap_pengawasans')
          // @ts-ignore
          .update(bapData)
          .eq('id', existingBap.id);
        if (bapUpdateError) throw bapUpdateError;
      } else {
        const { error: bapInsertError } = await supabase
          .from('bap_pengawasans')
          .insert(bapData);
        if (bapInsertError) throw bapInsertError;
      }

      return NextResponse.json({ success: true, message: 'BAP berhasil disimpan.' });
    }

    return NextResponse.json({ error: 'Action not valid' }, { status: 400 });

  } catch (error: any) {
    console.error('Error BAP submit:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
