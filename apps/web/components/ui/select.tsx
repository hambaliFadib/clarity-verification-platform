"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function Select({ value, onChange, options, placeholder, className, error }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const displayValue = () => {
    const option = options.find(opt =>
      typeof opt === "string" ? opt === value : opt.value === value
    );
    if (option) return typeof option === "string" ? option : option.label;
    if (!value && placeholder) return placeholder;
    return "\u00A0"; // Non-breaking space to preserve height
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <button
          type="button"
          className={cn(
            "w-full h-10 border rounded-lg px-3 py-2 text-body-sm bg-white focus:outline-none focus:ring-1 transition-all text-left pr-10",
            error ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary-container focus:ring-primary-fixed-dim",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={cn("block truncate", !value && "text-on-surface-variant/60")}>
            {displayValue()}
          </span>
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-on-surface-variant/60" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto py-1">
          {options.map((opt) => {
            const isString = typeof opt === "string";
            const optValue = isString ? opt : opt.value;
            const optLabel = isString ? opt : opt.label;

            return (
              <div
                key={optValue}
                className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low text-on-surface"
                onClick={() => handleSelect(optValue)}
              >
                {optLabel}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-body-sm text-on-surface-variant italic">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
