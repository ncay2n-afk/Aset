import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, QrCode, Layers, CheckSquare, Square, Filter, Building } from 'lucide-react';
import { OfficeAsset, MasterCompanySettings } from '../types';
import { KODE_DIVISI_LIST, parseAssetCode } from '../data/assetCodeGenerator';

interface BatchLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAssets: OfficeAsset[];
  companySettings?: MasterCompanySettings;
}

export const BatchLabelModal: React.FC<BatchLabelModalProps> = ({
  isOpen,
  onClose,
  allAssets,
  companySettings,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(allAssets.slice(0, 8).map((a) => a.id));
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'a4-grid' | 'compact-grid'>('a4-grid');
  const [logoSize, setLogoSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState(companySettings?.companyName || 'PT ASET KANTOR UTAMA');

  useEffect(() => {
    if (companySettings?.companyName) {
      setCompanyName(companySettings.companyName);
    }
  }, [companySettings]);

  // Filtered assets
  const filteredAssets = allAssets.filter((a) => {
    if (selectedDivision === 'ALL') return true;
    const parts = a.id.split('.');
    return parts[1] === selectedDivision;
  });

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredAssets.map((a) => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Generate QR for selected assets
  useEffect(() => {
    if (!isOpen) return;
    const targets = allAssets.filter((a) => selectedIds.includes(a.id));
    const newQrMap: Record<string, string> = {};

    Promise.all(
      targets.map(async (asset) => {
        try {
          const url = await QRCode.toDataURL(
            JSON.stringify({
              id: asset.id,
              name: asset.name,
              sku: asset.sku,
              loc: asset.location,
              pic: asset.custodian,
            }),
            {
              width: 180,
              margin: 1,
              color: { dark: '#0f172a', light: '#ffffff' },
            }
          );
          newQrMap[asset.id] = url;
        } catch (e) {
          console.error(e);
        }
      })
    ).then(() => {
      setQrMap(newQrMap);
    });
  }, [selectedIds, isOpen, allAssets]);

  if (!isOpen) return null;

  const selectedAssetObjects = allAssets.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cetak Label Stiker Massal (Batch Print)</h3>
              <p className="text-xs text-slate-400">
                Pilih puluhan aset sekaligus untuk dicetak pada kertas stiker lembar A4 / Roll
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar (no-print) */}
        <div className="no-print p-6 border-b border-slate-200 bg-slate-50 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Filter Divisi:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="ALL">Semua Divisi ({allAssets.length} Aset)</option>
                {KODE_DIVISI_LIST.map((d) => (
                  <option key={d.code} value={d.code}>
                    [{d.code}] {d.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Pilih Semua ({filteredAssets.length})
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs"
              >
                Kosongkan
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Format Lembar:</span>
                <button
                  type="button"
                  onClick={() => setLayoutMode('a4-grid')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    layoutMode === 'a4-grid'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Grid A4 (2 Kolom)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('compact-grid')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    layoutMode === 'compact-grid'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Kompak (3 Kolom)
                </button>
              </div>

              {companySettings?.logoUrl && (
                <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                  <span className="text-xs font-bold text-slate-700">Ukuran Logo:</span>
                  <button
                    type="button"
                    onClick={() => setLogoSize('normal')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'normal'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Sedang (48px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoSize('large')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'large'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Besar (72px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoSize('xlarge')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      logoSize === 'xlarge'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Ekstra Besar (90px)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Select Chips */}
          <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
            {filteredAssets.map((asset) => {
              const isSelected = selectedIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  onClick={() => handleToggleSelect(asset.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{asset.id}</span>
                  <span className="text-slate-400 font-sans font-normal truncate max-w-[90px]">{asset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Labels Canvas */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-100">
          <div className="no-print mb-3 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Siap mencetak {selectedAssetObjects.length} stiker label:</span>
            <span>Gunakan kertas stiker A4 (Label Tom & Jerry / thermal roll)</span>
          </div>

          {/* Print container with exact printable styling */}
          <div
            id="printable-batch-labels"
            className={`grid gap-4 mx-auto ${
              layoutMode === 'a4-grid' ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' : 'grid-cols-1 sm:grid-cols-3 max-w-5xl'
            }`}
          >
            {selectedAssetObjects.map((asset) => {
              const parsed = parseAssetCode(asset.id);
              return (
                <div
                  key={asset.id}
                  className="bg-white text-slate-900 border-2 border-slate-900 p-3.5 rounded-xl shadow-xs flex flex-col justify-between"
                  style={{ minHeight: '190px', fontFamily: 'sans-serif' }}
                >
                  {/* Tag Header */}
                  <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {companySettings?.logoUrl && (
                        <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                          <img
                            src={companySettings.logoUrl}
                            alt="Logo"
                            className={`object-contain transition-all ${
                              logoSize === 'xlarge'
                                ? 'h-20 max-w-[170px]'
                                : logoSize === 'large'
                                ? 'h-15 max-w-[130px]'
                                : 'h-11 max-w-[95px]'
                            }`}
                          />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h5 className="font-extrabold text-[11px] sm:text-[12px] tracking-tight uppercase leading-tight text-slate-900 truncate">
                          {companyName}
                        </h5>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider truncate mt-0.5">
                          {parsed.divisiName}
                        </p>
                      </div>
                    </div>
                    <div className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded tracking-wider shrink-0">
                      ASSET TAG
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex items-center gap-2.5 py-1.5">
                    {qrMap[asset.id] ? (
                      <img
                        src={qrMap[asset.id]}
                        alt={`QR ${asset.id}`}
                        className="w-16 h-16 shrink-0 border border-slate-300 rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                        QR...
                      </div>
                    )}

                    <div className="overflow-hidden flex-1 space-y-0.5">
                      <div className="font-mono text-xs font-black bg-amber-50 text-slate-900 px-1 py-0.5 rounded border border-amber-300 inline-block">
                        {asset.id}
                      </div>
                      <p className="font-bold text-[11px] text-slate-900 line-clamp-1 leading-tight">
                        {asset.name}
                      </p>
                      <p className="text-[9px] text-slate-600 truncate">
                        SKU: <strong>{asset.sku}</strong>
                      </p>
                      <p className="text-[9px] text-slate-600 truncate">
                        Lokasi: <strong>{asset.location}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-400 pt-0.5 flex justify-between text-[7px] text-slate-500 font-semibold uppercase">
                    <span>Dilarang Merusak Stiker</span>
                    <span>Tgl Beli: {asset.purchaseDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Actions (no-print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Terpilih: <strong>{selectedAssetObjects.length}</strong> stiker label
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
            >
              Tutup
            </button>
            <button
              onClick={() => window.print()}
              disabled={selectedAssetObjects.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {selectedAssetObjects.length} Label Stiker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
