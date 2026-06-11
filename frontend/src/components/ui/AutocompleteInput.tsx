import React, { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchSuggestions: (query: string) => Promise<T[]>;
  renderSuggestion: (item: T) => React.ReactNode;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  footer?: React.ReactNode;
}

export function AutocompleteInput<T>({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  renderSuggestion,
  placeholder,
  icon,
  className,
  inputClassName,
  debounceMs = 300,
  onKeyDown,
  footer
}: AutocompleteInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocused || !value.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(value);
        setSuggestions(results);
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, isFocused, debounceMs, fetchSuggestions]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = isFocused && value.trim() !== "";

  return (
    <div className={cn("relative group w-full", showDropdown ? "z-50" : "z-20", className)} ref={containerRef}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setIsFocused(false);
          }
          onKeyDown?.(e);
        }}
        placeholder={placeholder}
        className={cn(
          "w-full bg-surface-container border border-white/5 rounded-full py-2.5 text-on-surface text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline-variant",
          icon ? "pl-10" : "pl-4",
          value ? "pr-10" : "pr-4",
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
            Gợi ý
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
          
          <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(item);
                    setIsFocused(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm flex items-center justify-between group/item transition-colors"
                >
                  {renderSuggestion(item)}
                </button>
              ))
            ) : !isLoading ? (
              <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
                Không có gợi ý phù hợp.
              </div>
            ) : null}
          </div>

          {footer && (
            <div className="border-t border-white/5 mt-1 pt-1">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
