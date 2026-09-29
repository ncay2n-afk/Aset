import React from 'react';
import {
  Boxes,
  History,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Scan,
  Wrench,
  BarChart3,
  LogOut,
  CheckCircle2,
  ClipboardCheck,
  Trash2,
  Layers,
  Upload,
  Settings
} from 'lucide-react';
import { User } from 'firebase/auth';
import { MasterCompanySettings } from '../types';

export type AppTab =
  | 'assets'
  | 'transactions'
  | 'opname'
  | 'maintenance'
  | 'disposal'
  | 'reports'
  | 'settings'
  | 'workspace';

interface NavbarProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  onOpenTransactionModal: () => void;
  onOpenAddAssetModal: () => void;
  onOpenScanModal: () => void;
  onOpenBatchLabelModal: () => void;
  onOpenBatchImportModal: () => void;
  user: User | null;
  hasToken: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  spreadsheetUrl: string | null;
  companySettings?: MasterCompanySettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenTransactionModal,
  onOpenAddAssetModal,
  onOpenScanModal,
  onOpenBatchLabelModal,
  onOpenBatchImportModal,
  user,
  hasToken,
  onSignIn,
  onSignOut,
  isSyncing,
  onManualSync,
  spreadsheetUrl,
  companySettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            {companySettings?.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName || 'Logo Perusahaan'}
                className="w-10 h-10 rounded-xl bg-white p-1 object-contain border border-slate-700 shadow-md shadow-blue-500/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Boxes className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight truncate max-w-[180px] sm:max-w-xs">
                  {companySettings?.companyName ? companySettings.companyName.split(' ')[0] + ' ' + (companySettings.companyName.split(' ')[1] || 'Aset') : 'AsetKantor'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-sm">
                {companySettings?.brandSubtitle || 'Sistem Manajemen Inventaris & Mutasi Aset'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCurrentTab('assets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'assets'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Inventaris
            </button>

            <button
              onClick={() => setCurrentTab('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Mutasi
            </button>

            <button
              onClick={() => setCurrentTab('opname')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'opname'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              Stock Opname
            </button>

            <button
              onClick={() => setCurrentTab('maintenance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'maintenance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              Servis
            </button>

            <button
              onClick={() => setCurrentTab('disposal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'disposal'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Penghapusan (BAPA)
            </button>

            <button
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Laporan
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              Master & Pengaturan
            </button>

            <button
              onClick={() => setCurrentTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Workspace
              {hasToken ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              )}
            </button>
          </nav>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Action: Batch Label Print */}
            <button
              onClick={onOpenBatchLabelModal}
              title="Cetak Stiker Barcode QR Massal (Lembar A4/Roll)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline ml-1.5">Cetak Stiker Massal</span>
            </button>

            {/* Quick Action: Batch CSV Import */}
            <button
              onClick={onOpenBatchImportModal}
              title="Import Data Inventaris Massal via CSV"
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline ml-1.5">Import CSV</span>
            </button>

            {/* Quick Action: Scan Barcode / Kamera */}
            <button
              onClick={onOpenScanModal}
              title="Pindai Kamera atau Cari Cepat Barcode / QR Aset"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Scan className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* Quick Action Button: Catat Mutasi */}
            <button
              onClick={onOpenTransactionModal}
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mutasi</span>
            </button>

            {/* Tambah Aset */}
            <button
              onClick={onOpenAddAssetModal}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aset Baru</span>
            </button>

            {/* Sync Button */}
            {hasToken && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title="Sinkronkan dengan Google Sheets"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            )}

            {/* Google Authentication Control */}
            {user && hasToken ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  onClick={() => setCurrentTab('workspace')}
                  className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1 cursor-pointer hover:border-slate-600 transition"
                  title="Kelola Google Sheets, Drive, & Gmail"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full border border-slate-600 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden 2xl:block text-left">
                    <p className="text-xs font-medium text-slate-200 max-w-[110px] truncate leading-tight">
                      {user.displayName || 'Akun Google'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Terhubung
                    </p>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  title="Keluar / Disconnect"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="gsi-material-button flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition border border-slate-300 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden sm:inline">Masuk</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary / Mobile Navigation Row */}
        <div className="flex xl:hidden items-center justify-around py-2 border-t border-slate-800 text-[11px] overflow-x-auto">
          <button
            onClick={() => setCurrentTab('assets')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'assets' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Inventaris
          </button>
          <button
            onClick={() => setCurrentTab('transactions')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'transactions' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Mutasi
          </button>
          <button
            onClick={() => setCurrentTab('opname')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'opname' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Opname
          </button>
          <button
            onClick={() => setCurrentTab('maintenance')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'maintenance' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Servis
          </button>
          <button
            onClick={() => setCurrentTab('disposal')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'disposal' ? 'text-rose-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Penghapusan
          </button>
          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'reports' ? 'text-blue-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Laporan
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Master
          </button>
          <button
            onClick={() => setCurrentTab('workspace')}
            className={`flex items-center gap-1 py-1 px-2 rounded-md ${
              currentTab === 'workspace' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Workspace
          </button>
        </div>
      </div>
    </header>
  );
};
