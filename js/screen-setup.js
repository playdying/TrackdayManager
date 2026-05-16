// ── Screen 4: Setup-Erfassung ──

const ScreenSetup = (() => {

  let _wizardState = null;

  function startWithWizardState(ws) {
    _wizardState = { ...ws };
  }

  function render() {
    if (!_wizardState) { App.navigate('fahrzeuge'); return; }

    const vehicle = getVehicle(_wizardState.vehicleId);
    if (!vehicle) { App.navigate('fahrzeuge'); return; }

    const last = getLastSessionForVehicle(_wizardState.vehicleId);
    const pre = last || {};

    const el = document.getElementById('screen-setup');
    el.innerHTML = `
      <div class="screen-header">
        <button class="btn-icon" id="setup-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style="text-align:center">
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${_esc(vehicle.name)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${_esc(_wizardState.strecke)} · ${_wizardState.bedingung === 'nass' ? '🌧 Nass' : '☀ Trocken'}</div>
        </div>
        <div style="width:44px"></div>
      </div>

      <div class="scroll-content">
        ${last ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border)">
          Vorausgefüllt aus letzter Session vom ${_formatDate(last.datum)}
        </div>` : ''}

        <!-- Gabel -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="22"/><line x1="8" y1="6" x2="16" y2="6"/>
            </svg>
            Gabel (vorne)
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Negativfederweg (mm)</label>
                <input class="field-input" type="number" id="gabel-negfed" value="${pre.gabel?.negativfederweg_mm ?? ''}" placeholder="z.B. 28">
              </div>
              <div class="field-group">
                <label class="field-label">Durchstreckung (mm)</label>
                <input class="field-input" type="number" id="gabel-durch" value="${pre.gabel?.durchstreckung_mm ?? ''}" placeholder="z.B. 12">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Druckstufe (Klicks)</label>
                <input class="field-input" type="number" id="gabel-druck" value="${pre.gabel?.druckstufe_klicks ?? ''}" placeholder="z.B. 12">
              </div>
              <div class="field-group">
                <label class="field-label">Zugstufe (Klicks)</label>
                <input class="field-input" type="number" id="gabel-zug" value="${pre.gabel?.zugstufe_klicks ?? ''}" placeholder="z.B. 8">
              </div>
            </div>
          </div>
        </div>

        <!-- Federbein -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="22"/><path d="M8 8h8M8 12h8M8 16h8"/>
            </svg>
            Federbein (hinten)
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Negativfederweg (mm)</label>
                <input class="field-input" type="number" id="fb-negfed" value="${pre.federbein?.negativfederweg_mm ?? ''}" placeholder="z.B. 22">
              </div>
              <div class="field-group">
                <label class="field-label">Höhe (mm)</label>
                <input class="field-input" type="number" id="fb-hoehe" value="${pre.federbein?.hoehe_mm ?? ''}" placeholder="z.B. 820">
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Messpunkt</label>
              <select class="field-input" id="fb-messpunkt">
                ${MESSPUNKTE.map(m => `<option value="${m}" ${(pre.federbein?.messpunkt || 'Kettenspanner') === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Druckstufe (Klicks)</label>
                <input class="field-input" type="number" id="fb-druck" value="${pre.federbein?.druckstufe_klicks ?? ''}" placeholder="z.B. 10">
              </div>
              <div class="field-group">
                <label class="field-label">Zugstufe (Klicks)</label>
                <input class="field-input" type="number" id="fb-zug" value="${pre.federbein?.zugstufe_klicks ?? ''}" placeholder="z.B. 6">
              </div>
            </div>
          </div>
        </div>

        <!-- Reifen -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Reifen
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Hersteller</label>
                <input class="field-input" id="reifen-hersteller" value="${_esc(pre.reifen?.hersteller || '')}" placeholder="z.B. Pirelli">
              </div>
              <div class="field-group">
                <label class="field-label">Modell</label>
                <input class="field-input" id="reifen-modell" value="${_esc(pre.reifen?.modell || '')}" placeholder="z.B. Diablo SC">
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Compound</label>
              <input class="field-input" id="reifen-compound" value="${_esc(pre.reifen?.compound || '')}" placeholder="z.B. SC1">
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Druck vorne (bar)</label>
                <input class="field-input" type="number" step="0.1" id="reifen-dv" value="${pre.reifen?.druck_vorne ?? ''}" placeholder="z.B. 2.1">
              </div>
              <div class="field-group">
                <label class="field-label">Druck hinten (bar)</label>
                <input class="field-input" type="number" step="0.1" id="reifen-dh" value="${pre.reifen?.druck_hinten ?? ''}" placeholder="z.B. 1.9">
              </div>
            </div>
          </div>
        </div>

        <!-- Bestzeit -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
            </svg>
            Bestzeit
          </div>
          <div class="setup-section-body">
            <div class="field-group">
              <label class="field-label">Zeit (MM:SS.mmm)</label>
              <input class="field-input bestzeit-input" id="setup-bestzeit" value="${_esc(pre.bestzeit || '')}" placeholder="2:04.381" inputmode="decimal">
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Format: Minuten:Sekunden.Millisekunden</div>
            </div>
          </div>
        </div>

        <!-- Notiz -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Notiz
          </div>
          <div class="setup-section-body">
            <textarea class="field-input" id="setup-notiz" placeholder="Was hat sich verändert? Warum diese Einstellung?" style="min-height:120px">${_esc(pre.notiz || '')}</textarea>
          </div>
        </div>

        <button class="btn btn-primary btn-full" id="setup-save" style="margin-top:8px;margin-bottom:8px">
          Session speichern
        </button>
        <div style="height:8px"></div>
      </div>`;

    document.getElementById('setup-back').addEventListener('click', () => {
      App.navigate('wizard');
      ScreenWizard.render();
    });

    document.getElementById('setup-save').addEventListener('click', _save);
  }

  function _save() {
    const g = (id) => document.getElementById(id)?.value?.trim() || '';
    const n = (id) => { const v = document.getElementById(id)?.value; return v !== '' && v !== undefined ? parseFloat(v) : ''; };

    addSession({
      vehicleId: _wizardState.vehicleId,
      datum: _wizardState.datum,
      uhrzeit: _wizardState.uhrzeit,
      strecke: _wizardState.strecke,
      streckeKm: _wizardState.streckeKm,
      bedingung: _wizardState.bedingung,
      temperatur: {
        luft: n('wiz-luft') || _wizardState.temperatur?.luft || '',
        asphalt: n('wiz-asphalt') || _wizardState.temperatur?.asphalt || ''
      },
      gabel: {
        negativfederweg_mm: n('gabel-negfed'),
        durchstreckung_mm: n('gabel-durch'),
        druckstufe_klicks: n('gabel-druck'),
        zugstufe_klicks: n('gabel-zug')
      },
      federbein: {
        negativfederweg_mm: n('fb-negfed'),
        hoehe_mm: n('fb-hoehe'),
        messpunkt: g('fb-messpunkt') || 'Kettenspanner',
        druckstufe_klicks: n('fb-druck'),
        zugstufe_klicks: n('fb-zug')
      },
      reifen: {
        hersteller: g('reifen-hersteller'),
        modell: g('reifen-modell'),
        compound: g('reifen-compound'),
        druck_vorne: n('reifen-dv'),
        druck_hinten: n('reifen-dh')
      },
      bestzeit: g('setup-bestzeit'),
      notiz: g('setup-notiz')
    });

    _wizardState = null;
    App.navigate('zeiten');
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

  return { render, startWithWizardState };
})();
