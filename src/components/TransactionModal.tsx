import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  ArrowRightLeft,
  Mail,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Calendar,
  User as UserIcon,
  Building,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  OfficeAsset,
  TransactionType,
  AssetCondition,
  AssetTransaction,
  WorkspaceConfig,
  MasterBuildingLocation
} from '../types';
import { uploadConditionPhotoToDrive } from '../services/driveService';
import { sendGmailMessage, buildAssetStatusEmailTemplate } from '../services/gmailService';
import { appendRow, syncAssetsToSheet, transactionToRow } from '../services/sheetsService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: OfficeAsset | null;
  allAssets: OfficeAsset[];
  token: string | null;
  currentUserEmail: string | null;
  workspaceConfig: WorkspaceConfig;
  onTransactionSuccess: (
    updatedAsset: OfficeAsset,
    newTransaction: AssetTransaction
  ) => void;
  registeredLocations?: MasterBuildingLocation[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  allAssets,
  token,
  currentUserEmail,
  workspaceConfig,
  onTransactionSuccess,
  registeredLocations = [],
}) => {
  const [assetId, setAssetId] = useState<string>(selectedAsset?.id || (allAssets[0]?.id || ''));
  const [transactionType, setTransactionType] = useState<TransactionType>('PEMINJAMAN');
  const [quantity, setQuantity] = useState<number>(1);
  const [staffName, setStaffName] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('Engineering');
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [conditionBefore, setConditionBefore] = useState<AssetCondition>('Baik');
  const [conditionAfter, setConditionAfter] = useState<AssetCondition>('Baik');
  const [newLocation, setNewLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDriveUrl, setPhotoDriveUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Notification State
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);

  // Loading & Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Current active asset object
  const currentAsset = allAssets.find((a) => a.id === assetId) || selectedAsset || allAssets[0];

  useEffect(() => {
    if (selectedAsset) {
      setAssetId(selectedAsset.id);
      setConditionBefore(selectedAsset.condition);
      setConditionAfter(selectedAsset.condition);
      setNewLocation(selectedAsset.location);
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (currentAsset) {
      setConditionBefore(currentAsset.condition);
      setConditionAfter(currentAsset.condition);
      setNewLocation(currentAsset.location);
    }
  }, [assetId]);

  useEffect(() => {
    if (currentUserEmail && !emailRecipient) {
      setEmailRecipient(staffEmail || currentUserEmail);
    } else if (staffEmail) {
      setEmailRecipient(staffEmail);
    }
  }, [staffEmail, currentUserEmail]);

  if (!isOpen) return null;

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  // Quick preset dates for expected return
  const handleSetReturnDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setExpectedReturnDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset) {
      setErrorMessage('Pilih aset terlebih dahulu.');
      return;
    }

    if (!staffName.trim()) {
      setErrorMessage('Nama staf / penanggung jawab wajib diisi.');
      return;
    }

    // Stock validations
    if (transactionType === 'PEMINJAMAN' && quantity > currentAsset.availableStock) {
      setErrorMessage(
        `Stok tersedia tidak mencukupi! Sisa stok tersedia: ${currentAsset.availableStock} ${currentAsset.unit}.`
      );
      return;
    }

    if (transactionType === 'PENGEMBALIAN' && quantity > currentAsset.borrowedStock) {
      setErrorMessage(
        `Jumlah yang dikembalikan (${quantity}) melebihi jumlah yang sedang dipinjam (${currentAsset.borrowedStock} unit).`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const trxId = `TRX-${Date.now().toString().slice(-6)}`;
      const dateStr = date.replace('T', ' ');
      const dateOnly = date.split('T')[0];

      let uploadedPhotoUrl = photoDriveUrl || currentAsset.lastPhotoUrl || '';
      let uploadedFileId = '';
      let driveFolderPath = `AsetKantor_Dokumentasi_Foto / ${currentAsset.id} / ${dateOnly}`;

      // 1. Upload photo to Google Drive if photo is provided and token exists
      if (photoFile) {
        setSubmitStep('Mengunggah bukti foto kondisi ke Google Drive...');
        const fileName = `KONDISI_${currentAsset.id}_${dateOnly}_${trxId}.jpg`;

        if (token) {
          try {
            const driveResult = await uploadConditionPhotoToDrive(
              token,
              photoFile,
              fileName,
              currentAsset.id,
              dateOnly
            );
            uploadedPhotoUrl = driveResult.webViewLink;
            uploadedFileId = driveResult.fileId;
            driveFolderPath = driveResult.folderPath;
          } catch (driveErr: any) {
            console.warn('Gagal upload ke Drive API, gunakan local preview url:', driveErr);
            uploadedPhotoUrl = photoPreview || '';
          }
        } else {
          // Offline / Local preview fallback
          uploadedPhotoUrl = photoPreview || '';
        }
      }

      // 2. Compute automated stock changes
      let updatedTotal = currentAsset.totalStock;
      let updatedAvailable = currentAsset.availableStock;
      let updatedBorrowed = currentAsset.borrowedStock;
      let updatedDamaged = currentAsset.damagedStock;
      let updatedStatus = currentAsset.status;
      let updatedCondition = conditionAfter;
      let updatedLocation = currentAsset.location;

      if (transactionType === 'PEMINJAMAN') {
        updatedAvailable = Math.max(0, currentAsset.availableStock - quantity);
        updatedBorrowed = currentAsset.borrowedStock + quantity;
        updatedStatus = updatedAvailable === 0 ? 'Sedang Dipinjam' : 'Tersedia';
      } else if (transactionType === 'PENGEMBALIAN') {
        updatedBorrowed = Math.max(0, currentAsset.borrowedStock - quantity);
        if (conditionAfter === 'Rusak Berat' || conditionAfter === 'Perlu Perbaikan') {
          updatedDamaged = currentAsset.damagedStock + quantity;
          updatedStatus = 'Dalam Perbaikan';
        } else {
          updatedAvailable = currentAsset.availableStock + quantity;
          updatedStatus = 'Tersedia';
        }
      } else if (transactionType === 'MUTASI_LOKASI') {
        updatedLocation = newLocation || currentAsset.location;
      } else if (transactionType === 'PERBAIKAN') {
        updatedAvailable = Math.max(0, currentAsset.availableStock - quantity);
        updatedDamaged = currentAsset.damagedStock + quantity;
        updatedStatus = 'Dalam Perbaikan';
      } else if (transactionType === 'TAMBAH_STOK') {
        updatedTotal = currentAsset.totalStock + quantity;
        updatedAvailable = currentAsset.availableStock + quantity;
        updatedStatus = 'Tersedia';
      } else if (transactionType === 'AFKIR_RUSAK') {
        updatedAvailable = Math.max(0, currentAsset.availableStock - quantity);
        updatedDamaged = currentAsset.damagedStock + quantity;
      }

      // Final status condition check
      if (updatedAvailable <= 1 && updatedTotal > 0) {
        updatedStatus = 'Stok Kritis';
      }

      const updatedAsset: OfficeAsset = {
        ...currentAsset,
        totalStock: updatedTotal,
        availableStock: updatedAvailable,
        borrowedStock: updatedBorrowed,
        damagedStock: updatedDamaged,
        condition: updatedCondition,
        status: updatedStatus,
        location: updatedLocation,
        lastPhotoUrl: uploadedPhotoUrl || currentAsset.lastPhotoUrl,
        lastPhotoDate: dateOnly,
        updatedAt: new Date().toISOString(),
      };

      const newTransaction: AssetTransaction = {
        id: trxId,
        assetId: currentAsset.id,
        assetName: currentAsset.name,
        type: transactionType,
        quantity,
        staffName,
        staffEmail: staffEmail || emailRecipient,
        department,
        date: dateStr,
        expectedReturnDate: expectedReturnDate || undefined,
        conditionBefore,
        conditionAfter,
        locationBefore: currentAsset.location,
        locationAfter: updatedLocation,
        photoDriveUrl: uploadedPhotoUrl,
        photoDriveFileId: uploadedFileId,
        photoDriveFolderName: driveFolderPath,
        notes,
        emailNotificationSent: false,
        emailRecipient: emailRecipient || staffEmail || (currentUserEmail || ''),
      };

      // 3. Send Email Notification via Gmail API if enabled
      if (sendEmail && emailRecipient) {
        setSubmitStep('Mengirim notifikasi email status via Gmail...');
        try {
          if (token) {
            const { subject, html } = buildAssetStatusEmailTemplate(updatedAsset, newTransaction);
            await sendGmailMessage(token, {
              to: emailRecipient,
              subject,
              htmlBody: html,
            });
            newTransaction.emailNotificationSent = true;
          }
        } catch (emailErr: any) {
          console.warn('Gagal kirim Gmail (tetap lanjut menyimpan transaksi):', emailErr);
        }
      }

      // 4. Sync with Google Sheets if configured and token exists
      if (token && workspaceConfig.spreadsheetId) {
        setSubmitStep('Memperbarui data dan stok di Google Sheets...');
        try {
          // Append transaction log to Riwayat_Mutasi
          const trxRow = transactionToRow(newTransaction);
          await appendRow(token, workspaceConfig.spreadsheetId, 'Riwayat_Mutasi', trxRow);

          // Update asset inventory
          const updatedAllAssets = allAssets.map((a) => (a.id === updatedAsset.id ? updatedAsset : a));
          await syncAssetsToSheet(token, workspaceConfig.spreadsheetId, updatedAllAssets);
        } catch (sheetErr: any) {
          console.warn('Gagal sinkronisasi Google Sheets:', sheetErr);
        }
      }

      setSubmitStep('Transaksi berhasil dicatat!');
      onTransactionSuccess(updatedAsset, newTransaction);
      onClose();
    } catch (err: any) {
      console.error('Submit transaction error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses transaksi');
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Catat Mutasi / Peminjaman Aset</h3>
              <p className="text-xs text-slate-400">
                Pembaruan stok otomatis & upload foto kondisi ke Google Drive
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Aset & Jenis Transaksi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Aset Kantor *
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {allAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.id}] {a.name} (Tersedia: {a.availableStock} {a.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Transaksi / Mutasi *
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PEMINJAMAN">📌 Peminjaman Staf</option>
                <option value="PENGEMBALIAN">✅ Pengembalian Aset</option>
                <option value="MUTASI_LOKASI">📍 Relokasi / Pindah Lokasi</option>
                <option value="PERBAIKAN">🔧 Perbaikan / Servis Maintenance</option>
                <option value="TAMBAH_STOK">➕ Tambah Pasokan Stok</option>
                <option value="AFKIR_RUSAK">⚠️ Kerusakan / Afkir Barang</option>
              </select>
            </div>
          </div>

          {/* Asset Live Stock Insight Banner */}
          {currentAsset && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-800">{currentAsset.name}</span>
                <span className="text-slate-500 text-[11px] block">
                  Lokasi Saat Ini: <strong>{currentAsset.location}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-700">
                  {currentAsset.availableStock} {currentAsset.unit} Tersedia
                </span>
                <span className="text-[11px] text-slate-500 block">
                  (Dipinjam: {currentAsset.borrowedStock} | Total: {currentAsset.totalStock})
                </span>
              </div>
            </div>
          )}

          {/* Section 2: Detail Transaksi & Staf */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Data Staf & Transaksi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Unit *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={transactionType === 'PEMINJAMAN' ? currentAsset?.availableStock || 99 : 99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <span className="text-xs text-slate-500">{currentAsset?.unit || 'Unit'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Staf / PIC *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian Pratama"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departemen / Divisi
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Engineering">Engineering / IT</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="General Affairs">General Affairs (GA)</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Human Resources">Human Resources (HR)</option>
                  <option value="Operasional">Operasional Lapangan</option>
                  <option value="Direksi / Eksekutif">Direksi / Eksekutif</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Transaksi *
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>

              {transactionType === 'PEMINJAMAN' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Estimasi Tanggal Kembali
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSetReturnDays(3)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                      >
                        +3 hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetReturnDays(7)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                      >
                        +1 mgg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetReturnDays(30)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                      >
                        +1 bln
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              {transactionType === 'MUTASI_LOKASI' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Lokasi Baru Aset *
                    </label>
                    {registeredLocations.length > 0 && (
                      <span className="text-[10px] text-blue-600 font-semibold">
                        {registeredLocations.length} titik master
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="trx-registered-locations-list"
                    placeholder="Pilih dari master atau ketik lokasi baru..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                  <datalist id="trx-registered-locations-list">
                    {registeredLocations.map((loc) => (
                      <option
                        key={loc.id}
                        value={`${loc.buildingName} - ${loc.floor} (${loc.roomName})`}
                      />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            {/* Condition assessment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Kondisi Sebelum Mutasi
                </label>
                <select
                  value={conditionBefore}
                  onChange={(e) => setConditionBefore(e.target.value as AssetCondition)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kondisi Saat Ini / Setelah Mutasi *
                </label>
                <select
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value as AssetCondition)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="Baik">Baik (Normal)</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: FOTO BUKTI KONDISI BARANG (GOOGLE DRIVE) */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  Foto Bukti Kondisi Barang (Google Drive)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Disimpan terstruktur di folder Google Drive: <code>AsetKantor_Dokumentasi_Foto / {currentAsset?.id || 'AST'} / [Tanggal]</code>
                </p>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                Wajib Bukti Fisik
              </span>
            </div>

            {/* Photo Uploader Dropzone & Camera */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 transition rounded-xl p-4 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="condition-photo-upload"
              />

              {photoPreview ? (
                <div className="relative inline-block group">
                  <img
                    src={photoPreview}
                    alt="Pratinjau Bukti Fisik"
                    className="max-h-48 rounded-lg object-contain shadow-md mx-auto border border-slate-200"
                  />
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium hover:bg-slate-100"
                    >
                      Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="text-xs px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-md text-rose-600 font-medium hover:bg-rose-100"
                    >
                      Hapus
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    ✓ Foto siap diunggah ke Google Drive & ditautkan ke record aset
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Ambil Foto / Pilih Berkas Bukti
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mendukung format JPG, PNG, atau kamera smartphone langsung
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: NOTIFIKASI EMAIL GMAIL */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Kirim Notifikasi Email Status via Gmail
                </span>
              </label>

              {sendEmail && (
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  {showEmailPreview ? 'Tutup Pratinjau' : 'Lihat Pratinjau Email'}
                </button>
              )}
            </div>

            {sendEmail && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Email Penerima Notifikasi (Staf / PIC / Manajer) *
                  </label>
                  <input
                    type="email"
                    placeholder="nama.staf@perusahaan.com"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {showEmailPreview && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 font-mono text-slate-700">
                    <p className="font-bold text-slate-900 font-sans">
                      Subject: [AsetKantor] Notifikasi: {transactionType} - {currentAsset?.name} ({currentAsset?.id})
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Isi email mencakup rincian staf ({staffName || 'Nama Staf'}), divisi, jumlah unit, kondisi awal/akhir, dan tombol langsung ke tautan foto Google Drive.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Catatan Tambahan */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Alasan Mutasi
            </label>
            <textarea
              rows={2}
              placeholder="Tambahkan catatan khusus, nomor surat jalan, atau keterangan penting lainnya..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            ></textarea>
          </div>

          {/* Footer Submit */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {isSubmitting ? (
                <span className="flex items-center gap-2 text-blue-600 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {submitStep || 'Sedang memproses...'}
                </span>
              ) : (
                <span>Stok dan log mutasi otomatis diperbarui ke Google Sheets & Drive</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi & Simpan Mutasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
