import { AssetTransaction, OfficeAsset } from '../types';

function toBase64Url(str: string): string {
  // UTF-8 encode before btoa to handle Indonesian special characters and accents
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function sendGmailMessage(token: string, params: SendEmailParams): Promise<boolean> {
  const { to, subject, htmlBody } = params;

  const emailLines = [
    `To: ${to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ];

  const emailContent = emailLines.join('\r\n');
  const base64UrlContent = toBase64Url(emailContent);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlContent,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to send Gmail:', res.status, errorBody);
    throw new Error(`Gagal mengirim email via Gmail API: ${res.status} ${errorBody}`);
  }

  return true;
}

/**
 * Builds a beautiful HTML notification template for asset mutations.
 */
export function buildAssetStatusEmailTemplate(
  asset: OfficeAsset,
  trx: AssetTransaction,
  appUrl: string = window.location.origin
): { subject: string; html: string } {
  let typeLabel = '';
  let badgeColor = '#2563eb';
  let badgeBg = '#eff6ff';

  switch (trx.type) {
    case 'PEMINJAMAN':
      typeLabel = 'Peminjaman Aset Baru';
      badgeColor = '#2563eb';
      badgeBg = '#eff6ff';
      break;
    case 'PENGEMBALIAN':
      typeLabel = 'Pengembalian Aset Kantor';
      badgeColor = '#059669';
      badgeBg = '#ecfdf5';
      break;
    case 'PERBAIKAN':
      typeLabel = 'Aset Membutuhkan Perbaikan / Servis';
      badgeColor = '#d97706';
      badgeBg = '#fffbeb';
      break;
    case 'AFKIR_RUSAK':
      typeLabel = 'Peringatan: Kerusakan Aset / Afkir';
      badgeColor = '#dc2626';
      badgeBg = '#fef2f2';
      break;
    case 'MUTASI_LOKASI':
      typeLabel = 'Relokasi Posisi Aset';
      badgeColor = '#7c3aed';
      badgeBg = '#f5f3ff';
      break;
    default:
      typeLabel = 'Pembaruan Status Aset';
  }

  const subject = `[AsetKantor] Notifikasi: ${typeLabel} - ${asset.name} (${asset.id})`;

  const photoSection = trx.photoDriveUrl
    ? `
      <div style="margin-top: 20px; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #334155;">📷 Bukti Foto Kondisi Barang di Google Drive:</p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          Folder: <code>${trx.photoDriveFolderName || 'Google Drive'}</code>
        </p>
        <div style="margin-top: 10px;">
          <a href="${trx.photoDriveUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 8px 16px; font-size: 13px; font-weight: 500; text-decoration: none; border-radius: 6px;">
            Buka Foto di Google Drive ↗
          </a>
        </div>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0; color: #1e293b;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color: #0f172a; padding: 20px 24px;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">AsetKantor</span>
              <span style="color: #94a3b8; font-size: 12px; margin-left: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.1);">Sistem Inventaris</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Laporan Perubahan Status Aset Otomatis</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 24px;">
            <div style="display: inline-block; padding: 4px 12px; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}33; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${typeLabel}
            </div>

            <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 16px 0 8px 0;">
              ${asset.name}
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
              Kode Aset: <strong>${asset.id}</strong> | Kategori: <strong>${asset.category}</strong>
            </p>

            <!-- Detail Grid Table -->
            <table cellpadding="6" cellspacing="0" border="0" width="100%" style="font-size: 13px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px;">
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td width="35%" style="color: #64748b; font-weight: 500;">Staf / Penanggung Jawab</td>
                <td style="color: #0f172a; font-weight: 600;">${trx.staffName} (${trx.department})</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Email Staf</td>
                <td style="color: #0f172a;">${trx.staffEmail || '-'}</td>
              </tr>
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Jumlah Unit</td>
                <td style="color: #0f172a; font-weight: 600;">${trx.quantity} ${asset.unit}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Waktu Transaksi</td>
                <td style="color: #0f172a;">${trx.date}</td>
              </tr>
              ${
                trx.expectedReturnDate
                  ? `
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Estimasi Tanggal Kembali</td>
                <td style="color: #2563eb; font-weight: 600;">${trx.expectedReturnDate}</td>
              </tr>
              `
                  : ''
              }
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Kondisi Barang</td>
                <td style="color: #0f172a;">
                  Sebelum: <strong>${trx.conditionBefore}</strong> ➔ Sesudah: <strong>${trx.conditionAfter}</strong>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="color: #64748b; font-weight: 500;">Sisa Stok Tersedia</td>
                <td style="color: #0f172a; font-weight: 700;">${asset.availableStock} ${asset.unit} (Total: ${asset.totalStock})</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 500;">Catatan Mutasi</td>
                <td style="color: #334155;">${trx.notes || 'Tidak ada catatan tambahan.'}</td>
              </tr>
            </table>

            ${photoSection}

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
              <a href="${appUrl}" target="_blank" style="font-size: 13px; color: #2563eb; text-decoration: none; font-weight: 500;">
                Buka Aplikasi Manajemen Aset Kantor ➔
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            Email ini dikirim secara otomatis oleh Sistem AsetKantor terintegrasi Google Workspace (Sheets, Drive, & Gmail).
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, html };
}
