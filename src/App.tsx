/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout
} from './services/auth';
import {
  OfficeAsset,
  AssetTransaction,
  WorkspaceConfig,
  MaintenanceRecord,
  StockOpnameSession,
  DisposalRecord,
  AssetCondition,
  MasterBuildingLocation,
  MasterVendor,
  MasterCompanySettings
} from './types';
import {
  INITIAL_OFFICE_ASSETS,
  INITIAL_TRANSACTIONS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_STOCK_OPNAME_SESSIONS,
  INITIAL_DISPOSAL_RECORDS,
  INITIAL_BUILDING_LOCATIONS,
  INITIAL_VENDORS,
  INITIAL_COMPANY_SETTINGS
} from './data/mockInitialData';
import {
  KODE_DIVISI_LIST,
  KODE_SUB_KELOMPOK_LIST,
  CodeItem
} from './data/assetCodeGenerator';
import { Navbar, AppTab } from './components/Navbar';
import { DashboardKPI } from './components/DashboardKPI';
import { AssetList } from './components/AssetList';
import { TransactionModal } from './components/TransactionModal';
import { AddAssetModal } from './components/AddAssetModal';
import { EditAssetModal } from './components/EditAssetModal';
import { TransactionHistory } from './components/TransactionHistory';
import { ReportsView } from './components/ReportsView';
import { MaintenanceView } from './components/MaintenanceView';
import { StockOpnameView } from './components/StockOpnameView';
import { DisposalView } from './components/DisposalView';
import { MasterSettingsView } from './components/MasterSettingsView';
import { GoogleWorkspaceSettings } from './components/GoogleWorkspaceSettings';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { AssetLabelModal } from './components/AssetLabelModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BastModal } from './components/BastModal';
import { DepreciationCalculatorModal } from './components/DepreciationCalculatorModal';
import { BatchLabelModal } from './components/BatchLabelModal';
import { BatchImportModal } from './components/BatchImportModal';
import { WarrantyAlertsBanner } from './components/WarrantyAlertsBanner';
import {
  syncAssetsToSheet,
  createSpreadsheet
} from './services/sheetsService';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const LOCAL_STORAGE_ASSETS_KEY = 'aset_kantor_assets_v3';
const LOCAL_STORAGE_TRX_KEY = 'aset_kantor_trx_v3';
const LOCAL_STORAGE_MTC_KEY = 'aset_kantor_mtc_v3';
const LOCAL_STORAGE_SO_KEY = 'aset_kantor_so_v3';
const LOCAL_STORAGE_DSP_KEY = 'aset_kantor_dsp_v3';
const LOCAL_STORAGE_LOC_KEY = 'aset_kantor_loc_v3';
const LOCAL_STORAGE_VND_KEY = 'aset_kantor_vnd_v3';
const LOCAL_STORAGE_COMPANY_KEY = 'aset_kantor_company_v3';
const LOCAL_STORAGE_DIV_KEY = 'aset_kantor_div_v3';
const LOCAL_STORAGE_SUB_KEY = 'aset_kantor_sub_v3';
const LOCAL_STORAGE_CONFIG_KEY = 'aset_kantor_config_v3';

