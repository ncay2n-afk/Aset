import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRightLeft,
  Image as ImageIcon,
  ExternalLink,
  MapPin,
  Tag,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
  Wrench,
  XCircle,
  Eye,
  Shield,
  FileSpreadsheet,
  QrCode,
  Calculator,
  Edit2,
  X,
  Calendar,
  User,
  DollarSign,
  Building,
  Sparkles
} from 'lucide-react';
import { OfficeAsset, AssetCategory, AssetStatus, AssetCondition } from '../types';
import { parseAssetCode } from '../data/assetCodeGenerator';
import { formatRupiah } from '../utils/currencyFormatter';

interface AssetListProps {
  assets: OfficeAsset[];
  onOpenTransactionModal: (asset?: OfficeAsset) => void;
  onOpenAddAssetModal: () => void;
  onViewPhoto: (photoUrl: string, title: string) => void;
  onOpenLabelModal: (asset: OfficeAsset) => void;
  onOpenDepreciationModal: (asset: OfficeAsset) => void;
  onOpenEditModal: (asset: OfficeAsset) => void;
  selectedStatusFilter: string | null;
  onClearStatusFilter: () => void;
}

const CATEGORIES: AssetCategory[] = [
  'IT & Elektronik',
  'Furnitur & Meja',
  'Peralatan Presentasi',
  'Kendaraan Operasional',
  'Perangkat Jaringan',
  'ATK & Suplai Kantor',
];

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  onOpenTransactionModal,
  onOpenAddAssetModal,
  onViewPhoto,
  onOpenLabelModal,
  onOpenDepreciationModal,
  onOpenEditModal,
  selectedStatusFilter,
  onClearStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<OfficeAsset | null>(null);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.custodian.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchesCategory =
        selectedCategory === 'ALL' || asset.category === selectedCategory;

      // Condition
      const matchesCondition =
        selectedCondition === 'ALL' || asset.condition === selectedCondition;

      // Status
      let matchesStatus = true;
      if (selectedStatusFilter) {
        if (selectedStatusFilter === 'Stok Kritis') {
          matchesStatus = asset.availableStock <= 1;
        } else {
          matchesStatus = asset.status === selectedStatusFilter;
        }
      }

      return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
    });
  }, [assets, searchQuery, selectedCategory, selectedCondition, selectedStatusFilter]);

  const getStatusBadge = (status: AssetStatus, availableStock: number) => {
    if (availableStock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Stok Habis
        </span>
      );
    }
    if (availableStock <= 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Stok Kritis
        </span>
      );
    }

    switch (status) {
      case 'Tersedia':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Tersedia ({availableStock})
          </span>
        );
      case 'Sedang Dipinjam':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
            Sebagian Dipinjam
          </span>
        );
      case 'Dalam Perbaikan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Wrench className="w-3 h-3 text-purple-600" />
            Dalam Servis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getConditionBadge = (condition: AssetCondition) => {
    switch (condition) {
      case 'Baik':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-100/70 text-emerald-800">
            Baik
          </span>
        );
      case 'Perlu Perbaikan':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100/70 text-amber-800">
            Perlu Perbaikan
          </span>
        );
      case 'Rusak Ringan':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-100/70 text-orange-800">
            Rusak Ringan
          </span>
        );
      case 'Rusak Berat':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-100/70 text-rose-800">
            Rusak Berat
          </span>
        );
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter Bar, and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aset (nama, kode AST, SKU, lokasi, PIC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="Baik">Kondisi: Baik</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Tabel
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition ${
                viewMode === 'cards' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Kartu
            </button>
          </div>

          {/* Add Asset Button */}
          <button
            onClick={onOpenAddAssetModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Aset</span>
          </button>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(selectedStatusFilter || selectedCategory !== 'ALL' || selectedCondition !== 'ALL' || searchQuery) && (
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
          <span className="font-semibold text-slate-500">Filter Aktif:</span>
          {selectedStatusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Status: {selectedStatusFilter}
              <button onClick={onClearStatusFilter} className="hover:text-blue-900 font-bold ml-1">
                ×
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Kategori: {selectedCategory}
              <button onClick={() => setSelectedCategory('ALL')} className="hover:text-slate-900 font-bold ml-1">
                ×
              </button>
            </span>
          )}
          {selectedCondition !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Kondisi: {selectedCondition}
              <button onClick={() => setSelectedCondition('ALL')} className="hover:text-slate-900 font-bold ml-1">
                ×
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              Pencarian: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 font-bold ml-1">
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              onClearStatusFilter();
              setSelectedCategory('ALL');
              setSelectedCondition('ALL');
              setSearchQuery('');
            }}
            className="text-blue-600 hover:underline text-xs ml-2 cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Main Content: Table or Cards View */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Tidak ada aset kantor ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau reset filter untuk menampilkan semua inventaris kantor.
          </p>
          <button
            onClick={() => {
              onClearStatusFilter();
              setSelectedCategory('ALL');
              setSelectedCondition('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Tampilkan Semua Aset
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Aset & Kode</th>
                  <th className="py-3 px-4">Kategori & Lokasi</th>
                  <th className="py-3 px-4">Stok Inventaris</th>
                  <th className="py-3 px-4">Kondisi & Status</th>
                  <th className="py-3 px-4">Nilai Perolehan</th>
                  <th className="py-3 px-4">Foto Kondisi (Drive)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition group">
                    {/* Aset & Kode */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {asset.lastPhotoUrl ? (
                          <div
                            onClick={() => onViewPhoto(asset.lastPhotoUrl!, `Foto Kondisi: ${asset.name}`)}
                            className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer group-hover:ring-2 group-hover:ring-blue-500/30 transition relative"
                          >
                            <img
                              src={asset.lastPhotoUrl}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p
                            onClick={() => setSelectedAssetDetail(asset)}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer"
                          >
                            {asset.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-medium">
                              {asset.id}
                            </span>
                            <span>• SKU: {asset.sku}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kategori & Lokasi */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="inline-block font-medium text-slate-800">
                          {asset.category}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{asset.location}</span>
                        </div>
                      </div>
                    </td>

                    {/* Stok Inventaris */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {asset.availableStock}{' '}
                            <span className="text-[11px] font-normal text-slate-500">
                              / {asset.totalStock} {asset.unit}
                            </span>
                          </span>
                        </div>
                        {/* Progress Bar of Stock */}
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden flex">
                          <div
                            style={{
                              width: `${(asset.availableStock / Math.max(asset.totalStock, 1)) * 100}%`,
                            }}
                            className="bg-emerald-500 h-full"
                            title={`Tersedia: ${asset.availableStock}`}
                          ></div>
                          <div
                            style={{
                              width: `${(asset.borrowedStock / Math.max(asset.totalStock, 1)) * 100}%`,
                            }}
                            className="bg-blue-500 h-full"
                            title={`Dipinjam: ${asset.borrowedStock}`}
                          ></div>
                          <div
                            style={{
                              width: `${(asset.damagedStock / Math.max(asset.totalStock, 1)) * 100}%`,
                            }}
                            className="bg-rose-500 h-full"
                            title={`Rusak: ${asset.damagedStock}`}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Dipinjam: {asset.borrowedStock} | Rusak: {asset.damagedStock}
                        </div>
                      </div>
                    </td>

                    {/* Kondisi & Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(asset.status, asset.availableStock)}</div>
                        <div>{getConditionBadge(asset.condition)}</div>
                      </div>
                    </td>

                    {/* Nilai Perolehan */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {formatIDR(asset.purchasePrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        PIC: {asset.custodian}
                      </div>
                    </td>

                    {/* Foto Kondisi & Google Drive Link */}
                    <td className="py-3.5 px-4">
                      {asset.lastPhotoUrl ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={asset.lastPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Foto Drive</span>
                          </a>
                          <span className="text-[10px] text-slate-400">
                            {asset.lastPhotoDate || 'Terverifikasi'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ada foto</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAssetDetail(asset)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Lihat Detail Lengkap Aset"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </button>

                        <button
                          onClick={() => onOpenLabelModal(asset)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Cetak Label Stiker & QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-700" />
                        </button>

                        <button
                          onClick={() => onOpenDepreciationModal(asset)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Kalkulator Penyusutan / Depresiasi Aset"
                        >
                          <Calculator className="w-3.5 h-3.5 text-blue-600" />
                        </button>

                        <button
                          onClick={() => onOpenEditModal(asset)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Edit Detail Aset"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <button
                          onClick={() => onOpenTransactionModal(asset)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          title="Catat Peminjaman, Pengembalian, atau Mutasi Aset"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Mutasi / Pinjam</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS / GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Image Header */}
                <div className="h-40 bg-slate-100 relative group overflow-hidden border-b border-slate-100">
                  {asset.lastPhotoUrl ? (
                    <img
                      src={asset.lastPhotoUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Belum ada foto fisik</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <span className="font-mono text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                      {asset.id}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {getStatusBadge(asset.status, asset.availableStock)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                      {asset.category}
                    </span>
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 mt-0.5">
                      {asset.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </p>
                  </div>

                  {/* Stock Bar */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500">Stok Tersedia:</span>
                      <span className="font-bold text-slate-900">
                        {asset.availableStock} / {asset.totalStock} {asset.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${(asset.availableStock / Math.max(asset.totalStock, 1)) * 100}%`,
                        }}
                        className="bg-emerald-500 h-full"
                      ></div>
                      <div
                        style={{
                          width: `${(asset.borrowedStock / Math.max(asset.totalStock, 1)) * 100}%`,
                        }}
                        className="bg-blue-500 h-full"
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>Dipinjam: {asset.borrowedStock}</span>
                      <span>Kondisi: {asset.condition}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {formatIDR(asset.purchasePrice)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedAssetDetail(asset)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg transition"
                    title="Lihat Detail Aset"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenLabelModal(asset)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
                    title="Cetak Label QR"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenDepreciationModal(asset)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg transition"
                    title="Kalkulator Depresiasi"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenEditModal(asset)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition"
                    title="Edit Detail Aset"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenTransactionModal(asset)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Pinjam</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                      {selectedAssetDetail.id}
                    </span>
                    <span className="text-xs text-slate-400">SKU: {selectedAssetDetail.sku}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedAssetDetail.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssetDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Resep Kode Barang breakdown */}
              {(() => {
                const parsed = parseAssetCode(selectedAssetDetail.id);
                if (!parsed.isValid) return null;
                return (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900">
                    <span className="font-bold block mb-1 text-[11px] uppercase tracking-wider">
                      Resep Kode Inventaris Resmi:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-700">
                      <div>Bidang [{parsed.bidang}]: <strong className="block text-slate-900">{parsed.bidangName}</strong></div>
                      <div>Divisi [{parsed.divisi}]: <strong className="block text-slate-900">{parsed.divisiName}</strong></div>
                      <div>Sub Kelompok [{parsed.subKelompok}]: <strong className="block text-slate-900">{parsed.subKelompokName}</strong></div>
                      <div>No Urutan: <strong className="block text-slate-900">{parsed.urutan}</strong></div>
                      <div>Tahun: <strong className="block text-slate-900">20{parsed.tahun}</strong></div>
                    </div>
                  </div>
                );
              })()}

              {/* Photo & Core Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Photo Preview */}
                <div className="sm:col-span-1">
                  <div className="w-full h-44 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative group flex items-center justify-center">
                    {selectedAssetDetail.lastPhotoUrl ? (
                      <>
                        <img
                          src={selectedAssetDetail.lastPhotoUrl}
                          alt={selectedAssetDetail.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onViewPhoto(selectedAssetDetail.lastPhotoUrl!, `Foto Kondisi: ${selectedAssetDetail.name}`)}
                          className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 font-semibold text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Perbesar Foto</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">Belum ada foto fisik</span>
                      </div>
                    )}
                  </div>
                  {selectedAssetDetail.lastPhotoUrl && (
                    <a
                      href={selectedAssetDetail.lastPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-[11px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka di Google Drive</span>
                    </a>
                  )}
                </div>

                {/* Details Column */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Status Inventaris</span>
                      <div className="mt-1">
                        {getStatusBadge(selectedAssetDetail.status, selectedAssetDetail.availableStock)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Kondisi Fisik</span>
                      <div className="mt-1">
                        {getConditionBadge(selectedAssetDetail.condition)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Stok & Satuan</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedAssetDetail.availableStock} / {selectedAssetDetail.totalStock} {selectedAssetDetail.unit}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Dipinjam: {selectedAssetDetail.borrowedStock} | Rusak: {selectedAssetDetail.damagedStock}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Harga Perolehan</span>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {formatRupiah(selectedAssetDetail.purchasePrice)}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Tgl Beli: {selectedAssetDetail.purchaseDate}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Lokasi: <strong>{selectedAssetDetail.location}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>PIC Penanggung Jawab: <strong>{selectedAssetDetail.custodian}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Kategori Barang: <strong>{selectedAssetDetail.category}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssetDetail(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
              >
                Tutup
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const a = selectedAssetDetail;
                    setSelectedAssetDetail(null);
                    onOpenLabelModal(a);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Cetak Label QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const a = selectedAssetDetail;
                    setSelectedAssetDetail(null);
                    onOpenDepreciationModal(a);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Kalkulator Depresiasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const a = selectedAssetDetail;
                    setSelectedAssetDetail(null);
                    onOpenEditModal(a);
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const a = selectedAssetDetail;
                    setSelectedAssetDetail(null);
                    onOpenTransactionModal(a);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Mutasi / Pinjam</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
