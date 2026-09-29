import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  Mail,
  CheckCircle2,
  FileText,
  ArrowRightLeft,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';
import { AssetTransaction, OfficeAsset } from '../types';
import { sendGmailMessage } from '../services/gmailService';

interface OverdueLoansTrackerProps {
  transactions: AssetTransaction[];
  assets: OfficeAsset[];
  onQuickReturn: (trx: AssetTransaction) => void;
  onOpenBast: (trx: AssetTransaction) => void;
  token: string | null;
}

export const OverdueLoansTracker: React.FC<OverdueLoansTrackerProps> = ({
  transactions,
  assets,
  onQuickReturn,
  onOpenBast,
  token,
}) => {
  const [sendingTrxId, setSendingTrxId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; text: string } | null>(null);

  // Active loans: type === 'PEMINJAMAN' and not yet marked returned
  const activeLoans = transactions.filter((t) => t.type === 'PEMINJAMAN');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLoanStatus = (expectedReturnDate?: string) => {
    if (!expectedReturnDate) return { label: 'Tanpa Batas', color: 'slate', daysDiff: 0 };

    const returnDate = new Date(expectedReturnDate);
    returnDate.setHours(0, 0, 0, 0);

    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `TERLAMBAT ${Math.abs(diffDays)} HARI`,
        color: 'rose',
        daysDiff: diffDays,
        isOverdue: true,
      };
    } else if (diffDays <= 2) {
      return {
        label: `Jatuh Tempo ${diffDays === 0 ? 'Hari Ini' : `${diffDays} hari lagi`}`,
        color: 'amber',
        daysDiff: diffDays,
        isUrgent: true,
      };
    } else {
      return {
        label: `Masih ${diffDays} hari`,
        color: 'emerald',
        daysDiff: diffDays,
      };
    }
  };

  const handleSendReminderEmail = async (trx: AssetTransaction) => {
    if (!token) {
      alert('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }
    if (!trx.staffEmail) {
      alert('Email staf peminjam tidak tersedia.');
      return;
    }

    setSendingTrxId(trx.id);
    try {
      await sendGmailMessage(token, {
        to: trx.staffEmail,
        subject: `[PERINGATAN PENGEMBALIAN ASET] ${trx.assetName} - Jatuh Tempo: ${trx.expectedReturnDate || 'Segera'}`,
        htmlBody: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
            <h3 style="color: #9f1239; margin-top: 0;">Pemberitahuan Batas Waktu Peminjaman Aset Kantor</h3>
            <p style="color: #334155; font-size: 14px;">
              Halo <strong>${trx.staffName}</strong>,
            </p>
            <p style="color: #475569; font-size: 13px;">
              Berdasarkan catatan sistem inventaris kantor, peminjaman aset berikut telah mendekati atau melewati batas waktu pengembalian yang disepakati:
            </p>
            <table cellpadding="6" style="font-size: 13px; border-collapse: collapse; width: 100%; max-width: 500px; background: #fff; border: 1px solid #fda4af; margin: 15px 0;">
              <tr><td style="color:#64748b;">Nama Aset</td><td><strong>${trx.assetName}</strong></td></tr>
              <tr><td style="color:#64748b;">Kode Aset</td><td><strong>${trx.assetId}</strong></td></tr>
              <tr><td style="color:#64748b;">Jumlah Unit</td><td>${trx.quantity} unit</td></tr>
              <tr><td style="color:#64748b;">Tanggal Pinjam</td><td>${trx.date}</td></tr>
              <tr><td style="color:#64748b;">Estimasi Kembali</td><td style="color:#e11d48; font-weight: bold;">${trx.expectedReturnDate}</td></tr>
            </table>
            <p style="color: #475569; font-size: 13px;">
              Mohon segera melakukan pengembalian fisik barang ke Divisi General Affairs (GA) atau mengajukan perpanjangan masa pinjam.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
              Email otomatis dari Sistem Manajemen Aset Kantor.
            </p>
          </div>
        `,
      });

      setStatusMessage({ id: trx.id, text: '✓ Email peringatan berhasil dikirim!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(`Gagal mengirim email: ${err.message}`);
    } finally {
      setSendingTrxId(null);
    }
  };

  if (activeLoans.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">Tidak ada peminjaman aset yang berstatus aktif saat ini.</p>
        <p className="mt-0.5">Seluruh aset kantor berada di lokasi penyimpanan inventaris.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pelacakan Pinjaman Aktif & Jatuh Tempo ({activeLoans.length} Peminjaman)
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">
          Dilengkapi alert otomatis ke staf via Gmail
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {activeLoans.map((trx) => {
          const status = getLoanStatus(trx.expectedReturnDate);
          return (
            <div
              key={trx.id}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                status.isOverdue
                  ? 'bg-rose-50/40 hover:bg-rose-50/70'
                  : status.isUrgent
                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{trx.assetName}</span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                    {trx.assetId} ({trx.quantity} unit)
                  </span>

                  {status.isOverdue ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300">
                      {status.label}
                    </span>
                  ) : status.isUrgent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {status.label}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {status.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>Peminjam: <strong>{trx.staffName}</strong> ({trx.department})</span>
                  <span>Tgl Pinjam: {trx.date}</span>
                  <span>Batas Kembali: <strong className={status.isOverdue ? 'text-rose-600' : ''}>{trx.expectedReturnDate || '-'}</strong></span>
                </div>

                {statusMessage?.id === trx.id && (
                  <p className="text-[11px] text-emerald-600 font-semibold">{statusMessage.text}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Print BAST */}
                <button
                  onClick={() => onOpenBast(trx)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition"
                  title="Cetak Berita Acara Serah Terima (BAST)"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>BAST</span>
                </button>

                {/* Send Email Reminder */}
                <button
                  onClick={() => handleSendReminderEmail(trx)}
                  disabled={sendingTrxId === trx.id}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 shadow-2xs transition disabled:opacity-50"
                  title="Kirim Email Peringatan Jatuh Tempo ke Staf"
                >
                  {sendingTrxId === trx.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>Peringatkan</span>
                </button>

                {/* Quick Return Action */}
                <button
                  onClick={() => onQuickReturn(trx)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Kembalikan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
