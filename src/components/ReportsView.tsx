import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Printer,
  PieChart,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Calculator,
  Wrench,
  DollarSign
} from 'lucide-react';
import { OfficeAsset, AssetTransaction, MaintenanceRecord } from '../types';

interface ReportsViewProps {
  assets: OfficeAsset[];
  transactions: AssetTransaction[];
  maintenanceRecords?: MaintenanceRecord[];
  spreadsheetUrl: string | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  assets,
  transactions,
  maintenanceRecords = [],
  spreadsheetUrl,
}) => {
  // 1. Valuation per Category
  const categorySummary = assets.reduce((acc, a) => {
    if (!acc[a.category]) {
      acc[a.category] = { count: 0, units: 0, value: 0 };
    }
    acc[a.category].count += 1;
    acc[a.category].units += a.totalStock;
    acc[a.category].value += a.purchasePrice * a.totalStock;
    return acc;
  }, {} as Record<string, { count: number; units: number; value: number }>);

  // 2. Loans per Department
  const departmentLoans = transactions
    .filter((t) => t.type === 'PEMINJAMAN')
    .reduce((acc, t) => {
      acc[t.department] = (acc[t.department] || 0) + t.quantity;
      return acc;
    }, {} as Record<string, number>);

  // 3. Condition breakdown
  const conditionCount = assets.reduce((acc, a) => {
    acc[a.condition] = (acc[a.condition] || 0) + a.totalStock;
    return acc;
  }, {} as Record<string, number>);

  const totalUnits = assets.reduce((sum, a) => sum + a.totalStock, 0);
  const totalBorrowed = assets.reduce((sum, a) => sum + a.borrowedStock, 0);
  const totalValue = assets.reduce((sum, a) => sum + a.purchasePrice * a.totalStock, 0);

  const utilizationRate = totalUnits > 0 ? Math.round((totalBorrowed / totalUnits) * 100) : 0;

  // 4. Portfolio Depreciation Calculation (Straight Line)
  const now = new Date();
  let totalAccumulatedDepreciation = 0;
  let totalNetBookValue = 0;

  const assetsWithDepreciation = assets.map((a) => {
    const usefulYears = a.category === 'Furnitur & Meja' ? 8 : a.category === 'Kendaraan Operasional' ? 5 : 4;
    const residualVal = Math.round(a.purchasePrice * 0.1);
    const depreciable = Math.max(0, a.purchasePrice - residualVal);
    const purchaseDt = new Date(a.purchaseDate || '2024-01-01');
    const months = Math.max(0, (now.getFullYear() - purchaseDt.getFullYear()) * 12 + (now.getMonth() - purchaseDt.getMonth()));
    const totalMonths = usefulYears * 12;
    const monthlyDep = depreciable / totalMonths;
    const accumulated = Math.min(depreciable, Math.round(months * monthlyDep));
    const bookVal = Math.max(residualVal, a.purchasePrice - accumulated);

    totalAccumulatedDepreciation += accumulated * a.totalStock;
    totalNetBookValue += bookVal * a.totalStock;

    return {
      ...a,
      monthsUsed: months,
      monthlyDepreciation: monthlyDep,
      accumulatedDepreciation: accumulated,
      bookValue: bookVal,
      pctDepreciated: Math.min(100, Math.round((accumulated / Math.max(depreciable, 1)) * 100)),
    };
  });

  // Total Maintenance Spending
  const totalMaintenanceSpent = maintenanceRecords.reduce((sum, m) => sum + (m.actualCost || m.estimatedCost || 0), 0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Aset',
      'Nama Aset',
      'Kategori',
      'SKU',
      'Total Stok',
      'Tersedia',
      'Dipinjam',
      'Kondisi',
      'Status',
      'Lokasi',
      'Harga Perolehan (IDR)',
      'Nilai Buku Terkini (IDR)',
      'Akumulasi Depresiasi (IDR)',
      'PIC',
    ];

    const rows = assetsWithDepreciation.map((a) => [
      `"${a.id}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.sku}"`,
      a.totalStock,
      a.availableStock,
      a.borrowedStock,
      `"${a.condition}"`,
      `"${a.status}"`,
      `"${a.location}"`,
      a.purchasePrice,
      a.bookValue,
      a.accumulatedDepreciation,
      `"${a.custodian}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Aset_Kantor_Depresiasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Tools */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Laporan Analitik, Finansial, & Penggunaan Real-Time
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventarisasi, nilai buku depresiasi, utilisasi divisi, dan biaya pemeliharaan kantor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nilai Perolehan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Nilai Perolehan
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {formatIDR(totalValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total biaya beli ({totalUnits} unit)
          </p>
        </div>

        {/* Nilai Buku Bersih (Net Book Value) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Nilai Buku Bersih (NBV)
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
            {formatIDR(totalNetBookValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Setelah dipotong akumulasi susut
          </p>
        </div>

        {/* Akumulasi Depresiasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Akumulasi Penyusutan
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
            {formatIDR(totalAccumulatedDepreciation)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Beban penyusutan garis lurus
          </p>
        </div>

        {/* Biaya Servis & Pemeliharaan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Biaya Maintenance
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-2">
            {formatIDR(totalMaintenanceSpent)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {maintenanceRecords.length} agenda servis tercatat
          </p>
        </div>
      </div>

      {/* Breakdown by Category & Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Distribusi & Nilai */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Distribusi & Valuasi per Kategori Aset
          </h4>
          <div className="space-y-3">
            {Object.entries(categorySummary).map(([catName, data]) => {
              const pct = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';
              return (
                <div key={catName} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-800">{catName}</span>
                    <span className="font-bold text-slate-900">{formatIDR(data.value)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{data.count} jenis item</span>
                    <span>{data.units} unit fisik</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peminjaman Berdasarkan Divisi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Peminjaman Aset Berdasarkan Departemen / Divisi
          </h4>
          {Object.keys(departmentLoans).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada riwayat transaksi peminjaman tercatat.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(departmentLoans).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="font-semibold text-slate-800">{dept}</span>
                  </div>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {count} Unit Dipinjam
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Depreciation Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-600" />
          Tabel Akuntansi Nilai Buku & Depresiasi Aset Terkini
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Kode & Nama Aset</th>
                <th className="py-2.5 px-3">Harga Beli</th>
                <th className="py-2.5 px-3">Masa Pakai</th>
                <th className="py-2.5 px-3">Akumulasi Susut</th>
                <th className="py-2.5 px-3">Nilai Buku Saat Ini</th>
                <th className="py-2.5 px-3">Sisa Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {assetsWithDepreciation.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900">{a.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 block">{a.id}</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{formatIDR(a.purchasePrice)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.monthsUsed} bulan</td>
                  <td className="py-2.5 px-3 text-rose-600 font-semibold">{formatIDR(a.accumulatedDepreciation)}</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-bold">{formatIDR(a.bookValue)}</td>
                  <td className="py-2.5 px-3">
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${100 - a.pctDepreciated}%` }}
                        className="bg-emerald-500 h-full"
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400">{100 - a.pctDepreciated}% tersisa</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
