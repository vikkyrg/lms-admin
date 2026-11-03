import React, { createContext, useContext, useState } from 'react';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [notice, setNotice] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const notify = (message, type = 'error') => {
    const nextNotice = typeof message === 'object'
      ? {
          message: message.message || '',
          type: message.type || (message.title === 'success' ? 'success' : type)
        }
      : { message, type };
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const confirm = ({ title, message, description }) => new Promise((resolve) => {
    setConfirmation({
      title: title || 'Please confirm',
      description: description || message || '',
      resolve
    });
  });

  const closeConfirmation = (result) => {
    if (!confirmation) return;
    confirmation.resolve(result);
    setConfirmation(null);
  };

  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      {notice && (
        <div role="status" className={`fixed right-4 top-4 z-[70] max-w-sm rounded-lg px-4 py-3 text-sm font-semibold shadow-pop ring-1 ring-inset ${notice.type === 'success' ? 'bg-success-soft text-[#15803d] ring-[#16a34a]/25' : 'bg-danger-soft text-[#b91c1c] ring-[#dc2626]/25'}`}>
          {notice.message}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        description={confirmation?.description}
        onCancel={() => closeConfirmation(false)}
        onConfirm={() => closeConfirmation(true)}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);

export const ConfirmDialog = ({ open, title, description, onCancel, onConfirm, loading = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-deep/50 p-4 admin-overlay-in" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-sm rounded-lg bg-surface p-5 shadow-overlay admin-modal-in">
        <h2 id="confirm-title" className="text-sm font-bold text-ink">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-canvas disabled:opacity-50 transition">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center rounded-md bg-danger px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-50 shadow-sm transition">{loading ? 'Working…' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};
