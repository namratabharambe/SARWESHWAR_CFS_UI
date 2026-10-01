const fs = require('fs');
const path = require('path');

const csvPath = fs.existsSync('c:/sarvwshwar ui/cfs-admin-UI/cfs-UI/Geofences.csv')
  ? path.resolve('c:/sarvwshwar ui/cfs-admin-UI/cfs-UI/Geofences.csv')
  : path.resolve('c:/sarvwshwar ui/Geofences.csv');

console.log(`Reading coordinates from: ${csvPath}`);
const outputPath = path.resolve(__dirname, 'yard-map-data.ts');
const jsonOutputPath = path.resolve(__dirname, 'geofences-data.json');

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

console.log(`Parsed ${slots.length} geofences from Geofences.csv`);

// Save JSON artifact
fs.writeFileSync(jsonOutputPath, JSON.stringify(slots, null, 2), 'utf-8');

const shippingLines = ['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd', 'ONE', 'Evergreen'];
const isoTypes = ['40HC', '20GP', '45R1', '40OT', '20FR'];
const tasks = [
  'Vessel Discharge Consolidation',
  'Customs Bond Clearance',
  'Inland Rail Transshipment',
  'Empty Repositioning',
  'Pre-Trip Cold Inspection',
  'Dangerous Goods Buffer',
];

const cfsSlots = slots.map((s, idx) => {
  const parts = s.name.split(' ');
  const code = parts[0] || s.name;
  const bay = parts[1] || `${idx + 1}`;
  const blockLetter = s.name.charAt(0).toUpperCase();

  let zoneType = 'Block D (General Yard)';
  let block = blockLetter;
  let row = code;

  let cycle = 'General Staging Cycle';
  if (blockLetter === 'A') {
    zoneType = 'Block A (Import)';
    cycle = 'Import Clearance Cycle';
  } else if (blockLetter === 'B') {
    zoneType = 'Block B (Export)';
    cycle = 'Export Buffer Cycle';
  } else if (blockLetter === 'C') {
    zoneType = 'Block C (Empty Depot)';
    cycle = 'Empty Storage Cycle';
  } else if (blockLetter === 'F') {
    zoneType = 'Block F (Trailer Parking)';
    cycle = 'Trailer Marshalling Cycle';
  } else if (blockLetter === 'H') {
    zoneType = 'Block H (Reefer Grid)';
    cycle = 'Reefer Cold Chain Cycle';
  } else if (blockLetter === 'I') {
    zoneType = 'Block I (Customs Shed)';
    cycle = 'Customs Examination Cycle';
  }

  const isOccupied = (idx * 7 + 13) % 10 < 6; // 60% realistic live occupancy
  const status = isOccupied ? 'occupied' : 'available';
  const shippingLine = isOccupied ? shippingLines[idx % shippingLines.length] : undefined;
  const isoCode = isOccupied ? isoTypes[idx % isoTypes.length] : undefined;
  const truckNumber = isOccupied ? `MH-46-AR-${1000 + (idx * 37) % 8999}` : undefined;
  const containerNumber = isOccupied
    ? `${(shippingLine || 'MSCU').substring(0, 4).toUpperCase()}U${7000000 + idx * 197}`
    : undefined;
  const isReefer = blockLetter === 'H' || (isOccupied && idx % 7 === 0);
  const cargoType = isReefer ? 'Reefer' : blockLetter === 'C' ? 'Empty' : idx % 9 === 0 ? 'Hazardous' : 'Dry';
  const temperature = isReefer ? `${-18.0 - (idx % 5) * 0.4}°C` : undefined;

  const polygon = [
    { lat: s.coords[0][0], lng: s.coords[0][1] },
    { lat: s.coords[1][0], lng: s.coords[1][1] },
    { lat: s.coords[2][0], lng: s.coords[2][1] },
    { lat: s.coords[3][0], lng: s.coords[3][1] },
  ];

  const center = {
    lat: s.coords[4][0],
    lng: s.coords[4][1],
  };

  return {
    id: `slot-${idx + 1}`,
    name: s.name,
    code: s.name,
    block,
    row,
    bay,
    zoneType,
    cycle,
    status,
    center,
    polygon,
    truckNumber,
    driverName: isOccupied ? `Driver #${101 + (idx % 50)}` : undefined,
    transporter: isOccupied ? 'Prosper Freight Logistics' : undefined,
    containerNumber,
    isoCode,
    shippingLine,
    cargoType,
    temperature,
    sealNumber: isOccupied ? `CFS-${88000 + idx}` : undefined,
    grossWeightKg: isOccupied ? 18000 + (idx * 340) % 14000 : undefined,
    dwellTime: isOccupied ? `${(idx % 48) + 2}h ${((idx * 17) % 60)}m` : undefined,
    entryTime: isOccupied ? `2026-09-28 0${(idx % 8) + 1}:30` : undefined,
    assignedTask: isOccupied ? tasks[idx % tasks.length] : undefined,
    tierLevel: isOccupied ? (idx % 4) + 1 : undefined,
    maxTiers: 4,
    priority: idx % 11 === 0,
  };
});

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
  zoneType:
    | 'Block A (Import)'
    | 'Block B (Export)'
    | 'Block C (Empty Depot)'
    | 'Block D (General Yard)'
    | 'Block F (Trailer Parking)'
    | 'Block H (Reefer Grid)'
    | 'Block I (Customs Shed)';
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
  center: { lat: 18.9028, lng: 73.0465 },
  minLat: 18.9015,
  maxLat: 18.9042,
  minLng: 73.0452,
  maxLng: 73.0475,
};
`;

fs.writeFileSync(outputPath, tsCode, 'utf-8');
console.log(`Successfully generated yard-map-data.ts with ${cfsSlots.length} slots matching Geofences.csv`);
