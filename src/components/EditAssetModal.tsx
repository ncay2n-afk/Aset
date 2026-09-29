import React, { useState } from 'react';
import { X, Save, Trash2, AlertTriangle, CheckCircle2, Layers, Info } from 'lucide-react';
import { OfficeAsset, AssetCategory, AssetCondition, AssetStatus, MasterBuildingLocation } from '../types';
import { parseAssetCode } from '../data/assetCodeGenerator';
import { CurrencyInput } from './CurrencyInput';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: OfficeAsset | null;
  onSaveAsset: (updatedAsset: OfficeAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  registeredLocations?: MasterBuildingLocation[];
}

const CATEGORIES: AssetCategory[] = [
  'IT & Elektronik',
  'Furnitur & Meja',
  'Peralatan Presentasi',
  'Kendaraan Operasional',
  'Perangkat Jaringan',
  'ATK & Suplai Kantor',
];

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onSaveAsset,
  onDeleteAsset,
  registeredLocations = [],
}) => {
  if (!isOpen || !asset) return null;

  const [id, setId] = useState(asset.id);
  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState<AssetCategory>(asset.category);
  const [sku, setSku] = useState(asset.sku);
  const [totalStock, setTotalStock] = useState<number>(asset.totalStock);
  const [availableStock, setAvailableStock] = useState<number>(asset.availableStock);
  const [location, setLocation] = useState(asset.location);
  const [condition, setCondition] = useState<AssetCondition>(asset.condition);
  const [status, setStatus] = useState<AssetStatus>(asset.status);
  const [custodian, setCustodian] = useState(asset.custodian);
  const [purchasePrice, setPurchasePrice] = useState<number>(asset.purchasePrice);
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate);
  const [notes, setNotes] = useState(asset.notes);

  const parsed = parseAssetCode(id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: OfficeAsset = {
      ...asset,
      id: id.trim(),
      name: name.trim(),
      category,
      sku: sku.trim(),
      totalStock,
      availableStock: Math.min(availableStock, totalStock),
      location: location.trim(),
      condition,
      status,
      custodian: custodian.trim(),
      purchasePrice,
      purchaseDate,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAsset(updated);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Yakin ingin menghapus aset "${asset.name}" (${asset.id}) dari database?`)) {
      onDeleteAsset(asset.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Edit Detail Aset</h3>
            <p className="text-xs text-slate-400 font-mono">Kode Aset: {asset.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Kode Resep Info Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase">
                Kode Barang Standar [XX].[XX].[XXX].[XXX].[XX]
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Resep Kode Aktif</span>
            </div>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-black text-slate-900 tracking-wider"
            />
            {parsed.isValid && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] text-slate-600 pt-1">
                <div>Bidang: <strong>[{parsed.bidang}] {parsed.bidangName.slice(0, 15)}...</strong></div>
                <div>Divisi: <strong>[{parsed.divisi}] {parsed.divisiName}</strong></div>
                <div>Sub: <strong>[{parsed.subKelompok}] {parsed.subKelompokName}</strong></div>
                <div>Urut: <strong>[{parsed.urutan}] Tahun: '{parsed.tahun}</strong></div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aset *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode / SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Stok
              </label>
              <input
                type="number"
                min="0"
                value={totalStock}
                onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stok Tersedia
              </label>
              <input
                type="number"
                min="0"
                value={availableStock}
                onChange={(e) => setAvailableStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Fisik
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AssetCondition)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Lokasi Penempatan
                </label>
                {registeredLocations.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {registeredLocations.length} titik master
                  </span>
                )}
              </div>
              <input
                type="text"
                list="edit-registered-locations-list"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <datalist id="edit-registered-locations-list">
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
                value={custodian}
                onChange={(e) => setCustodian(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Perolehan
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Spesifikasi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            ></textarea>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Aset</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
