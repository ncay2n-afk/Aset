export type AssetCategory =
  | 'IT & Elektronik'
  | 'Furnitur & Meja'
  | 'Peralatan Presentasi'
  | 'Kendaraan Operasional'
  | 'Perangkat Jaringan'
  | 'ATK & Suplai Kantor';

export type AssetCondition = 'Baik' | 'Perlu Perbaikan' | 'Rusak Ringan' | 'Rusak Berat';

export type AssetStatus =
  | 'Tersedia'
  | 'Sedang Dipinjam'
  | 'Dalam Perbaikan'
  | 'Stok Kritis'
  | 'Nonaktif / Dihapus';

export interface OfficeAsset {
  id: string; // e.g. 01.14.001.001.24
  name: string;
  category: AssetCategory;
  sku: string;
  totalStock: number;
  availableStock: number;
  borrowedStock: number;
  damagedStock: number;
  unit: string; // Unit, Pcs, Set, Buah
  location: string;
  condition: AssetCondition;
  status: AssetStatus;
  purchaseDate: string;
  purchasePrice: number;
  custodian: string; // PIC / Penanggung Jawab
  usefulLifeYears?: number; // Masa Manfaat (Tahun)
  residualValue?: number; // Nilai Sisa / Residu (IDR)
  warrantyExpiryDate?: string; // Tgl Berakhir Garansi
  taxExpiryDate?: string; // Tgl Jatuh Tempo Pajak Kendaraan / Izin
  serialNumber?: string;
  lastPhotoUrl?: string;
  lastPhotoDate?: string;
  notes: string;
  updatedAt: string;
}

export type TransactionType =
  | 'PEMINJAMAN'
  | 'PENGEMBALIAN'
  | 'MUTASI_LOKASI'
  | 'PERBAIKAN'
  | 'TAMBAH_STOK'
  | 'AFKIR_RUSAK';

export interface AssetTransaction {
  id: string; // e.g. TRX-202609-001
  assetId: string;
  assetName: string;
  type: TransactionType;
  quantity: number;
  staffName: string;
  staffEmail: string;
  department: string;
  date: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionBefore: AssetCondition;
  conditionAfter: AssetCondition;
  locationBefore?: string;
  locationAfter?: string;
  photoDriveUrl?: string;
  photoDriveFileId?: string;
  photoDriveFolderName?: string;
  signatureDataUrl?: string; // Tanda Tangan Digital BAST
  notes: string;
  emailNotificationSent: boolean;
  emailRecipient: string;
}

export type MaintenanceStatus = 'Terjadwal' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan';
export type MaintenanceType = 'Rutin Berkala' | 'Perbaikan Darurat' | 'Kalibrasi' | 'Penggantian Suku Cadang';

export interface MaintenanceRecord {
  id: string; // MTC-xxx
  assetId: string;
  assetName: string;
  serviceType: MaintenanceType;
  scheduledDate: string;
  completedDate?: string;
  vendorOrTechnician: string;
  estimatedCost: number;
  actualCost?: number;
  status: MaintenanceStatus;
  notes: string;
  driveInvoiceUrl?: string;
  createdAt: string;
}

// ==========================================
// STOCK OPNAME & AUDIT FISIK INVENTARIS
// ==========================================
export type AuditItemStatus =
  | 'SESUAI'
  | 'BELUM_DIPERIKSA'
  | 'SELISIH_LOKASI'
  | 'RUSAK'
  | 'HILANG';

export interface StockOpnameItem {
  assetId: string;
  assetName: string;
  expectedLocation: string;
  expectedCondition: AssetCondition;
  actualLocation?: string;
  actualCondition?: AssetCondition;
  status: AuditItemStatus;
  scannedAt?: string;
  notes?: string;
}

export interface StockOpnameSession {
  id: string; // e.g. SO-202609-001
  title: string;
  divisionCode?: string;
  divisionName?: string;
  location: string;
  scheduledDate: string;
  status: 'DRAF' | 'SEDANG_BERJALAN' | 'SELESAI';
  auditorName: string;
  notes: string;
  totalExpectedAssets: number;
  verifiedCount: number;
  discrepancyCount: number;
  items: StockOpnameItem[];
  signatureAuditor?: string;
  signatureApprover?: string;
  completedAt?: string;
  createdAt: string;
}

// ==========================================
// PENGHAPUSAN / DISPOSAL ASET (BAPA)
// ==========================================
export type DisposalType =
  | 'AFKIR_RUSAK_BERAT'
  | 'LELANG_JUAL'
  | 'HIBAH'
  | 'HILANG_MUSNAH'
  | 'KADALUARSA_USANG';

export interface DisposalRecord {
  id: string; // DSP-xxx
  documentNumber: string; // No. BAPA/GA/...
  assetId: string;
  assetName: string;
  category: string;
  disposalType: DisposalType;
  requestDate: string;
  salvageRecoveryAmount: number;
  bookValueAtDisposal: number;
  originalPrice: number;
  reason: string;
  status: 'DIAJUKAN' | 'DISETUJUI' | 'SELESAI';
  picApprover: string;
  witnessName?: string;
  signaturePic?: string;
  createdAt: string;
}

// ==========================================
// MASTER DATA ENTITIES & APPLICATION SETTINGS
// ==========================================
export interface MasterBuildingLocation {
  id: string;
  buildingName: string; // Nama Gedung / Proyek
  floor: string; // Lantai / Zona
  roomName: string; // Nama Ruangan / Slot Area
  notes?: string;
}

export interface MasterVendor {
  id: string;
  name: string;
  serviceCategory: string; // Servis IT, Kendaraan, AC, Kalibrasi
  phone: string;
  email?: string;
  address?: string;
  picName: string;
}

export interface MasterCompanySettings {
  companyName: string;
  brandSubtitle: string;
  logoUrl?: string; // Data URL or Image URL for company logo
  address: string;
  phone: string;
  email: string;
  defaultUsefulLifeYears: number; // default: 4 tahun
  defaultResidualPercent: number; // default: 10%
  bastNumberPrefix: string; // default: "BAST/AST"
  bapaNumberPrefix: string; // default: "BAPA/GA"
  soNumberPrefix: string; // default: "BA-SO"
  assetCodeSeparator: '.' | '-';
}

export interface WorkspaceConfig {
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  driveFolderId: string | null;
  driveFolderName: string;
  notificationEmail: string;
  autoSendEmailOnLoan: boolean;
  autoSendEmailOnDamage: boolean;
  autoSendEmailOnLowStock: boolean;
  lowStockThreshold: number;
}
