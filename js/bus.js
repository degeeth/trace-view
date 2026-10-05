// Bus d'événements minimal : les modules (carte, profil, tableau) ne se connaissent pas,
// ils publient et écoutent des événements.
//
//   climb:select  { climb }        côte sélectionnée (ou null pour désélectionner)
//   trace:mode    'none' | 'slope' | 'climbs' | 'ravitaillements'
//   cursor:move   km               curseur du profil
//   cursor:stop
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach(fn => fn(payload));
}
