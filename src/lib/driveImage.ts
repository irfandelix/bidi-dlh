/**
 * Helper to convert Google Drive links or IDs into direct image URLs
 * so that Vercel never stores images and browsers fetch them directly from Google Drive CDN.
 */
export function getDriveImageUrl(urlOrId: string | null | undefined, width: number = 1000): string {
  if (!urlOrId) return '';
  
  // If already a standard direct URL that isn't Google Drive
  if (urlOrId.startsWith('http') && !urlOrId.includes('drive.google.com') && !urlOrId.includes('googleusercontent.com')) {
    return urlOrId;
  }

  // Extract Google Drive File ID from standard Drive URLs or raw ID
  let fileId = urlOrId;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/) || urlOrId.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    fileId = match[1];
  }

  // Return Google Drive Direct Image CDN URL
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function getDriveWebLink(urlOrId: string | null | undefined): string {
  if (!urlOrId) return '';
  if (urlOrId.startsWith('https://drive.google.com/file/d/')) return urlOrId;
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/) || urlOrId.match(/id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : urlOrId;
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}
