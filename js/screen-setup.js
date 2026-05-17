// ── Screen Setup: Fahrwerk, Reifen, Elektronik, Bestzeit ──

const ScreenSetup = (() => {

  let _wizardState = null;
  let _editSession = null;

  function startWithWizardState(ws) {
    _editSession = null;
    _wizardState = { ...ws };
  }

  function startWithSession(session) {
    _editSession = session;
    _wizardState = {
      vehicleId: session.vehicleId,
      datum: session.datum,
      uhrzeit: session.uhrzeit || '',
      strecke: session.strecke,
      streckeKm: session.streckeKm || '',
      bedingung: session.bedingung || 'trocken',
      temperatur: session.temperatur || {}
    };
  }

  function render() {
    if (!_wizardState) { App.navigate('fahrzeuge'); return; }

    const vehicle = getVehicle(_wizardState.vehicleId);
    if (!vehicle) { App.navigate('fahrzeuge'); return; }

    const last = _editSession ? null : getLastSessionForVehicle(_wizardState.vehicleId);
    const pre = _editSession || last || {};

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
          <div style="font-size:11px;color:var(--text-muted)">${_editSession ? 'Session bearbeiten' : _esc(_wizardState.strecke) + ' · ' + (_wizardState.bedingung === 'nass' ? '🌧 Nass' : '☀ Trocken')}</div>
        </div>
        <div style="width:44px"></div>
      </div>

      <div class="scroll-content">
        ${last ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border)">
          Vorausgefüllt aus letzter Session vom ${_formatDate(last.datum)}
        </div>` : ''}

        ${_editSession ? `
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Basisdaten
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Datum</label>
                <input class="field-input" type="date" id="edit-datum" value="${_esc(_editSession.datum || '')}">
              </div>
              <div class="field-group">
                <label class="field-label">Uhrzeit</label>
                <input class="field-input" type="time" id="edit-uhrzeit" value="${_esc(_editSession.uhrzeit || '')}">
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Strecke</label>
              <input class="field-input" id="edit-strecke" list="edit-strecke-list" value="${_esc(_editSession.strecke || '')}">
              <datalist id="edit-strecke-list">
                ${STRECKEN.map(s => `<option value="${_esc(s.name)}">`).join('')}
              </datalist>
            </div>
            <div class="field-group">
              <label class="field-label">Bedingung</label>
              <select class="field-input" id="edit-bedingung">
                <option value="trocken" ${(_editSession.bedingung || 'trocken') === 'trocken' ? 'selected' : ''}>☀ Trocken</option>
                <option value="nass" ${(_editSession.bedingung || '') === 'nass' ? 'selected' : ''}>🌧 Nass</option>
              </select>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Lufttemperatur (°C)</label>
                <input class="field-input" type="number" step="0.01" id="edit-luft" value="${_editSession.temperatur?.luft ?? ''}">
              </div>
              <div class="field-group">
                <label class="field-label">Asphalttemperatur (°C)</label>
                <input class="field-input" type="number" step="0.01" id="edit-asphalt" value="${_editSession.temperatur?.asphalt ?? ''}">
              </div>
            </div>
          </div>
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
                <input class="field-input" type="number" step="0.01" id="gabel-negfed" value="${pre.gabel?.negativfederweg_mm ?? ''}" placeholder="z.B. 28">
              </div>
              <div class="field-group">
                <label class="field-label">Durchstreckung (mm)</label>
                <input class="field-input" type="number" step="0.01" id="gabel-durch" value="${pre.gabel?.durchstreckung_mm ?? ''}" placeholder="z.B. 12">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Federvorspannung (Umdr. Zu)</label>
                <input class="field-input" type="number" step="0.5" id="gabel-federvsp" value="${pre.gabel?.federvorspannung ?? ''}" placeholder="optional">
              </div>
              <div class="field-group"></div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Druckstufe (Klicks Offen)</label>
                <input class="field-input" type="number" step="1" id="gabel-druck" value="${pre.gabel?.druckstufe_klicks ?? ''}" placeholder="z.B. 12">
              </div>
              <div class="field-group">
                <label class="field-label">Zugstufe (Klicks Offen)</label>
                <input class="field-input" type="number" step="1" id="gabel-zug" value="${pre.gabel?.zugstufe_klicks ?? ''}" placeholder="z.B. 8">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Öltyp</label>
                <input class="field-input" type="number" step="0.01" id="gabel-oeltyp" value="${pre.gabel?.oeltyp ?? ''}" placeholder="z.B. 5">
              </div>
              <div class="field-group">
                <label class="field-label">Öllevel (mm)</label>
                <input class="field-input" type="number" step="0.01" id="gabel-oelstand" value="${pre.gabel?.oelstand_mm ?? ''}" placeholder="z.B. 110">
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
                <input class="field-input" type="number" step="0.01" id="fb-negfed" value="${pre.federbein?.negativfederweg_mm ?? ''}" placeholder="z.B. 22">
              </div>
              <div class="field-group">
                <label class="field-label">Höhe (mm)</label>
                <input class="field-input" type="number" step="0.01" id="fb-hoehe" value="${pre.federbein?.hoehe_mm ?? ''}" placeholder="z.B. 820">
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Messpunkt</label>
              <input class="field-input" id="fb-messpunkt" value="${_esc(pre.federbein?.messpunkt || '')}" placeholder="z.B. Kettenspanner, Schwinge…">
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Federvorspannung (Umdr. Zu)</label>
                <input class="field-input" type="number" step="0.5" id="fb-federvsp" value="${pre.federbein?.federvorspannung ?? ''}" placeholder="optional">
              </div>
              <div class="field-group"></div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Druckstufe (Klicks Offen)</label>
                <input class="field-input" type="number" step="1" id="fb-druck" value="${pre.federbein?.druckstufe_klicks ?? ''}" placeholder="z.B. 10">
              </div>
              <div class="field-group">
                <label class="field-label">Zugstufe (Klicks Offen)</label>
                <input class="field-input" type="number" step="1" id="fb-zug" value="${pre.federbein?.zugstufe_klicks ?? ''}" placeholder="z.B. 6">
              </div>
            </div>
          </div>
        </div>

        <!-- Sekundärübersetzung -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/>
              <line x1="12" y1="7" x2="12" y2="17"/>
            </svg>
            Sekundärübersetzung
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Ritzel (Zähne)</label>
                <input class="field-input" type="number" step="1" id="sek-ritzel" value="${pre.sekundaer?.ritzel ?? ''}" placeholder="z.B. 16">
              </div>
              <div class="field-group">
                <label class="field-label">Kettenrad (Zähne)</label>
                <input class="field-input" type="number" step="1" id="sek-kettenrad" value="${pre.sekundaer?.kettenrad ?? ''}" placeholder="z.B. 42">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Kettenlänge (Glieder)</label>
                <input class="field-input" type="number" step="1" id="sek-kettenlaenge" value="${pre.sekundaer?.kettenlaenge ?? ''}" placeholder="z.B. 112">
              </div>
              <div class="field-group">
                <label class="field-label">Übersetzung</label>
                <div class="field-input" id="sek-ratio" style="color:var(--accent);font-family:var(--font-display);font-size:18px;font-weight:700;display:flex;align-items:center">—</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reifen Vorne -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Reifen Vorne
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Hersteller</label>
                <input class="field-input" id="reifen-v-hersteller" value="${_esc(pre.reifen?.vorne?.hersteller || '')}" placeholder="z.B. Pirelli">
              </div>
              <div class="field-group">
                <label class="field-label">Modell</label>
                <input class="field-input" id="reifen-v-modell" value="${_esc(pre.reifen?.vorne?.modell || '')}" placeholder="z.B. Diablo SC">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Compound</label>
                <input class="field-input" id="reifen-v-compound" value="${_esc(pre.reifen?.vorne?.compound || '')}" placeholder="z.B. SC1">
              </div>
              <div class="field-group">
                <label class="field-label">Druck (bar)</label>
                <input class="field-input" type="number" step="0.01" id="reifen-v-druck" value="${pre.reifen?.vorne?.druck ?? ''}" placeholder="z.B. 2.10">
              </div>
            </div>
          </div>
        </div>

        <!-- Reifen Hinten -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Reifen Hinten
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Hersteller</label>
                <input class="field-input" id="reifen-h-hersteller" value="${_esc(pre.reifen?.hinten?.hersteller || '')}" placeholder="z.B. Pirelli">
              </div>
              <div class="field-group">
                <label class="field-label">Modell</label>
                <input class="field-input" id="reifen-h-modell" value="${_esc(pre.reifen?.hinten?.modell || '')}" placeholder="z.B. Diablo SC">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Compound</label>
                <input class="field-input" id="reifen-h-compound" value="${_esc(pre.reifen?.hinten?.compound || '')}" placeholder="z.B. SC0">
              </div>
              <div class="field-group">
                <label class="field-label">Druck (bar)</label>
                <input class="field-input" type="number" step="0.01" id="reifen-h-druck" value="${pre.reifen?.hinten?.druck ?? ''}" placeholder="z.B. 1.90">
              </div>
            </div>
          </div>
        </div>

        <!-- Elektronik -->
        <div class="setup-section">
          <div class="setup-section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Elektronik
          </div>
          <div class="setup-section-body">
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">TC Stufe</label>
                <input class="field-input" type="number" step="1" id="elek-tc-stufe" value="${pre.elektronik?.tc_stufe ?? ''}" placeholder="z.B. 3">
              </div>
              <div class="field-group">
                <label class="field-label">Motor Modus</label>
                <input class="field-input" id="elek-tc-modus" value="${_esc(pre.elektronik?.tc_modus ?? '')}" placeholder="z.B. A, Sport, 2">
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
          ${_editSession ? 'Änderungen speichern' : 'Session speichern'}
        </button>
        <div style="height:8px"></div>
      </div>`;

    document.getElementById('setup-back').addEventListener('click', () => {
      if (_editSession) {
        _editSession = null;
        _wizardState = null;
        App.navigate('zeiten');
      } else {
        App.navigate('wizard');
        ScreenWizard.render();
      }
    });

    document.getElementById('setup-save').addEventListener('click', _save);

    ['sek-ritzel', 'sek-kettenrad'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', _updateRatio);
    });
    _updateRatio();
  }

  function _updateRatio() {
    const ritzel = parseFloat(document.getElementById('sek-ritzel')?.value);
    const kettenrad = parseFloat(document.getElementById('sek-kettenrad')?.value);
    const el = document.getElementById('sek-ratio');
    if (!el) return;
    el.textContent = (ritzel > 0 && kettenrad > 0)
      ? (kettenrad / ritzel).toFixed(3)
      : '—';
  }

  function _save() {
    const g = (id) => document.getElementById(id)?.value?.trim() || '';
    const n = (id) => { const v = document.getElementById(id)?.value; return v !== '' && v !== undefined ? parseFloat(v) : ''; };

    const isEdit = !!_editSession;
    const sessionData = {
      vehicleId: _wizardState.vehicleId,
      datum: isEdit ? (g('edit-datum') || _editSession.datum) : _wizardState.datum,
      uhrzeit: isEdit ? g('edit-uhrzeit') : _wizardState.uhrzeit,
      strecke: isEdit ? (g('edit-strecke') || _editSession.strecke) : _wizardState.strecke,
      streckeKm: isEdit ? _editSession.streckeKm : _wizardState.streckeKm,
      bedingung: isEdit ? (document.getElementById('edit-bedingung')?.value || 'trocken') : _wizardState.bedingung,
      temperatur: {
        luft: isEdit ? n('edit-luft') : (n('wiz-luft') || _wizardState.temperatur?.luft || ''),
        asphalt: isEdit ? n('edit-asphalt') : (n('wiz-asphalt') || _wizardState.temperatur?.asphalt || '')
      },
      gabel: {
        negativfederweg_mm: n('gabel-negfed'),
        durchstreckung_mm: n('gabel-durch'),
        federvorspannung: n('gabel-federvsp'),
        druckstufe_klicks: n('gabel-druck'),
        zugstufe_klicks: n('gabel-zug'),
        oeltyp: n('gabel-oeltyp'),
        oelstand_mm: n('gabel-oelstand')
      },
      elektronik: {
        tc_stufe: n('elek-tc-stufe'),
        tc_modus: g('elek-tc-modus')
      },
      sekundaer: {
        ritzel: n('sek-ritzel'),
        kettenrad: n('sek-kettenrad'),
        kettenlaenge: n('sek-kettenlaenge')
      },
      federbein: {
        negativfederweg_mm: n('fb-negfed'),
        hoehe_mm: n('fb-hoehe'),
        messpunkt: g('fb-messpunkt'),
        federvorspannung: n('fb-federvsp'),
        druckstufe_klicks: n('fb-druck'),
        zugstufe_klicks: n('fb-zug')
      },
      reifen: {
        vorne: {
          hersteller: g('reifen-v-hersteller'),
          modell: g('reifen-v-modell'),
          compound: g('reifen-v-compound'),
          druck: n('reifen-v-druck')
        },
        hinten: {
          hersteller: g('reifen-h-hersteller'),
          modell: g('reifen-h-modell'),
          compound: g('reifen-h-compound'),
          druck: n('reifen-h-druck')
        }
      },
      bestzeit: g('setup-bestzeit'),
      notiz: g('setup-notiz')
    };

    if (isEdit) {
      updateSession(_editSession.id, sessionData);
    } else {
      addSession(sessionData);
    }

    _editSession = null;
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

  return { render, startWithWizardState, startWithSession };
})();
