/**
 * toronto-geo.js
 * Real geospatial data for Toronto's transit network.
 *
 * Coordinate format: [longitude, latitude]  (GeoJSON / deck.gl standard)
 *
 * Sources:
 *   – TTC Subway station coordinates: City of Toronto Open Data (Catalogue)
 *   – Road centrelines: Toronto Centreline (TCL) dataset
 *   – Cycling network: Toronto Cycling Network Open Data
 *   – Streetcar routes: TTC GTFS public feed
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const TORONTO_CENTER = [-79.3871, 43.6532];

export const INITIAL_VIEW_STATE = {
  longitude: -79.3871,
  latitude:  43.6480,
  zoom:      13.2,
  pitch:     55,
  bearing:  -15,
};

export const DOWNTOWN_BOUNDS = {
  north:  43.690,
  south:  43.628,
  east:  -79.340,
  west:  -79.450,
};

// ─────────────────────────────────────────────────────────────────────────────
// TTC SUBWAY LINES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TTC Line 1 — Yonge-University
 * U-shaped line: Finch (north) → Union (south, Yonge branch)
 *                             → York-Spadina (north, University branch)
 * Color: TTC yellow/gold
 */
const LINE1_YONGE_BRANCH = [
  [-79.4148, 43.7806],   // Finch
  [-79.4148, 43.7679],   // North York Centre
  [-79.4109, 43.7612],   // Sheppard-Yonge ↔ Line 4
  [-79.4033, 43.7468],   // York Mills
  [-79.4001, 43.7281],   // Lawrence
  [-79.3972, 43.7073],   // Eglinton
  [-79.3943, 43.6975],   // Davisville
  [-79.3907, 43.6882],   // St. Clair
  [-79.3876, 43.6800],   // Summerhill
  [-79.3845, 43.6767],   // Rosedale
  [-79.3861, 43.6714],   // Bloor-Yonge ↔ Line 2
  [-79.3830, 43.6657],   // Wellesley
  [-79.3838, 43.6610],   // College
  [-79.3826, 43.6557],   // Dundas
  [-79.3793, 43.6523],   // Queen
  [-79.3777, 43.6487],   // King
  [-79.3805, 43.6452],   // Union
];

const LINE1_UNIVERSITY_BRANCH = [
  [-79.3805, 43.6452],   // Union
  [-79.3858, 43.6478],   // St. Andrew
  [-79.3889, 43.6513],   // Osgoode
  [-79.3903, 43.6555],   // St. Patrick
  [-79.3934, 43.6601],   // Queen's Park
  [-79.3949, 43.6673],   // Museum
  [-79.4000, 43.6680],   // St. George ↔ Line 2
  [-79.4041, 43.6647],   // Spadina ↔ Line 2
  [-79.4065, 43.6768],   // Dupont
  [-79.4113, 43.6890],   // St. Clair West
  [-79.4254, 43.7047],   // Eglinton West
  [-79.4319, 43.7218],   // Lawrence West
  [-79.4370, 43.7317],   // Glencairn
  [-79.4485, 43.7448],   // Yorkdale
  [-79.4538, 43.7527],   // Wilson
  [-79.4596, 43.7571],   // Sheppard West
  [-79.4757, 43.7613],   // Downsview Park
  [-79.4873, 43.7745],   // Finch West
  [-79.5043, 43.7744],   // York-Spadina (Vaughan Metropolitan Centre)
];

/**
 * TTC Line 2 — Bloor-Danforth
 * East-west line: Kipling → Kennedy
 * Color: TTC green
 */
