import React, { useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Table,
  Sparkles
} from 'lucide-react';
import { OfficeAsset, AssetCategory, AssetCondition } from '../types';
import { formatAssetCode } from '../data/assetCodeGenerator';
import { formatRupiah } from '../utils/currencyFormatter';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCount: number;
  onImportAssets: (newAssets: OfficeAsset[]) => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  existingCount,
  onImportAssets,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<OfficeAsset>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download Sample CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'Kode Bidang [01/04/02/03]',
      'Kode Divisi [01-14]',
      'Kode Sub Kelompok [001-011]',
      'Nama Barang',
      'Kategori',
      'SKU',
      'Jumlah',
      'Satuan',
      'Lokasi',
      'Kondisi [Baik/Perlu Perbaikan/Rusak]',
      'Harga Beli IDR',
      'Tgl Beli YYYY-MM-DD',
      'PIC Penanggung Jawab',
    ];

    const sampleRow1 = [
      '01',
      '14',
      '001',
      'ThinkPad T14s Gen 4 AMD 16GB',
      'IT & Elektronik',
      'SKU-TP-T14S',
      '5',
      'Unit',
      'Head Office Lt. 3',
      'Baik',
      '21500000',
      '2024-05-10',
      'Budi Santoso',
    ];

    const sampleRow2 = [
      '01',
      '04',
      '002',
      'Epson L3210 All-in-One Ink Tank',
      'IT & Elektronik',
      'SKU-EPS-L3210',
      '2',
      'Unit',
      'Operasional Area Kantor',
      'Baik',
      '2850000',
      '2024-06-15',
      'Ahmad Fauzi',
    ];

    const content = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_Aset_Kantor.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV
  const handleParse = (text: string) => {
    setCsvText(text);
    setParseError(null);

    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      setParsedPreview([]);
      return;
    }

    try {
      const items: Partial<OfficeAsset>[] = [];
      let currentSeq = existingCount + 1;

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // basic comma splitting (with quote handling)
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 4) continue;

        const kodeBidang = cols[0] || '01';
        const kodeDivisi = cols[1] || '14';
        const kodeSubKelompok = cols[2] || '001';
        const name = cols[3] || 'Barang Baru';
        const category = (cols[4] as AssetCategory) || 'IT & Elektronik';
        const sku = cols[5] || `SKU-${Date.now().toString().slice(-4)}${i}`;
        const totalStock = parseInt(cols[6]) || 1;
        const unit = cols[7] || 'Unit';
        const location = cols[8] || 'Head Office';
        const condition = (cols[9] as AssetCondition) || 'Baik';
        const purchasePrice = parseInt((cols[10] || '').replace(/\D/g, ''), 10) || 0;
        const purchaseDate = cols[11] || new Date().toISOString().split('T')[0];
        const custodian = cols[12] || 'General Affairs';

        const tahunDuaDigit = purchaseDate.slice(2, 4);
        const urutanCode = String(currentSeq).padStart(3, '0');
        const autoId = formatAssetCode(kodeBidang, kodeDivisi, kodeSubKelompok, urutanCode, tahunDuaDigit);
        currentSeq++;

        items.push({
          id: autoId,
          name,
          category,
          sku,
          totalStock,
          availableStock: totalStock,
          borrowedStock: 0,
          damagedStock: 0,
          unit,
          location,
          condition,
          status: 'Tersedia',
          purchasePrice,
          purchaseDate,
          custodian,
          notes: 'Diimpor massal via CSV template',
          updatedAt: new Date().toISOString(),
        });
      }

      setParsedPreview(items);
    } catch (err: any) {
      setParseError(err.message || 'Format CSV tidak valid.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) handleParse(text);
      };
      reader.readAsText(file);
    }
  };

  const handleCommitImport = () => {
    if (parsedPreview.length === 0) return;
    onImportAssets(parsedPreview as OfficeAsset[]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Import Massal Aset (CSV & Excel)</h3>
              <p className="text-xs text-slate-400">
                Otomatis meng-generate kode resep [XX].[XX].[XXX].[XXX].[XX] untuk puluhan data
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Download Template Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Unduh Format Template CSV Standar</h4>
                <p className="text-[11px] text-emerald-800">
                  Kolom sudah disesuaikan dengan kode bidang, divisi, sub kelompok, dan harga.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload or Paste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Upload File .CSV
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Atau Tempel (Paste) Teks CSV di Sini
              </label>
              <textarea
                rows={3}
                placeholder="01,14,001,Laptop ThinkPad,IT & Elektronik,SKU-01,1,Unit,Lt 2,Baik,15000000,2024-01-01,Budi"
                value={csvText}
                onChange={(e) => handleParse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              ></textarea>
            </div>
          </div>

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-600" />
                  Pratinjau Data Siap Impor ({parsedPreview.length} Item):
                </span>
                <span className="text-emerald-600 font-semibold text-[11px]">
                  ✓ Kode resep terformat otomatis
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Kode Terbentuk</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Harga Beli</th>
                      <th className="py-2.5 px-3">Stok</th>
                      <th className="py-2.5 px-3">Lokasi</th>
                      <th className="py-2.5 px-3">PIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="py-2 px-3 font-bold text-blue-900 bg-blue-50/50">{item.id}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">{item.name}</td>
                        <td className="py-2 px-3 font-sans text-slate-500">{item.category}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatRupiah(item.purchasePrice)}</td>
                        <td className="py-2 px-3 font-bold">{item.totalStock} {item.unit}</td>
                        <td className="py-2 px-3 font-sans">{item.location}</td>
                        <td className="py-2 px-3 font-sans text-slate-500">{item.custodian}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedPreview.length === 0}
              onClick={handleCommitImport}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Simpan & Daftarkan {parsedPreview.length} Aset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
