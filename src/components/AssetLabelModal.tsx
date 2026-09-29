import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, QrCode, Tag, Check, Layers, Sliders, Shield, Info } from 'lucide-react';
import { OfficeAsset, MasterCompanySettings } from '../types';
import { parseAssetCode } from '../data/assetCodeGenerator';

interface AssetLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: OfficeAsset | null;
  allAssets?: OfficeAsset[];
  companySettings?: MasterCompanySettings;
}

export const AssetLabelModal: React.FC<AssetLabelModalProps> = ({
  isOpen,
  onClose,
  asset,
  allAssets = [],
  companySettings,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<OfficeAsset | null>(asset);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState(companySettings?.companyName || 'PT ASET KANTOR UTAMA');
  const [departmentName, setDepartmentName] = useState(companySettings?.brandSubtitle || 'GENERAL AFFAIRS & IT DIVISION');
  const [labelSize, setLabelSize] = useState<'standard' | 'compact'>('standard');
  const [logoSize, setLogoSize] = useState<'normal' | 'large' | 'xlarge'>('large');

  useEffect(() => {
    if (companySettings) {
      if (companySettings.companyName) setCompanyName(companySettings.companyName);
      if (companySettings.brandSubtitle) setDepartmentName(companySettings.brandSubtitle);
    }
  }, [companySettings]);

  useEffect(() => {
    setSelectedAsset(asset);
  }, [asset]);

  useEffect(() => {
    if (selectedAsset) {
      const parsed = parseAssetCode(selectedAsset.id);
      const qrPayload = JSON.stringify({
        id: selectedAsset.id,
        name: selectedAsset.name,
        sku: selectedAsset.sku,
        bidang: parsed.bidangName,
        divisi: parsed.divisiName,
        sub: parsed.subKelompokName,
        tahun: `20${parsed.tahun}`,
        pic: selectedAsset.custodian,
        loc: selectedAsset.location,
      });

      QRCode.toDataURL(qrPayload, {
        width: 250,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [selectedAsset]);

  if (!isOpen || !selectedAsset) return null;

  const parsed = parseAssetCode(selectedAsset.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cetak Label / Stiker QR Barcode Aset</h3>
              <p className="text-xs text-slate-400">
                Resep Kode [XX].[XX].[XXX].[XXX].[XX] siap tempel pada barang kantor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Controls (hidden on print) */}
          <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Aset untuk Dicetak
                </label>
                <select
                  value={selectedAsset.id}
                  onChange={(e) => {
                    const found = allAssets.find((a) => a.id === e.target.value);
                    if (found) setSelectedAsset(found);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium font-mono"
                >
                  {allAssets.length > 0 ? (
                    allAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.id}] {a.name} ({a.location})
                      </option>
                    ))
                  ) : (
                    <option value={selectedAsset.id}>
                      [{selectedAsset.id}] {selectedAsset.name}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ukuran Stiker
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLabelSize('standard')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      labelSize === 'standard'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Standar (7x4.5 cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelSize('compact')}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                      labelSize === 'compact'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kompak (5x3.5 cm)
                  </button>
                </div>
              </div>

              {companySettings?.logoUrl && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ukuran Logo Stiker
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLogoSize('normal')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        logoSize === 'normal'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Sedang (56px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSize('large')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        logoSize === 'large'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Besar (80px - Rekomendasi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSize('xlarge')}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition ${
                        logoSize === 'xlarge'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Ekstra Besar (100px)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Perusahaan / Instansi di Label
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Divisi / Departemen Pengelola
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Code Breakdown Recipe Pill */}
            {parsed.isValid && (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                <span className="font-bold block mb-1">Resep Kode Barang:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-[10px] text-slate-700">
                  <div>Bidang [{parsed.bidang}]: <strong>{parsed.bidangName}</strong></div>
                  <div>Divisi [{parsed.divisi}]: <strong>{parsed.divisiName}</strong></div>
                  <div>Sub [{parsed.subKelompok}]: <strong>{parsed.subKelompokName}</strong></div>
                  <div>Urut: <strong>{parsed.urutan}</strong></div>
                  <div>Tahun: <strong>20{parsed.tahun}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Label Preview (What will be printed) */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold mb-3 no-print">
              Pratinjau Stiker Fisik Siap Cetak:
            </span>

            {/* Print Sticker Box */}
            <div
              id="printable-asset-label"
              className={`bg-white text-slate-900 border-2 border-slate-900 shadow-md p-4 rounded-xl flex flex-col justify-between transition-all ${
                labelSize === 'standard' ? 'w-[420px] min-h-[230px]' : 'w-[350px] min-h-[190px]'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  {companySettings?.logoUrl && (
                    <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                      <img
                        src={companySettings.logoUrl}
                        alt="Logo"
                        className={`object-contain transition-all ${
                          logoSize === 'xlarge'
                            ? 'h-24 max-w-[200px]'
                            : logoSize === 'large'
                            ? 'h-20 max-w-[160px]'
                            : 'h-14 max-w-[120px]'
                        }`}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-[13px] tracking-tight uppercase leading-tight text-slate-900">
                      {companyName}
                    </h4>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">
                      {departmentName}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded tracking-wider shrink-0">
                  ASSET TAG
                </div>
              </div>

              {/* Body: QR Code and Details */}
              <div className="flex items-center gap-3 py-2">
                {qrDataUrl ? (
                  <div className="shrink-0 bg-white p-1 border border-slate-300 rounded shadow-2xs">
                    <img
                      src={qrDataUrl}
                      alt={`QR ${selectedAsset.id}`}
                      className={labelSize === 'standard' ? 'w-24 h-24' : 'w-20 h-20'}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Loading...
                  </div>
                )}

                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="font-mono text-xs sm:text-sm font-black tracking-wider text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 inline-block shadow-2xs">
                    {selectedAsset.id}
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 line-clamp-1 leading-tight">
                    {selectedAsset.name}
                  </h5>
                  <p className="text-[10px] text-slate-600 truncate">
                    SKU: <strong>{selectedAsset.sku}</strong>
                  </p>
                  <p className="text-[10px] text-slate-600 truncate">
                    Divisi: <strong>{parsed.divisiName}</strong>
                  </p>
                  <p className="text-[10px] text-slate-600 truncate">
                    Lokasi: <strong>{selectedAsset.location}</strong>
                  </p>
                </div>
              </div>

              {/* Warning / Security Footer */}
              <div className="border-t border-slate-400 pt-1 flex items-center justify-between text-[8px] text-slate-500 font-semibold uppercase">
                <span>Dilarang Merusak / Melepas Label Ini</span>
                <span>Tgl Beli: {selectedAsset.purchaseDate}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions (hidden on print) */}
          <div className="no-print border-t border-slate-200 pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Gunakan kertas stiker tahan air atau kertas label thermal untuk hasil terbaik.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Stiker</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
