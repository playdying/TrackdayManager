// ── Screen 1: Fahrzeugübersicht ──

const ScreenFahrzeuge = (() => {

  const expandedIds = new Set();
  const editIds = new Set();
  let deleteConfirmId = null;

  function render() {
    const el = document.getElementById('screen-fahrzeuge');
    el.innerHTML = `
      <div class="screen-header">
        <span class="screen-title">Motorräder</span>
        <button class="btn btn-primary" id="btn-add-vehicle" style="font-size:13px;padding:8px 14px;min-height:36px;">
          + Hinzufügen
        </button>
      </div>
      <div class="scroll-content" id="fahrzeuge-list"></div>
    `;
    _renderList();
    document.getElementById('btn-add-vehicle').addEventListener('click', _openAddModal);
  }

  function _renderList() {
    const list = document.getElementById('fahrzeuge-list');
    const vehicles = getVehicles();

    if (!vehicles.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
            <path d="M8 17.5h7M2 10l2-5h10l4 5H2z"/><path d="M14 5l2 5"/>
          </svg>
          <p class="empty-state-title">Noch kein Motorrad</p>
          <p class="empty-state-text">Tippe auf „+ Hinzufügen" um dein erstes Motorrad anzulegen.</p>
        </div>`;
      return;
    }

    list.innerHTML = vehicles.map(v => _buildCard(v)).join('');
    _attachCardEvents();
  }

  function _buildCard(v) {
    const isExpanded = expandedIds.has(v.id);
    const isEdit = editIds.has(v.id);
    const isDeleteConfirm = deleteConfirmId === v.id;
    const sessionCount = getSessions(v.id).length;

    if (isEdit) return _buildEditCard(v);

    const umbauten = (v.umbauten || []).map(u =>
      `<span class="umbau-tag">${_esc(u)}</span>`).join('');

    return `
      <div class="vehicle-card" id="vcard-${v.id}">
        <div class="vehicle-card-header" data-toggle="${v.id}">
          <div>
            <div class="vehicle-card-title">${_esc(v.name)}</div>
            <div class="vehicle-card-meta">
              ${v.year ? v.year + ' · ' : ''}
              ${v.motor?.hubraum ? v.motor.hubraum + ' · ' : ''}
              ${v.motor?.leistung ? v.motor.leistung : ''}
              ${sessionCount ? `· ${sessionCount} Session${sessionCount !== 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <div class="vehicle-card-actions">
            <button class="btn-icon" data-edit="${v.id}" title="Bearbeiten">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <svg style="color:var(--text-muted);transition:transform 0.2s;transform:rotate(${isExpanded ? '180' : '0'}deg)"
                 width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        ${isExpanded ? `
        <div class="vehicle-card-expand">
          ${_buildSection('Motor', [
            ['Hubraum', v.motor?.hubraum],
            ['Leistung', v.motor?.leistung],
            ['Drehmoment', v.motor?.drehmoment]
          ])}
          ${_buildSection('Fahrwerk', [
            ['Dämpfer vorne', v.fahrwerk?.daempfer_vorne],
            ['Dämpfer hinten', v.fahrwerk?.daempfer_hinten],
            ['Federn vorne', v.fahrwerk?.federn_vorne],
            ['Federn hinten', v.fahrwerk?.federn_hinten]
          ])}
          ${_buildSection('Bremsen', [
            ['Beläge vorne', v.bremsen?.belaege_vorne],
            ['Beläge hinten', v.bremsen?.belaege_hinten],
            ['Scheibe vorne', v.bremsen?.scheibe_vorne],
            ['Scheibe hinten', v.bremsen?.scheibe_hinten],
            ['Bias', v.bremsen?.bias]
          ])}
          ${_buildSection('Getriebe', [
            ['Übersetzung', v.getriebe?.uebersetzung],
            ['Differential', v.getriebe?.differential]
          ])}
          ${_buildSection('Gewicht', [
            ['Leergewicht', v.gewicht?.leergewicht],
            ['Fahrer', v.gewicht?.fahrer],
            ['Ballast', v.gewicht?.ballast]
          ])}
          ${(v.umbauten && v.umbauten.length) ? `
          <div class="vehicle-section">
            <div class="vehicle-section-title">Umbauten</div>
            <div>${umbauten}</div>
          </div>` : ''}
          ${v.notizen ? `
          <div class="vehicle-section">
            <div class="vehicle-section-title">Notizen</div>
            <div style="font-size:14px;color:var(--text-muted);line-height:1.6">${_esc(v.notizen)}</div>
          </div>` : ''}
        </div>
        ` : ''}

        ${isDeleteConfirm ? `
        <div class="delete-confirm">
          <div class="delete-confirm-text">
            Motorrad löschen? Alle ${sessionCount} Session${sessionCount !== 1 ? 's' : ''} werden ebenfalls gelöscht.
          </div>
          <div class="delete-confirm-actions">
            <button class="btn btn-ghost" style="font-size:13px;padding:6px 12px;min-height:36px" data-cancel-delete="${v.id}">Abbrechen</button>
            <button class="btn btn-danger" style="font-size:13px;padding:6px 12px;min-height:36px" data-confirm-delete="${v.id}">Löschen</button>
          </div>
        </div>` : ''}
      </div>`;
  }

  function _buildSection(title, fields) {
    const hasContent = fields.some(([, v]) => v);
    if (!hasContent) return '';
    return `
      <div class="vehicle-section">
        <div class="vehicle-section-title">${title}</div>
        <div class="kv-grid">
          ${fields.filter(([, v]) => v).map(([k, v]) => `
            <div class="kv-item">
              <span class="kv-key">${k}</span>
              <span class="kv-value">${_esc(v)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function _buildEditCard(v) {
    const umbauten = (v.umbauten || []);
    return `
      <div class="vehicle-card" id="vcard-${v.id}">
        <div style="padding:16px">
          <div style="font-family:var(--font-display);font-size:18px;font-weight:700;margin-bottom:16px;color:var(--accent)">
            Bearbeiten
          </div>

          <div class="field-group">
            <label class="field-label">Name *</label>
            <input class="field-input" id="edit-name-${v.id}" value="${_esc(v.name)}" placeholder="z.B. Honda CBR 1000RR">
          </div>
          <div class="field-group">
            <label class="field-label">Baujahr</label>
            <input class="field-input" id="edit-year-${v.id}" value="${_esc(v.year)}" placeholder="z.B. 2022" type="number">
          </div>

          <div class="section-title">Motor</div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Hubraum</label>
              <input class="field-input" id="edit-motor-hubraum-${v.id}" value="${_esc(v.motor?.hubraum)}" placeholder="999 cc"></div>
            <div class="field-group"><label class="field-label">Leistung</label>
              <input class="field-input" id="edit-motor-leistung-${v.id}" value="${_esc(v.motor?.leistung)}" placeholder="214 PS"></div>
          </div>
          <div class="field-group"><label class="field-label">Drehmoment</label>
            <input class="field-input" id="edit-motor-drehmoment-${v.id}" value="${_esc(v.motor?.drehmoment)}" placeholder="113 Nm"></div>

          <div class="section-title">Fahrwerk</div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Dämpfer vorne</label>
              <input class="field-input" id="edit-fw-dv-${v.id}" value="${_esc(v.fahrwerk?.daempfer_vorne)}" placeholder="Öhlins TTX"></div>
            <div class="field-group"><label class="field-label">Dämpfer hinten</label>
              <input class="field-input" id="edit-fw-dh-${v.id}" value="${_esc(v.fahrwerk?.daempfer_hinten)}" placeholder="Öhlins TTX"></div>
          </div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Federn vorne</label>
              <input class="field-input" id="edit-fw-fv-${v.id}" value="${_esc(v.fahrwerk?.federn_vorne)}"></div>
            <div class="field-group"><label class="field-label">Federn hinten</label>
              <input class="field-input" id="edit-fw-fh-${v.id}" value="${_esc(v.fahrwerk?.federn_hinten)}"></div>
          </div>

          <div class="section-title">Bremsen</div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Beläge vorne</label>
              <input class="field-input" id="edit-br-bv-${v.id}" value="${_esc(v.bremsen?.belaege_vorne)}" placeholder="Brembo Z04"></div>
            <div class="field-group"><label class="field-label">Beläge hinten</label>
              <input class="field-input" id="edit-br-bh-${v.id}" value="${_esc(v.bremsen?.belaege_hinten)}"></div>
          </div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Scheibe vorne</label>
              <input class="field-input" id="edit-br-sv-${v.id}" value="${_esc(v.bremsen?.scheibe_vorne)}" placeholder="320 mm"></div>
            <div class="field-group"><label class="field-label">Scheibe hinten</label>
              <input class="field-input" id="edit-br-sh-${v.id}" value="${_esc(v.bremsen?.scheibe_hinten)}" placeholder="220 mm"></div>
          </div>
          <div class="field-group"><label class="field-label">Bremsbalance</label>
            <input class="field-input" id="edit-br-bias-${v.id}" value="${_esc(v.bremsen?.bias)}" placeholder="70/30"></div>

          <div class="section-title">Gewicht</div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Leergewicht</label>
              <input class="field-input" id="edit-gew-leer-${v.id}" value="${_esc(v.gewicht?.leergewicht)}" placeholder="195 kg"></div>
            <div class="field-group"><label class="field-label">Fahrer</label>
              <input class="field-input" id="edit-gew-fahr-${v.id}" value="${_esc(v.gewicht?.fahrer)}" placeholder="75 kg"></div>
          </div>
          <div class="field-group"><label class="field-label">Ballast</label>
            <input class="field-input" id="edit-gew-ball-${v.id}" value="${_esc(v.gewicht?.ballast)}"></div>

          <div class="section-title">Umbauten</div>
          <div id="umbauten-list-${v.id}">
            ${umbauten.map((u, i) => `
              <div class="umbau-item-edit" id="umbau-item-${v.id}-${i}">
                <input class="field-input" value="${_esc(u)}" data-umbau="${v.id}" data-idx="${i}">
                <button class="btn-remove-umbau" data-remove-umbau="${v.id}" data-idx="${i}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>`).join('')}
          </div>
          <button class="btn btn-ghost btn-full mt-8" id="btn-add-umbau-${v.id}" style="font-size:13px;margin-top:6px">
            + Umbau hinzufügen
          </button>

          <div class="section-title">Notizen</div>
          <div class="field-group">
            <textarea class="field-input" id="edit-notizen-${v.id}" placeholder="Allgemeine Anmerkungen…">${_esc(v.notizen)}</textarea>
          </div>

          <div class="divider"></div>
          <div class="row-between">
            <button class="btn btn-danger" data-delete-vehicle="${v.id}" style="font-size:13px;padding:8px 14px">Löschen…</button>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" data-cancel-edit="${v.id}" style="font-size:13px;padding:8px 14px">Abbrechen</button>
              <button class="btn btn-primary" data-save-edit="${v.id}" style="font-size:13px;padding:8px 14px">Speichern</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function _attachCardEvents() {
    const list = document.getElementById('fahrzeuge-list');

    list.addEventListener('click', e => {
      // Toggle expand
      const toggle = e.target.closest('[data-toggle]');
      if (toggle && !e.target.closest('[data-edit]')) {
        const id = toggle.dataset.toggle;
        expandedIds.has(id) ? expandedIds.delete(id) : expandedIds.add(id);
        _renderList();
        return;
      }

      // Edit mode
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        const id = editBtn.dataset.edit;
        editIds.add(id);
        expandedIds.delete(id);
        _renderList();
        _attachEditEvents(id);
        return;
      }

      // Cancel edit
      const cancelEdit = e.target.closest('[data-cancel-edit]');
      if (cancelEdit) {
        editIds.delete(cancelEdit.dataset.cancelEdit);
        _renderList();
        return;
      }

      // Save edit
      const saveEdit = e.target.closest('[data-save-edit]');
      if (saveEdit) {
        _saveEdit(saveEdit.dataset.saveEdit);
        return;
      }

      // Delete vehicle (show confirm)
      const deleteBtn = e.target.closest('[data-delete-vehicle]');
      if (deleteBtn) {
        deleteConfirmId = deleteBtn.dataset.deleteVehicle;
        editIds.delete(deleteConfirmId);
        _renderList();
        return;
      }

      // Cancel delete
      const cancelDel = e.target.closest('[data-cancel-delete]');
      if (cancelDel) {
        deleteConfirmId = null;
        _renderList();
        return;
      }

      // Confirm delete
      const confirmDel = e.target.closest('[data-confirm-delete]');
      if (confirmDel) {
        deleteVehicle(confirmDel.dataset.confirmDelete);
        deleteConfirmId = null;
        editIds.delete(confirmDel.dataset.confirmDelete);
        _renderList();
        return;
      }
    });
  }

  function _attachEditEvents(id) {
    const addUmbauBtn = document.getElementById(`btn-add-umbau-${id}`);
    if (addUmbauBtn) {
      addUmbauBtn.addEventListener('click', () => {
        const container = document.getElementById(`umbauten-list-${id}`);
        const idx = container.children.length;
        const div = document.createElement('div');
        div.className = 'umbau-item-edit';
        div.id = `umbau-item-${id}-${idx}`;
        div.innerHTML = `
          <input class="field-input" value="" data-umbau="${id}" data-idx="${idx}">
          <button class="btn-remove-umbau" data-remove-umbau="${id}" data-idx="${idx}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>`;
        container.appendChild(div);
        div.querySelector('input').addEventListener('click', e => e.stopPropagation());
        div.querySelector('button').addEventListener('click', e => {
          e.stopPropagation();
          div.remove();
        });
      });
    }

    // Remove umbau buttons
    document.querySelectorAll(`[data-remove-umbau="${id}"]`).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const item = btn.closest('.umbau-item-edit');
        item.remove();
      });
    });

    // Prevent input clicks from triggering card toggle
    document.querySelectorAll(`#vcard-${id} input, #vcard-${id} textarea, #vcard-${id} select`).forEach(el => {
      el.addEventListener('click', e => e.stopPropagation());
    });
  }

  function _saveEdit(id) {
    const v = getVehicle(id);
    if (!v) return;

    const g = (sel) => (document.getElementById(sel)?.value || '').trim();

    const umbauten = Array.from(document.querySelectorAll(`[data-umbau="${id}"]`))
      .map(inp => inp.value.trim())
      .filter(Boolean);

    updateVehicle(id, {
      name: g(`edit-name-${id}`),
      year: g(`edit-year-${id}`),
      motor: {
        hubraum: g(`edit-motor-hubraum-${id}`),
        leistung: g(`edit-motor-leistung-${id}`),
        drehmoment: g(`edit-motor-drehmoment-${id}`)
      },
      fahrwerk: {
        daempfer_vorne: g(`edit-fw-dv-${id}`),
        daempfer_hinten: g(`edit-fw-dh-${id}`),
        federn_vorne: g(`edit-fw-fv-${id}`),
        federn_hinten: g(`edit-fw-fh-${id}`)
      },
      bremsen: {
        belaege_vorne: g(`edit-br-bv-${id}`),
        belaege_hinten: g(`edit-br-bh-${id}`),
        scheibe_vorne: g(`edit-br-sv-${id}`),
        scheibe_hinten: g(`edit-br-sh-${id}`),
        bias: g(`edit-br-bias-${id}`)
      },
      gewicht: {
        leergewicht: g(`edit-gew-leer-${id}`),
        fahrer: g(`edit-gew-fahr-${id}`),
        ballast: g(`edit-gew-ball-${id}`)
      },
      umbauten,
      notizen: g(`edit-notizen-${id}`)
    });

    editIds.delete(id);
    expandedIds.add(id);
    _renderList();
  }

  function _openAddModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Neues Motorrad</div>
        <div class="field-group">
          <label class="field-label">Name *</label>
          <input class="field-input" id="modal-add-name" placeholder="z.B. Honda CBR 1000RR" autofocus>
        </div>
        <div class="field-group">
          <label class="field-label">Baujahr</label>
          <input class="field-input" id="modal-add-year" type="number" placeholder="z.B. 2022">
        </div>
        <div class="field-group">
          <label class="field-label">Hubraum</label>
          <input class="field-input" id="modal-add-hub" placeholder="z.B. 999 cc">
        </div>
        <div class="field-group">
          <label class="field-label">Leistung</label>
          <input class="field-input" id="modal-add-lei" placeholder="z.B. 214 PS">
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:20px">
          Alle weiteren Details können später ergänzt werden.
        </p>
        <div class="row-between">
          <button class="btn btn-ghost" id="modal-cancel" style="flex:1">Abbrechen</button>
          <button class="btn btn-primary" id="modal-save" style="flex:1">Hinzufügen</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#modal-save').addEventListener('click', () => {
      const name = document.getElementById('modal-add-name').value.trim();
      if (!name) {
        document.getElementById('modal-add-name').style.borderColor = '#ff4444';
        return;
      }
      addVehicle({
        name,
        year: document.getElementById('modal-add-year').value.trim(),
        motor: {
          hubraum: document.getElementById('modal-add-hub').value.trim(),
          leistung: document.getElementById('modal-add-lei').value.trim()
        }
      });
      overlay.remove();
      _renderList();
    });

    setTimeout(() => document.getElementById('modal-add-name')?.focus(), 100);
  }

  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { render };
})();
