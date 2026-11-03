import React from 'react';

/**
 * Styled native select for table filters. options: [{value,label}].
 */
const FilterDropdown = ({ value, onChange, options = [], placeholder, label, className = '' }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label || placeholder || 'Filter'}
      className="admin-input appearance-none pr-8 cursor-pointer"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export default FilterDropdown;
