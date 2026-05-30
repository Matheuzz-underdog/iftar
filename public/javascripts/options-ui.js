export const optionConfigs = {
  ascii: [
    { id: 'columns', label: 'Columns', type: 'number', min: 20, max: 500, value: 80 },
    { id: 'format', label: 'Format', type: 'select', options: ['png', 'jpg'], value: 'png' },
    { id: 'density', label: 'Density', type: 'select', options: ['original', 'conservative', 'expanded', 'detailed'], value: 'original' },
    { id: 'luminance', label: 'Luminance', type: 'select', options: ['bt709', 'ntsc', 'gamma'], value: 'bt709' },
    { id: 'cellSize', label: 'Cell Size', type: 'number', min: 2, max: 32, value: 8 },
    { id: 'brightness', label: 'Brightness', type: 'number', min: -255, max: 255, value: 0 }
  ],
  ansi: [
    { id: 'columns', label: 'Columns', type: 'number', min: 20, max: 500, value: 80 },
    { id: 'format', label: 'Format', type: 'select', options: ['png', 'jpg'], value: 'png' },
    { id: 'colorMethod', label: 'Color Method', type: 'select', options: ['classic', 'perceptual', 'lab', 'cmc'], value: 'lab' },
    { id: 'dithering', label: 'Dithering', type: 'select', options: ['none', 'floyd-steinberg', 'atkinson', 'ordered'], value: 'none' },
    { id: 'cellSize', label: 'Cell Size', type: 'number', min: 2, max: 32, value: 8 },
    { id: 'brightness', label: 'Brightness', type: 'number', min: -255, max: 255, value: 0 }
  ],
  grey: [
    { id: 'columns', label: 'Columns', type: 'number', min: 20, max: 500, value: 80 },
    { id: 'format', label: 'Format', type: 'select', options: ['png', 'jpg'], value: 'png' },
    { id: 'dithering', label: 'Dithering', type: 'select', options: ['none', 'floyd-steinberg', 'atkinson', 'ordered'], value: 'none' },
    { id: 'cellSize', label: 'Cell Size', type: 'number', min: 2, max: 32, value: 8 },
    { id: 'brightness', label: 'Brightness', type: 'number', min: -255, max: 255, value: 0 }
  ],
  '256': [
    { id: 'columns', label: 'Columns', type: 'number', min: 20, max: 500, value: 80 },
    { id: 'format', label: 'Format', type: 'select', options: ['png', 'jpg'], value: 'png' },
    { id: 'colorMethod', label: 'Color Method', type: 'select', options: ['classic', 'perceptual', 'lab', 'cmc'], value: 'lab' },
    { id: 'dithering', label: 'Dithering', type: 'select', options: ['none', 'floyd-steinberg', 'atkinson', 'ordered'], value: 'none' },
    { id: 'cellSize', label: 'Cell Size', type: 'number', min: 2, max: 32, value: 8 },
    { id: 'brightness', label: 'Brightness', type: 'number', min: -255, max: 255, value: 0 }
  ],
  rgb: [
    { id: 'columns', label: 'Columns', type: 'number', min: 20, max: 500, value: 80 },
    { id: 'format', label: 'Format', type: 'select', options: ['png', 'jpg'], value: 'png' },
    { id: 'dithering', label: 'Dithering', type: 'select', options: ['none', 'floyd-steinberg', 'atkinson', 'ordered'], value: 'none' },
    { id: 'cellSize', label: 'Cell Size', type: 'number', min: 2, max: 32, value: 8 },
    { id: 'brightness', label: 'Brightness', type: 'number', min: -255, max: 255, value: 0 }
  ]
};

export function renderOptions(mode) {
  const container = document.getElementById('optionsContainer');
  const config = optionConfigs[mode];
  container.innerHTML = '';

  config.forEach(opt => {
    const div = document.createElement('div');
    div.style.marginBottom = '5px';

    const label = document.createElement('label');
    label.textContent = opt.label + ': ';
    div.appendChild(label);

    if (opt.type === 'select') {
      const select = document.createElement('select');
      select.id = 'opt_' + opt.id;
      opt.options.forEach(o => {
        const option = document.createElement('option');
        option.value = o;
        option.textContent = o;
        if (o === opt.value) option.selected = true;
        select.appendChild(option);
      });
      div.appendChild(select);
    } else if (opt.type === 'number') {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'opt_' + opt.id;
      input.min = opt.min;
      input.max = opt.max;
      input.value = opt.value;
      div.appendChild(input);
    }

    container.appendChild(div);
  });
}

export function getCurrentOptions(mode) {
  const config = optionConfigs[mode];
  const options = {};

  config.forEach(opt => {
    const el = document.getElementById('opt_' + opt.id);
    if (el) {
      options[opt.id] = opt.type === 'number' ? parseInt(el.value, 10) : el.value;
    }
  });

  return options;
}

export function buildQueryString(options) {
  const params = [];
  for (const [key, value] of Object.entries(options)) {
    if (value !== null && value !== undefined && value !== '') {
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
  }
  return params.join('&');
}
