import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Table/section search input. Controlled: pass value + onChange.
 */
const SearchBar = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="admin-input pl-8 pr-8"
      aria-label={placeholder}
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-ink-faint hover:text-ink transition"
        aria-label="Clear search"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    ) : null}
  </div>
);

export default SearchBar;
