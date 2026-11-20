import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Megaphone, ImagePlus, Eye, EyeOff, Save, Trash2, UploadCloud
} from 'lucide-react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import { Modal, btn } from '../components/ui';
import WebsitePopupPreview from '../components/WebsitePopupPreview';

const emptyForm = () => ({
  title: '',
  subtitle: '',
  heading: '',
  description: '',
  badgeText: '',
  primaryButtonText: '',
  primaryButtonUrl: '',
  secondaryButtonText: '',
  secondaryButtonUrl: '',
  layout: 'image-left',
  theme: 'light',
  accentColor: '',
  isActive: false,
  delaySeconds: 0,
  displayFrequency: 'session',
  startDate: '',
  endDate: '',
  closeOnOverlay: true
});

const apiImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const base = api.defaults.baseURL || '/api/v1';
  if (/^https?:\/\//i.test(base)) return `${base.replace(/\/+$/, '')}${imagePath.replace(/^\/api\/v1/, '')}`;
  return `${window.location.origin}${imagePath}`;
};

const toForm = (popup) => ({
  ...emptyForm(),
  title: popup.title || '',
  subtitle: popup.subtitle || '',
  heading: popup.heading || '',
  description: popup.description || '',
  badgeText: popup.badgeText || '',
  layout: popup.layout || 'image-left',
  theme: popup.theme || 'light',
  accentColor: popup.accentColor || '',
  isActive: Boolean(popup.isActive),
  delaySeconds: popup.delaySeconds ?? 0,
  displayFrequency: popup.displayFrequency || 'session',
  closeOnOverlay: popup.closeOnOverlay !== false,
  primaryButtonText: popup.primaryButton?.text || '',
  primaryButtonUrl: popup.primaryButton?.url || '',
  secondaryButtonText: popup.secondaryButton?.text || '',
  secondaryButtonUrl: popup.secondaryButton?.url || '',
  startDate: popup.startDate ? new Date(popup.startDate).toISOString().slice(0, 10) : '',
  endDate: popup.endDate ? new Date(popup.endDate).toISOString().slice(0, 10) : ''
});

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="admin-label">{label}</label>
    {children}
  </div>
);

