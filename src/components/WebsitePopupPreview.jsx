import React from 'react';
import { X, ArrowRight } from 'lucide-react';

const layoutClasses = {
  'image-left': 'sm:flex-row',
  'image-top': 'flex-col',
  'full-banner': 'flex-col',
  centered: 'flex-col text-center'
};

const WebsitePopupPreview = ({ popup, imageUrl, onClose }) => {
  const dark = popup.theme === 'dark';
  const accent = popup.accentColor || '#f4d36b';
  const image = imageUrl !== undefined ? imageUrl : (popup.hasImage ? `${apiImageBase()}${popup.imageUrl}` : '');

  return (
    <div
      className={`relative mx-auto flex w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl ${layoutClasses[popup.layout] || layoutClasses['image-left']} ${
        dark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
      }`}
      style={{ '--popup-accent': accent }}
    >
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close preview" className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-2 text-current hover:bg-black/20">
          <X className="h-4 w-4" />
        </button>
      ) : null}
      {image ? (
        <div className={`relative min-h-44 ${popup.layout === 'image-left' ? 'sm:w-[42%]' : 'w-full'} ${
          popup.layout === 'full-banner' ? 'h-48 sm:h-60' : 'h-44 sm:h-56'
        }`}>
          <img src={image} alt="" className="h-full w-full object-cover" />
          {popup.layout === 'full-banner' ? <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" /> : null}
        </div>
      ) : null}
      <div className={`flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-9 ${popup.layout === 'centered' ? 'items-center' : ''} ${
        popup.layout === 'full-banner' ? 'absolute inset-0 text-white sm:justify-end sm:pb-10' : ''
      }`}>
        {popup.badgeText ? (
          <span className="mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-900" style={{ backgroundColor: accent }}>
            {popup.badgeText}
          </span>
        ) : null}
        {popup.title ? <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{popup.title}</p> : null}
        {popup.heading ? <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl" style={{ color: popup.layout === 'full-banner' ? undefined : accent }}>{popup.heading}</h2> : null}
        {popup.subtitle ? <p className="mt-2 text-sm font-semibold opacity-80">{popup.subtitle}</p> : null}
        {popup.description ? <p className="mt-3 max-w-lg text-sm leading-relaxed opacity-75">{popup.description}</p> : null}
        <div className={`mt-5 flex flex-wrap gap-2.5 ${popup.layout === 'centered' ? 'justify-center' : ''}`}>
          {popup.primaryButton?.text ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
              {popup.primaryButton.text}<ArrowRight className="h-4 w-4" />
            </span>
          ) : null}
          {popup.secondaryButton?.text ? (
            <span className={`inline-flex items-center rounded-lg border px-4 py-2.5 text-sm font-bold ${dark || popup.layout === 'full-banner' ? 'border-white/30' : 'border-slate-300'}`}>
              {popup.secondaryButton.text}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const apiImageBase = () => {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '');
  return `${window.location.origin}${base.replace(/\/+$/, '')}`;
};

export default WebsitePopupPreview;
