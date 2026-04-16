"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search movies, TV shows...",
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div
      className={`relative flex items-center w-full rounded-lg transition-all duration-200 ${
        isFocused
          ? "bg-streamex-surface ring-1 ring-streamex-accent"
          : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <Search
        className={`ml-3 flex-shrink-0 transition-colors duration-200 ${
          isFocused ? "text-streamex-accent" : "text-streamex-text-secondary"
        }`}
        size={16}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 px-3 text-sm text-white placeholder:text-streamex-text-secondary focus:outline-none"
      />
      {value && (
        <button
          onClick={handleClear}
          className="mr-2 p-1 rounded hover:bg-white/10 transition-colors duration-200 cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} className="text-streamex-text-secondary" />
        </button>
      )}
    </div>
  );
}
