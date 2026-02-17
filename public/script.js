let allApis = [];
let lastUrl = '';
let lastData = null;
let activeCategory = 'all';

async function init() {
  try {
    const [cfgRes, statsRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/stats')
    ]);
    const cfg = await cfgRes.json();
    const stats = await statsRes.json();

    allApis = cfg.data || [];
    renderStats(stats.data);
    renderCategories();
    renderDrawers(allApis);
  } catch(e) {
    document.getElementById('drawers').innerHTML = '<div class="no-apis">Failed to load endpoints</div>';
  }
}

function renderStats(stats) {
  document.getElementById('totalBadge').textContent = (stats?.total || 0) + ' requests';
  document.getElementById('apiBadge').textContent = allApis.length + ' endpoints';
}

function renderCategories() {
  const cats = [...new Set(allApis.map(a => a.category).filter(Boolean))];
  const bar = document.getElementById('catBar');
  bar.innerHTML = '<button class="cat-btn active" data-cat="all" onclick="filterCat(this,\'all\')">All</button>';
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = c;
    btn.textContent = c;
    btn.onclick = () => filterCat(btn, c);
    bar.appendChild(btn);
  });
}

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = cat;
  const filtered = cat === 'all' ? allApis : allApis.filter(a => a.category === cat);
  renderDrawers(filtered);
}

function renderDrawers(apis) {
  const container = document.getElementById('drawers');
  if (!apis.length) {
    container.innerHTML = '<div class="no-apis">No endpoints found</div>';
    return;
  }

  container.innerHTML = '';
  apis.forEach((api, i) => {
    const el = document.createElement('div');
    el.className = 'drawer';
    el.dataset.idx = i;

    const formId = 'form_' + i;
    const paramFields = (api.params || []).map(p => {
      const isSelect = p.name === 'format';
      if (isSelect) {
        return `<div class="field">
          <label>${p.name} ${p.required ? '<span class="req">*</span>' : ''}</label>
          <select id="${formId}_${p.name}">
            <option value="mp3">MP3</option>
            <option value="144">144p</option>
            <option value="240">240p</option>
            <option value="360">360p</option>
            <option value="480">480p</option>
            <option value="720">720p</option>
            <option value="1080">1080p</option>
          </select>
        </div>`;
      }
      const isLong = p.name === 'q' || p.name === 'prompt';
      if (isLong) {
        return `<div class="field">
          <label>${p.name} ${p.required ? '<span class="req">*</span>' : ''}</label>
          <textarea id="${formId}_${p.name}" placeholder="${p.description || p.name}"></textarea>
        </div>`;
      }
      return `<div class="field">
        <label>${p.name} ${p.required ? '<span class="req">*</span>' : ''}</label>
        <input id="${formId}_${p.name}" type="text" placeholder="${p.description || p.name}">
      </div>`;
    }).join('');

    const paramDocs = (api.params || []).map(p => `
      <div class="param-item">
        <span class="param-name">${p.name}</span>
        <span class="param-badge ${p.required ? 'required' : 'optional'}">${p.required ? 'required' : 'optional'}</span>
        <span class="param-desc">${p.description || ''}</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="drawer-header" onclick="toggleDrawer(this)">
        <span class="drawer-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="drawer-category">${api.category || 'API'}</span>
        <span class="drawer-name">${api.name}</span>
        <span class="drawer-endpoint">${api.endpoint}</span>
        <span class="drawer-chevron">▼</span>
      </div>
      <div class="drawer-body">
        <div class="drawer-inner">
          <div class="drawer-form">
            ${paramFields}
            <button class="send-btn" onclick="sendRequest(${i})">▶ Execute</button>
          </div>
          <div class="drawer-desc">
            <div class="desc-title">Endpoint</div>
            <div class="endpoint-display">GET ${api.endpoint}</div>
            <div class="desc-title">Parameters</div>
            <div class="param-list">${paramDocs}</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(el);
    setTimeout(() => el.classList.add('visible'), i * 40);
  });
}

function toggleDrawer(header) {
  const drawer = header.parentElement;
  const isOpen = drawer.classList.contains('open');
  document.querySelectorAll('.drawer.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) drawer.classList.add('open');
}

async function sendRequest(idx) {
  const api = allApis[idx] || (activeCategory !== 'all' ?
    allApis.filter(a => a.category === activeCategory)[idx] : allApis[idx]);

  const filtered = activeCategory === 'all' ? allApis : allApis.filter(a => a.category === activeCategory);
  const api2 = filtered[idx];
  if (!api2) return;

  const formId = 'form_' + idx;
  const params = new URLSearchParams();

  let valid = true;
  for (const p of (api2.params || [])) {
    const el = document.getElementById(formId + '_' + p.name);
    const val = el ? el.value.trim() : '';
    if (p.required && !val) {
      el && el.focus();
      showToast('Field "' + p.name + '" is required');
      valid = false;
      break;
    }
    if (val) params.set(p.name, val);
  }

  if (!valid) return;

  const url = api2.endpoint + '?' + params.toString();
  showLoader(true);

  try {
    const res = await fetch(url);
    const data = await res.json();
    lastUrl = window.location.origin + url;
    lastData = data;
    showModal(api2.name, data);
  } catch(e) {
    showToast('Error: ' + e.message);
  } finally {
    showLoader(false);
  }
}

function showModal(title, data) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalCode').textContent = JSON.stringify(data, null, 2);
  document.getElementById('modal').classList.add('show');
}

function closeModal() { document.getElementById('modal').classList.remove('show'); }

function openFull() { if (lastUrl) window.open(lastUrl, '_blank'); }

function copyURL() {
  if (!lastUrl) return;
  navigator.clipboard.writeText(lastUrl).then(() => showToast('URL copied'));
}

function copyJSON() {
  if (!lastData) return;
  navigator.clipboard.writeText(JSON.stringify(lastData, null, 2)).then(() => showToast('JSON copied'));
}

function showLoader(v) {
  document.getElementById('loader').classList.toggle('show', v);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

window.onclick = e => {
  if (e.target === document.getElementById('modal')) closeModal();
};

document.addEventListener('DOMContentLoaded', init);
