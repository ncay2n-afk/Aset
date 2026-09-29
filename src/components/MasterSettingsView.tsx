import React, { useState } from 'react';
import {
  Settings,
  Building2,
  FolderTree,
  Wrench,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building,
  Layers,
  Phone,
  Mail,
  MapPin,
  Tag,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Image,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  MasterBuildingLocation,
  MasterVendor,
  MasterCompanySettings,
  OfficeAsset,
  AssetTransaction,
  MaintenanceRecord,
  StockOpnameSession,
  DisposalRecord
} from '../types';
import { CodeItem } from '../data/assetCodeGenerator';

interface MasterSettingsViewProps {
  locations: MasterBuildingLocation[];
  onAddLocation: (loc: MasterBuildingLocation) => void;
  onUpdateLocation: (loc: MasterBuildingLocation) => void;
  onDeleteLocation: (id: string) => void;
  onImportLocations: (locs: MasterBuildingLocation[]) => void;

  vendors: MasterVendor[];
  onAddVendor: (vendor: MasterVendor) => void;
  onUpdateVendor: (vendor: MasterVendor) => void;
  onDeleteVendor: (id: string) => void;
  onImportVendors: (vendors: MasterVendor[]) => void;

  companySettings: MasterCompanySettings;
  onUpdateCompanySettings: (settings: MasterCompanySettings) => void;

  // Master Kode Divisi & Sub Kelompok
  customDivisions: CodeItem[];
  onAddDivision: (div: CodeItem) => void;
  onUpdateDivision: (oldCode: string, div: CodeItem) => void;
  onDeleteDivision: (code: string) => void;
  onImportDivisions: (divs: CodeItem[]) => void;

  customSubKelompoks: CodeItem[];
  onAddSubKelompok: (sub: CodeItem) => void;
  onUpdateSubKelompok: (oldCode: string, sub: CodeItem) => void;
  onDeleteSubKelompok: (code: string) => void;
  onImportSubKelompoks: (subs: CodeItem[]) => void;

  // Backup & Restore
  allData: {
    assets: OfficeAsset[];
    transactions: AssetTransaction[];
    maintenanceRecords: MaintenanceRecord[];
    stockOpnameSessions: StockOpnameSession[];
    disposalRecords: DisposalRecord[];
  };
  onRestoreAllData: (data: any) => void;
}

