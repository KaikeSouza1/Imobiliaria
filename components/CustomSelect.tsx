"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

export default function CustomSelect({ label, icon, value, onChange, options }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calcula posição absoluta na tela para escapar de qualquer overflow:hidden pai
  const handleOpen = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = options.find((opt) => opt.value === value)?.label || options[0]?.label || "Selecione";

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label className="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2 px-1">
        {icon} {label}
      </label>

      <div className="relative w-full">
        <button
          onClick={handleOpen}
          className="w-full bg-white text-gray-800 font-bold py-3.5 px-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-transparent focus:border-green-400 outline-none"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            size={16}
            className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-green-600" : "text-gray-400"}`}
          />
        </button>

        {isOpen && (
          <div
            style={dropdownStyle}
            className="bg-white rounded-xl shadow-2xl border border-gray-100 py-2 max-h-72 overflow-y-auto"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between
                  ${value === opt.value ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {opt.label}
                {value === opt.value && <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-5 py-3 text-xs text-gray-400 font-medium">Nenhuma opção disponível</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}