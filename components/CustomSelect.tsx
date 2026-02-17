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

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "Todos";

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label className="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2 px-1">
        {icon} {label}
      </label>
      
      <div className="relative w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white text-gray-800 font-bold py-3.5 px-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all border border-transparent focus:border-green-400 outline-none"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-green-600" : "text-gray-400"}`} />
        </button>

        {/* LISTA DE OPÇÕES - Ajustada para w-full */}
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl z-[100] border border-gray-100 py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
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
                {value === opt.value && <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>}
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