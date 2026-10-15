const fs = require('fs');
const path = require('path');

// Locate Geofences.csv or geofence.csv
const candidates = [
  path.resolve('c:/sarvwshwar ui/cfs-admin-UI/Geofences.csv'),
  path.resolve('c:/sarvwshwar ui/cfs-admin-UI/geofence.csv'),
  path.resolve(__dirname, '../../../../Geofences.csv'),
  path.resolve(__dirname, '../../../../geofence.csv'),
  path.resolve(process.env.USERPROFILE || 'C:/Users/Sneha', 'Downloads/Geofences.csv'),
  path.resolve('c:/sarvwshwar ui/Geofences.csv'),
];

let csvPath = candidates.find((p) => fs.existsSync(p));
if (!csvPath) {
  throw new Error('Geofences CSV not found in any candidate path!');
}

console.log(`Reading coordinates from: ${csvPath}`);

const targetDirs = [
  path.resolve(__dirname),
];

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

const slots = [];
const header = lines[0];

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',').map((p) => p.trim());
  if (parts.length < 14) continue;

  const name = parts[0];
  if (!name) continue;

  const lat1 = parseFloat(parts[4]);
  const lng1 = parseFloat(parts[5]);
  const lat2 = parseFloat(parts[6]);
  const lng2 = parseFloat(parts[7]);
  const lat3 = parseFloat(parts[8]);
  const lng3 = parseFloat(parts[9]);
  const lat4 = parseFloat(parts[10]);
  const lng4 = parseFloat(parts[11]);
  const lat5 = parseFloat(parts[12]);
  const lng5 = parseFloat(parts[13]);

  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) continue;

  const centerLat = !isNaN(lat5) && lat5 !== 0 ? lat5 : (lat1 + lat2 + lat3 + lat4) / 4;
  const centerLng = !isNaN(lng5) && lng5 !== 0 ? lng5 : (lng1 + lng2 + lng3 + lng4) / 4;

  slots.push({
    name,
    coords: [
      [lat1, lng1],
      [lat2, lng2],
      [lat3, lng3],
      [lat4, lng4],
      [centerLat, centerLng],
    ],
  });
}

console.log(`Parsed ${slots.length} surveyed geofence locations from CSV.`);

let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

const cfsSlots = slots.map((s, idx) => {
  const name = s.name.trim();
  const parts = name.split(/[-\s]+/);

  let block = 'D';
  if (name.startsWith('ED')) block = 'ED';
  else if (name.startsWith('HS')) block = 'HS';
  else if (name.startsWith('14')) block = '14';
  else if (/^[A-Za-z]/.test(name)) block = name.charAt(0).toUpperCase();

  const code = name;
  const bay = parts[parts.length - 1] || `${idx + 1}`;
  const row = parts[0] || code;

  let zoneType = 'Block D (General Yard)';
  let cycle = 'General Staging Cycle';

  if (block === 'A') {
    zoneType = 'Block A (Import)';
    cycle = 'Import Clearance Cycle';
  } else if (block === 'B') {
    zoneType = 'Block B (Export)';
    cycle = 'Export Buffer Cycle';
  } else if (block === 'C') {
    zoneType = 'Block C (Empty Depot)';
    cycle = 'Empty Storage Cycle';
  } else if (block === 'D') {
    zoneType = 'Block D (General Yard)';
    cycle = 'General Staging Cycle';
  } else if (block === 'E') {
    zoneType = 'Block E (Export Staging)';
    cycle = 'Export Buffer Cycle';
  } else if (block === 'F') {
    zoneType = 'Block F (Trailer Parking)';
    cycle = 'Trailer Marshalling Cycle';
  } else if (block === 'G') {
    zoneType = 'Block G (Heavy Ground Storage)';
    cycle = 'General Staging Cycle';
  } else if (block === 'H') {
    zoneType = 'Block H (Reefer Grid)';
    cycle = 'Reefer Cold Chain Cycle';
  } else if (block === 'I') {
    zoneType = 'Block I (Customs Shed)';
    cycle = 'Customs Examination Cycle';
  } else if (block === 'ED') {
    zoneType = 'Empty Depot (ED-1)';
    cycle = 'Empty Storage Cycle';
  } else if (block === 'HS') {
    zoneType = 'Hazardous Grid (HS)';
    cycle = 'Hazardous Cargo Cycle';
  } else if (block === '14') {
    zoneType = 'Bay 14 Marshalling';
    cycle = 'Trailer Marshalling Cycle';
  }

  // All slots currently available with NO dummy trailers or containers
  const isOccupied = false;
  const status = 'available';

  const isReefer = block === 'H';
  const isHazardous = block === 'HS';
  const isEmpty = block === 'C' || block === 'ED';

  let cargoType = 'Dry';
  if (isReefer) cargoType = 'Reefer';
  else if (isHazardous) cargoType = 'Hazardous';
  else if (isEmpty) cargoType = 'Empty';

  const polygon = [
    { lat: s.coords[0][0], lng: s.coords[0][1] },
    { lat: s.coords[1][0], lng: s.coords[1][1] },
    { lat: s.coords[2][0], lng: s.coords[2][1] },
    { lat: s.coords[3][0], lng: s.coords[3][1] },
  ];

  polygon.forEach((p) => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  });

  const center = {
    lat: s.coords[4][0],
    lng: s.coords[4][1],
  };

  return {
    id: `slot-${idx + 1}`,
    name,
    code: name,
    block,
    row,
    bay,
    zoneType,
    cycle,
    status,
    center,
    polygon,
    truckNumber: undefined,
    driverName: undefined,
    transporter: undefined,
    containerNumber: undefined,
    isoCode: undefined,
    shippingLine: undefined,
    cargoType,
    temperature: undefined,
    sealNumber: undefined,
    grossWeightKg: undefined,
    dwellTime: undefined,
    entryTime: undefined,
    assignedTask: undefined,
    tierLevel: 0,
    maxTiers: 4,
    priority: false,
  };
});

