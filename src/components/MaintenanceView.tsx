import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  User,
  Building,
  Mail,
  Filter,
  Search,
  ExternalLink,
  X
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType, OfficeAsset, MasterVendor } from '../types';
import { sendGmailMessage } from '../services/gmailService';
import { CurrencyInput } from './CurrencyInput';

interface MaintenanceViewProps {
  assets: OfficeAsset[];
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onCompleteRecord: (recordId: string, actualCost: number, restoreAssetCondition: boolean) => void;
  token: string | null;
  currentUserEmail: string | null;
  vendors?: MasterVendor[];
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  assets,
  records,
  onAddRecord,
  onCompleteRecord,
  token,
  currentUserEmail,
  vendors = [],
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [serviceType, setServiceType] = useState<MaintenanceType>('Rutin Berkala');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [vendorOrTechnician, setVendorOrTechnician] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(500000);
  const [notes, setNotes] = useState('');

  // Complete Dialog State
  const [completingRecord, setCompletingRecord] = useState<MaintenanceRecord | null>(null);
  const [actualCostInput, setActualCostInput] = useState<number>(0);
  const [restoreStock, setRestoreStock] = useState<boolean>(true);

  // Email Reminder state
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    const matchSearch =
      search === '' ||
      r.assetName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetId.toLowerCase().includes(search.toLowerCase()) ||
      r.vendorOrTechnician.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    const newRecord: MaintenanceRecord = {
      id: `MTC-${Date.now().toString().slice(-6)}`,
      assetId: asset.id,
      assetName: asset.name,
      serviceType,
      scheduledDate,
      vendorOrTechnician: vendorOrTechnician.trim() || 'Tim Maintenance Internal',
      estimatedCost,
      status: 'Terjadwal',
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddRecord(newRecord);
    setIsAddModalOpen(false);
    setNotes('');
  };

  const handleSendReminderEmail = async (rec: MaintenanceRecord) => {
    if (!token) {
      alert('Silakan hubungkan akun Google untuk mengirim email reminder.');
      return;
    }

    const recipient = currentUserEmail || 'ga.maintenance@kantor.internal';
    try {
      await sendGmailMessage(token, {
        to: recipient,
        subject: `[Jadwal Servis Aset] Pengingat Pemeliharaan: ${rec.assetName} (${rec.assetId})`,
        htmlBody: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
            <h3 style="color: #0f172a;">Pengingat Jadwal Servis & Pemeliharaan Aset Kantor</h3>
            <p style="color: #334155;">Berikut adalah rincian agenda servis berkala yang dijadwalkan:</p>
            <table cellpadding="6" style="font-size: 13px; border-collapse: collapse; width: 100%; max-width: 500px; background: #fff; border: 1px solid #e2e8f0;">
              <tr><td style="color:#64748b;">Kode Aset</td><td><strong>${rec.assetId}</strong></td></tr>
              <tr><td style="color:#64748b;">Nama Barang</td><td><strong>${rec.assetName}</strong></td></tr>
              <tr><td style="color:#64748b;">Jenis Perawatan</td><td>${rec.serviceType}</td></tr>
              <tr><td style="color:#64748b;">Tanggal Rencana</td><td style="color: #2563eb; font-weight: bold;">${rec.scheduledDate}</td></tr>
              <tr><td style="color:#64748b;">Vendor / Teknisi</td><td>${rec.vendorOrTechnician}</td></tr>
              <tr><td style="color:#64748b;">Estimasi Biaya</td><td>${formatIDR(rec.estimatedCost)}</td></tr>
            </table>
          </div>
        `,
      });
      alert(`Email pengingat servis berhasil dikirim ke ${recipient}!`);
    } catch (err: any) {
      alert(`Gagal mengirim email: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari jadwal servis (nama aset, kode AST, vendor)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">Semua Status Servis</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Selesai">Selesai</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Jadwal Baru</span>
          </button>
        </div>
      </div>

      {/* Maintenance List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">
            Belum ada jadwal pemeliharaan tercatat
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Jadwalkan servis rutin berkala untuk printer, pendingin AC, proyektor, atau kendaraan operasional.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal Rencana</th>
                  <th className="py-3 px-4">Aset Terkait</th>
                  <th className="py-3 px-4">Jenis Perawatan</th>
                  <th className="py-3 px-4">Vendor / Teknisi</th>
                  <th className="py-3 px-4">Estimasi Biaya</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{r.scheduledDate}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                        {r.id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900">{r.assetName}</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1 rounded text-slate-600 ml-1.5">
                        {r.assetId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.serviceType}
                    </td>

                    <td className="py-3.5 px-4">
                      <span>{r.vendorOrTechnician}</span>
                      {r.notes && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1">
                          "{r.notes}"
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {formatIDR(r.actualCost || r.estimatedCost)}
                      </span>
                      {r.actualCost && (
                        <span className="text-[10px] text-emerald-600 block">Biaya Riil Selesai</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.status === 'Selesai' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Selesai
                        </span>
                      ) : r.status === 'Dalam Proses' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Sedang Dikerjakan
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          📅 Terjadwal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'Selesai' && (
                          <>
                            <button
                              onClick={() => handleSendReminderEmail(r)}
                              title="Kirim Notifikasi Reminder via Gmail"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            <button
                              onClick={() => {
                                setCompletingRecord(r);
                                setActualCostInput(r.estimatedCost);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                            >
                              Tandai Selesai
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                Tambah Jadwal Pemeliharaan Aset
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Aset Kantor *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.name} ({a.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Pemeliharaan *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as MaintenanceType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Rutin Berkala">Rutin Berkala</option>
                    <option value="Perbaikan Darurat">Perbaikan Darurat</option>
                    <option value="Kalibrasi">Kalibrasi</option>
                    <option value="Penggantian Suku Cadang">Ganti Suku Cadang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Rencana Servis *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Teknisi / Bengkel / Vendor *
                    </label>
                    {vendors.length > 0 && (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        {vendors.length} vendor terdaftar
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="registered-vendors-list"
                    placeholder="Pilih vendor rekanan atau ketik manual..."
                    value={vendorOrTechnician}
                    onChange={(e) => setVendorOrTechnician(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <datalist id="registered-vendors-list">
                    {vendors.map((v) => (
                      <option key={v.id} value={`${v.name} (${v.serviceCategory})`} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Biaya (IDR)
                  </label>
                  <CurrencyInput
                    value={estimatedCost}
                    onChange={setEstimatedCost}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pekerjaan Servis
                </label>
                <textarea
                  rows={2}
                  placeholder="Ganti oli, cek baterai, pembersihan sensor proyektor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Jadwal Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Service Dialog */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Selesaikan Servis Pemeliharaan
            </h3>
            <p className="text-xs text-slate-600">
              Konfirmasi penyelesaian servis untuk: <strong>{completingRecord.assetName}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biaya Riil / Tagihan Akhir (IDR)
              </label>
              <CurrencyInput
                value={actualCostInput}
                onChange={setActualCostInput}
                placeholder="0"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Pulihkan kondisi aset ke "Baik" dan kembalikan stok ke Tersedia</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCompletingRecord(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onCompleteRecord(completingRecord.id, actualCostInput, restoreStock);
                  setCompletingRecord(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Konfirmasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
