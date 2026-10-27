import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';

/** RF-12: 3-step scheduling wizard — materials+bag size → time slot → confirm. */
const TAMANOS = [
  { value: 'pequena', label: 'Pequeña (~2 kg)' },
  { value: 'mediana', label: 'Mediana (~5 kg)' },
  { value: 'grande', label: 'Grande (~10 kg)' },
];

const FRANJAS = [
  'Mañana (8:00 a. m. – 12:00 m.)',
  'Tarde (12:00 m. – 5:00 p. m.)',
  'Noche (5:00 p. m. – 8:00 p. m.)',
];

const STEP_TITLES = ['Materiales', 'Disponibilidad', 'Confirmar'];

export default function Agendar() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [step, setStep] = useState(1);
  const [detalles, setDetalles] = useState([
    { categoria_id: '', tamano_bolsa: 'mediana', cantidad: 1 },
  ]);
  const [fecha, setFecha] = useState('');
  const [franja, setFranja] = useState(FRANJAS[0]);
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .get('/categorias')
      .then(setCategorias)
      .catch((err) => setError(err.message));
  }, []);

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }, []);

  function updateDetalle(index, field, value) {
    setDetalles((prev) =>
      prev.map((detalle, i) => (i === index ? { ...detalle, [field]: value } : detalle)),
    );
  }

  const step1Valid = detalles.length > 0 && detalles.every((detalle) => detalle.categoria_id);
  const step2Valid = fecha >= minDate && franja;

  function goNext() {
    setError('');
    if (step === 1 && !step1Valid) {
      setError('Selecciona la categoría de cada material.');
      return;
    }
    if (step === 2 && !step2Valid) {
      setError('Elige una fecha (desde mañana) y una franja horaria.');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await api.post('/solicitudes', {
        fecha_solicitada: fecha,
        franja_disponibilidad: franja,
        nota_acceso: nota || null,
        detalles: detalles.map((detalle) => ({
          categoria_id: Number(detalle.categoria_id),
          tamano_bolsa: detalle.tamano_bolsa,
          cantidad: Number(detalle.cantidad),
        })),
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function categoriaNombre(id) {
    return categorias.find((categoria) => String(categoria.id) === String(id))?.nombre || '';
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-5xl" aria-hidden="true">
          ✅
        </p>
        <h1 className="text-2xl font-extrabold text-primary-dark">¡Solicitud creada!</h1>
        <p className="text-gray-700">
          Un reciclador de tu zona la verá y podrá aceptarla. Te contaremos el avance en tu
          panel.
        </p>
        <button type="button" className="btn-primary" onClick={() => navigate('/hogar')}>
          Volver a mi panel
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-extrabold text-primary-dark">Agendar recolección</h1>

      <ol className="flex gap-2" aria-label="Progreso del agendamiento">
        {STEP_TITLES.map((title, index) => {
          const number = index + 1;
          const isActive = step === number;
          return (
            <li
              key={title}
              aria-current={isActive ? 'step' : undefined}
              className={`flex-1 rounded-lg px-2 py-1.5 text-center text-sm font-semibold ${
                isActive
                  ? 'bg-primary text-white'
                  : step > number
                    ? 'bg-primary-light text-primary-dark'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              Paso {number}: {title}
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      {step === 1 && (
        <fieldset className="card space-y-4">
          <legend className="text-lg font-bold">¿Qué materiales entregarás?</legend>
          {detalles.map((detalle, index) => (
            <div key={index} className="space-y-3 rounded-lg border border-gray-200 p-3">
              <div>
                <label htmlFor={`categoria-${index}`} className="mb-1 block font-semibold">
                  Tipo de material
                </label>
                <select
                  id={`categoria-${index}`}
                  className="input-field"
                  value={detalle.categoria_id}
                  onChange={(event) => updateDetalle(index, 'categoria_id', event.target.value)}
                >
                  <option value="">Selecciona…</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre} (bolsa {categoria.color_bolsa})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="mb-1 block font-semibold">Tamaño de bolsa</span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tamaño de bolsa">
                  {TAMANOS.map((tamano) => (
                    <label
                      key={tamano.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                        detalle.tamano_bolsa === tamano.value
                          ? 'border-primary bg-primary-light text-primary-dark'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`tamano-${index}`}
                        value={tamano.value}
                        checked={detalle.tamano_bolsa === tamano.value}
                        onChange={() => updateDetalle(index, 'tamano_bolsa', tamano.value)}
                      />
                      {tamano.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor={`cantidad-${index}`} className="mb-1 block font-semibold">
                  Cantidad de bolsas
                </label>
                <input
                  id={`cantidad-${index}`}
                  type="number"
                  min={1}
                  max={50}
                  className="input-field max-w-[8rem]"
                  value={detalle.cantidad}
                  onChange={(event) => updateDetalle(index, 'cantidad', event.target.value)}
                />
              </div>
              {detalles.length > 1 && (
                <button
                  type="button"
                  className="text-sm font-semibold text-red-700 underline"
                  onClick={() => setDetalles((prev) => prev.filter((_, i) => i !== index))}
                >
                  Quitar este material
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              setDetalles((prev) => [
                ...prev,
                { categoria_id: '', tamano_bolsa: 'mediana', cantidad: 1 },
              ])
            }
          >
            + Agregar otro material
          </button>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="card space-y-4">
          <legend className="text-lg font-bold">¿Cuándo puedes entregar?</legend>
          <div>
            <label htmlFor="fecha-solicitud" className="mb-1 block font-semibold">
              Fecha
            </label>
            <input
              id="fecha-solicitud"
              type="date"
              className="input-field"
              min={minDate}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="franja-solicitud" className="mb-1 block font-semibold">
              Franja horaria de disponibilidad
            </label>
            <select
              id="franja-solicitud"
              className="input-field"
              value={franja}
              onChange={(event) => setFranja(event.target.value)}
            >
              {FRANJAS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nota-solicitud" className="mb-1 block font-semibold">
              Nota de acceso (opcional)
            </label>
            <input
              id="nota-solicitud"
              type="text"
              className="input-field"
              placeholder="Ej.: dejar en portería"
              maxLength={300}
              value={nota}
              onChange={(event) => setNota(event.target.value)}
            />
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <section aria-label="Resumen de la solicitud" className="card space-y-3">
          <h2 className="text-lg font-bold">Confirma tu solicitud</h2>
          <ul className="list-inside list-disc text-gray-800">
            {detalles.map((detalle, index) => (
              <li key={index}>
                {detalle.cantidad} bolsa(s){' '}
                {TAMANOS.find((tamano) => tamano.value === detalle.tamano_bolsa)?.label.toLowerCase()}{' '}
                de {categoriaNombre(detalle.categoria_id).toLowerCase()}
              </li>
            ))}
          </ul>
          <p>
            <strong>Fecha:</strong>{' '}
            {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <p>
            <strong>Disponibilidad:</strong> {franja}
          </p>
          {nota && (
            <p>
              <strong>Nota de acceso:</strong> {nota}
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        {step > 1 ? (
          <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
            ← Anterior
          </button>
        ) : (
          <Link to="/hogar" className="btn-secondary">
            Cancelar
          </Link>
        )}
        {step < 3 ? (
          <button type="button" className="btn-primary" onClick={goNext}>
            Siguiente →
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando…' : 'Confirmar solicitud'}
          </button>
        )}
      </div>
    </div>
  );
}
