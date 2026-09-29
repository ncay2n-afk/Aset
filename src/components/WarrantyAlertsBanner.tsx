import React from 'react';
import { ShieldAlert, AlertTriangle, Calendar, Car, Wrench, ArrowRight } from 'lucide-react';
import { OfficeAsset } from '../types';

interface WarrantyAlertsBannerProps {
  assets: OfficeAsset[];
  onSelectAsset: (asset: OfficeAsset) => void;
}

export const WarrantyAlertsBanner: React.FC<WarrantyAlertsBannerProps> = ({
  assets,
  onSelectAsset,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check warranties & taxes
  const alerts: {
    asset: OfficeAsset;
    type: 'WARRANTY' | 'TAX';
    title: string;
    daysDiff: number;
    isExpired: boolean;
  }[] = [];

  assets.forEach((asset) => {
    // 1. Warranty
    if (asset.warrantyExpiryDate) {
      const exp = new Date(asset.warrantyExpiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        alerts.push({
          asset,
          type: 'WARRANTY',
          title: diffDays < 0 ? `Garansi HABIS (${Math.abs(diffDays)} hari lalu)` : `Garansi berakhir dlm ${diffDays} hari`,
          daysDiff: diffDays,
          isExpired: diffDays < 0,
        });
      }
    }

    // 2. Tax / Vehicle STNK
    if (asset.taxExpiryDate) {
      const exp = new Date(asset.taxExpiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        alerts.push({
          asset,
          type: 'TAX',
          title: diffDays < 0 ? `Pajak STNK TELAT (${Math.abs(diffDays)} hari)` : `Jatuh tempo pajak dlm ${diffDays} hari`,
          daysDiff: diffDays,
          isExpired: diffDays < 0,
        });
      }
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-2xs">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
            Peringatan Jatuh Tempo Garansi & Pajak Kendaraan ({alerts.length} Perhatian)
          </h4>
        </div>
        <span className="text-[10px] text-amber-800 font-semibold hidden sm:inline">
          Proaktif pencegahan denda pajak & klaim garansi vendor
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {alerts.slice(0, 3).map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectAsset(item.asset)}
            className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs hover:border-amber-400 transition cursor-pointer flex items-center justify-between"
          >
            <div className="overflow-hidden space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    item.isExpired ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {item.type === 'TAX' ? 'Pajak STNK' : 'Garansi'}
                </span>
                <span className="font-mono text-[10px] text-slate-500 truncate">{item.asset.id}</span>
              </div>
              <p className="font-bold text-xs text-slate-900 truncate">{item.asset.name}</p>
              <p className={`text-[10px] font-semibold ${item.isExpired ? 'text-rose-600' : 'text-amber-700'}`}>
                {item.title}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
};
