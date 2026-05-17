// ── Screen Zeiten: Bestzeiten & Graph ──

const ScreenZeiten = (() => {

  let _filterVehicle = '';
  let _filterTrack = '';
  let _filterBedingung = 'alle';
  const expandedSessions = new Set();
  let _deleteConfirmId = null;
  let _setupChartIdx = 0;

  const SETUP_PARAMS = [
    { key: 'reifen.vorne.druck',           label: 'Reifen Druck Vorne',        unit: 'bar' },
    { key: 'reifen.hinten.druck',          label: 'Reifen Druck Hinten',       unit: 'bar' },
    { key: 'gabel.druckstufe_klicks',      label: 'Gabel Druckstufe',          unit: 'Klicks', integer: true },
    { key: 'gabel.zugstufe_klicks',        label: 'Gabel Zugstufe',            unit: 'Klicks', integer: true },
    { key: 'gabel.federvorspannung',       label: 'Gabel Federvorspannung',    unit: 'Umdr.' },
    { key: 'gabel.negativfederweg_mm',     label: 'Gabel Negativfederweg',     unit: 'mm' },
    { key: 'gabel.durchstreckung_mm',      label: 'Gabel Durchstreckung',      unit: 'mm' },
    { key: 'gabel.oelstand_mm',            label: 'Gabel Öllevel',             unit: 'mm' },
    { key: 'federbein.druckstufe_klicks',  label: 'Federbein Druckstufe',      unit: 'Klicks', integer: true },
    { key: 'federbein.zugstufe_klicks',    label: 'Federbein Zugstufe',        unit: 'Klicks', integer: true },
    { key: 'federbein.federvorspannung',   label: 'Federbein Federvorspannung',unit: 'Umdr.' },
    { key: 'federbein.negativfederweg_mm', label: 'Federbein Negativfederweg', unit: 'mm' },
    { key: 'federbein.hoehe_mm',           label: 'Federbein Höhe',            unit: 'mm' },
    { key: 'sekundaer.ritzel',             label: 'Ritzel',                    unit: 'Z.', integer: true },
    { key: 'sekundaer.kettenrad',          label: 'Kettenrad',                 unit: 'Z.', integer: true },
    { key: 'elektronik.tc_stufe',          label: 'TC Stufe',                  unit: '', integer: true },
    { key: 'elektronik.tc_modus',          label: 'Motor Modus',               unit: '', categorical: true, categories: ['A', 'B', 'C'] },
    { key: 'temperatur.luft',              label: 'Lufttemperatur',            unit: '°C' },
    { key: 'temperatur.asphalt',           label: 'Asphalttemperatur',         unit: '°C' },
  ];

  function _getVal(session, key) {
    const val = key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), session);
    if (val === '' || val === undefined || val === null) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  function _getRawVal(session, key) {
    const val = key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), session);
    if (val === '' || val === undefined || val === null) return null;
    return String(val).trim() || null;
  }

  function render() {
    const el = document.getElementById('screen-zeiten');
    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">Sessions</span>
      </div>
      <div class="filter-bar" id="zeiten-filter-bar"></div>
      <div class="scroll-content" id="zeiten-content"></div>`;

    _renderFilters();
    _renderContent();
  }

  function _renderFilters() {
    const bar = document.getElementById('zeiten-filter-bar');
    const vehicles = getVehicles();
    const allSessions = getSessions();
    const tracks = [...new Set(allSessions.map(s => s.strecke).filter(Boolean))];

    const vehicleLabel = _filterVehicle
      ? _esc(vehicles.find(v => v.id === _filterVehicle)?.name || 'Motorrad')
      : 'Alle Motorräder';
    const trackLabel = _filterTrack ? _esc(_filterTrack) : 'Alle Strecken';

    bar.innerHTML = `
      <button class="filter-chip ${_filterVehicle ? 'active' : ''}" id="filter-vehicle-btn">
        ${vehicleLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:5px;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button class="filter-chip ${_filterTrack ? 'active' : ''}" id="filter-track-btn">
        ${trackLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:5px;flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="filter-divider"></div>
      <button class="filter-chip ${_filterBedingung === 'alle' ? 'active' : ''}" data-cond="alle">Alle</button>
      <button class="filter-chip ${_filterBedingung === 'trocken' ? 'active' : ''}" data-cond="trocken">☀ Trocken</button>
      <button class="filter-chip ${_filterBedingung === 'nass' ? 'active' : ''}" data-cond="nass">🌧 Nass</button>
    `;

    document.getElementById('filter-vehicle-btn').addEventListener('click', () => {
      const options = [
        { label: 'Alle Motorräder', value: '' },
        ...vehicles.map(v => ({ label: v.name, value: v.id }))
      ];
      _openFilterSheet('Motorrad', options, _filterVehicle, val => {
        _filterVehicle = val;
        _setupChartIdx = 0;
        _renderFilters();
        _renderContent();
      });
    });

    document.getElementById('filter-track-btn').addEventListener('click', () => {
      const options = [
        { label: 'Alle Strecken', value: '' },
        ...tracks.map(t => ({ label: t, value: t }))
      ];
      _openFilterSheet('Strecke', options, _filterTrack, val => {
        _filterTrack = val;
        _setupChartIdx = 0;
        _renderFilters();
        _renderContent();
      });
    });

    bar.querySelectorAll('[data-cond]').forEach(btn => {
      btn.addEventListener('click', () => {
        _filterBedingung = btn.dataset.cond;
        _renderFilters();
        _renderContent();
      });
    });

    _enableDragScroll(bar);
  }

  function _enableDragScroll(el) {
    let startX = 0;
    let scrollLeft = 0;
    let dragging = false;
    let moved = false;

    el.addEventListener('mousedown', e => {
      dragging = true;
      moved = false;
      startX = e.pageX - el.getBoundingClientRect().left;
      scrollLeft = el.scrollLeft;
      el.classList.add('dragging');
    });

    window.addEventListener('mouseup', () => {
      dragging = false;
      el.classList.remove('dragging');
    });

    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = x - startX;
      if (Math.abs(walk) > 4) moved = true;
      el.scrollLeft = scrollLeft - walk;
    });

    el.addEventListener('click', e => {
      if (moved) e.stopPropagation();
    }, true);
  }

  function _renderContent() {
    const el = document.getElementById('zeiten-content');
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

    const withTime = filtered.filter(s => parseTime(s.bestzeit) !== null);
    const bestSeconds = withTime.length ? Math.min(...withTime.map(s => parseTime(s.bestzeit))) : null;
    const bestSession = withTime.find(s => parseTime(s.bestzeit) === bestSeconds);

    const chartData = withTime
      .slice()
      .sort((a, b) => {
        const ad = (a.datum || '') + 'T' + (a.uhrzeit || '');
        const bd = (b.datum || '') + 'T' + (b.uhrzeit || '');
        return ad < bd ? -1 : ad > bd ? 1 : 0;
      })
      .map(s => ({
        datum: s.datum,
        uhrzeit: s.uhrzeit,
        timeSeconds: parseTime(s.bestzeit),
        bestzeit: s.bestzeit,
        bedingung: s.bedingung
      }));

    const showCharts = _filterVehicle && _filterTrack;

    const _dateOf = x => new Date((x.datum || '') + 'T' + (x.uhrzeit || ''));
    const timelineItems = filtered
      .slice()
      .sort((a, b) => _dateOf(b) - _dateOf(a));

    el.innerHTML = `
      ${bestSession ? `
      <div class="bestzeit-banner">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Bestzeit</div>
          <div class="bestzeit-value">${_esc(bestSession.bestzeit)}</div>
          <div class="bestzeit-meta">
            ${_formatDate(bestSession.datum)} · ${_esc(bestSession.strecke)}
            ${bestSession.reifen?.vorne?.hersteller ? '· ' + _esc(bestSession.reifen.vorne.hersteller) : ''}
          </div>
        </div>
        <div><span class="badge badge-${bestSession.bedingung}">${bestSession.bedingung}</span></div>
      </div>` : ''}

      ${chartData.length >= 2 && showCharts ? `
      <div class="chart-container">
        <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">
          Zeitverlauf — älteste links, neueste rechts
        </div>
        <canvas id="zeiten-chart" height="160"></canvas>
      </div>` : ''}

      ${showCharts ? `<div id="setup-chart-wrapper"></div>` : ''}

      ${timelineItems.length === 0 ? `
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
      ${timelineItems.map(s => _buildHistoryEntry(s, bestSeconds)).join('')}
      `}
      <div style="height:8px"></div>`;

    // Event listeners for session list
    el.querySelectorAll('[data-expand-session]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.expandSession;
        expandedSessions.has(id) ? expandedSessions.delete(id) : expandedSessions.add(id);
        _deleteConfirmId = null;
        _renderContent();
      });
    });

    el.querySelectorAll('[data-edit-session]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const session = getSessions().find(s => s.id === btn.dataset.editSession);
        if (!session) return;
        ScreenSetup.startWithSession(session);
        ScreenSetup.render();
        App.navigate('setup');
      });
    });

    el.querySelectorAll('[data-delete-session]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _deleteConfirmId = _deleteConfirmId === btn.dataset.deleteSession ? null : btn.dataset.deleteSession;
        _renderContent();
      });
    });

    el.querySelectorAll('[data-confirm-delete-session]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        deleteSession(btn.dataset.confirmDeleteSession);
        expandedSessions.delete(btn.dataset.confirmDeleteSession);
        _deleteConfirmId = null;
        _renderContent();
      });
    });

    el.querySelectorAll('[data-cancel-delete-session]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _deleteConfirmId = null;
        _renderContent();
      });
    });

    // Draw lap time chart
    const canvas = document.getElementById('zeiten-chart');
    if (canvas && chartData.length >= 2) {
      _drawChart(canvas, chartData);
    }

    // Draw setup comparison carousel
    if (showCharts) {
      _renderSetupCarousel(filtered);
    }
  }

  // ── Setup Chart Carousel ──

  function _renderSetupCarousel(sessions) {
    const wrapper = document.getElementById('setup-chart-wrapper');
    if (!wrapper) return;

    // Filter to params that have >= 2 data points
    const activeParams = SETUP_PARAMS.filter(p => {
      if (p.categorical) return sessions.filter(s => _getRawVal(s, p.key) !== null).length >= 2;
      return sessions.filter(s => _getVal(s, p.key) !== null).length >= 2;
    });

    if (activeParams.length === 0) return;

    // Clamp index
    if (_setupChartIdx >= activeParams.length) _setupChartIdx = 0;
    if (_setupChartIdx < 0) _setupChartIdx = 0;

    const current = activeParams[_setupChartIdx];
    const hasPrev = _setupChartIdx > 0;
    const hasNext = _setupChartIdx < activeParams.length - 1;

    wrapper.innerHTML = `
      <div class="chart-container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <button class="btn-icon" id="setup-prev" style="opacity:${hasPrev ? 1 : 0.25};flex-shrink:0" ${hasPrev ? '' : 'disabled'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style="text-align:center;flex:1;padding:0 8px">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em">
              Setup Vergleich · ${_setupChartIdx + 1} / ${activeParams.length}
            </div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-top:2px">
              ${_esc(current.label)}${current.unit ? `<span style="color:var(--text-muted);font-weight:400"> (${current.unit})</span>` : ''}
            </div>
          </div>
          <button class="btn-icon" id="setup-next" style="opacity:${hasNext ? 1 : 0.25};flex-shrink:0" ${hasNext ? '' : 'disabled'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
        <canvas id="setup-chart" height="160"></canvas>
        <div style="display:flex;justify-content:center;align-items:center;gap:5px;margin-top:10px;flex-wrap:wrap">
          ${activeParams.map((_, i) => `
            <div style="height:5px;border-radius:3px;background:${i === _setupChartIdx ? 'var(--accent)' : 'var(--border)'};width:${i === _setupChartIdx ? '16px' : '5px'};transition:all 0.2s"></div>
          `).join('')}
        </div>
      </div>`;

    // Navigation buttons
    wrapper.querySelector('#setup-prev')?.addEventListener('click', () => {
      if (_setupChartIdx > 0) { _setupChartIdx--; _renderSetupCarousel(sessions); }
    });
    wrapper.querySelector('#setup-next')?.addEventListener('click', () => {
      if (_setupChartIdx < activeParams.length - 1) { _setupChartIdx++; _renderSetupCarousel(sessions); }
    });

    // Touch / swipe support
    const container = wrapper.querySelector('.chart-container');
    let touchStartX = 0;
    container.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    container.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && _setupChartIdx < activeParams.length - 1) { _setupChartIdx++; _renderSetupCarousel(sessions); }
        if (diff < 0 && _setupChartIdx > 0) { _setupChartIdx--; _renderSetupCarousel(sessions); }
      }
    }, { passive: true });

    // Prepare data for chart (sorted oldest → newest, only sessions with this param)
    const sortByDate = (a, b) => {
      const ad = (a.datum || '') + 'T' + (a.uhrzeit || '');
      const bd = (b.datum || '') + 'T' + (b.uhrzeit || '');
      return ad < bd ? -1 : ad > bd ? 1 : 0;
    };

    let chartSessions, numToLabel = null, yRange = null;

    if (current.categorical) {
      const rawSessions = sessions
        .filter(s => _getRawVal(s, current.key) !== null)
        .sort(sortByDate);
      // Use fixed categories if defined (e.g. ['A','B','C']), else derive from data
      const uniqueVals = current.categories
        ? current.categories.slice()
        : [...new Set(rawSessions.map(s => _getRawVal(s, current.key)))].sort();
      // A = highest index → top of chart
      const valueToNum = {};
      uniqueVals.forEach((v, i) => { valueToNum[v] = uniqueVals.length - 1 - i; });
      numToLabel = {};
      Object.entries(valueToNum).forEach(([lbl, num]) => { numToLabel[num] = lbl; });
      // Fix Y range to always cover all defined categories
      yRange = [0, uniqueVals.length - 1];
      chartSessions = rawSessions.map(s => ({
        datum: s.datum,
        value: valueToNum[_getRawVal(s, current.key)] ?? 0
      }));
    } else {
      chartSessions = sessions
        .filter(s => _getVal(s, current.key) !== null)
        .sort(sortByDate)
        .map(s => ({ datum: s.datum, value: _getVal(s, current.key) }));
    }

    const canvas = document.getElementById('setup-chart');
    if (canvas) _drawSetupChart(canvas, chartSessions, current.unit, numToLabel, current.integer || false, yRange);
  }

  function _drawSetupChart(canvas, data, unit, numToLabel = null, integer = false, yRange = null) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width || canvas.parentElement.clientWidth - 32;
    const H = 160;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 16, bottom: 36, left: 56 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const values = data.map(d => d.value);
    const minV = yRange ? yRange[0] : Math.min(...values);
    const maxV = yRange ? yRange[1] : Math.max(...values);
    const rangeV = maxV - minV || 1;

    const toX = i => pad.left + (i / Math.max(data.length - 1, 1)) * cW;
    const toY = v => pad.top + ((maxV - v) / rangeV) * cH;

    const fmtVal = v => {
      if (Number.isInteger(v)) return String(v);
      return parseFloat(v.toFixed(2)).toString();
    };

    // Grid lines + Y labels
    ctx.strokeStyle = '#2a2e3d';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9aa0bb';
    ctx.font = `10px 'Barlow', sans-serif`;
    ctx.textAlign = 'right';

    if (numToLabel) {
      // Categorical: one grid line per defined category (all levels always shown)
      const allNums = Object.keys(numToLabel).map(Number).sort((a, b) => a - b);
      allNums.forEach(v => {
        const y = toY(v);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.fillText(numToLabel[v] ?? String(v), pad.left - 4, y + 4);
      });
    } else if (integer) {
      // Integer: grid lines at nice whole-number positions
      const range = maxV - minV;
      let step = 1;
      if (range > 20) step = Math.ceil(range / 4 / 5) * 5;
      else if (range > 8) step = Math.ceil(range / 4);
      else if (range > 4) step = 2;
      const gridVals = new Set([Math.round(minV), Math.round(maxV)]);
      for (let v = Math.ceil(minV / step) * step; v <= maxV + 0.001; v += step) {
        gridVals.add(Math.round(v));
      }
      [...gridVals].sort((a, b) => b - a).forEach(v => {
        const y = toY(v);
        if (y < pad.top - 5 || y > pad.top + cH + 5) return;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.fillText(String(v) + (unit ? ' ' + unit : ''), pad.left - 4, y + 4);
      });
    } else {
      // Numeric: 4 evenly spaced grid lines
      for (let i = 0; i <= 3; i++) {
        const y = pad.top + (i / 3) * cH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        const v = maxV - (i / 3) * rangeV;
        ctx.fillText(fmtVal(v) + (unit ? ' ' + unit : ''), pad.left - 4, y + 4);
      }
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

    if (data.length < 2) {
      // Single point — just a dot in the center
      ctx.fillStyle = '#d4f53c';
      ctx.strokeStyle = '#d4f53c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pad.left + cW / 2, pad.top + cH / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Line
    ctx.strokeStyle = '#d4f53c';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.value)) : ctx.lineTo(toX(i), toY(d.value));
    });
    ctx.stroke();

    // Fill under line
    ctx.fillStyle = 'rgba(212,245,60,0.06)';
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.value)) : ctx.lineTo(toX(i), toY(d.value));
    });
    ctx.lineTo(toX(data.length - 1), H - pad.bottom);
    ctx.lineTo(toX(0), H - pad.bottom);
    ctx.closePath();
    ctx.fill();

    // Dots
    data.forEach((d, i) => {
      ctx.fillStyle = '#181b23';
      ctx.strokeStyle = '#d4f53c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toX(i), toY(d.value), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  // ── Filter Sheet ──

  function _openFilterSheet(title, options, current, onSelect) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">${title} wählen</div>
        <div id="filter-sheet-options">
          ${options.map(opt => `
            <div class="filter-sheet-option ${opt.value === current ? 'active' : ''}" data-value="${_esc(opt.value)}">
              <span>${_esc(opt.label)}</span>
              ${opt.value === current ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </div>`).join('')}
        </div>
        <div style="height:8px"></div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelectorAll('.filter-sheet-option').forEach(opt => {
      opt.addEventListener('click', () => {
        onSelect(opt.dataset.value);
        overlay.remove();
      });
    });
  }

  // ── History Entry ──

  function _buildHistoryEntry(s, bestSeconds) {
    const secs = parseTime(s.bestzeit);
    const delta = (secs !== null && bestSeconds !== null) ? secs - bestSeconds : null;
    const isBest = delta === 0;
    const isExpanded = expandedSessions.has(s.id);
    const isDeleteConfirm = _deleteConfirmId === s.id;

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
          <div class="divider"></div>
          ${isDeleteConfirm ? `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="font-size:13px;color:#ff4444">Session wirklich löschen?</span>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" data-cancel-delete-session="${s.id}" style="font-size:12px;padding:6px 10px;min-height:34px">Abbrechen</button>
              <button class="btn btn-danger" data-confirm-delete-session="${s.id}" style="font-size:12px;padding:6px 10px;min-height:34px">Löschen</button>
            </div>
          </div>` : `
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" data-edit-session="${s.id}" style="font-size:12px;padding:6px 12px;min-height:34px;flex:1">
              Bearbeiten
            </button>
            <button class="btn btn-ghost" data-delete-session="${s.id}" style="font-size:12px;padding:6px 12px;min-height:34px;color:var(--text-muted)">
              Löschen…
            </button>
          </div>`}
        </div>` : ''}
      </div>`;
  }

  function _buildSessionDetail(s) {
    const v = getVehicle(s.vehicleId);
    const rv = s.reifen?.vorne;
    const rh = s.reifen?.hinten;
    const reifenVorne = [rv?.hersteller, rv?.modell, rv?.compound].filter(Boolean).join(' ');
    const reifenHinten = [rh?.hersteller, rh?.modell, rh?.compound].filter(Boolean).join(' ');
    const rows = [
      ['Motorrad', v?.name],
      ['Lufttemperatur', s.temperatur?.luft !== '' ? s.temperatur?.luft + ' °C' : null],
      ['Asphalttemperatur', s.temperatur?.asphalt !== '' ? s.temperatur?.asphalt + ' °C' : null],
      ['Reifen Vorne', reifenVorne || null],
      ['Druck Vorne', rv?.druck !== '' && rv?.druck !== undefined ? rv.druck + ' bar' : null],
      ['Reifen Hinten', reifenHinten || null],
      ['Druck Hinten', rh?.druck !== '' && rh?.druck !== undefined ? rh.druck + ' bar' : null],
      ['Ritzel / Kettenrad', (s.sekundaer?.ritzel && s.sekundaer?.kettenrad) ? `${s.sekundaer.ritzel} / ${s.sekundaer.kettenrad} = ${(s.sekundaer.kettenrad / s.sekundaer.ritzel).toFixed(3)}` : null],
      ['Kettenlänge', s.sekundaer?.kettenlaenge ? s.sekundaer.kettenlaenge + ' Glieder' : null],
      ['Gabel Vorspannung', s.gabel?.federvorspannung !== '' && s.gabel?.federvorspannung !== undefined ? s.gabel.federvorspannung + ' Umdr.' : null],
      ['Gabel Druckstufe', s.gabel?.druckstufe_klicks !== '' ? s.gabel?.druckstufe_klicks + ' Klicks' : null],
      ['Gabel Zugstufe', s.gabel?.zugstufe_klicks !== '' ? s.gabel?.zugstufe_klicks + ' Klicks' : null],
      ['Gabel Öltyp', s.gabel?.oeltyp !== '' && s.gabel?.oeltyp !== undefined ? String(s.gabel.oeltyp) : null],
      ['Gabel Öllevel', s.gabel?.oelstand_mm !== '' && s.gabel?.oelstand_mm !== undefined ? s.gabel.oelstand_mm + ' mm' : null],
      ['Federbein Vorspannung', s.federbein?.federvorspannung !== '' && s.federbein?.federvorspannung !== undefined ? s.federbein.federvorspannung + ' Umdr.' : null],
      ['Federbein Druckstufe', s.federbein?.druckstufe_klicks !== '' ? s.federbein?.druckstufe_klicks + ' Klicks' : null],
      ['Federbein Zugstufe', s.federbein?.zugstufe_klicks !== '' ? s.federbein?.zugstufe_klicks + ' Klicks' : null],
      ['Federbein Höhe', s.federbein?.hoehe_mm ? s.federbein.hoehe_mm + ' mm' + (s.federbein?.messpunkt ? ' (' + s.federbein.messpunkt + ')' : '') : null],
      ['TC Stufe', s.elektronik?.tc_stufe !== '' && s.elektronik?.tc_stufe !== undefined ? String(s.elektronik.tc_stufe) : null],
      ['Motor Modus', s.elektronik?.tc_modus || null],
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

  // ── Lap Time Chart ──

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
    const toY = t => pad.top + ((maxT - t) / rangeT) * cH;

    // Grid lines + Y labels
    ctx.strokeStyle = '#2a2e3d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (i / 3) * cH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

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
      i === 0 ? ctx.moveTo(toX(i), toY(d.timeSeconds)) : ctx.lineTo(toX(i), toY(d.timeSeconds));
    });
    ctx.stroke();

    // Fill under line
    ctx.fillStyle = 'rgba(212,245,60,0.06)';
    ctx.beginPath();
    data.forEach((d, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(d.timeSeconds)) : ctx.lineTo(toX(i), toY(d.timeSeconds));
    });
    ctx.lineTo(toX(data.length - 1), H - pad.bottom);
    ctx.lineTo(toX(0), H - pad.bottom);
    ctx.closePath();
    ctx.fill();

    // Dots
    data.forEach((d, i) => {
      const isBest = d.timeSeconds === minT;
      ctx.fillStyle = isBest ? '#d4f53c' : '#181b23';
      ctx.strokeStyle = '#d4f53c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toX(i), toY(d.timeSeconds), isBest ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  // ── Helpers ──

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
