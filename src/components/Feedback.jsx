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
        <div role="status" className={`fixed right-4 top-4 z-[70] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${notice.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? 'Working...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};
