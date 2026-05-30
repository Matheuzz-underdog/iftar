import { renderOptions, getCurrentOptions, buildQueryString } from './options-ui.js';
import { uploadFile } from './process-api.js';

const modeSelector = document.getElementById('modeSelector');
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const filePreview = document.getElementById('filePreview');
const fileDownload = document.getElementById('fileDownload');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const fileError = document.getElementById('fileError');

function showError(msg) {
  fileError.textContent = msg;
  fileError.style.display = 'block';
  filePreviewContainer.style.display = 'none';
}

function showPreview(blob, contentType) {
  const ext = contentType.includes('jpeg') ? 'jpg' : 'png';
  const imageUrl = URL.createObjectURL(blob);

  filePreview.src = imageUrl;
  fileDownload.href = imageUrl;
  fileDownload.download = modeSelector.value + '_' + Date.now() + '.' + ext;
  filePreviewContainer.style.display = 'block';
  fileError.style.display = 'none';
}

async function handleProcess() {
  const file = fileInput.files[0];
  if (!file) {
    showError('Selecciona un archivo');
    return;
  }

  const mode = modeSelector.value;
  const options = getCurrentOptions(mode);
  const qs = buildQueryString(options);
  const endpoint = `/api/image/${mode}/render${qs ? '?' + qs : ''}`;

  try {
    const { blob, contentType } = await uploadFile(endpoint, file);
    showPreview(blob, contentType);
  } catch (e) {
    showError('Error ' + (e.status || '') + ': ' + e.message);
  }
}

modeSelector.addEventListener('change', () => renderOptions(modeSelector.value));
processBtn.addEventListener('click', handleProcess);

renderOptions(modeSelector.value);