export const MasterSettingsView: React.FC<MasterSettingsViewProps> = ({
  locations,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onImportLocations,
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onImportVendors,
  companySettings,
  onUpdateCompanySettings,
  customDivisions,
  onAddDivision,
  onUpdateDivision,
  onDeleteDivision,
  onImportDivisions,
  customSubKelompoks,
  onAddSubKelompok,
  onUpdateSubKelompok,
  onDeleteSubKelompok,
  onImportSubKelompoks,
  allData,
  onRestoreAllData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'company' | 'locations' | 'divisions' | 'categories' | 'vendors' | 'backup'
  >('company');

  // Company Settings Form State
  const [companyForm, setCompanyForm] = useState<MasterCompanySettings>(companySettings);

  // New Location Form State
  const [newBldName, setNewBldName] = useState('');
  const [newFloor, setNewFloor] = useState('Lantai 1');
  const [newRoom, setNewRoom] = useState('');
  const [newLocNotes, setNewLocNotes] = useState('');

  // Edit Location Modal State
  const [editingLocation, setEditingLocation] = useState<MasterBuildingLocation | null>(null);

  // New Vendor Form State
  const [newVndName, setNewVndName] = useState('');
  const [newVndCat, setNewVndCat] = useState('Servis IT & Komputer');
  const [newVndPhone, setNewVndPhone] = useState('');
  const [newVndEmail, setNewVndEmail] = useState('');
  const [newVndAddress, setNewVndAddress] = useState('');
  const [newVndPic, setNewVndPic] = useState('');

  // Edit Vendor Modal State
  const [editingVendor, setEditingVendor] = useState<MasterVendor | null>(null);

  // New Division State
  const [newDivCode, setNewDivCode] = useState('');
  const [newDivName, setNewDivName] = useState('');
  const [editingDivision, setEditingDivision] = useState<{ oldCode: string; code: string; name: string } | null>(null);

  // New Sub Kelompok State
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [editingSubKelompok, setEditingSubKelompok] = useState<{ oldCode: string; code: string; name: string } | null>(null);

  // Import Modal State: 'locations' | 'vendors' | 'divisions' | 'subkelompok' | null
  const [importTarget, setImportTarget] = useState<'locations' | 'vendors' | 'divisions' | 'subkelompok' | null>(null);
  const [importCsvText, setImportCsvText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // ==========================================
  // LOGO UPLOAD HANDLERS
  // ==========================================
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCompanyForm((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompanyForm((prev) => ({ ...prev, logoUrl: undefined }));
  };

  // Save Company Settings
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanySettings(companyForm);
    alert('Pengaturan identitas perusahaan dan logo berhasil disimpan!');
  };

  // Add Location
  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBldName.trim() || !newRoom.trim()) return;

    const newLoc: MasterBuildingLocation = {
      id: `LOC-${Date.now().toString().slice(-4)}`,
      buildingName: newBldName.trim(),
      floor: newFloor.trim(),
      roomName: newRoom.trim(),
      notes: newLocNotes.trim(),
    };

    onAddLocation(newLoc);
    setNewBldName('');
    setNewRoom('');
    setNewLocNotes('');
  };

  const handleSaveEditLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    onUpdateLocation(editingLocation);
    setEditingLocation(null);
  };

  // Add Vendor
  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVndName.trim()) return;

    const newVnd: MasterVendor = {
      id: `VND-${Date.now().toString().slice(-4)}`,
      name: newVndName.trim(),
      serviceCategory: newVndCat,
      phone: newVndPhone.trim(),
      email: newVndEmail.trim(),
      address: newVndAddress.trim(),
      picName: newVndPic.trim() || 'Customer Support',
    };

    onAddVendor(newVnd);
    setNewVndName('');
    setNewVndPhone('');
    setNewVndEmail('');
    setNewVndAddress('');
    setNewVndPic('');
  };

  const handleSaveEditVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    onUpdateVendor(editingVendor);
    setEditingVendor(null);
  };

  // Add Division
  const handleCreateDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivCode.trim() || !newDivName.trim()) return;
    const formattedCode = newDivCode.trim().padStart(2, '0').slice(-2);
    onAddDivision({ code: formattedCode, name: newDivName.trim() });
    setNewDivCode('');
    setNewDivName('');
  };

  const handleSaveEditDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDivision) return;
    const formattedCode = editingDivision.code.trim().padStart(2, '0').slice(-2);
    onUpdateDivision(editingDivision.oldCode, { code: formattedCode, name: editingDivision.name.trim() });
    setEditingDivision(null);
  };

  // Add Sub Kelompok
  const handleCreateSubKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) return;
    const formattedCode = newSubCode.trim().padStart(3, '0').slice(-3);
    onAddSubKelompok({ code: formattedCode, name: newSubName.trim() });
    setNewSubCode('');
    setNewSubName('');
  };

  const handleSaveEditSubKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubKelompok) return;
    const formattedCode = editingSubKelompok.code.trim().padStart(3, '0').slice(-3);
    onUpdateSubKelompok(editingSubKelompok.oldCode, { code: formattedCode, name: editingSubKelompok.name.trim() });
    setEditingSubKelompok(null);
  };

  // ==========================================
  // EXPORT TO CSV HELPERS
  // ==========================================
  const handleExportLocationsCsv = () => {
    const headers = ['Gedung', 'Lantai', 'Ruangan', 'Catatan'];
    const rows = locations.map((l) => [l.buildingName, l.floor, l.roomName, l.notes || '']);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCsvFile(csvContent, 'Master_Gedung_Lantai_Ruang.csv');
  };

  const handleExportVendorsCsv = () => {
    const headers = ['Nama Vendor', 'Kategori Servis', 'Telepon', 'Email', 'Alamat', 'PIC'];
    const rows = vendors.map((v) => [v.name, v.serviceCategory, v.phone, v.email || '', v.address || '', v.picName]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCsvFile(csvContent, 'Master_Rekanan_Vendor.csv');
  };

  const handleExportDivisionsCsv = () => {
    const headers = ['Kode Divisi', 'Nama Divisi'];
    const rows = customDivisions.map((d) => [d.code, d.name]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCsvFile(csvContent, 'Master_Divisi.csv');
  };

  const handleExportSubKelompoksCsv = () => {
    const headers = ['Kode Sub Kelompok', 'Nama Sub Kelompok'];
    const rows = customSubKelompoks.map((s) => [s.code, s.name]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCsvFile(csvContent, 'Master_Sub_Kelompok.csv');
  };

  const downloadCsvFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // CSV IMPORT PARSING FOR MASTER DATA
  // ==========================================
  const handleOpenImportModal = (target: 'locations' | 'vendors' | 'divisions' | 'subkelompok') => {
    setImportTarget(target);
    setImportCsvText('');
    setImportError(null);
    setImportPreview([]);
  };

  const handleDownloadImportTemplate = (target: string) => {
    let headers = '';
    let sample = '';
    if (target === 'locations') {
      headers = 'Nama Gedung,Lantai,Nama Ruangan,Catatan';
      sample = '"Gedung Menara Sentra","Lantai 2","Ruang Meeting VIP","Proyektor & AC sentral"\n"Kawasan Teras Samarinda","Lantai Dasar","Kantor Pengelola Lapangan","Pos utama"';
    } else if (target === 'vendors') {
      headers = 'Nama Vendor,Kategori Servis,Telepon,Email,Alamat,PIC';
      sample = '"PT Sentosa Solusi","Servis Komputer & Jaringan","021-5550123","support@sentosa.id","Jl. Sudirman 45","Budi Santoso"';
    } else if (target === 'divisions') {
      headers = 'Kode Divisi (2 Digit),Nama Divisi';
      sample = '"15","Divisi Fasilitas Dermaga"\n"16","Divisi Pusat Logistik Pangan"';
    } else if (target === 'subkelompok') {
      headers = 'Kode Sub Kelompok (3 Digit),Nama Sub Kelompok';
      sample = '"017","Kamera Pengawas CCTV"\n"018","Genset & Power Backup"';
    }
    const content = `${headers}\n${sample}`;
    downloadCsvFile(content, `Template_Import_${target}.csv`);
  };

  const handleParseImportText = (text: string) => {
    setImportCsvText(text);
    setImportError(null);
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setImportPreview([]);
      return;
    }

    try {
      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());

        if (importTarget === 'locations') {
          if (cols[0] && cols[2]) {
            parsed.push({
              id: `LOC-${Date.now().toString().slice(-4)}${i}`,
              buildingName: cols[0],
              floor: cols[1] || 'Lantai 1',
              roomName: cols[2],
              notes: cols[3] || '',
            });
          }
        } else if (importTarget === 'vendors') {
          if (cols[0]) {
            parsed.push({
              id: `VND-${Date.now().toString().slice(-4)}${i}`,
              name: cols[0],
              serviceCategory: cols[1] || 'Servis Umum',
              phone: cols[2] || '',
              email: cols[3] || '',
              address: cols[4] || '',
              picName: cols[5] || 'PIC Support',
            });
          }
        } else if (importTarget === 'divisions') {
          if (cols[0] && cols[1]) {
            parsed.push({
              code: cols[0].padStart(2, '0').slice(-2),
              name: cols[1],
            });
          }
        } else if (importTarget === 'subkelompok') {
          if (cols[0] && cols[1]) {
            parsed.push({
              code: cols[0].padStart(3, '0').slice(-3),
              name: cols[1],
            });
          }
        }
      }
      setImportPreview(parsed);
    } catch (e: any) {
      setImportError(e.message || 'Gagal memproses file CSV.');
    }
  };

  const handleCommitImport = () => {
    if (importPreview.length === 0) return;
    if (importTarget === 'locations') {
      onImportLocations(importPreview);
    } else if (importTarget === 'vendors') {
      onImportVendors(importPreview);
    } else if (importTarget === 'divisions') {
      onImportDivisions(importPreview);
    } else if (importTarget === 'subkelompok') {
      onImportSubKelompoks(importPreview);
    }
    setImportTarget(null);
    alert(`Berhasil mengimpor ${importPreview.length} data master baru!`);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupPayload = {
      app: 'AsetKantor Enterprise',
      version: '3.1.0',
      exportedAt: new Date().toISOString(),
      companySettings,
      locations,
      vendors,
      customDivisions,
      customSubKelompoks,
      ...allData,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_AsetKantor_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (confirm('Yakin ingin memulihkan seluruh data dari file backup ini? Data saat ini akan diperbarui.')) {
            onRestoreAllData(parsed);
            alert('Data cadangan berhasil dipulihkan!');
          }
        } catch (err: any) {
          alert('Format file JSON backup tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {companySettings.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt="Logo Perusahaan"
              className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1"
            />
          ) : (
            <div className="p-3 bg-slate-900 rounded-xl text-white">
              <Settings className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Master Data & Pengaturan Aplikasi
            </h3>
            <p className="text-xs text-slate-500">
              Kelola logo instansi, hierarki lokasi gedung/lantai, divisi, sub kelompok aset, rekanan vendor, serta impor data CSV
            </p>
          </div>
        </div>

        <button
          onClick={handleExportBackup}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Cadangan (JSON)</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('company')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'company'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil Instansi & Logo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'locations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Gedung, Lantai & Ruang ({locations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('divisions')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'divisions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Master Divisi ({customDivisions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Sub Kelompok Aset ({customSubKelompoks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'vendors'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Rekanan Vendor ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'backup'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Backup & Pulihkan</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. Profil Instansi, Upload Logo & Dokumen Resmi         */}
      {/* ======================================================== */}
      {activeSubTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Logo & Identitas Kop Surat Resmi</h4>
            <p className="text-xs text-slate-500">
              Logo dan identitas ini akan dicetak otomatis di header BAST, Berita Acara Stock Opname (BA-SO), BAPA Penghapusan, serta stiker label QR fisik barang.
            </p>
          </div>

          {/* Logo Upload Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center">
              {companyForm.logoUrl ? (
                <div className="w-24 h-24 rounded-2xl bg-white border-2 border-blue-400 p-1 flex items-center justify-center overflow-hidden shadow-sm relative group">
                  <img
                    src={companyForm.logoUrl}
                    alt="Logo Perusahaan"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute inset-0 bg-rose-900/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-200/80 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                  <Image className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-semibold">Belum Ada Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <h5 className="text-xs font-bold text-slate-800">Unggah File Logo Perusahaan</h5>
              <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
                Mendukung format PNG transparan, JPG, SVG, atau WebP (Disarankan rasio kotak / horizontal proporsional, maks. 2MB).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>

                {companyForm.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Perusahaan / Instansi *
              </label>
              <input
                type="text"
                required
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sub-Judul / Divisi Pengelola *
              </label>
              <input
                type="text"
                required
                value={companyForm.brandSubtitle}
                onChange={(e) => setCompanyForm({ ...companyForm, brandSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Kantor Resmi
              </label>
              <input
                type="text"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Format Penomoran Dokumen & Kode Barang</h4>
            <p className="text-xs text-slate-500 mb-3">
              Kustomisasi awalan nomor surat resmi otomatis dan pemisah segmen kode inventaris.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prefix Surat BAST
                </label>
                <input
                  type="text"
                  value={companyForm.bastNumberPrefix}
                  onChange={(e) => setCompanyForm({ ...companyForm, bastNumberPrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prefix Berita Acara BA-SO
                </label>
                <input
                  type="text"
                  value={companyForm.soNumberPrefix}
                  onChange={(e) => setCompanyForm({ ...companyForm, soNumberPrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prefix Berita Acara BAPA
                </label>
                <input
                  type="text"
                  value={companyForm.bapaNumberPrefix}
                  onChange={(e) => setCompanyForm({ ...companyForm, bapaNumberPrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Separator Kode Barang
                </label>
                <select
                  value={companyForm.assetCodeSeparator}
                  onChange={(e) => setCompanyForm({ ...companyForm, assetCodeSeparator: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                >
                  <option value=".">Titik [ . ] (01.14.001...)</option>
                  <option value="-">Strip [ - ] (01-14-001...)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Logo & Format Dokumen</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. Master Gedung, Lantai & Lokasi Ruangan                 */}
      {/* ======================================================== */}
      {activeSubTab === 'locations' && (
        <div className="space-y-6">
          {/* Action Header: Add, Import, Export */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  Master Hierarki Gedung, Lantai & Ruang
                </h4>
                <p className="text-xs text-slate-500">
                  Daftarkan titik lokasi fisik barang (Gedung &rarr; Lantai/Zona &rarr; Ruangan/Slot).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportLocationsCsv}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImportModal('locations')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import CSV Gedung & Ruang</span>
                </button>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateLocation} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Gedung / Proyek *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Gedung Menara Sentra / Rusunawa"
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lantai / Zona *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Lantai 1, Lantai 2, Basement 1..."
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Ruangan / Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Server Room, Open Space Dev..."
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Titik Lokasi</span>
                </button>
              </div>
            </form>
          </div>

          {/* Locations List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Gedung / Proyek</th>
                    <th className="py-3 px-4">Lantai / Zona</th>
                    <th className="py-3 px-4">Nama Ruangan / Slot</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-4 h-4 text-blue-600 shrink-0" />
                        {loc.buildingName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{loc.floor}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{loc.roomName}</td>
                      <td className="py-3 px-4 text-slate-400 italic text-[11px]">{loc.notes || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingLocation(loc)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Data Lokasi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus lokasi ${loc.roomName} (${loc.floor})?`)) {
                                onDeleteLocation(loc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Lokasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Master Divisi & Unit Kerja                            */}
      {/* ======================================================== */}
      {activeSubTab === 'divisions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-indigo-600" />
                  Master Divisi & Unit Kerja Perusahaan
                </h4>
                <p className="text-xs text-slate-500">
                  Kode divisi 2 digit digunakan pada segmen kedua kode barang [XX].[XX].[XXX].[XXX].[XX].
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDivisionsCsv}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImportModal('divisions')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import CSV Divisi</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDivision} className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="w-28">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode [XX] *
                </label>
                <input
                  type="text"
                  maxLength={2}
                  required
                  placeholder="15"
                  value={newDivCode}
                  onChange={(e) => setNewDivCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Divisi / Unit Usaha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengolahan Limbah / Fasilitas Dermaga..."
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Divisi</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customDivisions.map((div) => (
              <div
                key={div.code}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black bg-blue-50 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                    {div.code}
                  </span>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{div.name}</h5>
                    <span className="text-[10px] text-slate-400">Unit Kerja Aktif</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingDivision({ oldCode: div.code, code: div.code, name: div.name })}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Divisi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus divisi [${div.code}] ${div.name}?`)) {
                        onDeleteDivision(div.code);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Divisi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Master Sub Kelompok Aset                              */}
      {/* ======================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Master Sub Kelompok / Jenis Barang
                </h4>
                <p className="text-xs text-slate-500">
                  Kode sub kelompok 3 digit digunakan pada segmen ketiga kode barang [XX].[XX].[XXX].[XXX].[XX].
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSubKelompoksCsv}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImportModal('subkelompok')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import CSV Sub Kelompok</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubKelompok} className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="w-28">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode [XXX] *
                </label>
                <input
                  type="text"
                  maxLength={3}
                  required
                  placeholder="017"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Sub Kelompok / Jenis Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamera CCTV / Brankas Besi / Genset Diesel..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sub Kelompok</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customSubKelompoks.map((sub) => (
              <div
                key={sub.code}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black bg-amber-50 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300">
                    {sub.code}
                  </span>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{sub.name}</h5>
                    <span className="text-[10px] text-slate-400">Klasifikasi Barang</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingSubKelompok({ oldCode: sub.code, code: sub.code, name: sub.name })}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Sub Kelompok"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus sub kelompok [${sub.code}] ${sub.name}?`)) {
                        onDeleteSubKelompok(sub.code);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Sub Kelompok"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Master Vendor & Rekanan Servis                        */}
      {/* ======================================================== */}
      {activeSubTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  Master Rekanan Vendor & Bengkel Servis
                </h4>
                <p className="text-xs text-slate-500">
                  Rekanan yang terdaftar dapat dipilih langsung pada saat pencatatan jadwal pemeliharaan dan servis aset.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportVendorsCsv}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenImportModal('vendors')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import CSV Vendor</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateVendor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Vendor / Bengkel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="PT Samafitro / Auto2000..."
                  value={newVndName}
                  onChange={(e) => setNewVndName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Servis
                </label>
                <input
                  type="text"
                  placeholder="Servis Mesin Fotokopi / IT..."
                  value={newVndCat}
                  onChange={(e) => setNewVndCat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Telepon / Hotline
                </label>
                <input
                  type="text"
                  placeholder="021-..."
                  value={newVndPhone}
                  onChange={(e) => setNewVndPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Vendor</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {v.serviceCategory}
                  </span>
                  <h5 className="font-bold text-sm text-slate-900">{v.name}</h5>
                  <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.phone || '-'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.email || '-'}</span>
                    </p>
                    {v.address && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{v.address}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      PIC: <strong>{v.picName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingVendor(v)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Rekanan Vendor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus vendor ${v.name}?`)) {
                        onDeleteVendor(v.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Rekanan Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Cadangan & Pemulihan Database (Backup & Restore)      */}
      {/* ======================================================== */}
      {activeSubTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-bold text-slate-900">Manajemen Cadangan & Pemulihan Sistem</h4>
            <p className="text-xs text-slate-500">
              Jaga keamanan database aset kantor Anda dengan mengunduh snapshot cadangan secara berkala.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Export Card */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-3 bg-blue-100 text-blue-700 w-fit rounded-xl mb-3">
                  <Download className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-sm text-slate-900">Ekspor File Cadangan (JSON)</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mengunduh seluruh master data, inventaris aset, logo, transaksi mutasi, pemeliharaan servis, hasil stock opname, dan pengaturan ke file JSON terenkripsi.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Lengkap</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-3 bg-emerald-100 text-emerald-700 w-fit rounded-xl mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-sm text-slate-900">Pulihkan dari File Cadangan (Restore)</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pulihkan seluruh data inventaris dan pengaturan dari file JSON cadangan yang telah dibuat sebelumnya.
                </p>
              </div>

              <div>
                <label className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Backup (.JSON)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT GEDUNG & LOKASI                              */}
      {/* ======================================================== */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Edit Data Lokasi Ruangan
              </h4>
              <button onClick={() => setEditingLocation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Gedung / Proyek *</label>
                <input
                  type="text"
                  required
                  value={editingLocation.buildingName}
                  onChange={(e) => setEditingLocation({ ...editingLocation, buildingName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lantai / Zona *</label>
                <input
                  type="text"
                  required
                  value={editingLocation.floor}
                  onChange={(e) => setEditingLocation({ ...editingLocation, floor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Ruangan / Area *</label>
                <input
                  type="text"
                  required
                  value={editingLocation.roomName}
                  onChange={(e) => setEditingLocation({ ...editingLocation, roomName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editingLocation.notes || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT VENDOR                                       */}
      {/* ======================================================== */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Edit Data Rekanan Vendor
              </h4>
              <button onClick={() => setEditingVendor(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Vendor / Bengkel *</label>
                <input
                  type="text"
                  required
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Servis *</label>
                <input
                  type="text"
                  required
                  value={editingVendor.serviceCategory}
                  onChange={(e) => setEditingVendor({ ...editingVendor, serviceCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon</label>
                  <input
                    type="text"
                    value={editingVendor.phone}
                    onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingVendor.email || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kantor / Bengkel</label>
                <input
                  type="text"
                  value={editingVendor.address || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama PIC Vendor</label>
                <input
                  type="text"
                  value={editingVendor.picName}
                  onChange={(e) => setEditingVendor({ ...editingVendor, picName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT DIVISI                                       */}
      {/* ======================================================== */}
      {editingDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Edit Data Divisi
              </h4>
              <button onClick={() => setEditingDivision(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDivision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Divisi [XX] *</label>
                <input
                  type="text"
                  maxLength={2}
                  required
                  value={editingDivision.code}
                  onChange={(e) => setEditingDivision({ ...editingDivision, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Divisi / Unit Kerja *</label>
                <input
                  type="text"
                  required
                  value={editingDivision.name}
                  onChange={(e) => setEditingDivision({ ...editingDivision, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDivision(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SUB KELOMPOK                                 */}
      {/* ======================================================== */}
      {editingSubKelompok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Edit Sub Kelompok Aset
              </h4>
              <button onClick={() => setEditingSubKelompok(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubKelompok} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Sub Kelompok [XXX] *</label>
                <input
                  type="text"
                  maxLength={3}
                  required
                  value={editingSubKelompok.code}
                  onChange={(e) => setEditingSubKelompok({ ...editingSubKelompok, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sub Kelompok / Jenis *</label>
                <input
                  type="text"
                  required
                  value={editingSubKelompok.name}
                  onChange={(e) => setEditingSubKelompok({ ...editingSubKelompok, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubKelompok(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CSV IMPORT DEDICATED FOR EACH MASTER              */}
      {/* ======================================================== */}
      {importTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Import Data CSV Master:{' '}
                {importTarget === 'locations'
                  ? 'Gedung, Lantai & Ruang'
                  : importTarget === 'vendors'
                  ? 'Rekanan Vendor'
                  : importTarget === 'divisions'
                  ? 'Divisi Perusahaan'
                  : 'Sub Kelompok Aset'}
              </h4>
              <button onClick={() => setImportTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-emerald-950">Unduh Format Template CSV</h5>
                  <p className="text-[11px] text-emerald-800">Gunakan file template ini untuk mengisi data massal.</p>
                </div>
                <button
                  onClick={() => handleDownloadImportTemplate(importTarget)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload File .CSV atau Tempel Teks CSV:
                </label>
                <textarea
                  rows={4}
                  placeholder="Tempel baris CSV di sini atau pilih file di bawah..."
                  value={importCsvText}
                  onChange={(e) => handleParseImportText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                ></textarea>
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const txt = event.target?.result as string;
                        if (txt) handleParseImportText(txt);
                      };
                      reader.readAsText(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Pratinjau Data Siap Impor ({importPreview.length} Baris):
                  </span>
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          {importTarget === 'locations' && (
                            <>
                              <th className="p-2">Gedung</th>
                              <th className="p-2">Lantai</th>
                              <th className="p-2">Ruangan</th>
                              <th className="p-2">Catatan</th>
                            </>
                          )}
                          {importTarget === 'vendors' && (
                            <>
                              <th className="p-2">Nama</th>
                              <th className="p-2">Kategori</th>
                              <th className="p-2">Telepon</th>
                              <th className="p-2">PIC</th>
                            </>
                          )}
                          {importTarget === 'divisions' && (
                            <>
                              <th className="p-2">Kode</th>
                              <th className="p-2">Nama Divisi</th>
                            </>
                          )}
                          {importTarget === 'subkelompok' && (
                            <>
                              <th className="p-2">Kode</th>
                              <th className="p-2">Nama Sub Kelompok</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                            {importTarget === 'locations' && (
                              <>
                                <td className="p-2 font-bold">{item.buildingName}</td>
                                <td className="p-2">{item.floor}</td>
                                <td className="p-2">{item.roomName}</td>
                                <td className="p-2 text-slate-400">{item.notes}</td>
                              </>
                            )}
                            {importTarget === 'vendors' && (
                              <>
                                <td className="p-2 font-bold">{item.name}</td>
                                <td className="p-2">{item.serviceCategory}</td>
                                <td className="p-2">{item.phone}</td>
                                <td className="p-2">{item.picName}</td>
                              </>
                            )}
                            {importTarget === 'divisions' && (
                              <>
                                <td className="p-2 font-mono font-bold text-blue-900">{item.code}</td>
                                <td className="p-2 font-semibold">{item.name}</td>
                              </>
                            )}
                            {importTarget === 'subkelompok' && (
                              <>
                                <td className="p-2 font-mono font-bold text-amber-950">{item.code}</td>
                                <td className="p-2 font-semibold">{item.name}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportTarget(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importPreview.length === 0}
                  onClick={handleCommitImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  Simpan & Impor {importPreview.length} Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