export default function App() {
  // Navigation Tabs: 'assets' | 'transactions' | 'opname' | 'maintenance' | 'disposal' | 'reports' | 'workspace'
  const [currentTab, setCurrentTab] = useState<AppTab>('assets');

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Asset, Transaction, Maintenance, Stock Opname, and Disposal Data
  const [assets, setAssets] = useState<OfficeAsset[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ASSETS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_OFFICE_ASSETS;
    } catch {
      return INITIAL_OFFICE_ASSETS;
    }
  });

  const [transactions, setTransactions] = useState<AssetTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRX_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MTC_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS;
    } catch {
      return INITIAL_MAINTENANCE_RECORDS;
    }
  });

  const [stockOpnameSessions, setStockOpnameSessions] = useState<StockOpnameSession[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SO_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_OPNAME_SESSIONS;
    } catch {
      return INITIAL_STOCK_OPNAME_SESSIONS;
    }
  });

  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DSP_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DISPOSAL_RECORDS;
    } catch {
      return INITIAL_DISPOSAL_RECORDS;
    }
  });

  // Master Data: Building Locations, Vendors, Company Settings, Custom Divisions, and Sub Kelompoks
  const [locations, setLocations] = useState<MasterBuildingLocation[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOC_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BUILDING_LOCATIONS;
    } catch {
      return INITIAL_BUILDING_LOCATIONS;
    }
  });

  const [vendors, setVendors] = useState<MasterVendor[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VND_KEY);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [companySettings, setCompanySettings] = useState<MasterCompanySettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COMPANY_KEY);
      return saved ? JSON.parse(saved) : INITIAL_COMPANY_SETTINGS;
    } catch {
      return INITIAL_COMPANY_SETTINGS;
    }
  });

  const [customDivisions, setCustomDivisions] = useState<CodeItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DIV_KEY);
      return saved ? JSON.parse(saved) : KODE_DIVISI_LIST;
    } catch {
      return KODE_DIVISI_LIST;
    }
  });

  const [customSubKelompoks, setCustomSubKelompoks] = useState<CodeItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SUB_KEY);
      return saved ? JSON.parse(saved) : KODE_SUB_KELOMPOK_LIST;
    } catch {
      return KODE_SUB_KELOMPOK_LIST;
    }
  });

  // Google Workspace Configuration
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      spreadsheetId: null,
      spreadsheetName: 'AsetKantor_Database_Inventaris',
      spreadsheetUrl: null,
      driveFolderId: null,
      driveFolderName: 'AsetKantor_Dokumentasi_Foto',
      notificationEmail: '',
      autoSendEmailOnLoan: true,
      autoSendEmailOnDamage: true,
      autoSendEmailOnLowStock: true,
      lowStockThreshold: 1,
    };
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Modals
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedAssetForTrx, setSelectedAssetForTrx] = useState<OfficeAsset | null>(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isBatchLabelModalOpen, setIsBatchLabelModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);

  const [photoViewer, setPhotoViewer] = useState<{ isOpen: boolean; url: string | null; title: string }>({
    isOpen: false,
    url: null,
    title: '',
  });

  // Modals: Label/QR, Scanner, BAST, Depreciation, Edit Asset
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedAssetForLabel, setSelectedAssetForLabel] = useState<OfficeAsset | null>(null);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [isBastModalOpen, setIsBastModalOpen] = useState(false);
  const [selectedTrxForBast, setSelectedTrxForBast] = useState<AssetTransaction | null>(null);

  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);
  const [selectedAssetForDepreciation, setSelectedAssetForDepreciation] = useState<OfficeAsset | null>(null);

  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<OfficeAsset | null>(null);

  // Persistence to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ASSETS_KEY, JSON.stringify(assets));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MTC_KEY, JSON.stringify(maintenanceRecords));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [maintenanceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SO_KEY, JSON.stringify(stockOpnameSessions));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [stockOpnameSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DSP_KEY, JSON.stringify(disposalRecords));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [disposalRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOC_KEY, JSON.stringify(locations));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [locations]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_VND_KEY, JSON.stringify(vendors));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [vendors]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMPANY_KEY, JSON.stringify(companySettings));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [companySettings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DIV_KEY, JSON.stringify(customDivisions));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [customDivisions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SUB_KEY, JSON.stringify(customSubKelompoks));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [customSubKelompoks]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(workspaceConfig));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [workspaceConfig]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign In Handler
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setToken(res.accessToken);
      setToastMessage({
        type: 'success',
        text: `Berhasil terhubung dengan Google Workspace (${res.user.email})`,
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Gagal masuk dengan Google OAuth',
      });
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setToastMessage({
        type: 'info',
        text: 'Sesi Google telah diputus.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Manual Sync All with Google Sheets
  const handleManualSync = useCallback(async () => {
    if (!token) {
      setCurrentTab('workspace');
      setToastMessage({
        type: 'info',
        text: 'Silakan hubungkan akun Google untuk sinkronisasi Google Sheets.',
      });
      return;
    }

    setIsSyncing(true);
    try {
      let targetSheetId = workspaceConfig.spreadsheetId;

      if (!targetSheetId) {
        const created = await createSpreadsheet(token, 'AsetKantor_Database_Inventaris');
        targetSheetId = created.spreadsheetId;
        setWorkspaceConfig((prev) => ({
          ...prev,
          spreadsheetId: created.spreadsheetId,
          spreadsheetUrl: created.spreadsheetUrl,
        }));
      }

      await syncAssetsToSheet(token, targetSheetId, assets);

      setToastMessage({
        type: 'success',
        text: 'Data inventaris berhasil disinkronkan ke Google Sheets!',
      });
    } catch (err: any) {
      console.error(err);
      setToastMessage({
        type: 'error',
        text: err.message || 'Gagal menyinkronkan data dengan Google Sheets',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [token, workspaceConfig.spreadsheetId, assets]);

  // Transaction Success Handler
  const handleTransactionSuccess = (
    updatedAsset: OfficeAsset,
    newTransaction: AssetTransaction
  ) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );
    setTransactions((prev) => [newTransaction, ...prev]);

    setToastMessage({
      type: 'success',
      text: `Mutasi ${newTransaction.type} berhasil dicatat! Stok diperbarui, bukti foto tersimpan di Google Drive, dan notifikasi email terproses.`,
    });
  };

  // Add Asset Success Handler
  const handleAssetAdded = (newAsset: OfficeAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Aset baru "${newAsset.name}" (${newAsset.id}) berhasil didaftarkan ke inventaris kantor.`,
    });
  };

  // Batch CSV Import Handler
  const handleBatchImport = async (importedAssets: OfficeAsset[]) => {
    const combined = [...importedAssets, ...assets];
    setAssets(combined);

    if (token && workspaceConfig.spreadsheetId) {
      try {
        await syncAssetsToSheet(token, workspaceConfig.spreadsheetId, combined);
      } catch (e) {
        console.warn('Batch sync error:', e);
      }
    }

    setToastMessage({
      type: 'success',
      text: `Berhasil mengimpor ${importedAssets.length} aset baru ke dalam inventaris kantor!`,
    });
  };

  // Edit Asset Handler
  const handleSaveEditedAsset = async (updatedAsset: OfficeAsset) => {
    const updatedList = assets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
    setAssets(updatedList);

    if (token && workspaceConfig.spreadsheetId) {
      try {
        await syncAssetsToSheet(token, workspaceConfig.spreadsheetId, updatedList);
      } catch (err) {
        console.warn('Failed to sync edited asset to Sheets:', err);
      }
    }

    setToastMessage({
      type: 'success',
      text: `Perubahan data aset "${updatedAsset.name}" berhasil disimpan.`,
    });
  };

  // Delete Asset Handler
  const handleDeleteAsset = async (assetId: string) => {
    const updatedList = assets.filter((a) => a.id !== assetId);
    setAssets(updatedList);

    if (token && workspaceConfig.spreadsheetId) {
      try {
        await syncAssetsToSheet(token, workspaceConfig.spreadsheetId, updatedList);
      } catch (err) {
        console.warn('Failed to sync deleted asset to Sheets:', err);
      }
    }

    setToastMessage({
      type: 'info',
      text: `Aset ${assetId} telah dihapus dari inventaris kantor.`,
    });
  };

  // Stock Opname Session Handlers
  const handleAddStockOpnameSession = (newSession: StockOpnameSession) => {
    setStockOpnameSessions((prev) => [newSession, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Sesi stock opname "${newSession.title}" berhasil dibuat!`,
    });
  };

  const handleUpdateStockOpnameSession = (updatedSession: StockOpnameSession) => {
    setStockOpnameSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const handleReconcileAssets = (
    reconciledList: { assetId: string; condition: AssetCondition; location: string }[]
  ) => {
    const updated = assets.map((a) => {
      const match = reconciledList.find((r) => r.assetId === a.id);
      if (match) {
        return {
          ...a,
          condition: match.condition,
          location: match.location,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    setAssets(updated);
    if (token && workspaceConfig.spreadsheetId) {
      syncAssetsToSheet(token, workspaceConfig.spreadsheetId, updated).catch(console.warn);
    }

    setToastMessage({
      type: 'success',
      text: `Berhasil merekonsiliasi ${reconciledList.length} aset dengan fisik di lapangan!`,
    });
  };

  // Asset Disposal Handlers (BAPA)
  const handleAddDisposal = (record: DisposalRecord, removeAssetFromStock: boolean) => {
    setDisposalRecords((prev) => [record, ...prev]);

    if (removeAssetFromStock) {
      const updated = assets.map((a) => {
        if (a.id === record.assetId) {
          return {
            ...a,
            status: 'Nonaktif / Dihapus' as const,
            availableStock: 0,
            borrowedStock: 0,
            notes: `${a.notes} [DIHAPUS VIA BAPA: ${record.documentNumber} - ${record.reason}]`,
            updatedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      setAssets(updated);
      if (token && workspaceConfig.spreadsheetId) {
        syncAssetsToSheet(token, workspaceConfig.spreadsheetId, updated).catch(console.warn);
      }
    }

    setToastMessage({
      type: 'success',
      text: `Berita Acara Penghapusan Aset (${record.documentNumber}) berhasil diterbitkan!`,
    });
  };

  // Maintenance Handlers
  const handleAddMaintenance = (newRecord: MaintenanceRecord) => {
    setMaintenanceRecords((prev) => [newRecord, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Jadwal pemeliharaan "${newRecord.serviceType}" untuk ${newRecord.assetName} berhasil dibuat.`,
    });
  };

  const handleCompleteMaintenance = (
    recordId: string,
    actualCost: number,
    restoreAssetCondition: boolean
  ) => {
    const record = maintenanceRecords.find((r) => r.id === recordId);
    if (!record) return;

    setMaintenanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: 'Selesai',
              actualCost,
              completedDate: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );

    if (restoreAssetCondition) {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === record.assetId) {
            const restoredDamaged = Math.max(0, a.damagedStock - 1);
            return {
              ...a,
              condition: 'Baik',
              status: 'Tersedia',
              damagedStock: restoredDamaged,
              availableStock: a.availableStock + 1,
            };
          }
          return a;
        })
      );
    }

    setToastMessage({
      type: 'success',
      text: `Pemeliharaan aset ${record.assetName} ditandai selesai!`,
    });
  };

  // Modal Openers
  const handleOpenTransactionForAsset = (asset?: OfficeAsset) => {
    setSelectedAssetForTrx(asset || assets[0] || null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenLabelForAsset = (asset: OfficeAsset) => {
    setSelectedAssetForLabel(asset);
    setIsLabelModalOpen(true);
  };

  const handleOpenDepreciationForAsset = (asset: OfficeAsset) => {
    setSelectedAssetForDepreciation(asset);
    setIsDepreciationModalOpen(true);
  };

  const handleOpenEditForAsset = (asset: OfficeAsset) => {
    setSelectedAssetForEdit(asset);
    setIsEditAssetModalOpen(true);
  };

  const handleOpenBastForTrx = (trx: AssetTransaction) => {
    setSelectedTrxForBast(trx);
    setIsBastModalOpen(true);
  };

  const handleQuickReturnFromTracker = (trx: AssetTransaction) => {
    const targetAsset = assets.find((a) => a.id === trx.assetId) || assets[0];
    setSelectedAssetForTrx(targetAsset);
    setIsTransactionModalOpen(true);
  };

  const handleViewPhoto = (photoUrl: string, title: string) => {
    setPhotoViewer({
      isOpen: true,
      url: photoUrl,
      title,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce no-print">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-500/40'
                : 'bg-slate-900 text-blue-300 border-blue-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenTransactionModal={() => handleOpenTransactionForAsset()}
        onOpenAddAssetModal={() => setIsAddAssetModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenBatchLabelModal={() => setIsBatchLabelModalOpen(true)}
        onOpenBatchImportModal={() => setIsBatchImportModalOpen(true)}
        user={user}
        hasToken={!!token}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        spreadsheetUrl={workspaceConfig.spreadsheetUrl}
        companySettings={companySettings}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Proactive Warranty & Tax Expiration Alert Banner */}
        <WarrantyAlertsBanner
          assets={assets}
          onSelectAsset={(asset) => {
            setSelectedAssetForEdit(asset);
            setIsEditAssetModalOpen(true);
          }}
        />

        {/* KPI Dashboard */}
        <DashboardKPI
          assets={assets}
          transactions={transactions}
          hasToken={!!token}
          spreadsheetUrl={workspaceConfig.spreadsheetUrl}
          onOpenWorkspace={() => setCurrentTab('workspace')}
          onFilterStatus={(status) => {
            setSelectedStatusFilter(status);
            setCurrentTab('assets');
          }}
          selectedStatusFilter={selectedStatusFilter}
        />

        {/* Tab 1: Inventaris Aset */}
        {currentTab === 'assets' && (
          <AssetList
            assets={assets}
            onOpenTransactionModal={handleOpenTransactionForAsset}
            onOpenAddAssetModal={() => setIsAddAssetModalOpen(true)}
            onViewPhoto={handleViewPhoto}
            onOpenLabelModal={handleOpenLabelForAsset}
            onOpenDepreciationModal={handleOpenDepreciationForAsset}
            onOpenEditModal={handleOpenEditForAsset}
            selectedStatusFilter={selectedStatusFilter}
            onClearStatusFilter={() => setSelectedStatusFilter(null)}
          />
        )}

        {/* Tab 2: Riwayat Mutasi & Peminjaman */}
        {currentTab === 'transactions' && (
          <TransactionHistory
            transactions={transactions}
            assets={assets}
            onViewPhoto={handleViewPhoto}
            onOpenBast={handleOpenBastForTrx}
            onQuickReturn={handleQuickReturnFromTracker}
            token={token}
          />
        )}

        {/* Tab 3: Stock Opname & Audit Fisik */}
        {currentTab === 'opname' && (
          <StockOpnameView
            assets={assets}
            sessions={stockOpnameSessions}
            onAddSession={handleAddStockOpnameSession}
            onUpdateSession={handleUpdateStockOpnameSession}
            onReconcileAssets={handleReconcileAssets}
            onOpenScanner={() => setIsScanModalOpen(true)}
            companySettings={companySettings}
          />
        )}

        {/* Tab 4: Jadwal Pemeliharaan & Servis Rutin */}
        {currentTab === 'maintenance' && (
          <MaintenanceView
            assets={assets}
            records={maintenanceRecords}
            onAddRecord={handleAddMaintenance}
            onCompleteRecord={handleCompleteMaintenance}
            token={token}
            currentUserEmail={user?.email || null}
            vendors={vendors}
          />
        )}

        {/* Tab 5: Penghapusan Aset Resmi (BAPA) */}
        {currentTab === 'disposal' && (
          <DisposalView
            assets={assets}
            records={disposalRecords}
            onAddDisposal={handleAddDisposal}
            companySettings={companySettings}
          />
        )}

        {/* Tab 6: Laporan & Analitik Real-Time */}
        {currentTab === 'reports' && (
          <ReportsView
            assets={assets}
            transactions={transactions}
            maintenanceRecords={maintenanceRecords}
            spreadsheetUrl={workspaceConfig.spreadsheetUrl}
          />
        )}

        {/* Tab 7: Master Data & Pengaturan Aplikasi */}
        {currentTab === 'settings' && (
          <MasterSettingsView
            locations={locations}
            onAddLocation={(newLoc) => setLocations((prev) => [newLoc, ...prev])}
            onUpdateLocation={(updated) => setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))}
            onDeleteLocation={(id) => setLocations((prev) => prev.filter((l) => l.id !== id))}
            onImportLocations={(newLocs) => setLocations((prev) => [...newLocs, ...prev])}
            vendors={vendors}
            onAddVendor={(newVnd) => setVendors((prev) => [newVnd, ...prev])}
            onUpdateVendor={(updated) => setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))}
            onDeleteVendor={(id) => setVendors((prev) => prev.filter((v) => v.id !== id))}
            onImportVendors={(newVnds) => setVendors((prev) => [...newVnds, ...prev])}
            companySettings={companySettings}
            onUpdateCompanySettings={(cfg) => setCompanySettings(cfg)}
            customDivisions={customDivisions}
            onAddDivision={(div) => setCustomDivisions((prev) => [...prev, div])}
            onUpdateDivision={(oldCode, updated) => setCustomDivisions((prev) => prev.map((d) => (d.code === oldCode ? updated : d)))}
            onDeleteDivision={(code) => setCustomDivisions((prev) => prev.filter((d) => d.code !== code))}
            onImportDivisions={(newDivs) => setCustomDivisions((prev) => [...newDivs, ...prev])}
            customSubKelompoks={customSubKelompoks}
            onAddSubKelompok={(sub) => setCustomSubKelompoks((prev) => [...prev, sub])}
            onUpdateSubKelompok={(oldCode, updated) => setCustomSubKelompoks((prev) => prev.map((s) => (s.code === oldCode ? updated : s)))}
            onDeleteSubKelompok={(code) => setCustomSubKelompoks((prev) => prev.filter((s) => s.code !== code))}
            onImportSubKelompoks={(newSubs) => setCustomSubKelompoks((prev) => [...newSubs, ...prev])}
            allData={{
              assets,
              transactions,
              maintenanceRecords,
              stockOpnameSessions,
              disposalRecords,
            }}
            onRestoreAllData={(restored) => {
              if (restored.assets) setAssets(restored.assets);
              if (restored.transactions) setTransactions(restored.transactions);
              if (restored.maintenanceRecords) setMaintenanceRecords(restored.maintenanceRecords);
              if (restored.stockOpnameSessions) setStockOpnameSessions(restored.stockOpnameSessions);
              if (restored.disposalRecords) setDisposalRecords(restored.disposalRecords);
              if (restored.locations) setLocations(restored.locations);
              if (restored.vendors) setVendors(restored.vendors);
              if (restored.companySettings) setCompanySettings(restored.companySettings);
              if (restored.customDivisions) setCustomDivisions(restored.customDivisions);
              if (restored.customSubKelompoks) setCustomSubKelompoks(restored.customSubKelompoks);
            }}
          />
        )}

        {/* Tab 8: Pengaturan Integrasi Google Workspace */}
        {currentTab === 'workspace' && (
          <GoogleWorkspaceSettings
            user={user}
            token={token}
            onSignIn={handleSignIn}
            workspaceConfig={workspaceConfig}
            onUpdateConfig={(newCfg) => setWorkspaceConfig((prev) => ({ ...prev, ...newCfg }))}
            assets={assets}
            onSyncAll={handleManualSync}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Transaction & Loan Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        selectedAsset={selectedAssetForTrx}
        allAssets={assets}
        token={token}
        currentUserEmail={user?.email || null}
        workspaceConfig={workspaceConfig}
        onTransactionSuccess={handleTransactionSuccess}
        registeredLocations={locations}
      />

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        token={token}
        spreadsheetId={workspaceConfig.spreadsheetId}
        onAssetAdded={handleAssetAdded}
        existingCount={assets.length}
        registeredLocations={locations}
        customDivisions={customDivisions}
        customSubKelompoks={customSubKelompoks}
      />

      {/* Batch Import CSV Modal */}
      <BatchImportModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        existingCount={assets.length}
        onImportAssets={handleBatchImport}
      />

      {/* Batch Label Print Modal */}
      <BatchLabelModal
        isOpen={isBatchLabelModalOpen}
        onClose={() => setIsBatchLabelModalOpen(false)}
        allAssets={assets}
        companySettings={companySettings}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={isEditAssetModalOpen}
        onClose={() => setIsEditAssetModalOpen(false)}
        asset={selectedAssetForEdit}
        onSaveAsset={handleSaveEditedAsset}
        onDeleteAsset={handleDeleteAsset}
        registeredLocations={locations}
      />

      {/* Asset Label & QR Code Modal */}
      <AssetLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        asset={selectedAssetForLabel}
        allAssets={assets}
        companySettings={companySettings}
      />

      {/* Live Camera, Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        allAssets={assets}
        onSelectAssetForTransaction={handleOpenTransactionForAsset}
        onSelectAssetForLabel={handleOpenLabelForAsset}
      />

      {/* BAST Digital Modal */}
      <BastModal
        isOpen={isBastModalOpen}
        onClose={() => setIsBastModalOpen(false)}
        transaction={selectedTrxForBast}
        asset={assets.find((a) => a.id === selectedTrxForBast?.assetId) || null}
        companySettings={companySettings}
        onSaveSignature={(trxId, sigUrl) => {
          setTransactions((prev) =>
            prev.map((t) => (t.id === trxId ? { ...t, signatureDataUrl: sigUrl } : t))
          );
        }}
      />

      {/* Depreciation Calculator Modal */}
      <DepreciationCalculatorModal
        isOpen={isDepreciationModalOpen}
        onClose={() => setIsDepreciationModalOpen(false)}
        asset={selectedAssetForDepreciation}
      />

      {/* Full Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={photoViewer.isOpen}
        onClose={() => setPhotoViewer((prev) => ({ ...prev, isOpen: false }))}
        photoUrl={photoViewer.url}
        title={photoViewer.title}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-center text-xs text-slate-500 no-print">
        <p>
          AsetKantor Enterprise &bull; Sistem Manajemen Inventaris Terintegrasi Google Sheets, Google Drive, & Gmail API.
        </p>
      </footer>
    </div>
  );
}
