export interface CodeItem {
  code: string;
  name: string;
}

export const KODE_BIDANG_LIST: CodeItem[] = [
  { code: '01', name: 'Barang Bergerak Elektronik' },
  { code: '04', name: 'Barang Bergerak Non Elektronik' },
  { code: '02', name: 'Barang Tak Bergerak Elektronik' },
  { code: '03', name: 'Barang Tak Bergerak Non Elektronik' },
];

export const KODE_DIVISI_LIST: CodeItem[] = [
  { code: '01', name: 'Direksi dan Dewan Pengawas' },
  { code: '02', name: 'SDM' },
  { code: '03', name: 'Keuangan' },
  { code: '04', name: 'Operasional' },
  { code: '05', name: 'Marketing' },
  { code: '06', name: 'Pergudangan' },
  { code: '07', name: 'Pangan' },
  { code: '08', name: 'Rusunawa' },
  { code: '09', name: 'Air Bersih' },
  { code: '10', name: 'Parkir' },
  { code: '11', name: 'Assist Kapal' },
  { code: '12', name: 'Teras Samarinda' },
  { code: '13', name: 'Kost Syariah' },
  { code: '14', name: 'Head Office' },
];

export const KODE_SUB_KELOMPOK_LIST: CodeItem[] = [
  { code: '001', name: 'Laptop' },
  { code: '002', name: 'Printer' },
  { code: '003', name: 'Mouse' },
  { code: '004', name: 'Speaker' },
  { code: '005', name: 'Monitor' },
  { code: '006', name: 'Keyboard' },
  { code: '007', name: 'Ac' },
  { code: '008', name: 'Dispenser' },
  { code: '009', name: 'Jam Dinding' },
  { code: '010', name: 'Router' },
  { code: '011', name: 'Modem' },
  { code: '012', name: 'Proyektor' },
  { code: '013', name: 'Kursi Kerja' },
  { code: '014', name: 'Meja Kerja' },
  { code: '015', name: 'Kendaraan Roda 4' },
  { code: '016', name: 'Kendaraan Roda 2' },
  { code: '099', name: 'Peralatan Kantor Lainnya' },
];

/**
 * Format pembuatan kode barang:
 * [XX].[XX].[XXX].[XXX].[XX]
 * Kode Bidang . Kode Divisi . Kode Sub Kelompok . Kode Urutan Barang . Tahun Pembelian
 */
export function formatAssetCode(
  kodeBidang: string,
  kodeDivisi: string,
  kodeSubKelompok: string,
  kodeUrutan: string | number,
  tahun: string | number
): string {
  const b = (kodeBidang || '01').padStart(2, '0').slice(-2);
  const d = (kodeDivisi || '14').padStart(2, '0').slice(-2);
  const sk = (kodeSubKelompok || '001').padStart(3, '0').slice(-3);
  const u = String(kodeUrutan || '1').padStart(3, '0').slice(-3);
  const yStr = String(tahun || new Date().getFullYear()).slice(-2).padStart(2, '0');

  return `${b}.${d}.${sk}.${u}.${yStr}`;
}

export function parseAssetCode(code: string): {
  bidang: string;
  bidangName: string;
  divisi: string;
  divisiName: string;
  subKelompok: string;
  subKelompokName: string;
  urutan: string;
  tahun: string;
  isValid: boolean;
} {
  // Support both dot separated (01.14.001.001.24) and dash separated (01-14-001-001-24)
  const parts = code.split(/[.-]/);
  if (parts.length >= 5) {
    const bidang = parts[0].padStart(2, '0');
    const divisi = parts[1].padStart(2, '0');
    const subKelompok = parts[2].padStart(3, '0');
    const urutan = parts[3].padStart(3, '0');
    const tahun = parts[4].padStart(2, '0');

    const bidangObj = KODE_BIDANG_LIST.find((item) => item.code === bidang);
    const divisiObj = KODE_DIVISI_LIST.find((item) => item.code === divisi);
    const subKelompokObj = KODE_SUB_KELOMPOK_LIST.find((item) => item.code === subKelompok);

    return {
      bidang,
      bidangName: bidangObj ? bidangObj.name : 'Bidang Khusus',
      divisi,
      divisiName: divisiObj ? divisiObj.name : 'Divisi Khusus',
      subKelompok,
      subKelompokName: subKelompokObj ? subKelompokObj.name : 'Sub Kelompok',
      urutan,
      tahun,
      isValid: true,
    };
  }

  return {
    bidang: '01',
    bidangName: 'Barang Bergerak Elektronik',
    divisi: '14',
    divisiName: 'Head Office',
    subKelompok: '001',
    subKelompokName: 'Umum',
    urutan: '001',
    tahun: String(new Date().getFullYear()).slice(-2),
    isValid: false,
  };
}