const AdminWebsitePopup = () => {
  const [popup, setPopup] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { notify } = useFeedback();

  const localImageUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);
  const imageUrl = localImageUrl || (popup?.hasImage && !removeImage ? apiImageUrl(popup.imageUrl) : '');

  useEffect(() => {
    return () => {
      if (localImageUrl) URL.revokeObjectURL(localImageUrl);
    };
  }, [localImageUrl]);

  useEffect(() => {
    const loadPopup = async () => {
      try {
        const response = await api.get('/admin/website-popup');
        if (response.data.popup) {
          setPopup(response.data.popup);
          setForm(toForm(response.data.popup));
        }
      } catch (error) {
        console.error('Failed to load website popup configuration:', error);
        notify({ type: 'error', message: error.response?.data?.message || 'Failed to load popup configuration' });
      } finally {
        setLoading(false);
      }
    };
    loadPopup();
  }, []);

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const acceptFile = (selected) => {
    setFileError('');
    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setFileError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (selected.size > 3 * 1024 * 1024) {
      setFileError('Image must be 3 MB or smaller.');
      return;
    }
    setFile(selected);
    setRemoveImage(false);
  };

  const handleFile = (event) => {
    acceptFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    data.append('removeImage', String(removeImage));
    if (file) data.append('image', file);

    try {
      setSaving(true);
      const response = await api[popup ? 'put' : 'post']('/admin/website-popup', data);
      setPopup(response.data.popup);
      setForm(toForm(response.data.popup));
      setFile(null);
      setRemoveImage(false);
      notify({ type: 'success', message: 'Popup configuration saved successfully' });
    } catch (error) {
      console.error('Failed to save website popup configuration:', error);
      notify({ type: 'error', message: error.response?.data?.message || 'Failed to save popup configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!popup) return;
    try {
      setToggling(true);
      const response = await api.patch('/admin/website-popup/toggle', { isActive: !popup.isActive });
      setPopup(response.data.popup);
      setForm((current) => ({ ...current, isActive: response.data.popup.isActive }));
      notify({ type: 'success', message: `Popup ${response.data.popup.isActive ? 'enabled' : 'disabled'}` });
    } catch (error) {
      console.error('Failed to update popup status:', error);
      notify({ type: 'error', message: error.response?.data?.message || 'Failed to update popup status' });
    } finally {
      setToggling(false);
    }
  };

  const previewPopup = {
    ...form,
    primaryButton: { text: form.primaryButtonText, url: form.primaryButtonUrl },
    secondaryButton: { text: form.secondaryButtonText, url: form.secondaryButtonUrl },
    hasImage: Boolean(imageUrl),
    imageUrl: popup?.imageUrl
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl space-y-3" aria-label="Loading popup settings">
      <div className="admin-skeleton h-12 rounded-lg" />
      <div className="admin-skeleton h-24 rounded-lg" />
      <div className="admin-skeleton h-64 rounded-lg" />
    </div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
            <Megaphone className="h-5 w-5 text-brand" /> Website Popup
          </h1>
          <p className="mt-0.5 text-xs text-ink-soft">Update the announcement visitors see on the website.</p>
        </div>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${popup?.isActive ? 'bg-success-soft text-success' : 'bg-canvas text-ink-faint'}`}>
            {popup?.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink">Popup status</p>
            <p className={`text-xs font-semibold ${popup?.isActive ? 'text-success' : 'text-ink-faint'}`}>
              {popup?.isActive ? 'Active' : 'Inactive'}
              {popup?.updatedAt ? <span className="ml-2 font-normal text-ink-faint">Updated {new Date(popup.updatedAt).toLocaleDateString('en-IN')}</span> : null}
            </p>
            {!popup ? <p className="mt-0.5 text-[11px] text-ink-faint">Save your popup before enabling it.</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={!popup || toggling}
            className={btn(popup?.isActive ? 'secondary' : 'success', 'sm')}
            title={!popup ? 'Save the configuration before enabling' : undefined}
          >
            {popup?.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {toggling ? 'Updating…' : popup?.isActive ? 'Disable popup' : 'Enable popup'}
          </button>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-3">
        <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-3 text-sm font-bold text-ink">Popup content</h2>
          <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
            <Field label="Popup title">
              <input name="title" value={form.title} onChange={updateForm} maxLength={120} className="admin-input" placeholder="AutoOps School" />
            </Field>
            <Field label="Subtitle">
              <input name="subtitle" value={form.subtitle} onChange={updateForm} maxLength={160} className="admin-input" placeholder="Build your future in technology" />
            </Field>
            <Field label="Main heading">
              <input name="heading" value={form.heading} onChange={updateForm} maxLength={180} className="admin-input" placeholder="Admissions are now open" />
            </Field>
            <Field label="Badge text (optional)">
              <input name="badgeText" value={form.badgeText} onChange={updateForm} maxLength={80} className="admin-input" placeholder="Admissions Open 2027" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea name="description" value={form.description} onChange={updateForm} maxLength={1200} rows={3} className="admin-input" placeholder="Share a short announcement with website visitors." />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-3 text-sm font-bold text-ink">Popup image</h2>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="sr-only"
                tabIndex={-1}
                aria-label="Upload popup image"
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition ${
                  isDragging ? 'border-brand bg-brand-soft' : 'border-line bg-canvas hover:border-brand hover:bg-brand-soft/50'
                }`}
              >
                <UploadCloud className="mb-1.5 h-5 w-5 text-brand" />
                <span className="text-xs font-semibold text-ink">
                  {file ? 'Image ready to upload' : imageUrl ? 'Drop an image here to replace it' : 'Drag an image here or browse'}
                </span>
                <span className="mt-1 text-[11px] text-ink-faint">JPG, PNG, or WebP · maximum 3 MB</span>
              </div>
              {fileError ? <p role="alert" className="text-xs font-medium text-danger">{fileError}</p> : null}
              {imageUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  {file ? <span className="mr-auto max-w-full truncate text-[11px] text-ink-soft">{file.name}</span> : null}
                  {file ? (
                    <button type="button" onClick={() => { setFile(null); setRemoveImage(false); }} className={btn('secondary', 'sm')}>
                      {popup?.hasImage ? 'Cancel replacement' : 'Remove selected image'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setRemoveImage(true)} className={btn('ghost', 'sm', 'text-danger')}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove image
                    </button>
                  )}
                </div>
              ) : null}
              {removeImage && popup?.hasImage ? (
                <button type="button" onClick={() => setRemoveImage(false)} className={btn('secondary', 'sm')}>
                  Undo image removal
                </button>
              ) : null}
            </div>
            <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
              {imageUrl ? <img src={imageUrl} alt="Popup image preview" className="h-36 w-full object-cover" /> : (
                <div className="px-3 text-center text-xs text-ink-faint">
                  <ImagePlus className="mx-auto mb-1.5 h-5 w-5" />
                  No image selected
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 z-10 flex justify-end rounded-lg border border-line bg-surface/95 p-3 shadow-pop backdrop-blur">
          <button type="submit" disabled={saving} className={btn('primary')}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Popup preview" description="Preview reflects the current form values." size="xl">
        <WebsitePopupPreview popup={previewPopup} imageUrl={imageUrl} />
      </Modal>
    </div>
  );
};

export default AdminWebsitePopup;
