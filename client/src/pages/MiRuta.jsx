import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { buildRouteIcs, downloadIcs } from '../utils/ics.js';

/** RF-08 + RF-09: route lookup per UPZ with downloadable .ics reminder. */
export default function MiRuta() {
  const [upzList, setUpzList] = useState([]);
  const [selectedUpz, setSelectedUpz] = useState('');
  const [rutas, setRutas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/upz')
      .then(setUpzList)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedUpz) {
      setRutas(null);
      return;
    }
    api
      .get(`/rutas?upz=${selectedUpz}`)
      .then(setRutas)
      .catch((err) => setError(err.message));
  }, [selectedUpz]);

  function handleDownload(ruta) {
    const content = buildRouteIcs({
      upzNombre: ruta.upz_nombre,
      diaSemana: ruta.dia_semana,
      franjaHoraria: ruta.franja_horaria,
      operador: ruta.operador,
    });
    downloadIcs(`ruta-reciclaje-${ruta.upz_nombre.toLowerCase().replace(/\s+/g, '-')}.ics`, content);
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-dark">Mi ruta de recolección</h1>
      <p className="text-gray-700">
        Selecciona tu UPZ para conocer el día y la franja horaria de la ruta selectiva
        (bolsa blanca) en tu sector de Engativá.
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="selector-upz" className="mb-1 block font-semibold">
          Tu UPZ
        </label>
        <select
          id="selector-upz"
          className="input-field"
          value={selectedUpz}
          onChange={(event) => setSelectedUpz(event.target.value)}
        >
          <option value="">Selecciona una UPZ…</option>
          {upzList.map((upz) => (
            <option key={upz.id} value={upz.id}>
              {upz.nombre} (UPZ {upz.codigo})
            </option>
          ))}
        </select>
      </div>

      {rutas &&
        rutas.map((ruta) => (
          <div key={ruta.id} className="card space-y-3">
            <h2 className="text-xl font-bold">UPZ {ruta.upz_nombre}</h2>
            <p className="text-2xl font-extrabold text-primary-dark">
              {ruta.dia_semana}, {ruta.franja_horaria}
            </p>
            <p className="text-gray-700">Operador: {ruta.operador}</p>
            <p className="rounded-lg bg-primary-light p-3 text-primary-dark">
              Saca tu bolsa blanca ese día antes del inicio de la franja para que los
              recicladores puedan aprovecharla.
            </p>
            <button type="button" className="btn-primary" onClick={() => handleDownload(ruta)}>
              📅 Descargar recordatorio (.ics)
            </button>
            <p className="text-sm text-gray-600">
              El archivo .ics agrega un evento semanal a tu calendario (Google Calendar,
              Outlook o el calendario del celular).
            </p>
          </div>
        ))}

      {rutas && rutas.length === 0 && (
        <p role="status" className="card">
          Aún no hay ruta registrada para esta UPZ.
        </p>
      )}
    </div>
  );
}