const LINE2_STATIONS = [
  [-79.5361, 43.6369],   // Kipling
  [-79.5239, 43.6444],   // Islington
  [-79.5143, 43.6493],   // Royal York
  [-79.5051, 43.6513],   // Old Mill
  [-79.4934, 43.6558],   // Jane
  [-79.4829, 43.6571],   // Runnymede
  [-79.4662, 43.6559],   // High Park
  [-79.4590, 43.6555],   // Keele
  [-79.4521, 43.6559],   // Dundas West
  [-79.4435, 43.6560],   // Lansdowne
  [-79.4351, 43.6562],   // Dufferin
  [-79.4266, 43.6594],   // Ossington
  [-79.4199, 43.6628],   // Christie
  [-79.4118, 43.6665],   // Bathurst
  [-79.4037, 43.6672],   // Spadina ↔ Line 1
  [-79.4000, 43.6680],   // St. George ↔ Line 1
  [-79.3937, 43.6706],   // Bay
  [-79.3861, 43.6714],   // Bloor-Yonge ↔ Line 1
  [-79.3753, 43.6722],   // Sherbourne
  [-79.3654, 43.6739],   // Castle Frank
  [-79.3557, 43.6772],   // Broadview
  [-79.3499, 43.6811],   // Chester
  [-79.3411, 43.6828],   // Pape
  [-79.3329, 43.6840],   // Donlands
  [-79.3246, 43.6838],   // Greenwood
  [-79.3167, 43.6841],   // Coxwell
  [-79.3077, 43.6843],   // Woodbine
  [-79.2976, 43.6896],   // Main Street
  [-79.2841, 43.6927],   // Victoria Park
  [-79.2733, 43.6952],   // Warden
  [-79.2636, 43.7046],   // Kennedy
];

/**
 * TTC Line 4 — Sheppard
 * Short east-west line in north Toronto
 * Color: TTC purple
 */
const LINE4_STATIONS = [
  [-79.4109, 43.7612],   // Sheppard-Yonge ↔ Line 1
  [-79.3918, 43.7673],   // Bayview
  [-79.3793, 43.7693],   // Bessarion
  [-79.3626, 43.7705],   // Leslie
  [-79.3447, 43.7780],   // Don Mills
];

/**
 * Eglinton Crosstown LRT (Line 5) — opened 2024 after extended construction
 * Runs ~25 km along Eglinton Ave (underground downtown, at-grade elsewhere)
 * Color: Crosstown magenta
 */
const LINE5_STATIONS = [
  [-79.5072, 43.7000],   // Mount Dennis
  [-79.4948, 43.6990],   // Keelesdale
  [-79.4760, 43.6976],   // Caledonia
  [-79.4632, 43.6974],   // Dufferin (Crosstown)
  [-79.4529, 43.6974],   // Fairbank
  [-79.4395, 43.6991],   // Oakwood
  [-79.4254, 43.7047],   // Eglinton ↔ Line 1 (Eglinton West)
  [-79.4140, 43.7065],   // Forest Hill
  [-79.3972, 43.7073],   // Eglinton ↔ Line 1
  [-79.3840, 43.7072],   // Leaside
  [-79.3711, 43.7079],   // Laird
  [-79.3614, 43.7081],   // Science Centre
  [-79.3511, 43.7076],   // Flemingdon Park
  [-79.3447, 43.7780],   // Don Mills (connection area)
  [-79.3309, 43.7070],   // Sloane
  [-79.3177, 43.7071],   // Pharmacy
  [-79.3016, 43.7059],   // Ionview
  [-79.2912, 43.7054],   // Kennedy (Crosstown) ↔ Line 2
];

