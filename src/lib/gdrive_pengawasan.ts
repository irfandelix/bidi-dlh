import { google } from 'googleapis';
import stream from 'stream';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const getAuthClient = () => {
  const clientId = (process.env.GOOGLE_DRIVE_CLIENT_ID_PENGAWASAN || process.env.GOOGLE_DRIVE_CLIENT_ID)?.replace(/['"]/g, '');
  const clientSecret = (process.env.GOOGLE_DRIVE_CLIENT_SECRET_PENGAWASAN || process.env.GOOGLE_DRIVE_CLIENT_SECRET)?.replace(/['"]/g, '');
  const redirectUri = (process.env.GOOGLE_DRIVE_REDIRECT_URI || 'https://developers.google.com/oauthplayground')?.replace(/['"]/g, '');
  const refreshToken = (process.env.GOOGLE_DRIVE_REFRESH_TOKEN_PENGAWASAN || process.env.GOOGLE_DRIVE_REFRESH_TOKEN)?.replace(/['"]/g, '');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials for Pengawasan are not fully configured in environment variables.');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  
  return oAuth2Client;
};

const getDrive = () => google.drive({ version: 'v3', auth: getAuthClient() });
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_PENGAWASAN?.replace(/['"]/g, '');

/**
 * Fallback upload to Supabase Storage if Google Drive is unavailable or fails.
 */
async function uploadToSupabaseFallback(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderName?: string
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.replace(/['"]/g, '');

  if (!url || !key) {
    throw new Error('Supabase Storage credentials are not configured.');
  }

  const supabase = createSupabaseClient(url, key);
  const cleanFolder = (folderName || 'pengawasan').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const cleanName = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const storagePath = `${cleanFolder}/${Date.now()}_${cleanName}`;
  const bucket = mimeType.startsWith('image/') ? 'dokumentasi' : 'arsip_bap';

  const { data, error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    console.warn(`Upload to ${bucket} failed in Supabase, trying fallback bucket 'arsip_dokumen':`, error.message);
    const retry = await supabase.storage.from('arsip_dokumen').upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (retry.error) {
      throw new Error(`Upload gagal di Google Drive dan Supabase: ${retry.error.message}`);
    }
    const { data: pubData } = supabase.storage.from('arsip_dokumen').getPublicUrl(storagePath);
    return pubData.publicUrl;
  }

  const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return pubData.publicUrl;
}

export async function getOrCreateFolder(folderName: string, parentFolderId: string = ROOT_FOLDER_ID!): Promise<string> {
  try {
    if (!parentFolderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID_PENGAWASAN is not configured.');
    }
    const drive = getDrive();

    const safeFolderName = folderName.replace(/'/g, "\\'");
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  } catch (error: any) {
    console.warn('Google Drive getOrCreateFolder failed for pengawasan, using fallback identifier:', error.message);
    return folderName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'default_folder';
  }
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  try {
    const drive = getDrive();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const safeFileName = fileName.replace(/'/g, "\\'");
    const existingFile = await drive.files.list({
      q: `name='${safeFileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    let uploadedFileId = '';

    if (existingFile.data.files && existingFile.data.files.length > 0) {
      const fileId = existingFile.data.files[0].id!;
      const media = {
        mimeType: mimeType,
        body: bufferStream,
      };
      
      const res = await drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, webViewLink',
      });
      uploadedFileId = res.data.id!;
    } else {
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };
      const media = {
        mimeType: mimeType,
        body: bufferStream,
      };

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });
      uploadedFileId = res.data.id!;
    }

    await drive.permissions.create({
      fileId: uploadedFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const fileData = await drive.files.get({
      fileId: uploadedFileId,
      fields: 'webViewLink',
    });

    return fileData.data.webViewLink!;
  } catch (error: any) {
    console.warn('Google Drive upload failed for pengawasan, falling back to Supabase Storage:', error.message);
    return await uploadToSupabaseFallback(fileBuffer, fileName, mimeType, folderId);
  }
}

export async function getFileBufferFromDrive(fileId: string): Promise<Buffer> {
  // If the file identifier is a Supabase public URL or any direct URL, fetch it directly
  if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
    const res = await fetch(fileId);
    if (!res.ok) {
      throw new Error(`Gagal mengunduh file dari URL (${res.status}): ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  const drive = getDrive();
  try {
    const res = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(res.data as ArrayBuffer);
  } catch (error) {
    console.error('Error getting file buffer from Drive:', fileId, error);
    throw error;
  }
}
