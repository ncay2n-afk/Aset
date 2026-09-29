import React, { useState, useEffect } from 'react';
import { X, Calculator, TrendingDown, DollarSign, Calendar, Info, RefreshCw } from 'lucide-react';
import { OfficeAsset } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { formatRupiah } from '../utils/currencyFormatter';

interface DepreciationCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: OfficeAsset | null;
}

export const DepreciationCalculatorModal: React.FC<DepreciationCalculatorModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  if (!isOpen || !asset) return null;

  // Default useful life by category
  const getDefaultUsefulLife = (category: string) => {
    switch (category) {
      case 'IT & Elektronik':
        return 4; // 4 tahun
      case 'Furnitur & Meja':
        return 8; // 8 tahun
      case 'Kendaraan Operasional':
        return 5; // 5 tahun
      case 'Perangkat Jaringan':
        return 5; // 5 tahun
      default:
        return 4;
    }
  };

  const [purchasePrice, setPurchasePrice] = useState<number>(asset.purchasePrice || 0);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(
    asset.usefulLifeYears || getDefaultUsefulLife(asset.category)
  );
  const [residualValuePercent, setResidualValuePercent] = useState<number>(10); // 10% residual value

  useEffect(() => {
    if (asset) {
      setPurchasePrice(asset.purchasePrice || 0);
      setUsefulLifeYears(asset.usefulLifeYears || getDefaultUsefulLife(asset.category));
    }
  }, [asset]);

  const residualValue = Math.round((purchasePrice * residualValuePercent) / 100);
  const depreciableAmount = Math.max(0, purchasePrice - residualValue);

  // Calculate age in months
  const purchaseDate = new Date(asset.purchaseDate || '2024-01-01');
  const now = new Date();
  const diffMonths = Math.max(
    0,
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth())
  );

  const totalUsefulMonths = Math.max(1, usefulLifeYears * 12);
  const monthlyDepreciation = depreciableAmount / totalUsefulMonths;
  const annualDepreciation = monthlyDepreciation * 12;

  const effectiveMonths = Math.min(diffMonths, totalUsefulMonths);
  const accumulatedDepreciation = Math.round(effectiveMonths * monthlyDepreciation);
  const currentBookValue = Math.max(residualValue, purchasePrice - accumulatedDepreciation);
  const depreciationProgress = Math.min(100, Math.round((effectiveMonths / totalUsefulMonths) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Kalkulator Penyusutan / Depresiasi Aset</h3>
              <p className="text-xs text-slate-400">
                Metode Garis Lurus (Straight-Line Accounting Method)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Asset Info Header */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                {asset.id}
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">{asset.name}</h4>
              <p className="text-slate-500 text-[11px]">
                Kategori: {asset.category} &bull; Tgl Beli: {asset.purchaseDate} ({diffMonths} bulan pemakaian)
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-slate-500 block mb-1">Simulasi Harga Perolehan:</span>
              <div className="w-40 sm:ml-auto">
                <CurrencyInput
                  value={purchasePrice}
                  onChange={setPurchasePrice}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Interactive Parameters */}
          <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Masa Manfaat (Tahun)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={usefulLifeYears}
                onChange={(e) => setUsefulLifeYears(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
              <span className="text-[10px] text-slate-400">Total {totalUsefulMonths} bulan</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Estimasi Nilai Residu (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={residualValuePercent}
                onChange={(e) => setResidualValuePercent(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
              />
              <span className="text-[10px] text-slate-500 font-semibold">{formatRupiah(residualValue)}</span>
            </div>
          </div>

          {/* Depreciation Results */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Hasil Perhitungan Nilai Buku Saat Ini
            </h5>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium">Nilai Buku Saat Ini</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">
                  {formatRupiah(currentBookValue)}
                </p>
                <span className="text-[9px] text-slate-400">Current Book Value</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium">Akumulasi Penyusutan</span>
                <p className="text-base font-bold text-rose-600 mt-0.5">
                  {formatRupiah(accumulatedDepreciation)}
                </p>
                <span className="text-[9px] text-slate-400">Telah terpakai ({depreciationProgress}%)</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium">Beban per Bulan</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {formatRupiah(monthlyDepreciation)}
                </p>
                <span className="text-[9px] text-slate-400">{formatRupiah(annualDepreciation)}/tahun</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-[11px] mb-1 font-semibold">
                <span className="text-slate-600">Sisa Umur Ekonomis:</span>
                <span className="text-slate-900">
                  {Math.max(0, totalUsefulMonths - diffMonths)} Bulan Tersisa
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${depreciationProgress}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-300"
                ></div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <button
              onClick={() => {
                setPurchasePrice(asset.purchasePrice || 0);
                setUsefulLifeYears(asset.usefulLifeYears || getDefaultUsefulLife(asset.category));
                setResidualValuePercent(10);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Nilai Awal</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer shadow-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
