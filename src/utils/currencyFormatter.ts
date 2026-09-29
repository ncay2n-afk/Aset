/**
 * Utility functions for Indonesian Rupiah (IDR) currency formatting with dots as thousand separators.
 */

export const formatNumberWithDots = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numStr, 10));
};

export const parseNumberFromDots = (val: string): number => {
  if (!val) return 0;
  const cleanStr = val.replace(/\D/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
};

export const formatRupiah = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
};
