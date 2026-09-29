import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowRightLeft,
  ExternalLink,
  Eye,
  Mail,
  HardDrive,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Tag,
  Building,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { AssetTransaction, OfficeAsset } from '../types';
import { OverdueLoansTracker } from './OverdueLoansTracker';

interface TransactionHistoryProps {
  transactions: AssetTransaction[];
  assets: OfficeAsset[];
  onViewPhoto: (photoUrl: string, title: string) => void;
  onOpenBast: (trx: AssetTransaction) => void;
  onQuickReturn: (trx: AssetTransaction) => void;
  token: string | null;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  assets,
  onViewPhoto,
  onOpenBast,
  onQuickReturn,
  token,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      search === '' ||
      t.assetName.toLowerCase().includes(search.toLowerCase()) ||
      t.assetId.toLowerCase().includes(search.toLowerCase()) ||
      t.staffName.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PEMINJAMAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            📌 Peminjaman Staf
          </span>
        );
      case 'PENGEMBALIAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✅ Pengembalian
          </span>
        );
      case 'MUTASI_LOKASI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            📍 Relokasi
          </span>
        );
      case 'PERBAIKAN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            🔧 Servis Perbaikan
          </span>
        );
      case 'TAMBAH_STOK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            ➕ Tambah Stok
          </span>
        );
      case 'AFKIR_RUSAK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            ⚠️ Kerusakan
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Loans & Overdue Tracker */}
      <OverdueLoansTracker
        transactions={transactions}
        assets={assets}
        onQuickReturn={onQuickReturn}
        onOpenBast={onOpenBast}
        token={token}
      />

      {/* Audit Log Header & Search Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari riwayat mutasi (ID TRX, nama staf, nama aset, divisi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Transaksi</option>
            <option value="PEMINJAMAN">Peminjaman Staf</option>
            <option value="PENGEMBALIAN">Pengembalian</option>
            <option value="MUTASI_LOKASI">Relokasi Lokasi</option>
            <option value="PERBAIKAN">Perbaikan / Servis</option>
            <option value="TAMBAH_STOK">Penambahan Stok</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Belum ada riwayat mutasi</h4>
          <p className="text-xs text-slate-500 mt-1">
            Setiap peminjaman, mutasi, atau perbaikan aset kantor akan otomatis terekam di sini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu & ID</th>
                  <th className="py-3 px-4">Aset Terkait</th>
                  <th className="py-3 px-4">Jenis Transaksi</th>
                  <th className="py-3 px-4">Staf / Divisi</th>
                  <th className="py-3 px-4">Kondisi Barang</th>
                  <th className="py-3 px-4">Bukti Foto Google Drive</th>
                  <th className="py-3 px-4">Email Status</th>
                  <th className="py-3 px-4 text-right">Dokumen BAST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    {/* Waktu & ID */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900">{t.date}</span>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          {t.id}
                        </div>
                      </div>
                    </td>

                    {/* Aset Terkait */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 line-clamp-1">
                          {t.assetName}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                          {t.assetId}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">
                          ({t.quantity} unit)
                        </span>
                      </div>
                    </td>

                    {/* Jenis Transaksi */}
                    <td className="py-3.5 px-4">
                      <div>
                        {getTypeBadge(t.type)}
                        {t.expectedReturnDate && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Kembali: {t.expectedReturnDate}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Staf / Divisi */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-900">{t.staffName}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{t.department}</span>
                        </div>
                      </div>
                    </td>

                    {/* Kondisi Barang */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">
                        <span className="text-slate-500">Sebelum: </span>
                        <span className="font-medium text-slate-700">{t.conditionBefore}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className="font-bold text-slate-900">{t.conditionAfter}</span>
                        {t.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">
                            "{t.notes}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Bukti Foto Google Drive */}
                    <td className="py-3.5 px-4">
                      {t.photoDriveUrl ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              onViewPhoto(
                                t.photoDriveUrl!,
                                `Bukti Kondisi: ${t.assetName} (${t.date})`
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 hover:ring-2 hover:ring-blue-500 transition relative"
                            title="Pratinjau Foto"
                          >
                            <img
                              src={t.photoDriveUrl}
                              alt="Bukti Fisik"
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <div>
                            <a
                              href={t.photoDriveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              <HardDrive className="w-3 h-3" />
                              <span>Google Drive</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                            <p className="text-[9px] text-slate-400 max-w-[140px] truncate" title={t.photoDriveFolderName}>
                              {t.photoDriveFolderName?.split('/').pop() || 'Drive Folder'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa foto</span>
                      )}
                    </td>

                    {/* Email Status */}
                    <td className="py-3.5 px-4">
                      {t.emailNotificationSent ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terkirim</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                      {t.emailRecipient && (
                        <span className="text-[10px] text-slate-400 block max-w-[120px] truncate">
                          {t.emailRecipient}
                        </span>
                      )}
                    </td>

                    {/* BAST Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenBast(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Buat & Tanda Tangani Berita Acara Serah Terima (BAST)"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>BAST</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
