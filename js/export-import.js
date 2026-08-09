// ── Export / Import Screen & Logic ──

const ScreenEinstellungen = (() => {

  function render() {
    const el = document.getElementById('screen-einstellungen');
    const vehicles = getVehicles();
    const sessions = getSessions();

    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">Einstellungen</span>
      </div>
      <div class="scroll-content">

        <div class="section-title" style="padding-top:4px">Daten</div>

        <div class="settings-item" id="btn-export">
          <div class="settings-item-label">
            <span class="settings-item-title">Export</span>
            <span class="settings-item-desc">
              ${vehicles.length} Motorrad${vehicles.length !== 1 ? 'räder' : ''} · ${sessions.length} Session${sessions.length !== 1 ? 's' : ''} exportieren
            </span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>

        <div class="settings-item" id="btn-import">
          <div class="settings-item-label">
            <span class="settings-item-title">Import</span>
            <span class="settings-item-desc">JSON-Backup importieren</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        <input type="file" id="import-file-input" accept=".json" style="display:none">

        <div class="section-title">Info</div>

        <div class="settings-item" style="cursor:default">
          <div class="settings-item-label">
            <span class="settings-item-title">Trackday Manager</span>
            <span class="settings-item-desc">Version 1.0 · Daten lokal gespeichert</span>
          </div>
        </div>

        <div class="settings-item" style="cursor:default">
          <div class="settings-item-label">
            <span class="settings-item-title">Datenspeicherung</span>
            <span class="settings-item-desc">Alle Daten bleiben ausschließlich auf diesem Gerät. Kein Server, keine Cloud.</span>
          </div>
        </div>

        <div class="divider"></div>
        <div id="import-error" style="display:none;color:#ff4444;font-size:13px;padding:8px 0;line-height:1.5"></div>
        <div id="import-success" style="display:none;color:var(--accent);font-size:13px;padding:8px 0;line-height:1.5"></div>

        <div class="app-version">© Trackday Manager V1</div>
      </div>`;

    document.getElementById('btn-export').addEventListener('click', _showExportModal);
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', _onFileSelected);
  }

  function _showExportModal() {
    const defaultName = 'TrackManager';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Export</div>
        <div class="field-group">
          <label class="field-label">Dateiname</label>
          <input class="field-input" id="export-filename" value="${defaultName}" placeholder="TrackManager">
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">.json wird automatisch angehängt</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-ghost" id="export-cancel" style="flex:1">Abbrechen</button>
          <button class="btn btn-primary" id="export-confirm" style="flex:1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportieren
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#export-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#export-confirm').addEventListener('click', () => {
      const raw = document.getElementById('export-filename').value.trim();
      const name = raw || defaultName;
      overlay.remove();
      _doExport(name);
    });

    setTimeout(() => {
      const input = document.getElementById('export-filename');
      if (input) { input.focus(); input.select(); }
    }, 80);
  }

  async function _doExport(filename) {
    const payload = getExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const fullName = filename + '.json';

    // Desktop: File System Access API
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fullName,
          types: [{ description: 'JSON-Datei', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        _showSuccess(`"${fullName}" wurde gespeichert.`);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // iOS / Mobile: Web Share API with File
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], fullName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        try {
          // Kein title/text mitgeben — iOS speichert diese sonst als zusätzliche Textdatei
          await navigator.share({ files: [file] });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
    }

    // Fallback: download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    _showSuccess(`"${fullName}" wird heruntergeladen.`);
  }

  function _onFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    importFromFile(file).then(data => {
      _showImportConflictModal(data);
    }).catch(err => {
      _showError(err.message);
    });
  }

  function _showImportConflictModal(data) {
    const vCount = (data.vehicles || []).length;
    const sCount = (data.sessions || []).length;
    const existingV = getVehicles().length;
    const existingS = getSessions().length;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Import</div>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
          Die Datei enthält <strong style="color:var(--text)">${vCount} Motorrad${vCount !== 1 ? 'räder' : ''}</strong> und
          <strong style="color:var(--text)">${sCount} Session${sCount !== 1 ? 's' : ''}</strong>.
        </p>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
          Aktuell gespeichert: ${existingV} Motorräder, ${existingS} Sessions.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
          <button class="btn btn-secondary btn-full" id="import-merge">
            Zusammenführen
            <span style="font-size:11px;font-weight:400;opacity:0.7;margin-left:6px">Nur neue Einträge hinzufügen</span>
          </button>
          <button class="btn btn-danger btn-full" id="import-replace">
            Ersetzen
            <span style="font-size:11px;font-weight:400;opacity:0.7;margin-left:6px">Alle vorhandenen Daten überschreiben</span>
          </button>
        </div>
        <button class="btn btn-ghost btn-full" id="import-cancel-modal">Abbrechen</button>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#import-cancel-modal').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#import-merge').addEventListener('click', () => {
      applyImport(data, 'merge');
      overlay.remove();
      _showSuccess(`Import abgeschlossen: ${vCount} Motorräder, ${sCount} Sessions zusammengeführt.`);
      render();
    });

    overlay.querySelector('#import-replace').addEventListener('click', () => {
      applyImport(data, 'replace');
      overlay.remove();
      _showSuccess(`Import abgeschlossen: ${vCount} Motorräder, ${sCount} Sessions geladen.`);
      render();
    });
  }

  function _showError(msg) {
    const errEl = document.getElementById('import-error');
    const okEl = document.getElementById('import-success');
    if (!errEl) return;
    errEl.textContent = '⚠ ' + msg;
    errEl.style.display = 'block';
    if (okEl) okEl.style.display = 'none';
    setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 6000);
  }

  function _showSuccess(msg) {
    const okEl = document.getElementById('import-success');
    const errEl = document.getElementById('import-error');
    if (!okEl) return;
    okEl.textContent = '✓ ' + msg;
    okEl.style.display = 'block';
    if (errEl) errEl.style.display = 'none';
    setTimeout(() => { if (okEl) okEl.style.display = 'none'; }, 5000);
  }

  return { render };
})();
