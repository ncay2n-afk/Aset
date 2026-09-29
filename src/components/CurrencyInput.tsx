import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { formatNumberWithDots, parseNumberFromDots } from '../utils/currencyFormatter';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  prefix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  prefix = 'Rp',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // Compute formatted text with dots: e.g. 15000000 -> "15.000.000"
  const formattedValue = value > 0 ? formatNumberWithDots(value) : '';

  useLayoutEffect(() => {
    if (cursorPos !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [cursorPos, formattedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawVal = input.value;
    const selStart = input.selectionStart || 0;

    // Count how many numeric digits were before the cursor in the typed text
    const digitsBeforeCursor = rawVal.slice(0, selStart).replace(/\D/g, '').length;

    // Parse clean numeric integer
    const numeric = parseNumberFromDots(rawVal);
    onChange(numeric);

    // Format new text to find where the cursor should land
    const newFormatted = numeric > 0 ? formatNumberWithDots(numeric) : '';
    let newCursor = 0;
    let digitsCount = 0;

    if (digitsBeforeCursor === 0) {
      newCursor = 0;
    } else {
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          digitsCount++;
        }
        if (digitsCount === digitsBeforeCursor) {
          newCursor = i + 1;
          break;
        }
      }
      if (digitsCount < digitsBeforeCursor) {
        newCursor = newFormatted.length;
      }
    }

    setCursorPos(newCursor);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) return;

    // If backspace is pressed immediately following a dot (e.g. "15.|000"),
    // remove the digit before that dot so the user isn't stuck.
    if (e.key === 'Backspace' && input.selectionStart === input.selectionEnd) {
      const pos = input.selectionStart || 0;
      if (pos > 1 && input.value[pos - 1] === '.') {
        e.preventDefault();
        const before = input.value.slice(0, pos - 2);
        const after = input.value.slice(pos);
        const newRaw = before + after;
        const numeric = parseNumberFromDots(newRaw);
        onChange(numeric);

        const newFormatted = numeric > 0 ? formatNumberWithDots(numeric) : '';
        const digitsBefore = before.replace(/\D/g, '').length;
        let newCursor = 0;
        let dCount = 0;
        for (let i = 0; i < newFormatted.length; i++) {
          if (/\d/.test(newFormatted[i])) dCount++;
          if (dCount === digitsBefore) {
            newCursor = i + 1;
            break;
          }
        }
        setCursorPos(newCursor);
      }
    }
  };

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-xs font-bold text-slate-500 select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={formattedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full ${prefix ? 'pl-9' : 'pl-3'} pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${className}`}
      />
    </div>
  );
};
