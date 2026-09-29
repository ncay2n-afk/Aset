import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, FileText, CheckCircle2, Eraser, PenTool, ExternalLink, HardDrive } from 'lucide-react';
import { AssetTransaction, OfficeAsset, MasterCompanySettings } from '../types';

interface BastModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: AssetTransaction | null;
  asset: OfficeAsset | null;
  onSaveSignature?: (trxId: string, signatureUrl: string) => void;
  companySettings?: MasterCompanySettings;
}

export const BastModal: React.FC<BastModalProps> = ({
  isOpen,
  onClose,
  transaction,
  asset,
  onSaveSignature,
  companySettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const bastNumber = `BAST/AST/${transaction.date.slice(0, 4)}/${transaction.date.slice(5, 7)}/${transaction.id.replace('TRX-', '')}`;

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureSaved(false);
  };

  const handleSaveSignature = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (onSaveSignature) {
      onSaveSignature(transaction.id, dataUrl);
    }
    setSignatureSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Berita Acara Serah Terima (BAST) Digital</h3>
              <p className="text-xs text-slate-400">
                Dokumen legal pertanggungjawaban fisik inventaris kantor
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

        {/* BAST Body */}
        <div className="p-8 space-y-6 text-slate-900 text-xs leading-relaxed max-h-[80vh] overflow-y-auto font-sans">
          {/* Official Letterhead */}
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
                {companySettings?.brandSubtitle || 'DIVISI GENERAL AFFAIRS (GA) & IT ASSET MANAGEMENT'}
              </p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-black underline uppercase tracking-tight">
              BERITA ACARA SERAH TERIMA ASET KANTOR (BAST)
            </h3>
            <p className="font-mono text-slate-500 text-[11px]">
              Nomor Dokumen: <strong>{bastNumber}</strong>
            </p>
          </div>

          <p>
            Pada hari ini, tanggal <strong>{transaction.date}</strong>, telah dilakukan serah terima fisik aset kantor antara para pihak sebagai berikut:
          </p>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">
                PIHAK PERTAMA (PENGELOLA ASET)
              </p>
              <p>Nama: <strong>{asset?.custodian || 'General Affairs Supervisor'}</strong></p>
              <p>Jabatan: <strong>Asset & Facility Manager</strong></p>
              <p>Departemen: <strong>General Affairs / IT</strong></p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">
                PIHAK KEDUA (PENERIMA / PEMINJAM)
              </p>
              <p>Nama: <strong>{transaction.staffName}</strong></p>
              <p>Email: <strong>{transaction.staffEmail || '-'}</strong></p>
              <p>Departemen: <strong>{transaction.department}</strong></p>
            </div>
          </div>

          {/* Asset details table */}
          <div>
            <p className="font-bold mb-2">Rincian Barang / Aset yang Diserahterimakan:</p>
            <table className="w-full text-left border border-slate-300 text-[11px]">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Kode Aset</th>
                  <th className="p-2 border-r border-slate-300">Nama Barang & Spesifikasi</th>
                  <th className="p-2 border-r border-slate-300">Jumlah</th>
                  <th className="p-2 border-r border-slate-300">Kondisi Fisik</th>
                  <th className="p-2">Jatuh Tempo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-mono font-semibold">
                    {transaction.assetId}
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    <p className="font-bold">{transaction.assetName}</p>
                    <p className="text-[10px] text-slate-500">
                      SKU: {asset?.sku || '-'} &bull; Lokasi: {transaction.locationAfter || asset?.location || '-'}
                    </p>
                  </td>
                  <td className="p-2 border-r border-slate-300 font-bold">
                    {transaction.quantity} {asset?.unit || 'Unit'}
                  </td>
                  <td className="p-2 border-r border-slate-300">
                    <span className="font-semibold">{transaction.conditionAfter}</span>
                  </td>
                  <td className="p-2">
                    {transaction.expectedReturnDate || 'Tidak Ditentukan'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Condition Photo Attached */}
          {transaction.photoDriveUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={transaction.photoDriveUrl}
                  alt="Bukti Fisik BAST"
                  className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-xs"
                />
                <div>
                  <p className="font-bold text-slate-800">
                    Bukti Kondisi Fisik Terverifikasi di Google Drive
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Folder: {transaction.photoDriveFolderName}
                  </p>
                </div>
              </div>
              <a
                href={transaction.photoDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <span>Buka Foto Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Notes & Terms */}
          <div className="text-[10px] text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 space-y-1">
            <p className="font-bold text-slate-700">Ketentuan & Kewajiban Peminjam:</p>
            <p>1. Peminjam bertanggung jawab penuh atas pemeliharaan dan keamanan fisik aset selama masa penggunaan.</p>
            <p>2. Segala bentuk kerusakan atau kehilangan wajib segera dilaporkan kepada Divisi GA.</p>
            <p>3. Pihak Kedua setuju mengembalikan barang dalam kondisi baik pada waktu yang disepakati.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
            {/* Pihak Pertama */}
            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800">PIHAK PERTAMA,</p>
              <div className="h-16 flex items-center justify-center">
                <span className="font-serif italic text-slate-400 text-lg">
                  [Verified Digital Stamp]
                </span>
              </div>
              <div>
                <p className="font-bold underline text-slate-900">
                  {asset?.custodian || 'Budi Santoso'}
                </p>
                <p className="text-[10px] text-slate-500">Asset Management PIC</p>
              </div>
            </div>

            {/* Pihak Kedua (With Signature Pad) */}
            <div className="text-center space-y-2">
              <p className="font-bold text-slate-800">PIHAK KEDUA (PENERIMA),</p>

              {/* Signature Canvas */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 max-w-[280px] mx-auto">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={100}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[100px]"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[11px] gap-1">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Tanda Tangan di Sini</span>
                  </div>
                )}
              </div>

              {/* Canvas controls (no-print) */}
              <div className="flex items-center justify-center gap-2 no-print">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] flex items-center gap-1"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
                {hasSignature && !signatureSaved && (
                  <button
                    type="button"
                    onClick={handleSaveSignature}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Kunci Tanda Tangan</span>
                  </button>
                )}
                {signatureSaved && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tersimpan
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{transaction.staffName}</p>
                <p className="text-[10px] text-slate-500">{transaction.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions (no-print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Dokumen BAST dapat langsung dicetak atau disimpan sebagai arsip PDF resmi.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Download PDF BAST</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
