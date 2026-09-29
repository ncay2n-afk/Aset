import React from 'react';
import {
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  Wrench,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  HardDrive,
  Mail,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { OfficeAsset, AssetTransaction } from '../types';

interface DashboardKPIProps {
  assets: OfficeAsset[];
  transactions: AssetTransaction[];
  hasToken: boolean;
  spreadsheetUrl: string | null;
  onOpenWorkspace: () => void;
  onFilterStatus?: (status: string | null) => void;
  selectedStatusFilter: string | null;
}

export const DashboardKPI: React.FC<DashboardKPIProps> = ({
  assets,
  transactions,
  hasToken,
  spreadsheetUrl,
  onOpenWorkspace,
  onFilterStatus,
  selectedStatusFilter,
}) => {
  // Aggregate statistics
  const totalAssetsCount = assets.length;
  const totalUnits = assets.reduce((acc, curr) => acc + (curr.totalStock || 0), 0);
  const totalAvailable = assets.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
  const totalBorrowed = assets.reduce((acc, curr) => acc + (curr.borrowedStock || 0), 0);
  const totalDamaged = assets.reduce(
    (acc, curr) => acc + (curr.damagedStock || 0) + (curr.condition === 'Perlu Perbaikan' || curr.condition === 'Rusak Berat' ? 1 : 0),
    0
  );

  const totalValuation = assets.reduce(
    (acc, curr) => acc + (curr.purchasePrice || 0) * (curr.totalStock || 1),
    0
  );

  const criticalStockItems = assets.filter(
    (a) => a.availableStock <= 1 && a.totalStock > 0
  );

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Connection Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-4 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Google Workspace Asset Core</h2>
                {hasToken ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Terkoneksi Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Koneksi Diperlukan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Database tersinkronisasi dengan Google Sheets, foto kondisi tersimpan otomatis di Google Drive, dan notifikasi email via Gmail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka Spreadsheet</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            <button
              onClick={onOpenWorkspace}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <span>{hasToken ? 'Pengaturan Integrasi' : 'Hubungkan Akun Google'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Nilai Aset */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Nilai Aset</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {formatIDR(totalValuation)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600 inline" />
              Total kapitalisasi inventaris
            </p>
          </div>
        </div>

        {/* Total Unit & Item */}
        <div
          onClick={() => onFilterStatus && onFilterStatus(null)}
          className={`bg-white p-4 rounded-xl border shadow-xs flex flex-col justify-between transition cursor-pointer ${
            selectedStatusFilter === null ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Barang</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {totalUnits}{' '}
              <span className="text-xs font-normal text-slate-500">unit ({totalAssetsCount} item)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tersedia:{' '}
              <span className="font-semibold text-emerald-600">{totalAvailable} unit</span>
            </p>
          </div>
        </div>

        {/* Sedang Dipinjam */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Sedang Dipinjam')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex flex-col justify-between transition cursor-pointer ${
            selectedStatusFilter === 'Sedang Dipinjam'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sedang Dipinjam</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-indigo-700">
              {totalBorrowed}{' '}
              <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[11px] text-indigo-600 mt-0.5">
              Dipakai aktif oleh staf kantor
            </p>
          </div>
        </div>

        {/* Butuh Perbaikan / Rusak */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Dalam Perbaikan')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex flex-col justify-between transition cursor-pointer ${
            selectedStatusFilter === 'Dalam Perbaikan'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Butuh Servis</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-amber-600">
              {totalDamaged}{' '}
              <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[11px] text-amber-600 mt-0.5">
              Perlu maintenance / rusak
            </p>
          </div>
        </div>

        {/* Stok Kritis */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Stok Kritis')}
          className={`bg-white p-4 rounded-xl border shadow-xs flex flex-col justify-between transition cursor-pointer ${
            selectedStatusFilter === 'Stok Kritis'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Stok Kritis</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-rose-600">
              {criticalStockItems.length}{' '}
              <span className="text-xs font-normal text-slate-500">kategori</span>
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5">
              Sisa stok &le; 1 unit segera restock
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
