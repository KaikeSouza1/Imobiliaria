"use client"; // Obrigatório para interatividade

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label: string;
  icon: React.ReactNode;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function CustomSelect({ label, icon, options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o menu se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || "Selecione";

  return (
    <div className="relative w-full group" ref={containerRef}>
      <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1 mb-2 ml-2 group-hover:text-green-600 transition-colors">
        {icon} {label}
      </label>
      
      {/* O Botão que parece um Select */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 text-left px-4 py-3 rounded-xl border border-gray-200 flex justify-between items-center transition-all
        ${isOpen ? 'border-green-500 ring-2 ring-green-100' : 'hover:border-green-400'}`}
      >
        <span className={`font-bold text-sm truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value ? selectedLabel : "Todos"}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-500' : ''}`} />
      </button>

      {/* A Lista Flutuante (Dropdown) */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 text-sm font-medium cursor-pointer flex items-center justify-between transition-colors
                ${value === option.value ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-slate-50 hover:text-green-600'}`}
              >
                {option.label}
                {value === option.value && <Check size={14} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}