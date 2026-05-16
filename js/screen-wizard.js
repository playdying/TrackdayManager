// ── Screen Wizard: Schritte 1–3 (Fahrzeug → Bedingung → Strecke) ──

const ScreenWizard = (() => {

  const state = {
    step: 1,
    vehicleId: null,
    bedingung: 'trocken',
    datum: '',
    uhrzeit: '',
    temperatur: { luft: '', asphalt: '' },
    strecke: null,
    streckeKm: '',
    eigeneStrecke: false
  };

  function start() {
    // Reset state
    state.step = 1;
    state.vehicleId = null;
    state.bedingung = 'trocken';
    const now = new Date();
    state.datum = now.toISOString().slice(0, 10);
    state.uhrzeit = now.toTimeString().slice(0, 5);
    state.temperatur = { luft: '', asphalt: '' };
    state.strecke = null;
    state.streckeKm = '';
    state.eigeneStrecke = false;

    App.navigate('wizard');
  }

  function render() {
    switch (state.step) {
      case 1: _renderStep1(); break;
      case 2: _renderStep2(); break;
      case 3: _renderStep3(); break;
    }
  }

  // ── Step 1: Fahrzeug auswählen ──

  function _renderStep1() {
    const el = document.getElementById('screen-wizard');
    const vehicles = getVehicles();

    el.innerHTML = `
      <div class="screen-header">
        <button class="btn-icon" id="wizard-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="screen-title">Neue Session</span>
        <div style="width:44px"></div>
      </div>
      <div class="wizard-step-indicator">
        <div class="wizard-dot active"></div>
        <div class="wizard-dot"></div>
        <div class="wizard-dot"></div>
      </div>
      <div class="scroll-content" style="padding-top:16px">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Welches Motorrad fährst du heute?</p>
        ${vehicles.length === 0 ? `
          <div class="empty-state" style="padding:40px 0">
            <p class="empty-state-title">Kein Motorrad vorhanden</p>
            <p class="empty-state-text">Lege zuerst ein Motorrad in der Motorräder-Ansicht an.</p>
            <button class="btn btn-primary mt-16" id="wizard-go-vehicles">Zu Motorräder</button>
          </div>` : vehicles.map(v => `
          <div class="list-item ${state.vehicleId === v.id ? 'active' : ''}" data-select-vehicle="${v.id}">
            <div>
              <div class="list-item-name">${_esc(v.name)}</div>
              <div class="list-item-meta">${[v.year, v.motor?.hubraum, v.motor?.leistung].filter(Boolean).join(' · ')}</div>
            </div>
            ${state.vehicleId === v.id ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>`).join('')}
        <div style="height:20px"></div>
        ${vehicles.length > 0 ? `
        <button class="btn btn-primary btn-full" id="wizard-next-1" ${state.vehicleId ? '' : 'disabled'} style="opacity:${state.vehicleId ? 1 : 0.4}">
          Weiter
        </button>` : ''}
      </div>`;

    document.getElementById('wizard-back').addEventListener('click', () => App.navigate('fahrzeuge'));
    document.getElementById('wizard-go-vehicles')?.addEventListener('click', () => App.navigate('fahrzeuge'));

    el.querySelectorAll('[data-select-vehicle]').forEach(item => {
      item.addEventListener('click', () => {
        state.vehicleId = item.dataset.selectVehicle;
        _renderStep1();
      });
    });

    document.getElementById('wizard-next-1')?.addEventListener('click', () => {
      if (!state.vehicleId) return;
      state.step = 2;
      render();
    });
  }

  // ── Step 2: Bedingung, Datum, Temperaturen ──

  function _renderStep2() {
    const el = document.getElementById('screen-wizard');

    el.innerHTML = `
      <div class="screen-header">
        <button class="btn-icon" id="wizard-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="screen-title">Bedingungen</span>
        <div style="width:44px"></div>
      </div>
      <div class="wizard-step-indicator">
        <div class="wizard-dot done"></div>
        <div class="wizard-dot active"></div>
        <div class="wizard-dot"></div>
      </div>
      <div class="scroll-content" style="padding-top:16px">

        <p class="field-label" style="margin-bottom:10px">Streckenbedingung</p>
        <div class="toggle-group">
          <button class="toggle-btn ${state.bedingung === 'trocken' ? 'active' : ''}" data-condition="trocken">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/>
              <line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/>
              <line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            Trocken
          </button>
          <button class="toggle-btn ${state.bedingung === 'nass' ? 'active' : ''}" data-condition="nass">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/>
              <line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/>
              <line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/>
              <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
            </svg>
            Nass
          </button>
        </div>

        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Datum</label>
            <input class="field-input" type="date" id="wiz-datum" value="${state.datum}">
          </div>
          <div class="field-group">
            <label class="field-label">Uhrzeit</label>
            <input class="field-input" type="time" id="wiz-uhrzeit" value="${state.uhrzeit}">
          </div>
        </div>

        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Lufttemperatur (°C)</label>
            <input class="field-input" type="number" id="wiz-luft" value="${state.temperatur.luft}" placeholder="z.B. 22">
          </div>
          <div class="field-group">
            <label class="field-label">Asphalttemperatur (°C)</label>
            <input class="field-input" type="number" id="wiz-asphalt" value="${state.temperatur.asphalt}" placeholder="z.B. 38">
          </div>
        </div>

        <div style="height:20px"></div>
        <button class="btn btn-primary btn-full" id="wizard-next-2">Weiter</button>
      </div>`;

    document.getElementById('wizard-back').addEventListener('click', () => { state.step = 1; render(); });

    el.querySelectorAll('[data-condition]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.bedingung = btn.dataset.condition;
        el.querySelectorAll('[data-condition]').forEach(b => b.classList.toggle('active', b.dataset.condition === state.bedingung));
      });
    });

    document.getElementById('wizard-next-2').addEventListener('click', () => {
      state.datum = document.getElementById('wiz-datum').value;
      state.uhrzeit = document.getElementById('wiz-uhrzeit').value;
      state.temperatur.luft = document.getElementById('wiz-luft').value;
      state.temperatur.asphalt = document.getElementById('wiz-asphalt').value;
      state.step = 3;
      render();
    });
  }

  // ── Step 3: Strecke auswählen ──

  function _renderStep3() {
    const el = document.getElementById('screen-wizard');

    el.innerHTML = `
      <div class="screen-header">
        <button class="btn-icon" id="wizard-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="screen-title">Strecke</span>
        <div style="width:44px"></div>
      </div>
      <div class="wizard-step-indicator">
        <div class="wizard-dot done"></div>
        <div class="wizard-dot done"></div>
        <div class="wizard-dot active"></div>
      </div>
      <div class="scroll-content" style="padding-top:16px">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Welche Strecke fährst du?</p>

        ${STRECKEN.map(s => `
          <div class="list-item ${state.strecke === s.name && !state.eigeneStrecke ? 'active' : ''}" data-select-track="${_esc(s.name)}" data-km="${s.km}">
            <span class="list-item-name">${_esc(s.name)}</span>
            <span class="list-item-meta">${s.km} km</span>
          </div>`).join('')}

        <div class="list-item ${state.eigeneStrecke ? 'active' : ''}" id="btn-eigene-strecke">
          <span class="list-item-name">Eigene Strecke…</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>

        <div id="eigene-strecke-form" style="display:${state.eigeneStrecke ? 'block' : 'none'};margin-top:8px">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Streckenname</label>
              <input class="field-input" id="eigene-name" value="${state.eigeneStrecke ? _esc(state.strecke || '') : ''}" placeholder="Streckenname">
            </div>
            <div class="field-group">
              <label class="field-label">Länge (km)</label>
              <input class="field-input" id="eigene-km" value="${state.eigeneStrecke ? _esc(state.streckeKm || '') : ''}" placeholder="z.B. 4.200" type="number" step="0.001">
            </div>
          </div>
        </div>

        <div style="height:20px"></div>
        <button class="btn btn-primary btn-full" id="wizard-next-3" ${state.strecke || state.eigeneStrecke ? '' : 'disabled'} style="opacity:${state.strecke || state.eigeneStrecke ? 1 : 0.4}">
          Setup erfassen
        </button>
      </div>`;

    document.getElementById('wizard-back').addEventListener('click', () => { state.step = 2; render(); });

    el.querySelectorAll('[data-select-track]').forEach(item => {
      item.addEventListener('click', () => {
        state.strecke = item.dataset.selectTrack;
        state.streckeKm = item.dataset.km;
        state.eigeneStrecke = false;
        _renderStep3();
      });
    });

    document.getElementById('btn-eigene-strecke').addEventListener('click', () => {
      state.eigeneStrecke = true;
      state.strecke = '';
      state.streckeKm = '';
      _renderStep3();
      setTimeout(() => document.getElementById('eigene-name')?.focus(), 100);
    });

    document.getElementById('wizard-next-3').addEventListener('click', () => {
      if (state.eigeneStrecke) {
        const name = document.getElementById('eigene-name')?.value.trim();
        const km = document.getElementById('eigene-km')?.value.trim();
        if (!name) { document.getElementById('eigene-name').style.borderColor = '#ff4444'; return; }
        state.strecke = name;
        state.streckeKm = km;
      }
      if (!state.strecke) return;
      ScreenSetup.startWithWizardState(state);
      App.navigate('setup');
    });
  }

  function _esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { start, render };
})();
