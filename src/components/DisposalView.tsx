import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  FileText,
  Printer,
  DollarSign,
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  ShieldAlert,
  Search
} from 'lucide-react';
import { OfficeAsset, DisposalRecord, DisposalType, MasterCompanySettings } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface DisposalViewProps {
  assets: OfficeAsset[];
  records: DisposalRecord[];
  onAddDisposal: (record: DisposalRecord, removeAssetFromStock: boolean) => void;
  companySettings?: MasterCompanySettings;
}

export const DisposalView: React.FC<DisposalViewProps> = ({
  assets,
  records,
  onAddDisposal,
  companySettings,
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecordForBa, setSelectedRecordForBa] = useState<DisposalRecord | null>(null);

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [disposalType, setDisposalType] = useState<DisposalType>('AFKIR_RUSAK_BERAT');
  const [salvageAmount, setSalvageAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [picApprover, setPicApprover] = useState('Direktur Operasional & SDM');
  const [witnessName, setWitnessName] = useState('Auditor Internal PT Aset Kantor');

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCreateDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const newRecord: DisposalRecord = {
      id: `DSP-${Date.now().toString().slice(-6)}`,
      documentNumber: `BAPA/GA/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Date.now().toString().slice(-4)}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      category: selectedAsset.category,
      disposalType,
      requestDate: new Date().toISOString().split('T')[0],
      originalPrice: selectedAsset.purchasePrice,
      salvageRecoveryAmount: salvageAmount,
      bookValueAtDisposal: Math.max(0, Math.round(selectedAsset.purchasePrice * 0.1)),
      reason: reason.trim(),
      status: 'SELESAI',
      picApprover,
      witnessName,
      createdAt: new Date().toISOString(),
    };

    onAddDisposal(newRecord, true);
    setIsAddModalOpen(false);
    setReason('');
    setSalvageAmount(0);
  };

  const filtered = records.filter(
    (r) =>
      r.assetName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetId.toLowerCase().includes(search.toLowerCase()) ||
      r.documentNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalSalvage = records.reduce((sum, r) => sum + r.salvageRecoveryAmount, 0);
  const totalWrittenOff = records.reduce((sum, r) => sum + r.originalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner and KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Aset Dihapuskan (Afkir)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {records.length} <span className="text-xs font-normal text-slate-500">Unit Barang</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Status resmi terekam di Berita Acara</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nilai Perolehan yang Dihapus
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatIDR(totalWrittenOff)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Decommissioning dari neraca aset aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Nilai Pemulihan / Scrap / Lelang
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatIDR(totalSalvage)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pemasukan pemulihan aset afkir</p>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari penghapusan aset (nama barang, kode [XX.XX...], No BAPA)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Pengajuan Penghapusan Aset (BAPA)</span>
        </button>
      </div>

      {/* Records Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Trash2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Belum Ada Aset yang Dihapuskan</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Proses penghapusan aset (BAPA) digunakan untuk barang rusak berat yang tidak dapat diperbaiki, hilang, atau dilelang secara legal.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. BAPA & Tanggal</th>
                  <th className="py-3 px-4">Aset Terkait</th>
                  <th className="py-3 px-4">Alasan & Jenis Pemusnahan</th>
                  <th className="py-3 px-4">Harga Beli Awal</th>
                  <th className="py-3 px-4">Nilai Pemulihan (Scrap)</th>
                  <th className="py-3 px-4 text-right">Dokumen Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-slate-900">{r.documentNumber}</div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {r.requestDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{r.assetName}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-1.5">
                        {r.assetId}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Kategori: {r.category}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {r.disposalType.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-slate-500 italic mt-1 max-w-xs line-clamp-2">
                        "{r.reason}"
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatIDR(r.originalPrice)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600">{formatIDR(r.salvageRecoveryAmount)}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecordForBa(r)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        <span>Lihat BAPA</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Disposal Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Formulir Penghapusan Aset (Afkir / Lelang)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDisposal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Aset yang Dihapuskan *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.name} ({a.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Penghapusan *
                  </label>
                  <select
                    value={disposalType}
                    onChange={(e) => setDisposalType(e.target.value as DisposalType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="AFKIR_RUSAK_BERAT">Afkir (Rusak Berat Tak Terperbaiki)</option>
                    <option value="LELANG_JUAL">Lelang / Penjualan Terbuka</option>
                    <option value="HIBAH">Hibah Sosial</option>
                    <option value="HILANG_MUSNAH">Hilang / Bencana / Musnah</option>
                    <option value="KADALUARSA_USANG">Usang / Obsolete Teknologi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai Pemulihan / Scrap (IDR)
                  </label>
                  <CurrencyInput
                    value={salvageAmount}
                    onChange={setSalvageAmount}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Teknis & Pertimbangan Penghapusan *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Deskripsikan kerusakan fisik, suku cadang discontinued, atau berita acara kehilangan resmi kepolisian..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pejabat Penyetuju (Approval)
                  </label>
                  <input
                    type="text"
                    value={picApprover}
                    onChange={(e) => setPicApprover(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saksi / Auditor
                  </label>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>
                  Perhatian: Menyetujui penghapusan akan mengubah status aset menjadi <strong>Nonaktif / Dihapus</strong> dan menarik stoknya dari inventaris operasional aktif.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Terbitkan Dokumen BAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official BAPA Document View */}
      {selectedRecordForBa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" />
                Berita Acara Penghapusan Aset (BAPA) Resmi
              </h3>
              <button onClick={() => setSelectedRecordForBa(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6 text-slate-900 text-xs leading-relaxed max-h-[80vh] overflow-y-auto font-sans">
              {/* Corporate Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-center gap-4 text-center">
                {companySettings?.logoUrl && (
                  <img
                    src={companySettings.logoUrl}
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded"
                  />
                )}
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                    {companySettings?.companyName || 'PT ASET KANTOR CORPORATE INDONESIA'}
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {companySettings?.address || 'Gedung Perkantoran Menara Sentra Lt. 12 • Jakarta Selatan 12930'} &bull; Telp: {companySettings?.phone || '(021) 555-0199'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    {companySettings?.brandSubtitle || 'PANITIA PENGHAPUSAN DAN PEMINDAHTANGANAN ASET KANTOR'}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-black underline uppercase tracking-tight">
                  BERITA ACARA PENGHAPUSAN ASET (BAPA)
                </h3>
                <p className="font-mono text-slate-500 text-[11px]">
                  Nomor Dokumen: <strong>{selectedRecordForBa.documentNumber}</strong>
                </p>
              </div>

              <p>
                Pada hari ini, tanggal <strong>{selectedRecordForBa.requestDate}</strong>, berdasarkan hasil pemeriksaan fisik dan evaluasi teknis, panitia menyatakan setuju untuk melakukan penghapusan fisik dan pembukuan terhadap aset kantor berikut:
              </p>

              {/* Asset table */}
              <table className="w-full text-left border border-slate-300 text-[11px]">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Kode Barang</th>
                    <th className="p-2 border-r border-slate-300">Uraian Nama Barang</th>
                    <th className="p-2 border-r border-slate-300">Harga Perolehan</th>
                    <th className="p-2 border-r border-slate-300">Kategori Penghapusan</th>
                    <th className="p-2">Hasil Pemulihan (Scrap)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-mono font-bold">{selectedRecordForBa.assetId}</td>
                    <td className="p-2 border-r border-slate-300">
                      <strong>{selectedRecordForBa.assetName}</strong>
                      <p className="text-[10px] text-slate-500">{selectedRecordForBa.category}</p>
                    </td>
                    <td className="p-2 border-r border-slate-300 font-semibold">{formatIDR(selectedRecordForBa.originalPrice)}</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-rose-700">
                      {selectedRecordForBa.disposalType.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2 font-bold text-emerald-700">{formatIDR(selectedRecordForBa.salvageRecoveryAmount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Justification */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Alasan dan Fakta Pertimbangan:</span>
                <p className="text-slate-700 leading-relaxed">{selectedRecordForBa.reason}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-800">SAKSI / TIM AUDITOR INTERNAL,</p>
                  <div className="h-12 flex items-center justify-center italic text-slate-400">
                    [Tanda Tangan Terverifikasi]
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900">{selectedRecordForBa.witnessName || 'Auditor Internal'}</p>
                    <p className="text-[10px] text-slate-500">Pemeriksa Teknis</p>
                  </div>
                </div>

                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-800">PEJABAT YANG MENYETUJUI,</p>
                  <div className="h-12 flex items-center justify-center italic text-slate-400">
                    [Stempel Resmi Direksi]
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900">{selectedRecordForBa.picApprover}</p>
                    <p className="text-[10px] text-slate-500">Pimpinan Berwenang</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Dokumen BAPA legal untuk arsip perpajakan dan audit eksternal.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRecordForBa(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF BAPA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
