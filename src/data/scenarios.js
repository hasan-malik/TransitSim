/**
 * Predefined modal-mix scenarios for the TransitSim control panel.
 * Each represents a studied or proposed urban mobility policy.
 *
 * Sources:
 *   Status Quo:    City of Toronto Cordon Count 2022
 *   Car-Free:      Toronto King St Pilot study + Stockholm car-free modelling
 *   Transit First: City of Toronto TMP 2041 target scenario
 *   Cycling City:  Amsterdam Bicycle Account 2022 (adapted for Toronto context)
 *   Active City:   15-minute city framework (Moreno et al., 2021)
 *   Car Dominant:  1960s North American sprawl model (historical baseline)
 *   Bus BRT:       Bogotá TransMilenio-equivalent overlay
 *   2050 Green:    Toronto Climate Action Strategy net-zero target
 */
export const SCENARIOS = {
  statusQuo: {
    label:       'Status Quo',
    description: 'Current Toronto downtown modal split (City Cordon Count 2022)',
    icon:        '📊',
    mix: { car: 34, bus: 18, subway: 31, cycling: 6, pedestrian: 9, other: 2 },
  },
  carFree: {
    label:       'Car-Free Downtown',
    description: 'Eliminate personal vehicles; redistribute to transit + active',
    icon:        '🚫',
    mix: { car: 0, bus: 25, subway: 45, cycling: 18, pedestrian: 11, other: 1 },
  },
  transitFirst: {
    label:       'Transit First',
    description: 'Maximize rapid transit capacity — Vision Zero + BRT approach',
    icon:        '🚇',
    mix: { car: 12, bus: 30, subway: 42, cycling: 8, pedestrian: 6, other: 2 },
  },
  cyclingCity: {
    label:       'Cycling City',
    description: 'Amsterdam-level cycling infrastructure & adoption',
    icon:        '🚲',
    mix: { car: 8, bus: 14, subway: 24, cycling: 38, pedestrian: 14, other: 2 },
  },
  activeCity: {
    label:       'Active City',
    description: 'Walking & cycling prioritised — 15-minute neighbourhood model',
    icon:        '🏃',
    mix: { car: 10, bus: 15, subway: 25, cycling: 22, pedestrian: 26, other: 2 },
  },
  carDominant: {
    label:       'Car Dominant',
    description: '1960s North American sprawl model — what if cars won?',
    icon:        '🚗',
    mix: { car: 72, bus: 10, subway: 8, cycling: 2, pedestrian: 7, other: 1 },
  },
  busBRT: {
    label:       'Bus Rapid Transit',
    description: 'Bogotá-style BRT network replacing all surface streetcars',
    icon:        '🚌',
    mix: { car: 20, bus: 45, subway: 20, cycling: 6, pedestrian: 7, other: 2 },
  },
  greenMix: {
    label:       '2050 Green Target',
    description: 'Toronto Climate Action Strategy net-zero mobility scenario',
    icon:        '🌿',
    mix: { car: 5, bus: 20, subway: 40, cycling: 20, pedestrian: 13, other: 2 },
  },
};
