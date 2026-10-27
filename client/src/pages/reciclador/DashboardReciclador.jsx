import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';

/** RF-13 + RF-14: zone requests with accept/reschedule/reject and weight confirmation. */
const TAMANO_LABELS = {
  pequena: 'pequeña (~2 kg)',
  mediana: 'mediana (~5 kg)',
  grande: 'grande (~10 kg)',
};

export default function DashboardReciclador() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [toReschedule, setToReschedule] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [toConfirm, setToConfirm] = useState(null);
  const [peso, setPeso] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setSolicitudes(await api.get('/solicitudes/zona'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateEstado(id, estado, fecha) {
    setError('');
    setMessage('');
    try {
      await api.patch(`/solicitudes/${id}/estado`, {
        estado,
        fecha_solicitada: fecha || null,
      });
      setMessage(
        estado === 'aceptada'
          ? 'Solicitud aceptada. Recuerda confirmar la recolección con el peso al finalizar.'
          : estado === 'reprogramada'
            ? 'Solicitud reprogramada.'
            : 'Solicitud rechazada.',
      );
      setToReschedule(null);
      setNewDate('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/recolecciones', {
        solicitud_id: toConfirm.id,
        peso_kg: Number(peso),
        tipo_material: tipoMaterial,
      });
      setMessage('Recolección registrada. El registro es inmutable y respalda tu remuneración.');
      setToConfirm(null);
      setPeso('');
      setTipoMaterial('');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const pendientes = solicitudes.filter((solicitud) => solicitud.estado === 'pendiente');
  const asignadas = solicitudes.filter((solicitud) =>
    ['aceptada', 'reprogramada'].includes(solicitud.estado),
  );

  function SolicitudCard({ solicitud, children }) {
    return (
      <div className="card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">
            {new Date(`${solicitud.fecha_solicitada.slice(0, 10)}T12:00:00`).toLocaleDateString(
              'es-CO',
              { weekday: 'long', day: 'numeric', month: 'long' },
            )}
          </p>
          <span className="text-sm font-semibold text-gray-600">
            {solicitud.upz_nombre ? `UPZ ${solicitud.upz_nombre}` : 'Sin UPZ'}
          </span>
        </div>
        <p className="text-gray-800">
          {solicitud.hogar_nombre}
          {solicitud.barrio_aproximado ? ` · ${solicitud.barrio_aproximado}` : ''}
        </p>
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
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
            🔑 Acceso: {solicitud.nota_acceso}
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-primary-dark">Hola, {user.nombre}</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-primary-light p-3 font-semibold text-primary-dark">
          {message}
        </p>
      )}

      <section aria-labelledby="titulo-pendientes" className="space-y-3">
        <h2 id="titulo-pendientes" className="text-xl font-bold">
          Solicitudes de tu zona ({pendientes.length})
        </h2>
        {pendientes.length === 0 && (
          <p className="card text-gray-700">No hay solicitudes pendientes en tu zona.</p>
        )}
        {pendientes.map((solicitud) => (
          <SolicitudCard key={solicitud.id} solicitud={solicitud}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => updateEstado(solicitud.id, 'aceptada')}
            >
              Aceptar
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setToReschedule(solicitud);
                setNewDate('');
              }}
            >
              Reprogramar
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-700 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50"
              onClick={() => updateEstado(solicitud.id, 'rechazada')}
            >
              Rechazar
            </button>
          </SolicitudCard>
        ))}
      </section>

      <section aria-labelledby="titulo-asignadas" className="space-y-3">
        <h2 id="titulo-asignadas" className="text-xl font-bold">
          Aceptadas por ti ({asignadas.length})
        </h2>
        {asignadas.length === 0 && (
          <p className="card text-gray-700">No tienes recolecciones en curso.</p>
        )}
        {asignadas.map((solicitud) => (
          <SolicitudCard key={solicitud.id} solicitud={solicitud}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setToConfirm(solicitud);
                setPeso('');
                setTipoMaterial('');
              }}
            >
              ⚖️ Confirmar recolección
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setToReschedule(solicitud);
                setNewDate('');
              }}
            >
              Reprogramar
            </button>
          </SolicitudCard>
        ))}
      </section>

      {toReschedule && (
        <Modal title="Reprogramar solicitud" onClose={() => setToReschedule(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateEstado(toReschedule.id, 'reprogramada', newDate);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="nueva-fecha" className="mb-1 block font-semibold">
                Nueva fecha propuesta
              </label>
              <input
                id="nueva-fecha"
                type="date"
                className="input-field"
                required
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Reprogramar
            </button>
          </form>
        </Modal>
      )}

      {toConfirm && (
        <Modal title="Confirmar recolección" onClose={() => setToConfirm(null)}>
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-gray-600">
              Este registro es <strong>inmutable</strong>: respalda la remuneración por
              aprovechamiento (Decreto 596 de 2016). Verifica el peso antes de guardar.
            </p>
            <div>
              <label htmlFor="peso-kg" className="mb-1 block font-semibold">
                Peso recolectado (kg)
              </label>
              <input
                id="peso-kg"
                type="number"
                className="input-field"
                min="0.1"
                step="0.1"
                required
                value={peso}
                onChange={(event) => setPeso(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tipo-material" className="mb-1 block font-semibold">
                Tipo de material
              </label>
              <input
                id="tipo-material"
                type="text"
                className="input-field"
                placeholder="Ej.: cartón, PET y vidrio"
                required
                minLength={3}
                value={tipoMaterial}
                onChange={(event) => setTipoMaterial(event.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Guardando…' : 'Registrar recolección'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
