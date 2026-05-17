// ── Trackday Manager — Data Layer ──

const DB_VERSION = 2;
const STORAGE_KEY = 'trackday_v1';

const DB = {
  version: DB_VERSION,
  vehicles: [],
  sessions: [],
  events: []
};

// ── Persistence ──

function _loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.version === DB_VERSION) {
      DB.vehicles = parsed.vehicles || [];
      DB.sessions = parsed.sessions || [];
      DB.events = parsed.events || [];
    } else {
      _migrateStorage(parsed);
    }
  } catch (e) {
    console.error('Fehler beim Laden:', e);
  }
}

function _saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: DB_VERSION,
    vehicles: DB.vehicles,
    sessions: DB.sessions,
    events: DB.events
  }));
}

function _migrateStorage(old) {
  DB.vehicles = old.vehicles || [];
  DB.sessions = (old.sessions || []).map(s => _migrateSession(s, old.version || 1));
  DB.events = old.events || [];
  _saveData();
}

function _migrateSession(s, fromVersion) {
  if (fromVersion < 2) {
    const r = s.reifen || {};
    s.reifen = {
      vorne: { hersteller: r.hersteller || '', modell: r.modell || '', compound: r.compound || '', druck: r.druck_vorne ?? '' },
      hinten: { hersteller: r.hersteller || '', modell: r.modell || '', compound: r.compound || '', druck: r.druck_hinten ?? '' }
    };
  }
  return s;
}

function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

// ── Vehicles ──

function getVehicles() {
  return DB.vehicles;
}

function getVehicle(id) {
  return DB.vehicles.find(v => v.id === id) || null;
}

function addVehicle(data) {
  const now = new Date().toISOString();
  const v = {
    id: generateId(),
    name: data.name || '',
    year: data.year || '',
    motor: {
      hubraum: data.motor?.hubraum || '',
      leistung: data.motor?.leistung || '',
      drehmoment: data.motor?.drehmoment || ''
    },
    fahrwerk: {
      daempfer_vorne: data.fahrwerk?.daempfer_vorne || '',
      daempfer_hinten: data.fahrwerk?.daempfer_hinten || '',
      federn_vorne: data.fahrwerk?.federn_vorne || '',
      federn_hinten: data.fahrwerk?.federn_hinten || ''
    },
    bremsen: {
      belaege_vorne: data.bremsen?.belaege_vorne || '',
      belaege_hinten: data.bremsen?.belaege_hinten || '',
      scheibe_vorne: data.bremsen?.scheibe_vorne || '',
      scheibe_hinten: data.bremsen?.scheibe_hinten || '',
      bias: data.bremsen?.bias || ''
    },
    getriebe: {
      uebersetzung: data.getriebe?.uebersetzung || '',
      differential: data.getriebe?.differential || ''
    },
    gewicht: {
      leergewicht: data.gewicht?.leergewicht || '',
      fahrer: data.gewicht?.fahrer || '',
      ballast: data.gewicht?.ballast || ''
    },
    umbauten: data.umbauten || [],
    notizen: data.notizen || '',
    createdAt: now,
    updatedAt: now
  };
  DB.vehicles.push(v);
  _saveData();
  return v;
}

function updateVehicle(id, data) {
  const idx = DB.vehicles.findIndex(v => v.id === id);
  if (idx === -1) return null;
  DB.vehicles[idx] = { ...DB.vehicles[idx], ...data, updatedAt: new Date().toISOString() };
  _saveData();
  return DB.vehicles[idx];
}

function deleteVehicle(id) {
  DB.vehicles = DB.vehicles.filter(v => v.id !== id);
  DB.sessions = DB.sessions.filter(s => s.vehicleId !== id);
  _saveData();
}

// ── Sessions ──

function getSessions(vehicleId) {
  if (vehicleId) return DB.sessions.filter(s => s.vehicleId === vehicleId);
  return DB.sessions;
}

function getSession(id) {
  return DB.sessions.find(s => s.id === id) || null;
}

function addSession(data) {
  const s = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    datum: data.datum || '',
    uhrzeit: data.uhrzeit || '',
    strecke: data.strecke || '',
    streckeKm: data.streckeKm || '',
    bedingung: data.bedingung || 'trocken',
    temperatur: {
      luft: data.temperatur?.luft ?? '',
      asphalt: data.temperatur?.asphalt ?? ''
    },
    reifen: {
      vorne: {
        hersteller: data.reifen?.vorne?.hersteller || '',
        modell: data.reifen?.vorne?.modell || '',
        compound: data.reifen?.vorne?.compound || '',
        druck: data.reifen?.vorne?.druck ?? ''
      },
      hinten: {
        hersteller: data.reifen?.hinten?.hersteller || '',
        modell: data.reifen?.hinten?.modell || '',
        compound: data.reifen?.hinten?.compound || '',
        druck: data.reifen?.hinten?.druck ?? ''
      }
    },
    elektronik: {
      tc_stufe: data.elektronik?.tc_stufe ?? '',
      tc_modus: data.elektronik?.tc_modus ?? ''
    },
    sekundaer: {
      ritzel: data.sekundaer?.ritzel ?? '',
      kettenrad: data.sekundaer?.kettenrad ?? '',
      kettenlaenge: data.sekundaer?.kettenlaenge ?? ''
    },
    gabel: {
      negativfederweg_mm: data.gabel?.negativfederweg_mm ?? '',
      durchstreckung_mm: data.gabel?.durchstreckung_mm ?? '',
      federvorspannung: data.gabel?.federvorspannung ?? '',
      druckstufe_klicks: data.gabel?.druckstufe_klicks ?? '',
      zugstufe_klicks: data.gabel?.zugstufe_klicks ?? '',
      oeltyp: data.gabel?.oeltyp ?? '',
      oelstand_mm: data.gabel?.oelstand_mm ?? ''
    },
    federbein: {
      negativfederweg_mm: data.federbein?.negativfederweg_mm ?? '',
      hoehe_mm: data.federbein?.hoehe_mm ?? '',
      messpunkt: data.federbein?.messpunkt || '',
      federvorspannung: data.federbein?.federvorspannung ?? '',
      druckstufe_klicks: data.federbein?.druckstufe_klicks ?? '',
      zugstufe_klicks: data.federbein?.zugstufe_klicks ?? ''
    },
    bestzeit: data.bestzeit || '',
    notiz: data.notiz || '',
    createdAt: new Date().toISOString()
  };
  DB.sessions.push(s);
  _saveData();
  return s;
}

