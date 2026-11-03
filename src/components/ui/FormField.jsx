import React from 'react';

/**
 * Label + control + validation message wrapper for all admin forms.
 */
const FormField = ({ label, error, hint, required = false, htmlFor, children, className = '' }) => (
  <div className={className}>
    {label ? (
      <label htmlFor={htmlFor} className="admin-label">
        {label}
        {required ? <span className="text-danger ml-0.5">*</span> : null}
      </label>
    ) : null}
    {children}
    {error ? <p className="mt-1 text-xs font-medium text-danger">{error}</p> : null}
    {!error && hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
  </div>
);

export default FormField;
