import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { buildRouteIcs, downloadIcs } from '../../utils/ics.js';
import Modal from '../../components/Modal.jsx';
import StarRating from '../../components/StarRating.jsx';

export const ESTADO_STYLES = {
  pendiente: 'bg-amber-100 text-amber-900',
  aceptada: 'bg-green-100 text-green-900',
  reprogramada: 'bg-blue-100 text-blue-900',
  rechazada: 'bg-red-100 text-red-900',
  completada: 'bg-primary-light text-primary-dark',
  cancelada: 'bg-gray-200 text-gray-700',
};

const TAMANO_LABELS = {
  pequena: 'pequeña (~2 kg)',
  mediana: 'mediana (~5 kg)',
  grande: 'grande (~10 kg)',
};

function EstadoChip({ estado }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold uppercase ${ESTADO_STYLES[estado]}`}>
      {estado}
    </span>
  );
}

export default function DashboardHogar() {
  const { user } = useAuth();
  const [ruta, setRuta] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historial, setHistorial] = useState(null);
  const [error, setError] = useState('');
  const [toRate, setToRate] = useState(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [mias, hist] = await Promise.all([
        api.get('/solicitudes/mias'),
        api.get('/hogares/historial'),
      ]);
      setSolicitudes(mias);
      setHistorial(hist);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user.upz_id) return;
    api
      .get(`/rutas?upz=${user.upz_id}`)
      .then((rutas) => setRuta(rutas[0] || null))
      .catch(() => setRuta(null));
  }, [user.upz_id]);

  async function handleCancel(id) {
    try {
      await api.patch(`/solicitudes/${id}/cancelar`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRate(event) {
    event.preventDefault();
    try {
      await api.post('/calificaciones', {
        recoleccion_id: toRate.recoleccion_id,
        estrellas: stars,
        comentario: comment || null,
      });
      setToRate(null);
      setStars(0);
      setComment('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-primary-dark">Hola, {user.nombre}</h1>
        <Link to="/hogar/agendar" className="btn-primary">
          + Agendar recolección
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      {/* RF-09: visible route reminder in the dashboard */}
      {ruta && (
        <section aria-labelledby="titulo-recordatorio" className="rounded-xl bg-primary-light p-4">
          <h2 id="titulo-recordatorio" className="text-lg font-bold text-primary-dark">
            📅 Recordatorio: tu ruta selectiva
          </h2>
          <p className="text-gray-800">
            En tu UPZ ({ruta.upz_nombre}) la ruta de reciclaje pasa cada{' '}
            <strong>
              {ruta.dia_semana.toLowerCase()}, {ruta.franja_horaria}
            </strong>
          </p>
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={() =>
              downloadIcs(
                'ruta-reciclaje.ics',
                buildRouteIcs({
                  upzNombre: ruta.upz_nombre,
                  diaSemana: ruta.dia_semana,
                  franjaHoraria: ruta.franja_horaria,
                  operador: ruta.operador,
                }),
              )
            }
          >
            Añadir a mi calendario (.ics)
          </button>
        </section>
      )}

      {/* RF-15: accumulated kilograms */}
      {historial && (
        <section aria-labelledby="titulo-impacto" className="card">
          <h2 id="titulo-impacto" className="text-lg font-bold">
            Tu impacto
          </h2>
          <p className="text-4xl font-extrabold text-primary-dark">
            {historial.total_kg} kg
          </p>
          <p className="text-gray-700">
            de material aprovechable entregado a recicladores de oficio.
          </p>
        </section>
      )}

      <section aria-labelledby="titulo-solicitudes" className="space-y-3">
        <h2 id="titulo-solicitudes" className="text-xl font-bold">
          Mis solicitudes
        </h2>
        {solicitudes.length === 0 && (
          <p className="card text-gray-700">
            Aún no tienes solicitudes.{' '}
            <Link to="/hogar/agendar" className="font-semibold text-primary-dark underline">
              Agenda tu primera recolección
            </Link>
            .
          </p>
        )}
        {solicitudes.map((solicitud) => (
          <div key={solicitud.id} className="card space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                {new Date(`${solicitud.fecha_solicitada.slice(0, 10)}T12:00:00`).toLocaleDateString(
                  'es-CO',
                  { weekday: 'long', day: 'numeric', month: 'long' },
                )}
              </p>
              <EstadoChip estado={solicitud.estado} />
            </div>
            <p className="text-gray-700">Disponibilidad: {solicitud.franja_disponibilidad}</p>
            <ul className="text-sm text-gray-700">
              {solicitud.detalles.map((detalle) => (
                <li key={detalle.id}>
                  • {detalle.cantidad} bolsa(s) {TAMANO_LABELS[detalle.tamano_bolsa]} de{' '}
                  {detalle.categoria.toLowerCase()}
                </li>
              ))}
            </ul>
            {solicitud.nota_acceso && (
              <p className="text-sm text-gray-600">Nota: {solicitud.nota_acceso}</p>
            )}
            {solicitud.reciclador_nombre && (
              <p className="text-sm text-gray-600">Reciclador: {solicitud.reciclador_nombre}</p>
            )}
            {['pendiente', 'aceptada', 'reprogramada'].includes(solicitud.estado) && (
              <button
                type="button"
                className="text-sm font-semibold text-red-700 underline"
                onClick={() => handleCancel(solicitud.id)}
              >
                Cancelar solicitud
              </button>
            )}
          </div>
        ))}
      </section>

      <section aria-labelledby="titulo-historial" className="space-y-3">
        <h2 id="titulo-historial" className="text-xl font-bold">
          Historial de recolecciones
        </h2>
        {historial && historial.recolecciones.length === 0 && (
          <p className="card text-gray-700">Aún no tienes recolecciones completadas.</p>
        )}
        {historial?.recolecciones.map((recoleccion) => (
          <div key={recoleccion.recoleccion_id} className="card space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                {new Date(recoleccion.fecha_recoleccion).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-lg font-extrabold text-primary-dark">{recoleccion.peso_kg} kg</p>
            </div>
            <p className="text-gray-700">{recoleccion.tipo_material}</p>
            <p className="text-sm text-gray-600">Reciclador: {recoleccion.reciclador_nombre}</p>
            {recoleccion.estrellas ? (
              <div className="flex items-center gap-2">
                <StarRating value={recoleccion.estrellas} />
                {recoleccion.comentario && (
                  <span className="text-sm text-gray-600">«{recoleccion.comentario}»</span>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setToRate(recoleccion)}
              >
                ★ Calificar servicio
              </button>
            )}
          </div>
        ))}
      </section>

      {toRate && (
        <Modal title="Calificar la recolección" onClose={() => setToRate(null)}>
          <form onSubmit={handleRate} className="space-y-4">
            <StarRating value={stars} onChange={setStars} />
            <div>
              <label htmlFor="comentario-calificacion" className="mb-1 block font-semibold">
                Comentario (opcional)
              </label>
              <textarea
                id="comentario-calificacion"
                className="input-field"
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={stars === 0}>
              Enviar calificación
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
