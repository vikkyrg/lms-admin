import React from 'react';

/**
 * Shared button styles. Exported as a class-string helper so existing
 * <button> markup can adopt the design system without a wrapper component.
 * variants: primary | secondary | ghost | danger | success
 * sizes: sm | md
 */
export const btn = (variant = 'primary', size = 'md', extra = '') => {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30';
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-[13px]'
  };
  const variants = {
    primary: 'bg-navy text-white hover:bg-navy-deep shadow-sm',
    secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
    ghost: 'text-ink-soft hover:text-ink hover:bg-canvas',
    danger: 'bg-danger text-white hover:bg-[#b91c1c] shadow-sm',
    success: 'bg-success text-white hover:bg-[#15803d] shadow-sm'
  };
  return `${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${extra}`;
};

const Button = ({ variant = 'primary', size = 'md', className = '', type = 'button', children, ...rest }) => (
  <button type={type} className={btn(variant, size, className)} {...rest}>
    {children}
  </button>
);

export default Button;