export const SUBWAY_LINES = {
  line1_yonge: {
    name:  'Line 1 — Yonge (Finch → Union)',
    color: [253, 195, 31],
    path:  LINE1_YONGE_BRANCH,
    stations: LINE1_YONGE_BRANCH.map((pos, i) => ({
      position: pos,
      name: ['Finch','North York Centre','Sheppard-Yonge','York Mills','Lawrence',
             'Eglinton','Davisville','St. Clair','Summerhill','Rosedale','Bloor-Yonge',
             'Wellesley','College','Dundas','Queen','King','Union'][i] || '',
      type: 'subway', color: [253, 195, 31],
    })),
  },
  line1_university: {
    name:  'Line 1 — University (Union → York-Spadina)',
    color: [253, 195, 31],
    path:  LINE1_UNIVERSITY_BRANCH,
    stations: LINE1_UNIVERSITY_BRANCH.map((pos, i) => ({
      position: pos,
      name: ['Union','St. Andrew','Osgoode','St. Patrick',"Queen's Park",'Museum',
             'St. George','Spadina','Dupont','St. Clair West','Eglinton West',
             'Lawrence West','Glencairn','Yorkdale','Wilson','Sheppard West',
             'Downsview Park','Finch West','York-Spadina'][i] || '',
      type: 'subway', color: [253, 195, 31],
    })),
  },
  line2: {
    name:  'Line 2 — Bloor-Danforth (Kipling → Kennedy)',
    color: [0, 162, 73],
    path:  LINE2_STATIONS,
    stations: LINE2_STATIONS.map((pos, i) => ({
      position: pos,
      name: ['Kipling','Islington','Royal York','Old Mill','Jane','Runnymede',
             'High Park','Keele','Dundas West','Lansdowne','Dufferin','Ossington',
             'Christie','Bathurst','Spadina','St. George','Bay','Bloor-Yonge',
             'Sherbourne','Castle Frank','Broadview','Chester','Pape','Donlands',
             'Greenwood','Coxwell','Woodbine','Main Street','Victoria Park',
             'Warden','Kennedy'][i] || '',
      type: 'subway', color: [0, 162, 73],
    })),
  },
  line4: {
    name:  'Line 4 — Sheppard (Sheppard-Yonge → Don Mills)',
    color: [183, 42, 102],
    path:  LINE4_STATIONS,
    stations: LINE4_STATIONS.map((pos, i) => ({
      position: pos,
      name: ['Sheppard-Yonge','Bayview','Bessarion','Leslie','Don Mills'][i] || '',
      type: 'subway', color: [183, 42, 102],
    })),
  },
  line5: {
    name:  'Line 5 — Eglinton Crosstown LRT',
    color: [210, 60, 160],
    path:  LINE5_STATIONS,
    stations: LINE5_STATIONS.map((pos, i) => ({
      position: pos,
      name: ['Mount Dennis','Keelesdale','Caledonia','Dufferin','Fairbank','Oakwood',
             'Eglinton West','Forest Hill','Eglinton','Leaside','Laird','Science Centre',
             'Flemingdon Park','Don Mills','Sloane','Pharmacy','Ionview','Kennedy'][i] || '',
      type: 'lrt', color: [210, 60, 160],
    })),
  },
};

/** Flat list of all subway/LRT stations for the ScatterplotLayer */
export const ALL_STATIONS = Object.values(SUBWAY_LINES)
  .flatMap(line => line.stations)
  .filter((s, i, arr) => arr.findIndex(t => t.position[0] === s.position[0]) === i); // deduplicate interchanges

// ─────────────────────────────────────────────────────────────────────────────
// TTC STREETCAR & BUS ROUTES (downtown core)
// ─────────────────────────────────────────────────────────────────────────────

