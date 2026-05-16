// ── Screen 5: Bestzeiten & Graph ──

const ScreenZeiten = (() => {

  let _filterVehicle = '';
  let _filterTrack = '';
  let _filterBedingung = 'alle';
  const expandedSessions = new Set();

  function render() {
    const el = document.getElementById('screen-zeiten');
    const vehicles = getVehicles();
    const allSessions = getSessions();

    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">Zeiten</span>
      </div>
      <div class="scroll-content" id="zeiten-content"></div>`;

    _renderContent();
  }

  function _renderContent() {
    const el = document.getElementById('zeiten-content');
    const vehicles = getVehicles();
    const allSessions = getSessions();

    let filtered = allSessions.filter(s => {
      if (_filterVehicle && s.vehicleId !== _filterVehicle) return false;
      if (_filterTrack && s.strecke !== _filterTrack) return false;
      if (_filterBedingung !== 'alle' && s.bedingung !== _filterBedingung) return false;
      return true;
    });

    filtered = filtered.sort((a, b) => {
      const da = new Date(a.datum + 'T' + (a.uhrzeit || '00:00'));
      const db = new Date(b.datum + 'T' + (b.uhrzeit || '00:00'));
      return da - db;
    });

    // Tracks for filter
    const tracks = [...new Set(allSessions.map(s => s.strecke).filter(Boolean))];

    // Best time in filtered set
    const withTime = filtered.filter(s => parseTime(s.bestzeit) !== null);
    const bestSeconds = withTime.length ? Math.min(...withTime.map(s => parseTime(s.bestzeit))) : null;
    const bestSession = withTime.find(s => parseTime(s.bestzeit) === bestSeconds);

    // Chart data
    const chartData = withTime.map(s => ({
      datum: s.datum,
      timeSeconds: parseTime(s.bestzeit),
      bestzeit: s.bestzeit,
      bedingung: s.bedingung,
      reifen: [s.reifen?.hersteller, s.reifen?.compound].filter(Boolean).join(' ')
    }));

    el.innerHTML = `
      <!-- Filters -->
      <div class="filter-bar">
        <select class="filter-chip ${_filterVehicle ? 'active' : ''}" id="filter-vehicle">
          <option value="">Alle Motorräder</option>
          ${vehicles.map(v => `<option value="${v.id}" ${_filterVehicle === v.id ? 'selected' : ''}>${_esc(v.name)}</option>`).join('')}
        </select>
        <select class="filter-chip ${_filterTrack ? 'active' : ''}" id="filter-track">
          <option value="">Alle Strecken</option>
          ${tracks.map(t => `<option value="${t}" ${_filterTrack === t ? 'selected' : ''}>${_esc(t)}</option>`).join('')}
        </select>
        <button class="filter-chip ${_filterBedingung === 'alle' ? 'active' : ''}" data-cond="alle">Alle</button>
        <button class="filter-chip ${_filterBedingung === 'trocken' ? 'active' : ''}" data-cond="trocken">Trocken</button>
        <button class="filter-chip ${_filterBedingung === 'nass' ? 'active' : ''}" data-cond="nass">Nass</button>
      </div>

      <!-- Bestzeit Banner -->
      ${bestSession ? `
      <div class="bestzeit-banner">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">
            Bestzeit
          </div>
          <div class="bestzeit-value">${_esc(bestSession.bestzeit)}</div>
          <div class="bestzeit-meta">
            ${_formatDate(bestSession.datum)} · ${_esc(bestSession.strecke)}
            ${bestSession.reifen?.hersteller ? '· ' + _esc(bestSession.reifen.hersteller) : ''}
            ${bestSession.reifen?.compound ? _esc(bestSession.reifen.compound) : ''}
          </div>
        </div>
        <div>
          <span class="badge badge-${bestSession.bedingung}">${bestSession.bedingung}</span>
        </div>
      </div>` : ''}

      <!-- Chart -->
      ${chartData.length >= 2 ? `
      <div class="chart-container">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">
          Zeitverlauf
        </div>
        <canvas id="zeiten-chart" height="160"></canvas>
      </div>` : ''}

      <!-- History -->
      ${filtered.length === 0 ? `
      <div class="empty-state">
        <svg class="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
        </svg>
        <p class="empty-state-title">Noch keine Sessions</p>
        <p class="empty-state-text">Tippe auf + um deine erste Trackday-Session zu erfassen.</p>
      </div>` : `
      <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">
        ${filtered.length} Session${filtered.length !== 1 ? 's' : ''}
      </div>
      ${[...filtered].reverse().map(s => _buildHistoryEntry(s, bestSeconds)).join('')}
      `}
      <div style="height:8px"></div>`;

    // Attach filter events
    document.getElementById('filter-vehicle')?.addEventListener('change', e => {
      _filterVehicle = e.target.value;
      _renderContent();
    });
    document.getElementById('filter-track')?.addEventListener('change', e => {
      _filterTrack = e.target.value;
      _renderContent();
    });
    el.querySelectorAll('[data-cond]').forEach(btn => {
      btn.addEventListener('click', () => {
        _filterBedingung = btn.dataset.cond;
        _renderContent();
      });
    });

    // Expand history entries
    el.querySelectorAll('[data-expand-session]').forEach(header => {
      header.addEventListener('click', () => {
        const id = header.dataset.expandSession;
        expandedSessions.has(id) ? expandedSessions.delete(id) : expandedSessions.add(id);
        _renderContent();
      });
    });

    // Draw chart
    const canvas = document.getElementById('zeiten-chart');
    if (canvas && chartData.length >= 2) {
      _drawChart(canvas, chartData);
    }
  }

  function _buildHistoryEntry(s, bestSeconds) {
    const secs = parseTime(s.bestzeit);
    const delta = (secs !== null && bestSeconds !== null) ? secs - bestSeconds : null;
    const isBest = delta === 0;
    const isExpanded = expandedSessions.has(s.id);

    return `
      <div class="history-entry">
        <div class="history-entry-header" data-expand-session="${s.id}">
          <div class="history-entry-time">${s.bestzeit || '—'}</div>
          <div class="history-entry-info">
            <div class="history-entry-track">${_esc(s.strecke)}</div>
            <div class="history-entry-date">
              ${_formatDate(s.datum)}${s.uhrzeit ? ' · ' + s.uhrzeit : ''}
              · <span class="badge badge-${s.bedingung}" style="font-size:10px;padding:1px 6px">${s.bedingung}</span>
            </div>
          </div>
          <div class="history-entry-delta ${isBest ? 'best' : ''}">
            ${isBest ? '★ Best' : delta !== null ? '+' + delta.toFixed(3) + 's' : ''}
          </div>
        </div>
        ${isExpanded ? `
        <div class="history-entry-body">
          ${_buildSessionDetail(s)}
        </div>` : ''}
      </div>`;
  }

  function _buildSessionDetail(s) {
    const v = getVehicle(s.vehicleId);
    const rows = [
      ['Motorrad', v?.name],
      ['Lufttemperatur', s.temperatur?.luft ? s.temperatur.luft + ' °C' : null],
      ['Asphalttemperatur', s.temperatur?.asphalt ? s.temperatur.asphalt + ' °C' : null],
      ['Reifen', [s.reifen?.hersteller, s.reifen?.modell, s.reifen?.compound].filter(Boolean).join(' ')],
      ['Druck vorne', s.reifen?.druck_vorne ? s.reifen.druck_vorne + ' bar' : null],
      ['Druck hinten', s.reifen?.druck_hinten ? s.reifen.druck_hinten + ' bar' : null],
      ['Gabel Druckstufe', s.gabel?.druckstufe_klicks !== '' ? s.gabel?.druckstufe_klicks + ' Klicks' : null],
      ['Gabel Zugstufe', s.gabel?.zugstufe_klicks !== '' ? s.gabel?.zugstufe_klicks + ' Klicks' : null],
      ['Federbein Druckstufe', s.federbein?.druckstufe_klicks !== '' ? s.federbein?.druckstufe_klicks + ' Klicks' : null],
      ['Federbein Zugstufe', s.federbein?.zugstufe_klicks !== '' ? s.federbein?.zugstufe_klicks + ' Klicks' : null],
      ['Federbein Höhe', s.federbein?.hoehe_mm ? s.federbein.hoehe_mm + ' mm (' + (s.federbein?.messpunkt || '') + ')' : null],
    ].filter(([, v]) => v);

    return `
      <div class="kv-grid" style="margin-bottom:${s.notiz ? '12px' : '0'}">
        ${rows.map(([k, val]) => `
          <div class="kv-item">
            <span class="kv-key">${k}</span>
            <span class="kv-value">${_esc(String(val))}</span>
          </div>`).join('')}
      </div>
      ${s.notiz ? `<div style="font-size:13px;color:var(--text-muted);line-height:1.6;padding-top:8px;border-top:1px solid var(--border)">
        ${_esc(s.notiz)}
      </div>` : ''}`;
  }

  function _drawChart(canvas, data) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.parentElement.clientWidth - 32;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 16, bottom: 36, left: 52 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const times = data.map(d => d.timeSeconds);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const rangeT = maxT - minT || 1;

    const toX = i => pad.left + (i / (data.length - 1)) * cW;
    const toY = t => pad.top + (1 - (maxT - t) / rangeT) * cH;

    // Grid lines
    ctx.strokeStyle = '#2a2e3d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (i / 3) * cH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

      // Y labels
      const t = maxT - (i / 3) * rangeT;
      ctx.fillStyle = '#9aa0bb';
      ctx.font = `10px 'Barlow', sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(formatTime(t), pad.left - 6, y + 4);
    }

    // X labels (dates)
    ctx.fillStyle = '#9aa0bb';
    ctx.font = `10px 'Barlow', sans-serif`;
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 4));
    data.forEach((d, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillText(_shortDate(d.datum), toX(i), H - 6);
      }
    });

    // Line
    ctx.strokeStyle = '#d4f53c';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toX(i);
      const y = toY(d.timeSeconds);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area fill
    ctx.fillStyle = 'rgba(212,245,60,0.06)';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = toX(i);
      const y = toY(d.timeSeconds);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(data.length - 1), H - pad.bottom);
    ctx.lineTo(toX(0), H - pad.bottom);
    ctx.closePath();
    ctx.fill();

    // Dots
    data.forEach((d, i) => {
      const x = toX(i);
      const y = toY(d.timeSeconds);
      const isBest = d.timeSeconds === minT;
      ctx.fillStyle = isBest ? '#d4f53c' : '#181b23';
      ctx.strokeStyle = '#d4f53c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, isBest ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  function _shortDate(dateStr) {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${d}.${m}.`;
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  }

  function _esc(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render };
})();
