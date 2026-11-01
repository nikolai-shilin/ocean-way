/**
 * Which Ocean Way icon goes with a fact. Ids point into the sprite every page carries
 * (prototypes/icons/ow-icons.svg, drawn by prototypes/_build/build_icons.py; study sheet prototypes/icons.html).
 * Keys are the English source strings, so the choice is the same in every language.
 */

const SCOPE: Record<string, string> = {
  'Needed for all crew': 'ow-crew',
  'No experience needed': 'ow-level',
  'Valid 5 years': 'ow-licence',
};

/** Course scope fact: "Up to 60 nm offshore", "Any ocean" → offshore range; the rest by meaning. */
export const scopeIcon = (scope: string) => SCOPE[scope] ?? 'ow-offshore';

const USED_FOR: Record<string, string> = {
  'Introduction to Yachting': 'ow-intro',
  'Flotilla Skipper courses': 'ow-flotilla',
  'Bareboat Skipper courses': 'ow-bareboat',
  'Training passages': 'ow-route',
  'Passages and Yachtmaster': 'ow-offshore-ym',
  Charter: 'ow-charter',
};

/** Yacht "used for" fact: the sign of the course, passages or charter. */
export const usedForIcon = (usedFor: string) => USED_FOR[usedFor] ?? 'ow-monohull';

const SKILL: Record<string, string> = {
  'The radio and the licences': 'ow-licence',
  'Everyday calls': 'ow-chat',
  'Distress, urgency and safety': 'ow-mob',
  'DSC and GMDSS': 'ow-radio',
  'Steering and boat handling': 'ow-bareboat',
  'Sails and trim': 'ow-points-of-sail',
  'Lines and knots': 'ow-knots',
  'Mooring and anchoring': 'ow-anchor',
  'Safety on board': 'ow-lifejacket',
  Weather: 'ow-weather',
  'Taking command': 'ow-crew',
  'Boat handling under engine': 'ow-engine',
  'Charts and navigation': 'ow-fix',
  Anchoring: 'ow-anchor',
  'Weather and decisions': 'ow-weather',
  Safety: 'ow-lifejacket',
  'Under engine': 'ow-engine',
  'Under sail': 'ow-points-of-sail',
  'Rules of the road': 'ow-right-of-way',
  'Passage planning': 'ow-planning',
  Navigation: 'ow-fix',
  'Night sailing': 'ow-lights',
  'Heavy weather': 'ow-reefing',
  Emergencies: 'ow-mob',
  Skippering: 'ow-crew',
  'Offshore planning': 'ow-planning',
  'Navigation without electronics': 'ow-offshore-ym',
  'Watch systems and crew': 'ow-clock',
  'Boat and engine': 'ow-tool',
  'Emergencies at sea': 'ow-mob',
  'Rules and maritime law': 'ow-licence',
  'The sextant': 'ow-ocean',
  'Sun sights': 'ow-sun',
  'Stars, planets and the moon': 'ow-night',
  'Compass and position': 'ow-offshore-ym',
  'Ocean passages': 'ow-route',
};

/** Old i-* ids still stored with skills in the database, for titles not listed above. */
const LEGACY: Record<string, string> = {
  'i-info': 'ow-info', 'i-guests': 'ow-crew', 'i-buoy': 'ow-mob', 'i-light': 'ow-lights', 'i-wheel': 'ow-bareboat',
  'i-sail': 'ow-points-of-sail', 'i-clip': 'ow-read', 'i-anchor': 'ow-anchor', 'i-wind': 'ow-weather',
  'i-chart': 'ow-planning', 'i-compass': 'ow-offshore-ym', 'i-boat': 'ow-monohull', 'i-cert': 'ow-licence', 'i-star': 'ow-ocean',
};

/** Skill group on course pages: by its English title, else by the id stored with it. */
export const skillIcon = (title: string, stored: string) =>
  SKILL[title] ?? (stored.startsWith('ow-') ? stored : LEGACY[stored] ?? 'ow-sail');
