import React, { useState, useEffect } from 'react';
import { X, Plus, Camera, Layers, CheckCircle2, AlertTriangle, Loader2, Sparkles, Hash } from 'lucide-react';
import { OfficeAsset, AssetCategory, AssetCondition, MasterBuildingLocation } from '../types';
import { uploadConditionPhotoToDrive } from '../services/driveService';
import { appendRow, assetToRow } from '../services/sheetsService';
import { CurrencyInput } from './CurrencyInput';
import {
  KODE_BIDANG_LIST,
  KODE_DIVISI_LIST,
  KODE_SUB_KELOMPOK_LIST,
  formatAssetCode,
  CodeItem
} from '../data/assetCodeGenerator';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  spreadsheetId: string | null;
  onAssetAdded: (newAsset: OfficeAsset) => void;
  existingCount: number;
  registeredLocations?: MasterBuildingLocation[];
  customDivisions?: CodeItem[];
  customSubKelompoks?: CodeItem[];
}

const CATEGORIES: AssetCategory[] = [
  'IT & Elektronik',
  'Furnitur & Meja',
  'Peralatan Presentasi',
  'Kendaraan Operasional',
  'Perangkat Jaringan',
  'ATK & Suplai Kantor',
];

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  token,
  spreadsheetId,
  onAssetAdded,
  existingCount,
  registeredLocations = [],
  customDivisions,
  customSubKelompoks,
}) => {
  const activeDivisions = customDivisions && customDivisions.length > 0 ? customDivisions : KODE_DIVISI_LIST;
  const activeSubKelompoks = customSubKelompoks && customSubKelompoks.length > 0 ? customSubKelompoks : KODE_SUB_KELOMPOK_LIST;

  // Resep Kode Barang State (According to user specification)
  const [kodeBidang, setKodeBidang] = useState('01'); // 01: Barang Bergerak Elektronik
  const [kodeDivisi, setKodeDivisi] = useState(activeDivisions[0]?.code || '14');
  const [kodeSubKelompok, setKodeSubKelompok] = useState(activeSubKelompoks[0]?.code || '001');
  const [kodeUrutan, setKodeUrutan] = useState(String(existingCount + 1).padStart(3, '0'));
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Derived Year (2 digit)
  const tahunPembelianDuaDigit = purchaseDate ? purchaseDate.slice(2, 4) : '26';

  // Generated Asset Code
  const generatedAssetCode = formatAssetCode(
    kodeBidang,
    kodeDivisi,
    kodeSubKelompok,
    kodeUrutan,
    tahunPembelianDuaDigit
  );

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('IT & Elektronik');
  const [sku, setSku] = useState(`SKU-${Date.now().toString().slice(-5)}`);
  const [totalStock, setTotalStock] = useState<number>(1);
  const [unit, setUnit] = useState('Unit');
  const [location, setLocation] = useState('Head Office Lt. 2');
  const [condition, setCondition] = useState<AssetCondition>('Baik');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [custodian, setCustodian] = useState('');
  const [notes, setNotes] = useState('');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync sub-kelompok selection to suggested name or category
  useEffect(() => {
    const sub = KODE_SUB_KELOMPOK_LIST.find((s) => s.code === kodeSubKelompok);
    if (sub) {
      if (['001', '002', '003', '004', '005', '006', '007', '008', '010', '011'].includes(kodeSubKelompok)) {
        setKodeBidang('01'); // Bergerak Elektronik
      }
      if (['013', '014'].includes(kodeSubKelompok)) {
        setKodeBidang('04'); // Bergerak Non Elektronik
        setCategory('Furnitur & Meja');
      }
      if (['015', '016'].includes(kodeSubKelompok)) {
        setKodeBidang('04');
        setCategory('Kendaraan Operasional');
      }
    }
  }, [kodeSubKelompok]);

  // Sync Divisi to default location
  useEffect(() => {
    const div = KODE_DIVISI_LIST.find((d) => d.code === kodeDivisi);
    if (div) {
      setLocation(`Ruang ${div.name}`);
    }
  }, [kodeDivisi]);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama aset wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const autoId = generatedAssetCode;
      const todayStr = new Date().toISOString().split('T')[0];

      let uploadedPhotoUrl = photoPreview || '';

      if (photoFile && token) {
        try {
          const driveResult = await uploadConditionPhotoToDrive(
            token,
            photoFile,
            `INITIAL_${autoId.replace(/\./g, '_')}_${todayStr}.jpg`,
            autoId,
            todayStr
          );
          uploadedPhotoUrl = driveResult.webViewLink;
        } catch (driveErr) {
          console.warn('Drive upload error for initial asset photo:', driveErr);
        }
      }

      const newAsset: OfficeAsset = {
        id: autoId,
        name: name.trim(),
        category,
        sku: sku.trim(),
        totalStock: Math.max(1, totalStock),
        availableStock: Math.max(1, totalStock),
        borrowedStock: 0,
        damagedStock: 0,
        unit,
        location: location.trim(),
        condition,
        status: 'Tersedia',
        purchaseDate,
        purchasePrice,
        custodian: custodian.trim() || 'General Affairs',
        lastPhotoUrl: uploadedPhotoUrl,
        lastPhotoDate: todayStr,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (token && spreadsheetId) {
        try {
          const rowData = assetToRow(newAsset);
          await appendRow(token, spreadsheetId, 'Daftar_Aset', rowData);
        } catch (sheetErr) {
          console.warn('Google Sheets append error:', sheetErr);
        }
      }

      onAssetAdded(newAsset);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menambahkan aset baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Tambah Aset Baru</h3>
              <p className="text-xs text-slate-400">
                Resep Pembuatan Kode Barang Standar [XX].[XX].[XXX].[XXX].[XX]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* RESEP PEMBUATAN KODE BARANG COMPONENT (EXACT REPLICA)    */}
          {/* ======================================================== */}
          <div className="border-2 border-amber-300 bg-amber-50/40 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-amber-400 text-slate-900 text-center font-black text-xs uppercase tracking-wider py-1.5 border-b border-amber-300">
              RESEP PEMBUATAN KODE BARANG
            </div>

            {/* Visual Formula Header */}
            <div className="grid grid-cols-5 text-center divide-x divide-amber-200 border-b border-amber-200 bg-white">
              <div className="p-2">
                <span className="font-mono text-base font-black text-slate-900">{kodeBidang}</span>
                <span className="block text-[10px] font-bold text-amber-900 uppercase mt-0.5">
                  Kode Bidang
                </span>
              </div>
              <div className="p-2">
                <span className="font-mono text-base font-black text-slate-900">{kodeDivisi}</span>
                <span className="block text-[10px] font-bold text-amber-900 uppercase mt-0.5">
                  Kode Divisi
                </span>
              </div>
              <div className="p-2">
                <span className="font-mono text-base font-black text-slate-900">{kodeSubKelompok}</span>
                <span className="block text-[10px] font-bold text-amber-900 uppercase mt-0.5">
                  Kode Sub Kelompok
                </span>
              </div>
              <div className="p-2">
                <span className="font-mono text-base font-black text-slate-900">{kodeUrutan}</span>
                <span className="block text-[10px] font-bold text-amber-900 uppercase mt-0.5">
                  Kode Urutan Barang
                </span>
              </div>
              <div className="p-2">
                <span className="font-mono text-base font-black text-slate-900">{tahunPembelianDuaDigit}</span>
                <span className="block text-[10px] font-bold text-amber-900 uppercase mt-0.5">
                  Tahun Pembelian
                </span>
              </div>
            </div>

            {/* Generated Code Result Ribbon */}
            <div className="p-3 bg-amber-100/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">Kode Barang Terbentuk:</span>
              <div className="font-mono text-sm sm:text-base font-black text-blue-900 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-2xs tracking-widest">
                {generatedAssetCode}
              </div>
            </div>

            {/* Selectors for the 5 parameters */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white text-xs">
              {/* 1. Bidang */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Kode Bidang [XX]
                </label>
                <select
                  value={kodeBidang}
                  onChange={(e) => setKodeBidang(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {KODE_BIDANG_LIST.map((b) => (
                    <option key={b.code} value={b.code}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Divisi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Kode Divisi [XX]
                </label>
                <select
                  value={kodeDivisi}
                  onChange={(e) => setKodeDivisi(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {activeDivisions.map((d) => (
                    <option key={d.code} value={d.code}>
                      [{d.code}] {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Sub Kelompok */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. Kode Sub Kelompok [XXX]
                </label>
                <select
                  value={kodeSubKelompok}
                  onChange={(e) => setKodeSubKelompok(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  {activeSubKelompoks.map((s) => (
                    <option key={s.code} value={s.code}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Nomor Urut Barang */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  4. Urutan Barang [XXX]
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={kodeUrutan}
                  onChange={(e) => setKodeUrutan(e.target.value.padStart(3, '0').slice(-3))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              {/* 5. Tanggal Pembelian (menentukan 2 digit tahun) */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  5. Tanggal Pembelian (Tahun [XX]: {tahunPembelianDuaDigit})
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Detail Informasi Aset */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Aset / Merk & Tipe *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: MacBook Pro 16 M3 / Monitor Dell 27 / Ac Daikin 1.5 PK"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Aset *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Barcode / Serial Number (SKU)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Stok Awal *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={totalStock}
                  onChange={(e) => setTotalStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Barang
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Unit">Unit</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Set">Set</option>
                  <option value="Buah">Buah</option>
                  <option value="Paket">Paket</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kondisi Fisik
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Lokasi Penempatan
                  </label>
                  {registeredLocations.length > 0 && (
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {registeredLocations.length} titik master tersedia
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  list="registered-locations-list"
                  placeholder="Pilih dari master atau ketik lokasi..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <datalist id="registered-locations-list">
                  {registeredLocations.map((loc) => (
                    <option
                      key={loc.id}
                      value={`${loc.buildingName} - ${loc.floor} (${loc.roomName})`}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIC Penanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso (IT Lead)"
                  value={custodian}
                  onChange={(e) => setCustodian(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Perolehan (IDR)
                </label>
                <CurrencyInput
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  placeholder="0"
                />
              </div>

              {/* Initial Condition Photo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Fisik Aset (Tersimpan ke Google Drive)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan & Spesifikasi Teknis
              </label>
              <textarea
                rows={2}
                placeholder="Nomor seri pabrik, spesifikasi RAM/SSD, kelengkapan aksesoris, masa garansi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              ></textarea>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Aset ({generatedAssetCode})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
