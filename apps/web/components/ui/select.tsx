"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder, className, error, disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click (both wrapper and portal dropdown)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedWrapper = wrapperRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedWrapper && !clickedDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownMaxH = 240; // max-h-60
      const openUpward = spaceBelow < dropdownMaxH + 8 && rect.top > dropdownMaxH;

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const displayValue = () => {
    const option = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value,
    );
    if (option) return typeof option === "string" ? option : option.label;
    if (!value && placeholder) return placeholder;
    return "\u00A0";
  };

  const dropdown = isOpen && (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
    >
      {options.map((opt) => {
        const isString = typeof opt === "string";
        const optValue = isString ? opt : opt.value;
        const optLabel = isString ? opt : opt.label;
        return (
          <div
            key={optValue}
            className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low text-on-surface"
            onMouseDown={(e) => {
              // prevent blur-before-click race
              e.preventDefault();
              handleSelect(optValue);
            }}
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
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          className={cn(
            "w-full h-10 border rounded-lg px-3 py-2 text-body-sm bg-white focus:outline-none focus:ring-1 transition-all text-left pr-10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus:border-error focus:ring-error/20"
              : "border-outline-variant focus:border-primary-container focus:ring-primary-fixed-dim",
            className,
          )}
          onClick={handleToggle}
        >
          <span className={cn("block truncate", !value && "text-on-surface-variant/60")}>
            {displayValue()}
          </span>
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-on-surface-variant/60 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </div>

      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
