export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  folderId: string;
  folderPath: string;
  thumbnailLink?: string;
}

const ROOT_FOLDER_NAME = 'AsetKantor_Dokumentasi_Foto';

/**
 * Searches for a folder with a specific name in parents or root.
 */
async function findFolder(token: string, name: string, parentId?: string): Promise<string | null> {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Error finding folder in Google Drive:', err);
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Creates a folder in Google Drive.
 */
async function createFolder(token: string, name: string, parentId?: string): Promise<string> {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gagal membuat folder di Google Drive: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Ensures folder hierarchy:
 * Root Folder ("AsetKantor_Dokumentasi_Foto")
 *   └── Asset Folder (e.g. "AST-IT-001")
 *         └── Date Folder (e.g. "2026-09-25")
 */
export async function ensureDriveFolderHierarchy(
  token: string,
  assetId: string,
  dateStr: string
): Promise<{ rootId: string; targetFolderId: string; folderPath: string }> {
  // 1. Root folder
  let rootId = await findFolder(token, ROOT_FOLDER_NAME);
  if (!rootId) {
    rootId = await createFolder(token, ROOT_FOLDER_NAME);
  }

  // 2. Asset folder (under root)
  const safeAssetFolder = assetId.replace(/[^a-zA-Z0-9-_]/g, '_');
  let assetFolderId = await findFolder(token, safeAssetFolder, rootId);
  if (!assetFolderId) {
    assetFolderId = await createFolder(token, safeAssetFolder, rootId);
  }

  // 3. Date folder (under asset folder)
  const safeDate = dateStr.slice(0, 10);
  let dateFolderId = await findFolder(token, safeDate, assetFolderId);
  if (!dateFolderId) {
    dateFolderId = await createFolder(token, safeDate, assetFolderId);
  }

  return {
    rootId,
    targetFolderId: dateFolderId,
    folderPath: `${ROOT_FOLDER_NAME} / ${safeAssetFolder} / ${safeDate}`,
  };
}

/**
 * Uploads a photo to Google Drive multipart endpoint.
 */
export async function uploadConditionPhotoToDrive(
  token: string,
  file: File | Blob,
  fileName: string,
  assetId: string,
  dateStr: string
): Promise<DriveUploadResult> {
  const { targetFolderId, folderPath } = await ensureDriveFolderHierarchy(token, assetId, dateStr);

  const metadata = {
    name: fileName,
    mimeType: file.type || 'image/jpeg',
    parents: [targetFolderId],
    description: `Bukti kondisi fisik aset ${assetId} per tanggal ${dateStr}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read blob into binary/array buffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  const metadataString =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`;

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(metadataString);
  const footerBytes = encoder.encode(closeDelimiter);

  // Combine headers + binary bytes + footer
  const combined = new Uint8Array(headerBytes.length + fileBytes.length + footerBytes.length);
  combined.set(headerBytes, 0);
  combined.set(fileBytes, headerBytes.length);
  combined.set(footerBytes, headerBytes.length + fileBytes.length);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gagal mengunggah foto ke Google Drive: ${res.status} ${errorBody}`);
  }

  const uploadedFile = await res.json();

  // Try to set general read permission so anyone in domain/link can view
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (err) {
    console.warn('Could not set public permission on Drive file (scoped access only)', err);
  }

  return {
    fileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    webViewLink: uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    folderId: targetFolderId,
    folderPath,
    thumbnailLink: uploadedFile.thumbnailLink,
  };
}
