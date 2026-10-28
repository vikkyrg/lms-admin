import api from '../services/api';

/**
 * Authenticated course-material access for the Admin panel.
 *
 * `/materials/:id/download` is a protected endpoint: it needs the Admin bearer
 * token, so the file is fetched with the shared axios instance and handed to the
 * browser through an object URL instead of a plain <a href> navigation (which
 * cannot attach the header and would return 401).
 */
const toBlobError = async (blob) => {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || 'Unable to open this document.';
  } catch (e) {
    return 'Unable to open this document.';
  }
};

export const fetchMaterialBlob = async (materialId, { inline = false } = {}) => {
  let res;
  try {
    res = await api.get(`/materials/${materialId}/download`, {
      params: inline ? { inline: 'true' } : {},
      responseType: 'blob'
    });
  } catch (err) {
    const payload = err?.response?.data;
    if (payload instanceof Blob) {
      throw new Error(await toBlobError(payload));
    }
    throw err;
  }

  const type = res.headers?.['content-type'] || 'application/pdf';
  if (type.includes('application/json')) {
    throw new Error(await toBlobError(res.data));
  }
  return { blob: new Blob([res.data], { type }), type };
};

const triggerBrowserDownload = (blobUrl, fileName) => {
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = fileName || 'course-material';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
};

export const openMaterial = async (material, { inline = false } = {}) => {
  const { blob } = await fetchMaterialBlob(material._id, { inline });
  const url = window.URL.createObjectURL(blob);

  if (inline) {
    const opened = window.open(url, '_blank', 'noopener');
    if (!opened) window.alert('Please allow pop-ups to preview this PDF.');
  } else {
    triggerBrowserDownload(url, material.fileName || `${material.title}.pdf`);
  }

  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  return url;
};
