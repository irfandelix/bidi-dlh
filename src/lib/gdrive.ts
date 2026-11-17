import { google } from 'googleapis';
import stream from 'stream';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize OAuth2 client using the credentials from .env.local
const getAuthClient = () => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.replace(/['"]/g, '');
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.replace(/['"]/g, '');
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI?.replace(/['"]/g, '');
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.replace(/['"]/g, '');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials are not fully configured in environment variables.');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  
  return oAuth2Client;
};

const getDrive = () => {
  return google.drive({ version: 'v3', auth: getAuthClient() });
};

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
  const cleanFolder = (folderName || 'arsip_perizinan').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const cleanName = fileName.replace(/[/\\?%*:|"<>]/g, '_').trim();
  const storagePath = `${cleanFolder}/${Date.now()}_${cleanName}`;
  const bucket = 'arsip_dokumen';

  const { data, error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    console.warn('Upload with folder path failed in Supabase, trying root path:', error.message);
    const fallbackPath = `${Date.now()}_${cleanName}`;
    const retry = await supabase.storage.from(bucket).upload(fallbackPath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (retry.error) {
      throw new Error(`Upload gagal di Google Drive dan Supabase: ${retry.error.message}`);
    }
    const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fallbackPath);
    return pubData.publicUrl;
  }

  const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return pubData.publicUrl;
}

/**
 * Gets a folder by name inside a specific parent folder.
 * If it doesn't exist, creates it.
 */
export async function getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
  const targetParent = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID?.replace(/['"]/g, '');

  try {
    if (!targetParent) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured.');
    }

    const drive = getDrive();
    // Escape single quotes for the query
    const safeFolderName = folderName.replace(/'/g, "\\'");
    
    // Search for existing folder
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and '${targetParent}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    // Folder does not exist, create it
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [targetParent],
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  } catch (error: any) {
    console.warn('Google Drive getOrCreateFolder failed, using fallback folder identifier:', error.message);
    return folderName.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'default_folder';
  }
}

/**
 * Uploads a file (Buffer) to a specific Google Drive folder.
 * Overwrites the file if it already exists in that folder.
 * Automatically falls back to Supabase Storage if Google Drive encounters OAuth/permission/network errors.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderName: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  try {
    const drive = getDrive();

    // 1. Get or create the folder for this activity
    const folderId = await getOrCreateFolder(folderName);

    // 2. Convert Buffer to Readable Stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    // 3. Check if file with same name already exists in this folder to overwrite/update it
    const safeFileName = fileName.replace(/'/g, "\\'");
    const existingFile = await drive.files.list({
      q: `name='${safeFileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    let uploadedFileId = '';

    if (existingFile.data.files && existingFile.data.files.length > 0) {
      // Update existing file
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
      // Create new file
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

    // 4. Update file permissions to be readable by anyone with the link
    await drive.permissions.create({
      fileId: uploadedFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 5. Fetch the webViewLink
    const fileData = await drive.files.get({
      fileId: uploadedFileId,
      fields: 'webViewLink',
    });

    return fileData.data.webViewLink!;
  } catch (error: any) {
    console.warn('Google Drive upload failed, falling back to Supabase Storage:', error.message);
    return await uploadToSupabaseFallback(fileBuffer, fileName, mimeType, folderName);
  }
}
