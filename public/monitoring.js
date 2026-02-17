let refreshTimer;

async function fetchStats() {
  const [statsRes, cfgRes, keysRes] = await Promise.all([
    fetch('/api/stats'),
    fetch('/api/config'),
    fetch('/api/keys/info?apikey=__all__').catch(() => null)
  ]);

  const stats = await statsRes.json();
  const cfg = await cfgRes.json();

  renderStats(stats.data, cfg.data);
  renderEndpoints(stats.data);
  renderDailyChart(stats.data);
  await renderKeys();

  document.getElementById('lastUpdate').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

function renderStats(stats, cfg) {
  const total = stats?.total || 0;
  const endpoints = stats?.endpoints || {};
  const daily = stats?.daily || {};
  const today = new Date().toISOString().slice(0, 10);

  document.getElementById('totalReqs').textContent = total.toLocaleString();
  document.getElementById('todayReqs').textContent = 'Today: ' + (daily[today] || 0);
  document.getElementById('activeEndpoints').textContent = (cfg || []).length;
  document.getElementById('activeDays').textContent = Object.keys(daily).length;

  const sorted = Object.entries(endpoints).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    document.getElementById('topEndpoint').textContent = sorted[0][0];
    document.getElementById('topEndpointCount').textContent = sorted[0][1] + ' requests';
  }
}

function renderEndpoints(stats) {
  const endpoints = stats?.endpoints || {};
  const sorted = Object.entries(endpoints).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  document.getElementById('epCount').textContent = sorted.length + ' endpoints';

  const list = document.getElementById('epList');
  if (!sorted.length) {
    list.innerHTML = '<div class="empty-state">No requests recorded yet</div>';
    return;
  }

  list.innerHTML = sorted.slice(0, 15).map(([ep, count], i) => `
    <div class="ep-row">
      <span class="ep-rank">${String(i + 1).padStart(2, '0')}</span>
      <span class="ep-name">${ep}</span>
      <div class="ep-bar-wrap">
        <div class="ep-bar-bg">
          <div class="ep-bar" style="width:${Math.round((count / max) * 100)}%"></div>
        </div>
      </div>
      <span class="ep-count">${count}</span>
    </div>
  `).join('');
}

function renderDailyChart(stats) {
  const daily = stats?.daily || {};
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString('id', { weekday: 'short' }), count: daily[key] || 0 });
  }

  const max = Math.max(...days.map(d => d.count), 1);
  document.getElementById('dayRange').textContent = 'Last 7 days';

  const container = document.getElementById('chartBars');
  container.innerHTML = days.map(d => {
    const pct = Math.round((d.count / max) * 100);
    return `
      <div class="chart-col">
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="height:${Math.max(pct, 2)}%" title="${d.key}: ${d.count} requests"></div>
        </div>
        <div class="chart-date">${d.label}<br>${d.count}</div>
      </div>
    `;
  }).join('');
}

async function renderKeys() {
  const res = await fetch('/api/keys/all').then(r => r.json()).catch(() => null);
  const keys = res?.data || [];

  document.getElementById('keyCount').textContent = keys.length + ' keys';

  const tbody = document.getElementById('keyTable');
  if (!keys.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:#444;padding:20px;text-align:center">No keys found</td></tr>';
    return;
  }

  tbody.innerHTML = keys.map(k => {
    const { key, limit, used, remaining, owner } = k;
    const isUnlimited = limit === -1;
    const pct = isUnlimited ? 0 : Math.round((used / limit) * 100);
    const cls = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : '';

    return `
      <tr>
        <td><span class="key-val">${key}</span></td>
        <td>${owner || '-'}</td>
        <td>${isUnlimited ? '∞' : limit}</td>
        <td>${used}</td>
        <td>${isUnlimited ? '∞' : remaining}</td>
        <td style="min-width:100px">
          ${isUnlimited ? '<span style="color:#444;font-size:0.6rem;font-family:Space Mono,monospace">UNLIMITED</span>' : `
            <div class="usage-fill ${cls}">
              <div class="usage-fill-inner" style="width:${pct}%"></div>
            </div>
            <span style="font-size:0.55rem;color:#444;font-family:Space Mono,monospace">${pct}%</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function startAutoRefresh() {
  clearInterval(refreshTimer);
  refreshTimer = setInterval(fetchStats, 15000);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchStats();
  startAutoRefresh();
});