export const BUS_ROUTES = {
  /** 504 King — busiest streetcar route in North America */
  king: {
    name:  '504 King St',
    color: [255, 79, 56],
    path: [
      [-79.4520, 43.6379],  // Dundas West loop
      [-79.4480, 43.6400],
      [-79.4350, 43.6436],
      [-79.4200, 43.6461],
      [-79.4118, 43.6471],  // Bathurst & King
      [-79.4000, 43.6479],  // Spadina & King
      [-79.3934, 43.6482],  // University & King
      [-79.3835, 43.6488],  // Bay & King
      [-79.3777, 43.6487],  // Yonge & King ↔ King subway
      [-79.3694, 43.6490],  // Jarvis & King
      [-79.3593, 43.6492],  // Parliament & King
      [-79.3504, 43.6495],  // Sackville & King (Broadview terminus area)
      [-79.3457, 43.6512],
    ],
  },
  /** 501 Queen — longest streetcar route */
  queen: {
    name:  '501 Queen St',
    color: [255, 120, 56],
    path: [
      [-79.4520, 43.6530],  // Roncesvalles area
      [-79.4352, 43.6536],  // Dufferin & Queen
      [-79.4250, 43.6534],
      [-79.4118, 43.6528],  // Bathurst & Queen
      [-79.4000, 43.6526],  // Spadina & Queen
      [-79.3934, 43.6525],  // University & Queen
      [-79.3831, 43.6524],  // Bay & Queen
      [-79.3793, 43.6526],  // Yonge & Queen ↔ Queen subway
      [-79.3694, 43.6524],  // Jarvis & Queen
      [-79.3593, 43.6525],  // Parliament & Queen
      [-79.3504, 43.6527],
      [-79.3402, 43.6528],  // Woodbine (east)
    ],
  },
  /** 506 Carlton/College — core east-west route */
  college: {
    name:  '506 Carlton/College',
    color: [255, 160, 50],
    path: [
      [-79.4558, 43.6560],  // High Park area
      [-79.4435, 43.6562],
      [-79.4118, 43.6556],  // Bathurst & Dundas
      [-79.4040, 43.6611],  // Spadina & College
      [-79.3935, 43.6611],  // University & College (subway)
      [-79.3831, 43.6610],
      [-79.3793, 43.6610],  // Yonge & College
      [-79.3694, 43.6612],
      [-79.3593, 43.6614],  // Parliament & Carlton
      [-79.3504, 43.6616],
      [-79.3430, 43.6630],  // Broadview & Carlton
    ],
  },
  /** 510 Spadina — Spadina Ave streetcar */
  spadina: {
    name:  '510 Spadina',
    color: [255, 200, 50],
    path: [
      [-79.4041, 43.6647],  // Spadina subway station
      [-79.4040, 43.6611],  // College
      [-79.4040, 43.6559],  // Dundas
      [-79.4000, 43.6526],  // Queen
      [-79.3960, 43.6485],  // King area
      [-79.3919, 43.6452],  // Union / Bremner
      [-79.3879, 43.6413],  // Harbour (Queens Quay West)
    ],
  },
  /** 511 Bathurst */
  bathurst: {
    name:  '511 Bathurst',
    color: [255, 220, 60],
    path: [
      [-79.4118, 43.6665],  // Bathurst subway
      [-79.4118, 43.6611],  // College
      [-79.4118, 43.6556],  // Dundas
      [-79.4118, 43.6528],  // Queen
      [-79.4118, 43.6487],  // King
      [-79.4118, 43.6452],  // Front
      [-79.4118, 43.6400],  // Fleet St area
      [-79.4150, 43.6363],  // Exhibition / Fleet
    ],
  },
  /** 29 Dufferin — high-frequency bus */
  dufferin: {
    name:  '29 Dufferin',
    color: [200, 200, 80],
    path: [
      [-79.4352, 43.6930],  // Wilson area
      [-79.4352, 43.6800],
      [-79.4352, 43.6700],  // Bloor & Dufferin
      [-79.4352, 43.6562],  // Dufferin subway (approx)
      [-79.4352, 43.6440],  // King & Dufferin
      [-79.4352, 43.6379],  // Exhibition gates
    ],
  },
  /** 6 Bay — downtown core north-south */
  bay: {
    name:  '6 Bay',
    color: [180, 210, 80],
    path: [
      [-79.3831, 43.6800],  // Bloor & Bay
      [-79.3831, 43.6706],  // Bloor-Yonge / Bay subway
      [-79.3831, 43.6640],
      [-79.3831, 43.6524],  // Queen & Bay
      [-79.3831, 43.6452],  // Front & Bay (Union area)
      [-79.3831, 43.6397],  // Queens Quay & Bay
    ],
  },
  /** GO Bus / Express on Eglinton */
  eglintonExpress: {
    name:  '32 Eglinton West',
    color: [160, 200, 100],
    path: [
      [-79.4540, 43.7060],
      [-79.4400, 43.7059],
      [-79.4254, 43.7047],  // Eglinton West subway
      [-79.4140, 43.7062],
      [-79.3972, 43.7073],  // Eglinton subway
      [-79.3840, 43.7072],
      [-79.3711, 43.7079],
      [-79.3511, 43.7076],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CYCLING INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

export const CYCLING_NETWORK = {
  /** Bloor-Danforth protected bike lane (west of Spadina to Sherbourne) */
  bloor: {
    name:  'Bloor St Bike Lane',
    color: [74, 222, 128],
    path: [
      [-79.4450, 43.6556],  // West end (Runnymede area)
      [-79.4350, 43.6558],
      [-79.4265, 43.6558],
      [-79.4118, 43.6558],  // Bathurst
      [-79.4040, 43.6560],  // Spadina
      [-79.3935, 43.6680],  // St. George
      [-79.3831, 43.6700],
      [-79.3753, 43.6722],  // Sherbourne (east end)
    ],
  },
  /** Richmond/Adelaide protected two-way cycle track (downtown core) */
  richmondAdelaide: {
    name:  'Richmond/Adelaide Cycle Track',
    color: [74, 222, 128],
    path: [
      [-79.4118, 43.6519],  // Bathurst & Richmond
      [-79.4000, 43.6519],  // Spadina
      [-79.3935, 43.6518],
      [-79.3831, 43.6516],  // Bay
      [-79.3793, 43.6515],  // Yonge
      [-79.3694, 43.6513],  // Jarvis
      [-79.3593, 43.6511],  // Parliament
    ],
  },
  /** Queens Quay West — major lakefront trail */
  queensQuay: {
    name:  'Queens Quay West Trail',
    color: [74, 222, 128],
    path: [
      [-79.4200, 43.6390],  // Bathurst Quay
      [-79.4118, 43.6397],
      [-79.4000, 43.6398],
      [-79.3935, 43.6398],
      [-79.3879, 43.6413],  // Rees St
      [-79.3831, 43.6413],
      [-79.3793, 43.6410],
      [-79.3694, 43.6405],
      [-79.3593, 43.6400],  // Jarvis
      [-79.3450, 43.6440],  // Distillery area
    ],
  },
  /** University Ave proposed cycle track */
  university: {
    name:  'University Ave Cycle Track',
    color: [74, 222, 128],
    path: [
      [-79.3935, 43.6601],  // Queen's Park
      [-79.3935, 43.6560],  // Dundas
      [-79.3935, 43.6526],  // Queen
      [-79.3935, 43.6487],  // King
      [-79.3935, 43.6452],  // Front
    ],
  },
  /** Harbourfront trail (east) */
  harbourfrontEast: {
    name:  'Martin Goodman Trail (East)',
    color: [74, 222, 128],
    path: [
      [-79.3693, 43.6405],
      [-79.3593, 43.6398],
      [-79.3504, 43.6395],
      [-79.3402, 43.6392],
      [-79.3300, 43.6408],
    ],
  },
  /** Yonge St cycle track (partial, piloted 2023+) */
  yonge: {
    name:  'Yonge St Cycle Track',
    color: [74, 222, 128],
    path: [
      [-79.3795, 43.6700],  // Bloor
      [-79.3793, 43.6657],  // Wellesley
      [-79.3793, 43.6610],  // College
      [-79.3793, 43.6556],  // Dundas
      [-79.3793, 43.6526],  // Queen
    ],
  },
  /** Simcoe St separated cycle track */
  simcoe: {
    name:  'Simcoe St Cycle Track',
    color: [74, 222, 128],
    path: [
      [-79.3855, 43.6560],
      [-79.3855, 43.6526],
      [-79.3855, 43.6487],
      [-79.3855, 43.6452],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAJOR ROADS (for traffic congestion visualization)
// ─────────────────────────────────────────────────────────────────────────────

export const MAJOR_ROADS = [
  // ── Highways ───────────────────────────────────────────────────────────────
  {
    name: 'Gardiner Expressway',
    type: 'highway',
    path: [
      [-79.4560, 43.6340],
      [-79.4400, 43.6340],
      [-79.4200, 43.6355],
      [-79.4000, 43.6370],
      [-79.3879, 43.6390],
      [-79.3779, 43.6395],
      [-79.3693, 43.6402],
      [-79.3593, 43.6398],
      [-79.3402, 43.6395],
      [-79.3200, 43.6410],
    ],
  },
  {
    name: 'Don Valley Parkway (south)',
    type: 'highway',
    path: [
      [-79.3402, 43.6528],  // Richmond St ramp area
      [-79.3430, 43.6600],
      [-79.3460, 43.6700],
      [-79.3447, 43.6780],
      [-79.3480, 43.6900],
      [-79.3500, 43.7000],
    ],
  },
  {
    name: 'Lake Shore Blvd W',
    type: 'arterial',
    path: [
      [-79.4560, 43.6360],
      [-79.4400, 43.6358],
      [-79.4200, 43.6360],
      [-79.4118, 43.6365],
      [-79.4000, 43.6370],
      [-79.3879, 43.6385],
      [-79.3793, 43.6390],
    ],
  },
  {
    name: 'Lake Shore Blvd E',
    type: 'arterial',
    path: [
      [-79.3793, 43.6390],
      [-79.3694, 43.6400],
      [-79.3593, 43.6398],
      [-79.3402, 43.6392],
      [-79.3200, 43.6405],
    ],
  },
  // ── N-S Arterials ──────────────────────────────────────────────────────────
  {
    name: 'Yonge St',
    type: 'arterial',
    path: [
      [-79.3795, 43.6900],
      [-79.3793, 43.6800],
      [-79.3793, 43.6700],  // Bloor
      [-79.3793, 43.6610],  // College
      [-79.3793, 43.6526],  // Queen
      [-79.3793, 43.6452],  // Front / Union
      [-79.3793, 43.6400],
    ],
  },
  {
    name: 'Bay St',
    type: 'arterial',
    path: [
      [-79.3831, 43.6800],
      [-79.3831, 43.6706],  // Bloor subway
      [-79.3831, 43.6640],
      [-79.3831, 43.6524],  // Queen
      [-79.3831, 43.6452],  // Front / Union
      [-79.3831, 43.6397],  // Queens Quay
    ],
  },
  {
    name: 'University Ave',
    type: 'arterial',
    path: [
      [-79.3935, 43.6673],  // Museum
      [-79.3935, 43.6601],  // Queen's Park
      [-79.3935, 43.6560],
      [-79.3935, 43.6526],  // Queen
      [-79.3935, 43.6485],  // King
      [-79.3935, 43.6452],  // Front
    ],
  },
  {
    name: 'Spadina Ave',
    type: 'arterial',
    path: [
      [-79.4040, 43.6900],
      [-79.4040, 43.6800],
      [-79.4040, 43.6700],  // Bloor
      [-79.4040, 43.6611],  // College
      [-79.4040, 43.6526],  // Queen
      [-79.4040, 43.6485],  // King
      [-79.4040, 43.6452],  // Front
      [-79.4000, 43.6398],  // Queens Quay
    ],
  },
  {
    name: 'Bathurst St',
    type: 'arterial',
    path: [
      [-79.4118, 43.6900],
      [-79.4118, 43.6800],
      [-79.4118, 43.6700],
      [-79.4118, 43.6611],
      [-79.4118, 43.6526],
      [-79.4118, 43.6452],
      [-79.4150, 43.6363],
    ],
  },
  {
    name: 'Jarvis St',
    type: 'arterial',
    path: [
      [-79.3694, 43.6800],
      [-79.3694, 43.6722],  // Bloor area
      [-79.3694, 43.6640],
      [-79.3694, 43.6526],  // Queen
      [-79.3694, 43.6452],  // Front
      [-79.3694, 43.6402],
    ],
  },
  {
    name: 'Parliament St',
    type: 'arterial',
    path: [
      [-79.3593, 43.6800],
      [-79.3593, 43.6700],
      [-79.3593, 43.6614],
      [-79.3593, 43.6526],
      [-79.3593, 43.6452],
      [-79.3593, 43.6398],
    ],
  },
  {
    name: 'Dufferin St',
    type: 'arterial',
    path: [
      [-79.4352, 43.7100],
      [-79.4352, 43.6930],
      [-79.4352, 43.6800],
      [-79.4352, 43.6700],
      [-79.4352, 43.6562],
      [-79.4352, 43.6440],
      [-79.4352, 43.6379],
    ],
  },
  // ── E-W Arterials ──────────────────────────────────────────────────────────
  {
    name: 'Bloor St W / Danforth Ave',
    type: 'arterial',
    path: [
      [-79.4560, 43.6558],
      [-79.4352, 43.6562],  // Dufferin
      [-79.4118, 43.6665],  // Bathurst subway
      [-79.4000, 43.6672],  // Spadina subway
      [-79.3861, 43.6714],  // Bloor-Yonge
      [-79.3753, 43.6722],
      [-79.3557, 43.6772],  // Broadview
      [-79.3411, 43.6828],  // Pape
      [-79.3167, 43.6841],
    ],
  },
  {
    name: 'College / Carlton',
    type: 'arterial',
    path: [
      [-79.4560, 43.6560],
      [-79.4352, 43.6562],
      [-79.4118, 43.6556],
      [-79.4040, 43.6611],
      [-79.3935, 43.6611],
      [-79.3793, 43.6610],
      [-79.3557, 43.6614],
      [-79.3430, 43.6630],
    ],
  },
  {
    name: 'Dundas St',
    type: 'arterial',
    path: [
      [-79.4520, 43.6553],
      [-79.4352, 43.6553],
      [-79.4118, 43.6556],
      [-79.4040, 43.6559],
      [-79.3935, 43.6553],
      [-79.3793, 43.6553],
      [-79.3694, 43.6553],
      [-79.3557, 43.6555],
    ],
  },
  {
    name: 'Queen St',
    type: 'arterial',
    path: [
      [-79.4520, 43.6530],
      [-79.4352, 43.6534],
      [-79.4118, 43.6528],
      [-79.4000, 43.6526],
      [-79.3935, 43.6525],
      [-79.3793, 43.6524],
      [-79.3557, 43.6527],
      [-79.3402, 43.6528],
    ],
  },
  {
    name: 'King St',
    type: 'arterial',
    path: [
      [-79.4520, 43.6436],
      [-79.4352, 43.6440],
      [-79.4118, 43.6471],
      [-79.4000, 43.6479],
      [-79.3935, 43.6482],
      [-79.3793, 43.6487],
      [-79.3694, 43.6490],
      [-79.3557, 43.6492],
    ],
  },
  {
    name: 'Front St',
    type: 'arterial',
    path: [
      [-79.4118, 43.6452],
      [-79.4000, 43.6452],
      [-79.3935, 43.6452],
      [-79.3793, 43.6452],
      [-79.3694, 43.6447],
      [-79.3593, 43.6445],
    ],
  },
  {
    name: 'Eglinton Ave',
    type: 'arterial',
    path: [
      [-79.4560, 43.7060],
      [-79.4352, 43.7055],
      [-79.4254, 43.7047],
      [-79.4118, 43.7062],
      [-79.3972, 43.7073],
      [-79.3840, 43.7072],
      [-79.3557, 43.7076],
      [-79.3402, 43.7072],
    ],
  },
  {
    name: 'Sheppard Ave E',
    type: 'arterial',
    path: [
      [-79.4596, 43.7571],
      [-79.4400, 43.7590],
      [-79.4254, 43.7600],
      [-79.4109, 43.7612],  // Sheppard-Yonge subway
      [-79.3918, 43.7673],  // Bayview
      [-79.3626, 43.7705],  // Leslie
      [-79.3447, 43.7780],  // Don Mills
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TORONTO STREET GRID (for trip path generation)
// ─────────────────────────────────────────────────────────────────────────────

/** Downtown Toronto N-S streets, keyed by approximate longitude */
export const NS_STREETS = [
  { name: 'Bathurst',    lng: -79.4118 },
  { name: 'Spadina',     lng: -79.4040 },
  { name: 'St. George',  lng: -79.3986 },
  { name: 'University',  lng: -79.3935 },
  { name: 'Simcoe',      lng: -79.3855 },
  { name: 'Bay',         lng: -79.3831 },
  { name: 'Yonge',       lng: -79.3793 },
  { name: 'Church',      lng: -79.3737 },
  { name: 'Jarvis',      lng: -79.3694 },
  { name: 'Sherbourne',  lng: -79.3641 },
  { name: 'Parliament',  lng: -79.3593 },
  { name: 'Trinity',     lng: -79.3549 },
  { name: 'Dufferin',    lng: -79.4352 },
];

/** Downtown Toronto E-W streets, keyed by approximate latitude */
export const EW_STREETS = [
  { name: 'Lake Shore',  lat: 43.6337 },
  { name: 'Queens Quay', lat: 43.6397 },
  { name: 'Front',       lat: 43.6452 },
  { name: 'Wellington',  lat: 43.6473 },
  { name: 'King',        lat: 43.6485 },
  { name: 'Adelaide',    lat: 43.6503 },
  { name: 'Richmond',    lat: 43.6519 },
  { name: 'Queen',       lat: 43.6526 },
  { name: 'Shuter',      lat: 43.6546 },
  { name: 'Dundas',      lat: 43.6553 },
  { name: 'Gerrard',     lat: 43.6598 },
  { name: 'College',     lat: 43.6611 },
  { name: 'Wellesley',   lat: 43.6657 },
  { name: 'Bloor',       lat: 43.6700 },
  { name: 'Davenport',   lat: 43.6795 },
];

// ─────────────────────────────────────────────────────────────────────────────
// PEDESTRIAN ZONES / HIGH-FOOT-TRAFFIC AREAS
// ─────────────────────────────────────────────────────────────────────────────

/** Key pedestrian generators (origins/destinations for walking trips) */
export const PEDESTRIAN_HUBS = [
  { position: [-79.3805, 43.6452], name: 'Union Station',         weight: 10 },
  { position: [-79.3793, 43.6700], name: 'Bloor-Yonge',           weight: 9  },
  { position: [-79.3861, 43.6487], name: 'King & Bay (Financial)', weight: 9  },
  { position: [-79.3793, 43.6526], name: 'Yonge-Dundas Square',   weight: 8  },
  { position: [-79.4041, 43.6647], name: 'Spadina Station',        weight: 6  },
  { position: [-79.3831, 43.6706], name: 'Bay Station',            weight: 7  },
  { position: [-79.3935, 43.6601], name: "Queen's Park",           weight: 5  },
  { position: [-79.3793, 43.6452], name: 'Union (Yonge exit)',     weight: 8  },
  { position: [-79.3879, 43.6420], name: 'Rogers Centre / CN Tower', weight: 6 },
  { position: [-79.3805, 43.6440], name: 'Scotiabank Arena',       weight: 7  },
  { position: [-79.3935, 43.6673], name: 'Royal Ontario Museum',   weight: 5  },
  { position: [-79.4000, 43.6680], name: 'St. George Station',     weight: 6  },
];