const centerLat = +((minLat + maxLat) / 2).toFixed(6);
const centerLng = +((minLng + maxLng) / 2).toFixed(6);

const tsCode = `export interface GpsCoordinate {
  lat: number;
  lng: number;
}

export interface CfsGpsSlot {
  id: string;
  name: string;
  code: string;
  block: string;
  row: string;
  bay: string;
  zoneType: string;
  cycle?: string;
  status: 'occupied' | 'available' | 'reserved' | 'maintenance' | 'incoming';
  center: GpsCoordinate;
  polygon: GpsCoordinate[];
  truckNumber?: string;
  driverName?: string;
  driverPhone?: string;
  transporter?: string;
  containerNumber?: string;
  isoCode?: string;
  shippingLine?: string;
  cargoType?: 'Dry' | 'Reefer' | 'Hazardous' | 'Empty';
  temperature?: string;
  sealNumber?: string;
  grossWeightKg?: number;
  dwellTime?: string;
  entryTime?: string;
  assignedTask?: string;
  tierLevel?: number;
  maxTiers?: number;
  priority?: boolean;
}

export const RAW_CFS_GEOFENCES: { name: string; coords: number[][] }[] = ${JSON.stringify(slots, null, 2)};

export const CFS_GPS_SLOTS: CfsGpsSlot[] = ${JSON.stringify(cfsSlots, null, 2)};
export const ALL_CFS_GPS_SLOTS = CFS_GPS_SLOTS;

export const CFS_GEO_BOUNDS = {
  center: { lat: ${centerLat}, lng: ${centerLng} },
  minLat: ${minLat.toFixed(6)},
  maxLat: ${maxLat.toFixed(6)},
  minLng: ${minLng.toFixed(6)},
  maxLng: ${maxLng.toFixed(6)},
};
`;

for (const dir of targetDirs) {
  if (fs.existsSync(dir)) {
    const jsonPath = path.resolve(dir, 'geofences-data.json');
    const tsPath = path.resolve(dir, 'yard-map-data.ts');
    fs.writeFileSync(jsonPath, JSON.stringify(slots, null, 2), 'utf-8');
    fs.writeFileSync(tsPath, tsCode, 'utf-8');
    console.log(`Wrote JSON & TS files to: ${dir}`);
  }
}

console.log(`Successfully generated data with ${cfsSlots.length} slots from ${csvPath}`);
