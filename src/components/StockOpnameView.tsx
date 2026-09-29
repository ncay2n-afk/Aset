import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Printer,
  Calendar,
  Building,
  UserCheck,
  Layers,
  MapPin,
  Clock,
  Scan,
  RefreshCw,
  FileText,
  Sliders,
  X,
  ShieldCheck,
  PenTool,
  Eraser
} from 'lucide-react';
import {
  OfficeAsset,
  StockOpnameSession,
  StockOpnameItem,
  AuditItemStatus,
  AssetCondition,
  MasterCompanySettings
} from '../types';
import { KODE_DIVISI_LIST } from '../data/assetCodeGenerator';

interface StockOpnameViewProps {
  assets: OfficeAsset[];
  sessions: StockOpnameSession[];
  onAddSession: (session: StockOpnameSession) => void;
  onUpdateSession: (updated: StockOpnameSession) => void;
  onReconcileAssets: (reconciledAssets: { assetId: string; condition: AssetCondition; location: string }[]) => void;
  onOpenScanner?: () => void;
  companySettings?: MasterCompanySettings;
}

export const StockOpnameView: React.FC<StockOpnameViewProps> = ({
  assets,
  sessions,
  onAddSession,
  onUpdateSession,
  onReconcileAssets,
  onOpenScanner,
  companySettings,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBaModalOpen, setIsBaModalOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Session Form State
  const [newTitle, setNewTitle] = useState('Stock Opname Fisik Semester ' + (new Date().getMonth() > 5 ? 'II' : 'I') + ' ' + new Date().getFullYear());
  const [newDivisionCode, setNewDivisionCode] = useState('14'); // Head Office
  const [newLocation, setNewLocation] = useState('Head Office Gedung Utama');
  const [newAuditor, setNewAuditor] = useState('Tim Satgas Audit Internal GA');
  const [newNotes, setNewNotes] = useState('Pemeriksaan fisik keberadaan barang, label barcode QR, dan kondisi kelayakan pakai.');

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Helper to create session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const div = KODE_DIVISI_LIST.find((d) => d.code === newDivisionCode);
    const divName = div ? div.name : 'Semua Divisi';

    // Filter relevant assets or include all
    const relevantAssets = newDivisionCode === 'ALL'
      ? assets
      : assets.filter((a) => a.id.split('.')[1] === newDivisionCode || a.location.toLowerCase().includes(divName.toLowerCase()));

    const targetList = relevantAssets.length > 0 ? relevantAssets : assets;

    const items: StockOpnameItem[] = targetList.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      expectedLocation: a.location,
      expectedCondition: a.condition,
      status: 'BELUM_DIPERIKSA',
    }));

    const newSession: StockOpnameSession = {
      id: `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      divisionCode: newDivisionCode,
      divisionName: divName,
      location: newLocation,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'SEDANG_BERJALAN',
      auditorName: newAuditor,
      notes: newNotes,
      totalExpectedAssets: items.length,
      verifiedCount: 0,
      discrepancyCount: 0,
      items,
      createdAt: new Date().toISOString(),
    };

    onAddSession(newSession);
    setSelectedSessionId(newSession.id);
    setIsCreateModalOpen(false);
  };

  // Update item audit status
  const handleSetItemStatus = (
    assetId: string,
    newStatus: AuditItemStatus,
    actualCondition?: AssetCondition,
    actualLocation?: string,
    notes?: string
  ) => {
    if (!activeSession) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedItems = activeSession.items.map((item) => {
      if (item.assetId === assetId) {
        return {
          ...item,
          status: newStatus,
          actualCondition: actualCondition || item.actualCondition || item.expectedCondition,
          actualLocation: actualLocation || item.actualLocation || item.expectedLocation,
          scannedAt: nowStr,
          notes: notes !== undefined ? notes : item.notes,
        };
      }
      return item;
    });

    const verified = updatedItems.filter((i) => i.status !== 'BELUM_DIPERIKSA').length;
    const discrepancies = updatedItems.filter((i) => ['SELISIH_LOKASI', 'RUSAK', 'HILANG'].includes(i.status)).length;

    const updatedSession: StockOpnameSession = {
      ...activeSession,
      items: updatedItems,
      verifiedCount: verified,
      discrepancyCount: discrepancies,
      status: verified === updatedItems.length ? 'SELESAI' : 'SEDANG_BERJALAN',
      completedAt: verified === updatedItems.length ? new Date().toISOString() : undefined,
    };

    onUpdateSession(updatedSession);
  };

  // Reconcile database with audit results
  const handleReconcile = () => {
    if (!activeSession) return;
    const discrepancies = activeSession.items.filter(
      (i) => i.status === 'SELISIH_LOKASI' || i.status === 'RUSAK'
    );

    if (discrepancies.length === 0) {
      alert('Tidak ada data selisih lokasi/kondisi yang perlu direkonsiliasi.');
      return;
    }

    if (confirm(`Rekonsiliasi ${discrepancies.length} aset dengan kondisi/lokasi fisik terkini di database?`)) {
      const updates = discrepancies.map((i) => ({
        assetId: i.assetId,
        condition: i.actualCondition || i.expectedCondition,
        location: i.actualLocation || i.expectedLocation,
      }));
      onReconcileAssets(updates);
      alert('Database inventaris berhasil disinkronkan dengan hasil audit lapangan!');
    }
  };

  if (!activeSession) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h4 className="text-base font-bold text-slate-800">Belum Ada Sesi Stock Opname</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Mulai sesi audit fisik inventaris untuk memastikan keberadaan barang, keakuratan lokasi, dan keabsahan label QR di lapangan.
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Stock Opname</span>
        </button>
      </div>
    );
  }

  // Filter items in session
  const filteredItems = activeSession.items.filter((item) => {
    const matchSearch =
      itemSearch === '' ||
      item.assetName.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.assetId.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.expectedLocation.toLowerCase().includes(itemSearch.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const progressPercent = activeSession.totalExpectedAssets > 0
    ? Math.round((activeSession.verifiedCount / activeSession.totalExpectedAssets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{activeSession.title}</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    activeSession.status === 'SELESAI'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  {activeSession.status === 'SELESAI' ? 'Selesai Terverifikasi' : 'Sedang Berjalan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeSession.scheduledDate}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {activeSession.divisionName || 'Seluruh Divisi'} &bull; {activeSession.location}
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Auditor: {activeSession.auditorName}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.id}] {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sesi Baru</span>
            </button>

            <button
              onClick={() => setIsBaModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Cetak Berita Acara (BA-SO)</span>
            </button>

            {activeSession.discrepancyCount > 0 && (
              <button
                onClick={handleReconcile}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rekonsiliasi Database</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Total Target Audit
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {activeSession.totalExpectedAssets} <span className="text-xs font-normal text-slate-500">Item</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
              Fisik Terverifikasi
            </span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {activeSession.verifiedCount} <span className="text-xs font-normal text-emerald-600">({progressPercent}%)</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              Selisih / Perlu Cek
            </span>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {activeSession.discrepancyCount} <span className="text-xs font-normal text-amber-600">Item</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Belum Diperiksa
            </span>
            <div className="text-xl font-black text-slate-700 mt-0.5">
              {activeSession.totalExpectedAssets - activeSession.verifiedCount} <span className="text-xs font-normal text-slate-400">Item</span>
            </div>
          </div>
        </div>

        {/* Audit Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-600">Progress Verifikasi Fisik di Lapangan:</span>
            <span className="text-slate-900 font-bold">{progressPercent}% Selesai</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
            ></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari item audit (nama barang, kode [XX.XX...], lokasi)..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Semua Status Audit</option>
            <option value="BELUM_DIPERIKSA">Belum Diperiksa</option>
            <option value="SESUAI">Sesuai Fisik</option>
            <option value="SELISIH_LOKASI">Selisih Lokasi</option>
            <option value="RUSAK">Fisik Rusak</option>
            <option value="HILANG">Tidak Ditemukan / Hilang</option>
          </select>
        </div>
      </div>

      {/* Audit Items Checklist Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode & Nama Aset</th>
                <th className="py-3 px-4">Lokasi Buku vs Lapangan</th>
                <th className="py-3 px-4">Kondisi Barang</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Aksi Audit Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => (
                <tr key={item.assetId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] font-black bg-amber-50 text-amber-950 px-2 py-0.5 rounded border border-amber-300">
                      {item.assetId}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900 mt-1">{item.assetName}</h5>
                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">"{item.notes}"</p>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{item.expectedLocation}</span>
                    </div>
                    {item.actualLocation && item.actualLocation !== item.expectedLocation && (
                      <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                        Aktual: {item.actualLocation}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-xs font-semibold text-slate-800">{item.actualCondition || item.expectedCondition}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    {item.status === 'SESUAI' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Sesuai Fisik
                      </span>
                    ) : item.status === 'SELISIH_LOKASI' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-purple-600" />
                        Pindah Lokasi
                      </span>
                    ) : item.status === 'RUSAK' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Rusak Lapangan
                      </span>
                    ) : item.status === 'HILANG' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Tidak Ditemukan
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        ⏳ Belum Diperiksa
                      </span>
                    )}
                    {item.scannedAt && (
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        Dicek: {item.scannedAt}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSetItemStatus(item.assetId, 'SESUAI')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Tandai Fisik Barang Sesuai & Lengkap"
                      >
                        ✓ Sesuai
                      </button>

                      <button
                        onClick={() => {
                          const newLoc = prompt('Masukkan lokasi baru barang ditemukan:', item.expectedLocation);
                          if (newLoc !== null) {
                            handleSetItemStatus(item.assetId, 'SELISIH_LOKASI', item.expectedCondition, newLoc);
                          }
                        }}
                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Tandai Barang Ditemukan di Ruangan Lain"
                      >
                        Relokasi
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('Alasan status tidak ditemukan / hilang:');
                          if (reason !== null) {
                            handleSetItemStatus(item.assetId, 'HILANG', undefined, undefined, reason);
                          }
                        }}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Tandai Fisik Barang Hilang"
                      >
                        Hilang
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-400" />
                Buat Sesi Stock Opname Fisik Baru
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama / Agenda Audit *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Divisi [XX] *
                  </label>
                  <select
                    value={newDivisionCode}
                    onChange={(e) => {
                      setNewDivisionCode(e.target.value);
                      const div = KODE_DIVISI_LIST.find((d) => d.code === e.target.value);
                      if (div) setNewLocation(`Gedung ${div.name}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="ALL">Semua Divisi (Audit Global)</option>
                    {KODE_DIVISI_LIST.map((d) => (
                      <option key={d.code} value={d.code}>
                        [{d.code}] {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Fisik Audit *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Petugas / Tim Auditor *
                </label>
                <input
                  type="text"
                  required
                  value={newAuditor}
                  onChange={(e) => setNewAuditor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Ruang Lingkup Audit
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Mulai Stock Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Berita Acara Stock Opname (BA-SO) Official Document Modal */}
      {isBaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Berita Acara Hasil Stock Opname (BA-SO)
              </h3>
              <button onClick={() => setIsBaModalOpen(false)} className="text-slate-400 hover:text-white">
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
                    {companySettings?.brandSubtitle || 'TIM AUDIT INVENTARIS FISIK & GENERAL AFFAIRS'}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-black underline uppercase tracking-tight">
                  BERITA ACARA HASIL AUDIT FISIK INVENTARIS (STOCK OPNAME)
                </h3>
                <p className="font-mono text-slate-500 text-[11px]">
                  Nomor: <strong>BA-SO/{activeSession.id.replace('SO-', '')}/{new Date().getFullYear()}</strong>
                </p>
              </div>

              <p>
                Pada hari ini, tanggal <strong>{activeSession.scheduledDate}</strong>, telah diselesaikan pemeriksaan fisik inventaris kantor untuk unit kerja / divisi: <strong>{activeSession.divisionName}</strong> bertempat di <strong>{activeSession.location}</strong> dengan hasil rekapitulasi sebagai berikut:
              </p>

              {/* Summary Stats Table */}
              <table className="w-full text-left border border-slate-300 text-[11px]">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Parameter Pemeriksaan</th>
                    <th className="p-2 border-r border-slate-300 text-center">Jumlah Item</th>
                    <th className="p-2 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-r border-slate-300">Total Barang yang Ditargetkan</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">{activeSession.totalExpectedAssets} Unit</td>
                    <td className="p-2 text-center font-bold">100%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 text-emerald-800">Fisik Ada & Sesuai Lokasi</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-emerald-700">
                      {activeSession.items.filter((i) => i.status === 'SESUAI').length} Unit
                    </td>
                    <td className="p-2 text-center text-emerald-700 font-semibold">
                      {Math.round((activeSession.items.filter((i) => i.status === 'SESUAI').length / Math.max(1, activeSession.totalExpectedAssets)) * 100)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 text-purple-800">Selisih Lokasi (Pindah Ruang)</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-purple-700">
                      {activeSession.items.filter((i) => i.status === 'SELISIH_LOKASI').length} Unit
                    </td>
                    <td className="p-2 text-center text-purple-700 font-semibold">
                      {Math.round((activeSession.items.filter((i) => i.status === 'SELISIH_LOKASI').length / Math.max(1, activeSession.totalExpectedAssets)) * 100)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 text-rose-800">Tidak Ditemukan / Hilang</td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold text-rose-700">
                      {activeSession.items.filter((i) => i.status === 'HILANG').length} Unit
                    </td>
                    <td className="p-2 text-center text-rose-700 font-semibold">
                      {Math.round((activeSession.items.filter((i) => i.status === 'HILANG').length / Math.max(1, activeSession.totalExpectedAssets)) * 100)}%
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Discrepancies details */}
              <div>
                <p className="font-bold mb-1.5">Catatan Temuan Lapangan & Tindak Lanjut:</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <p>1. Seluruh barang yang berstatus <strong>Selisih Lokasi</strong> telah dicatat dan direkomendasikan mutasi resmi di sistem.</p>
                  <p>2. Barang yang mengalami kerusakan fisik diarahkan untuk pengajuan servis pada modul Pemeliharaan.</p>
                  <p>3. Stiker QR barcode fisik dipastikan dalam kondisi terbaca dan melekat dengan baik pada badan aset.</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-800">PETUGAS / AUDITOR LAPANGAN,</p>
                  <div className="h-12 flex items-center justify-center italic text-slate-400">
                    [Tanda Tangan Digital Terverifikasi]
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900">{activeSession.auditorName}</p>
                    <p className="text-[10px] text-slate-500">Satgas Stock Opname</p>
                  </div>
                </div>

                <div className="text-center space-y-12">
                  <p className="font-bold text-slate-800">MENGETAHUI / MENYETUJUI,</p>
                  <div className="h-12 flex items-center justify-center italic text-slate-400">
                    [Stempel Resmi GA Division]
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-900">General Affairs & Facility Head</p>
                    <p className="text-[10px] text-slate-500">Divisi Pengelola Aset</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Dokumen Berita Acara dapat langsung dicetak atau disimpan sebagai PDF arsip resmi.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF BA-SO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
