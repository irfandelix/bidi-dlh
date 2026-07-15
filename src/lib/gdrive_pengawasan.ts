import { google } from 'googleapis';
import stream from 'stream';

const getAuthClient = () => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID_PENGAWASAN;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET_PENGAWASAN;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN_PENGAWASAN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials for Pengawasan are not fully configured in environment variables.');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  
  return oAuth2Client;
};

const getDrive = () => google.drive({ version: 'v3', auth: getAuthClient() });
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID_PENGAWASAN;

export async function getOrCreateFolder(folderName: string, parentFolderId: string = ROOT_FOLDER_ID!): Promise<string> {
  const drive = getDrive();
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID_PENGAWASAN is not configured.');
  }

  try {
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
  } catch (error) {
    console.error('Error in getOrCreateFolder:', error);
    throw error;
  }
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<string> {
  const drive = getDrive();
  try {
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
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    throw error;
  }
}
