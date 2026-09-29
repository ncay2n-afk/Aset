import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Scan,
  Search,
  ArrowRightLeft,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Tag,
  Camera,
  CameraOff,
  SwitchCamera
} from 'lucide-react';
import jsQR from 'jsqr';
import { OfficeAsset } from '../types';
import { parseAssetCode } from '../data/assetCodeGenerator';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAssets: OfficeAsset[];
  onSelectAssetForTransaction: (asset: OfficeAsset) => void;
  onSelectAssetForLabel: (asset: OfficeAsset) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  allAssets,
  onSelectAssetForTransaction,
  onSelectAssetForLabel,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [matchedAsset, setMatchedAsset] = useState<OfficeAsset | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Live Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const handleSearch = useCallback((codeToSearch: string) => {
    const trimmed = codeToSearch.trim().toLowerCase();
    if (!trimmed) {
      setMatchedAsset(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    let targetCode = trimmed;
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.id) targetCode = parsed.id.toLowerCase();
      }
    } catch {}

    const found = allAssets.find(
      (a) =>
        a.id.toLowerCase() === targetCode ||
        a.sku.toLowerCase() === targetCode ||
        a.id.toLowerCase().includes(targetCode) ||
        a.name.toLowerCase().includes(targetCode)
    );

    setMatchedAsset(found || null);
  }, [allAssets]);

  // Video frame scanning loop with jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        setInputCode(code.data);
        handleSearch(code.data);
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleSearch, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung pada browser ini.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      setCameraError(err.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  const parsed = matchedAsset ? parseAssetCode(matchedAsset.id) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Pindai / Cari Cepat Barcode & QR Aset</h3>
              <p className="text-xs text-slate-400">
                Pencarian standar kode resep [XX].[XX].[XXX].[XXX].[XX]
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Live Camera Scanner Box */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
            {isCameraActive ? (
              <div className="relative aspect-video flex items-center justify-center bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-emerald-400 rounded-2xl relative animate-pulse shadow-lg">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                  </div>
                </div>

                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                      stopCamera();
                      setTimeout(startCamera, 200);
                    }}
                    className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl backdrop-blur-xs border border-slate-700 inline-flex items-center gap-1.5"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Ganti Kamera</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Tutup Kamera</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Camera className="w-5 h-5 text-blue-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Scan dengan Kamera HP / Laptop</h5>
                    <p className="text-[10px] text-slate-400">Pindai langsung stiker QR fisik barang</p>
                  </div>
                </div>
                <button
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera</span>
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Scanner Simulation / Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Atau Ketik Kode Barang / Tempel Hasil Barcode Laser *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Contoh: 01.14.001.001.24 atau SKU..."
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Sample Kode Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allAssets.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setInputCode(a.id);
                    handleSearch(a.id);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-mono rounded-lg border border-slate-200 transition"
                >
                  {a.id}
                </button>
              ))}
            </div>
          </div>

          {/* Matched Asset Result Card */}
          {matchedAsset ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded border border-amber-300 tracking-wider">
                    {matchedAsset.id}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1.5">
                    {matchedAsset.name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{matchedAsset.location}</span>
                    <span>• SKU: {matchedAsset.sku}</span>
                  </p>

                  {parsed && (
                    <div className="mt-2 text-[10px] text-slate-600 bg-white/80 p-2 rounded-lg border border-emerald-200/80 space-y-0.5">
                      <div>Bidang: <strong>{parsed.bidangName}</strong></div>
                      <div>Divisi: <strong>{parsed.divisiName}</strong> | Sub: <strong>{parsed.subKelompokName}</strong></div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 block">
                    {matchedAsset.availableStock} {matchedAsset.unit} Tersedia
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Total: {matchedAsset.totalStock} {matchedAsset.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    stopCamera();
                    onSelectAssetForLabel(matchedAsset);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak Stiker QR</span>
                </button>

                <button
                  onClick={() => {
                    stopCamera();
                    onSelectAssetForTransaction(matchedAsset);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Catat Mutasi / Pinjam</span>
                </button>
              </div>
            </div>
          ) : hasSearched && inputCode.trim() ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-700 space-y-1">
              <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
              <p className="font-semibold">Kode barang "{inputCode}" tidak ditemukan di database</p>
              <p className="text-slate-500 text-[11px]">
                Pastikan format sesuai resep penomoran [XX].[XX].[XXX].[XXX].[XX] atau nomor barcode SKU.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
