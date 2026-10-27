/**
 * RF-09: builds a weekly recurring calendar event (.ics) for the selective
 * collection route of a UPZ. Plain VCALENDAR text — no libraries, zero cost.
 */
const DAY_CODES = {
  domingo: 'SU',
  lunes: 'MO',
  martes: 'TU',
  miercoles: 'WE',
  miércoles: 'WE',
  jueves: 'TH',
  viernes: 'FR',
  sabado: 'SA',
  sábado: 'SA',
};

const DAY_INDEX = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** Next occurrence (today included) of the given Spanish weekday name. */
export function nextOccurrence(diaSemana, from = new Date()) {
  const target = DAY_INDEX[diaSemana.toLowerCase()];
  if (target === undefined) return from;
  const date = new Date(from);
  const delta = (target - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + delta);
  return date;
}

export function buildRouteIcs({ upzNombre, diaSemana, franjaHoraria, operador }) {
  const dayCode = DAY_CODES[diaSemana.toLowerCase()] || 'MO';
  const start = nextOccurrence(diaSemana);
  const description = [
    `Saca tus residuos aprovechables (bolsa blanca) en la franja: ${franjaHoraria}.`,
    operador ? `Operador: ${operador}.` : null,
    'Generado por EcoRecicla Engativá.',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EcoRecicla Engativa//Recordatorio de ruta//ES',
    'BEGIN:VEVENT',
    `UID:ruta-${upzNombre.toLowerCase().replace(/\s+/g, '-')}@ecorecicla.local`,
    `DTSTAMP:${formatDate(new Date())}T000000Z`,
    `DTSTART;VALUE=DATE:${formatDate(start)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`,
    `SUMMARY:Ruta de reciclaje — UPZ ${upzNombre}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
