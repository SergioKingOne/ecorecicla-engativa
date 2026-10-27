import { describe, expect, it } from 'vitest';
import { buildRouteIcs, nextOccurrence } from '../utils/ics.js';

describe('Generación de recordatorio .ics (RF-09)', () => {
  it('computes the next occurrence of the weekday', () => {
    const from = new Date('2026-07-16T10:00:00'); // a Thursday
    expect(nextOccurrence('jueves', from).getDay()).toBe(4);
    expect(nextOccurrence('lunes', from).getDay()).toBe(1);
    expect(nextOccurrence('sábado', from).getDay()).toBe(6);
  });

  it('builds a weekly recurring VCALENDAR event', () => {
    const ics = buildRouteIcs({
      upzNombre: 'Boyacá Real',
      diaSemana: 'Jueves',
      franjaHoraria: '6:00 a. m. – 10:00 a. m.',
      operador: 'Área Limpia D.C.',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TH');
    expect(ics).toContain('SUMMARY:Ruta de reciclaje — UPZ Boyacá Real');
    expect(ics).toContain('6:00 a. m. – 10:00 a. m.');
    expect(ics).toContain('END:VCALENDAR');
  });
});
