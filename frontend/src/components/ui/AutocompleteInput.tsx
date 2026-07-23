import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, Search } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AutocompleteInputProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchSuggestions: (query: string, signal?: AbortSignal) => Promise<T[]>;
  renderSuggestion: (item: T, isFocused?: boolean) => React.ReactNode;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  footer?: React.ReactNode;
  recentSearchesKey?: string;
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
  footer,
  recentSearchesKey
}: AutocompleteInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [recentSearches, setRecentSearches] = useState<T[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  useEffect(() => {
    if (recentSearchesKey) {
      try {
        const stored = localStorage.getItem(recentSearchesKey);
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch { }
    }
  }, [recentSearchesKey]);

  const handleSelect = (item: T) => {
    if (recentSearchesKey) {
      const newRecent = [item, ...recentSearches.filter(r => JSON.stringify(r) !== JSON.stringify(item))].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem(recentSearchesKey, JSON.stringify(newRecent));
    }
    onSelect(item);
    setIsFocused(false);
  };

  useEffect(() => {
    setFocusedIndex(-1);

    if (!isFocused) {
      return;
    }

    if (!value.trim()) {
      setSuggestions([]);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    // Check cache first
    if (cacheRef.current.has(value.trim())) {
      setSuggestions(cacheRef.current.get(value.trim()) || []);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(value, abortControllerRef.current.signal);
        cacheRef.current.set(value.trim(), results); // Save to cache
        setSuggestions(results);
      } catch (err: any) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          console.error("Autocomplete fetch error:", err);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, isFocused, debounceMs, fetchSuggestions]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  const currentList = value.trim() ? suggestions : recentSearches;
  const showDropdown = isFocused && (value.trim() !== "" || recentSearches.length > 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      onKeyDown?.(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev < currentList.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < currentList.length) {
        handleSelect(currentList[focusedIndex]);
      } else {
        setIsFocused(false);
        onKeyDown?.(e);
      }
    } else {
      onKeyDown?.(e);
    }
  };

  return (
    <div className={cn("relative group w-full", showDropdown ? "z-50" : "z-20", className)} ref={containerRef}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors flex items-center justify-center">
          {icon}
        </div>
      )}
      <input
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="autocomplete-listbox"
        aria-autocomplete="list"
        aria-activedescendant={focusedIndex >= 0 ? `suggestion-${focusedIndex}` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
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
          aria-label="Clear search"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            setSuggestions([]);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {showDropdown && (
        <div 
          id="autocomplete-listbox"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-between">
            {value.trim() ? "Gợi ý" : "Tìm kiếm gần đây"}
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          </div>
          
          <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {isLoading && suggestions.length === 0 ? (
              // Skeleton Loading State
              <div className="px-4 py-3 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-3 bg-white/5 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : currentList.length > 0 ? (
              currentList.map((item, index) => (
                <button
                  key={index}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === focusedIndex}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm flex items-center justify-between group/item transition-colors",
                    index === focusedIndex ? "bg-white/10 text-primary" : "hover:bg-white/5"
                  )}
                >
                  {renderSuggestion(item, index === focusedIndex)}
                </button>
              ))
            ) : value.trim() ? (
              // Empty State
              <div className="px-4 py-6 text-sm text-on-surface-variant text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1">
                  <Search className="w-4 h-4 opacity-50" />
                </div>
                <p>Không tìm thấy kết quả nào cho "{value}"</p>
                <p className="text-xs opacity-70">Hãy thử từ khóa khác chung chung hơn.</p>
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
