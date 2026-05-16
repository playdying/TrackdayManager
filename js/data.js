// ── Trackday Manager — Data Layer ──

const DB_VERSION = 1;
const STORAGE_KEY = 'trackday_v1';

const DB = {
  version: DB_VERSION,
  vehicles: [],
  sessions: []
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
    sessions: DB.sessions
  }));
}

function _migrateStorage(old) {
  // V1 → future: add migration steps here
  DB.vehicles = old.vehicles || [];
  DB.sessions = old.sessions || [];
  _saveData();
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
      hersteller: data.reifen?.hersteller || '',
      modell: data.reifen?.modell || '',
      compound: data.reifen?.compound || '',
      druck_vorne: data.reifen?.druck_vorne ?? '',
      druck_hinten: data.reifen?.druck_hinten ?? ''
    },
    gabel: {
      negativfederweg_mm: data.gabel?.negativfederweg_mm ?? '',
      durchstreckung_mm: data.gabel?.durchstreckung_mm ?? '',
      druckstufe_klicks: data.gabel?.druckstufe_klicks ?? '',
      zugstufe_klicks: data.gabel?.zugstufe_klicks ?? ''
    },
    federbein: {
      negativfederweg_mm: data.federbein?.negativfederweg_mm ?? '',
      hoehe_mm: data.federbein?.hoehe_mm ?? '',
      messpunkt: data.federbein?.messpunkt || 'Kettenspanner',
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

function exportData() {
  const payload = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'trackday-manager',
    data: { vehicles: DB.vehicles, sessions: DB.sessions }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trackday-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

  // Future: if (version < 2) { /* migrate fields */ }

  if (version > DB_VERSION) {
    throw new Error(`Version ${version} wird von dieser App nicht unterstützt. Bitte App aktualisieren.`);
  }

  return { vehicles, sessions };
}

function applyImport(data, mode) {
  if (mode === 'replace') {
    DB.vehicles = data.vehicles;
    DB.sessions = data.sessions;
  } else {
    const existingVIds = new Set(DB.vehicles.map(v => v.id));
    const existingSIds = new Set(DB.sessions.map(s => s.id));
    data.vehicles.forEach(v => { if (!existingVIds.has(v.id)) DB.vehicles.push(v); });
    data.sessions.forEach(s => { if (!existingSIds.has(s.id)) DB.sessions.push(s); });
  }
  _saveData();
}

// ── Init ──
_loadData();

// ── Predefined tracks ──
const STRECKEN = [
  { name: 'Nürburgring GP', km: '5.148' },
  { name: 'Hockenheimring', km: '4.574' },
  { name: 'Lausitzring', km: '4.534' },
  { name: 'Sachsenring', km: '3.671' },
  { name: 'Oschersleben', km: '3.667' },
  { name: 'Most', km: '4.212' },
  { name: 'Spa-Francorchamps', km: '7.004' },
  { name: 'Mugello', km: '5.245' }
];

const MESSPUNKTE = ['Kettenspanner', 'Schwinge', 'Achse', 'Rahmenheck'];
