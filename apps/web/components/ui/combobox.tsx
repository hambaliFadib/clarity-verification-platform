"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function Combobox({ value, onChange, options, placeholder, className, error, disabled }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value with input value when closed
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value);
    }
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (val: string) => {
    setInputValue(val);
    onChange(val);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full border rounded-lg px-3 py-2 text-body-sm bg-white focus:outline-none focus:ring-1 transition-all pr-10",
            error ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary-container focus:ring-primary-fixed-dim",
            disabled && "bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed",
            className
          )}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => !disabled && setIsOpen(true)}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center pr-3",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <ChevronDown className="h-4 w-4 text-on-surface-variant/60" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
          {inputValue.trim() && !options.find(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <div
              className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low text-primary font-medium"
              onClick={() => handleSelect(inputValue.trim())}
            >
              Use "{inputValue.trim()}"
            </div>
          )}
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low text-on-surface"
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
          {filteredOptions.length === 0 && !inputValue.trim() && (
            <div className="px-3 py-2 text-body-sm text-on-surface-variant italic">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
