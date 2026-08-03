// Open an uploaded data URL in a new tab, converting it to a Blob URL first.
// Blob URLs are more reliable than navigating directly to a large base64 URL.
export const openFileData = (fileData, fileName = 'prescription') => {
  if (!fileData) return false;

  try {
    const value = String(fileData);
    let url = value;

    if (value.startsWith('data:') && typeof window.atob === 'function' && typeof URL.createObjectURL === 'function') {
      const [metadata, encoded] = value.split(',', 2);
      if (encoded) {
        const mime = metadata.match(/^data:([^;]+)/i)?.[1] || 'application/octet-stream';
        const binary = window.atob(encoded);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      }
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) {
      if (url !== value) window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    }

    // Popup blockers still allow the user to open/download the file through a
    // normal anchor click initiated by the same user action.
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (url !== value) window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch {
    return false;
  }
};