function updateSession(id, data) {
  const idx = DB.sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  DB.sessions[idx] = { ...DB.sessions[idx], ...data };
  _saveData();
  return DB.sessions[idx];
}

function deleteSession(id) {
  DB.sessions = DB.sessions.filter(s => s.id !== id);
  _saveData();
}

// ── Events ──

function getEvents(vehicleId) {
  if (vehicleId) return DB.events.filter(e => e.vehicleId === vehicleId);
  return DB.events;
}

function addEvent(data) {
  const e = {
    id: generateId(),
    vehicleId: data.vehicleId || '',
    datum: data.datum || '',
    typ: data.typ || 'Sonstiges',
    notiz: data.notiz || '',
    createdAt: new Date().toISOString()
  };
  DB.events.push(e);
  _saveData();
  return e;
}

function deleteEvent(id) {
  DB.events = DB.events.filter(e => e.id !== id);
  _saveData();
}

function getLastSessionForVehicle(vehicleId) {
  const list = DB.sessions
    .filter(s => s.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return list[0] || null;
}

// ── Time helpers ──

function parseTime(str) {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  }
  return null;
}

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

// ── Export ──

function getExportPayload() {
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'trackday-manager',
    data: { vehicles: DB.vehicles, sessions: DB.sessions, events: DB.events }
  };
}

// ── Import ──

function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.app !== 'trackday-manager') {
          return reject(new Error('Ungültige Datei — kein Trackday Manager Export.'));
        }
        if (typeof parsed.version !== 'number') {
          return reject(new Error('Unbekannte Version — Import abgebrochen.'));
        }
        const data = _migrateImport(parsed);
        resolve(data);
      } catch {
        reject(new Error('Datei konnte nicht gelesen werden.'));
      }
    };
    reader.readAsText(file);
  });
}

function _migrateImport(imported) {
  const { version, data } = imported;
  let vehicles = data.vehicles || [];
  let sessions = data.sessions || [];

  if (version > DB_VERSION) {
    throw new Error(`Version ${version} wird von dieser App nicht unterstützt. Bitte App aktualisieren.`);
  }

  if (version < 2) {
    sessions = sessions.map(s => _migrateSession(s, version));
  }

  return { vehicles, sessions, events: data.events || [] };
}

function applyImport(data, mode) {
  if (mode === 'replace') {
    DB.vehicles = data.vehicles;
    DB.sessions = data.sessions;
    DB.events = data.events || [];
  } else {
    const existingVIds = new Set(DB.vehicles.map(v => v.id));
    const existingSIds = new Set(DB.sessions.map(s => s.id));
    const existingEIds = new Set(DB.events.map(e => e.id));
    data.vehicles.forEach(v => { if (!existingVIds.has(v.id)) DB.vehicles.push(v); });
    data.sessions.forEach(s => { if (!existingSIds.has(s.id)) DB.sessions.push(s); });
    (data.events || []).forEach(e => { if (!existingEIds.has(e.id)) DB.events.push(e); });
  }
  _saveData();
}

// ── Init ──
_loadData();

// ── Predefined tracks ──
const STRECKEN = [
  { name: 'Assen IDM Kurs', km: '4.555' },
  { name: 'Oschersleben', km: '3.667' },
  { name: 'Mettet', km: '3.850' },
  { name: 'Rijeka', km: '4.168' },
  { name: 'Most', km: '4.212' },
  { name: 'Brünn', km: '5.403' },
  { name: 'Lausitzring', km: '4.534' },
  { name: 'Spa', km: '7.004' },
  { name: 'Zolder', km: '4.011' },
  { name: 'Wuppertal', km: '' },
  { name: 'Hagen', km: '' },
  { name: 'RacelandKart', km: '' },
  { name: 'Vledderveen', km: '' }
];

const MESSPUNKTE = ['Kettenspanner', 'Schwinge', 'Achse', 'Rahmenheck'];

const EVENT_TYPEN = [
  'Fahrwerksservice',
  'Gabelservice',
  'Federbein-Service',
  'Motorrevision',
  'Reifenwechsel',
  'Kettenservice',
  'Reparatur / Unfall',
  'Umbau',
  'Sonstiges'
];
