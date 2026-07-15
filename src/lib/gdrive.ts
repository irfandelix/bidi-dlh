import { google } from 'googleapis';
import stream from 'stream';

// Initialize OAuth2 client using the credentials from .env.local
const getAuthClient = () => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials are not fully configured in environment variables.');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  
  return oAuth2Client;
};

const drive = google.drive({ version: 'v3', auth: getAuthClient() });
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

/**
 * Gets a folder by name inside a specific parent folder.
 * If it doesn't exist, creates it.
 */
export async function getOrCreateFolder(folderName: string, parentFolderId: string = ROOT_FOLDER_ID!): Promise<string> {
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured.');
  }

  try {
    // Escape single quotes for the query
    const safeFolderName = folderName.replace(/'/g, "\\'");
    
    // Search for existing folder
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and '${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0) {
      // Folder exists, return its ID
      return res.data.files[0].id!;
    }

    // Folder does not exist, create it
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
  } catch (error) {
    console.error('Error in getOrCreateFolder:', error);
    throw error;
  }
}

/**
 * Uploads a file (Buffer) to a specific Google Drive folder.
 * Overwrites the file if it already exists in that folder.
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderName: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  try {
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

    // 4. Update file permissions to be readable by anyone with the link (optional but usually required for public DB links)
    await drive.permissions.create({
      fileId: uploadedFileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 5. Fetch the webViewLink (sometimes it's only available after creating permissions)
    const fileData = await drive.files.get({
      fileId: uploadedFileId,
      fields: 'webViewLink',
    });

    return fileData.data.webViewLink!;
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw error;
  }
}
