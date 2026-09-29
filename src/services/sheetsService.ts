import { OfficeAsset, AssetTransaction, AssetCategory, AssetCondition, AssetStatus } from '../types';

export const ASSET_HEADERS = [
  'ID Aset',
  'Nama Aset',
  'Kategori',
  'SKU / Barcode',
  'Total Stok',
  'Stok Tersedia',
  'Stok Dipinjam',
  'Stok Rusak',
  'Satuan',
  'Lokasi',
  'Kondisi',
  'Status',
  'Tanggal Pembelian',
  'Harga Beli (IDR)',
  'PIC Penanggung Jawab',
  'Tautan Foto Google Drive',
  'Tanggal Foto',
  'Catatan',
  'Terakhir Diperbarui',
];

export const TRANSACTION_HEADERS = [
  'ID Transaksi',
  'ID Aset',
  'Nama Aset',
  'Jenis Transaksi',
  'Jumlah',
  'Nama Staf',
  'Email Staf',
  'Departemen / Divisi',
  'Tanggal & Waktu',
  'Rencana Kembali',
  'Kondisi Sebelum',
  'Kondisi Sesudah',
  'Tautan Foto Bukti Google Drive',
  'ID File Drive',
  'Path Folder Drive',
  'Catatan / Alasan',
  'Status Notifikasi Email',
  'Penerima Email',
];

export async function createSpreadsheet(
  token: string,
  title: string = 'AsetKantor_Database_Inventaris'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Daftar_Aset',
          gridProperties: { rowCount: 1000, columnCount: 22 },
        },
      },
      {
        properties: {
          title: 'Riwayat_Mutasi',
          gridProperties: { rowCount: 2000, columnCount: 22 },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Header row for both sheets
  await appendRow(token, spreadsheetId, 'Daftar_Aset', ASSET_HEADERS);
  await appendRow(token, spreadsheetId, 'Riwayat_Mutasi', TRANSACTION_HEADERS);

  return { spreadsheetId, spreadsheetUrl };
}

export async function appendRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rowValues: (string | number | boolean | null | undefined)[]
): Promise<void> {
  const safeValues = rowValues.map((v) => (v === undefined || v === null ? '' : String(v)));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetName
  )}!A1:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values: [safeValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menulis baris ke Google Sheets: ${res.status} ${errText}`);
  }
}

export function assetToRow(asset: OfficeAsset): (string | number)[] {
  return [
    asset.id,
    asset.name,
    asset.category,
    asset.sku,
    asset.totalStock,
    asset.availableStock,
    asset.borrowedStock,
    asset.damagedStock,
    asset.unit,
    asset.location,
    asset.condition,
    asset.status,
    asset.purchaseDate,
    asset.purchasePrice,
    asset.custodian,
    asset.lastPhotoUrl || '',
    asset.lastPhotoDate || '',
    asset.notes,
    asset.updatedAt,
  ];
}

export function transactionToRow(trx: AssetTransaction): (string | number)[] {
  return [
    trx.id,
    trx.assetId,
    trx.assetName,
    trx.type,
    trx.quantity,
    trx.staffName,
    trx.staffEmail,
    trx.department,
    trx.date,
    trx.expectedReturnDate || '-',
    trx.conditionBefore,
    trx.conditionAfter,
    trx.photoDriveUrl || '',
    trx.photoDriveFileId || '',
    trx.photoDriveFolderName || '',
    trx.notes,
    trx.emailNotificationSent ? 'Terkirim' : 'Tidak Terkirim',
    trx.emailRecipient,
  ];
}

export async function syncAssetsToSheet(
  token: string,
  spreadsheetId: string,
  assets: OfficeAsset[]
): Promise<void> {
  const rows = [ASSET_HEADERS, ...assets.map(assetToRow)];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daftar_Aset!A1:S${rows.length}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Daftar_Aset!A1:S${rows.length}`,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal sinkronisasi data aset ke Google Sheets: ${err}`);
  }
}

export async function fetchAssetsFromSheet(
  token: string,
  spreadsheetId: string
): Promise<OfficeAsset[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daftar_Aset!A2:S1000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Gagal membaca data aset dari Google Sheets');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((r: string[]) => ({
    id: r[0] || '',
    name: r[1] || 'Aset Tanpa Nama',
    category: (r[2] as AssetCategory) || 'IT & Elektronik',
    sku: r[3] || '',
    totalStock: Number(r[4]) || 0,
    availableStock: Number(r[5]) || 0,
    borrowedStock: Number(r[6]) || 0,
    damagedStock: Number(r[7]) || 0,
    unit: r[8] || 'Unit',
    location: r[9] || 'Kantor',
    condition: (r[10] as AssetCondition) || 'Baik',
    status: (r[11] as AssetStatus) || 'Tersedia',
    purchaseDate: r[12] || '',
    purchasePrice: Number(r[13]) || 0,
    custodian: r[14] || '',
    lastPhotoUrl: r[15] || '',
    lastPhotoDate: r[16] || '',
    notes: r[17] || '',
    updatedAt: r[18] || new Date().toISOString(),
  }));
}
