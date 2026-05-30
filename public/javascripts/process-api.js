export async function uploadFile(endpoint, file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw { status: response.status, message: err.error || err.detail || 'Error desconocido' };
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'image/png';

  return { blob, contentType };
}
