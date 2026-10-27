import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * RF-10 + RF-18: household signup. The Ley 1581 consent checkbox is blocking:
 * without it the submit button stays disabled and the API also rejects.
 */
export default function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [upzList, setUpzList] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    barrio_aproximado: '',
    upz_id: '',
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/upz')
      .then(setUpzList)
      .catch(() => setUpzList([]));
  }, []);

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setDetalles([]);
    setLoading(true);
    try {
      await register({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        barrio_aproximado: form.barrio_aproximado || null,
        upz_id: form.upz_id ? Number(form.upz_id) : null,
        autorizacion_datos: consent,
      });
      navigate('/hogar');
    } catch (err) {
      setError(err.message);
      setDetalles(err.detalles || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-dark">Crear cuenta de hogar</h1>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          <p>{error}</p>
          {detalles.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-sm">
              {detalles.map((detalle) => (
                <li key={detalle.campo}>{detalle.mensaje}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="registro-nombre" className="mb-1 block font-semibold">
            Nombre
          </label>
          <input
            id="registro-nombre"
            type="text"
            className="input-field"
            autoComplete="name"
            required
            minLength={3}
            value={form.nombre}
            onChange={updateField('nombre')}
          />
        </div>
        <div>
          <label htmlFor="registro-email" className="mb-1 block font-semibold">
            Correo electrónico
          </label>
          <input
            id="registro-email"
            type="email"
            className="input-field"
            autoComplete="email"
            required
            value={form.email}
            onChange={updateField('email')}
          />
        </div>
        <div>
          <label htmlFor="registro-password" className="mb-1 block font-semibold">
            Contraseña (mínimo 8 caracteres)
          </label>
          <input
            id="registro-password"
            type="password"
            className="input-field"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={updateField('password')}
          />
        </div>
        <div>
          <label htmlFor="registro-upz" className="mb-1 block font-semibold">
            UPZ donde vives (opcional)
          </label>
          <select id="registro-upz" className="input-field" value={form.upz_id} onChange={updateField('upz_id')}>
            <option value="">Selecciona tu UPZ…</option>
            {upzList.map((upz) => (
              <option key={upz.id} value={upz.id}>
                {upz.nombre} (UPZ {upz.codigo})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="registro-barrio" className="mb-1 block font-semibold">
            Barrio aproximado (opcional)
          </label>
          <input
            id="registro-barrio"
            type="text"
            className="input-field"
            value={form.barrio_aproximado}
            onChange={updateField('barrio_aproximado')}
          />
          <p className="mt-1 text-sm text-gray-600">
            Nunca pedimos tu dirección exacta (principio de minimización de datos).
          </p>
        </div>

        <section
          aria-labelledby="titulo-privacidad"
          tabIndex={0}
          className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800"
        >
          <h2 id="titulo-privacidad" className="font-bold">
            Aviso de privacidad (Ley 1581 de 2012)
          </h2>
          <p>
            EcoRecicla Engativá, proyecto académico de la UNAD, tratará tus datos (nombre,
            correo, barrio aproximado y UPZ) únicamente para coordinar recolecciones con
            organizaciones de recicladores de oficio y mostrarte tu historial.
          </p>
          <p>
            No compartimos tus datos con terceros ni los usamos con fines comerciales.
            Solo guardamos tu ubicación aproximada (barrio/UPZ), nunca tu dirección exacta.
          </p>
          <p>
            Puedes conocer, actualizar o eliminar tus datos y <strong>revocar esta
            autorización en cualquier momento</strong> desde tu perfil; al revocarla, tu
            cuenta se desactiva.
          </p>
        </section>

        <div className="flex items-start gap-3">
          <input
            id="registro-autorizacion"
            type="checkbox"
            className="mt-1 h-5 w-5 accent-primary"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <label htmlFor="registro-autorizacion" className="font-medium">
            Autorizo de forma expresa el tratamiento de mis datos personales según el
            aviso de privacidad. (Obligatorio para crear la cuenta)
          </label>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={!consent || loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        {!consent && (
          <p className="text-sm text-gray-600" role="note">
            Debes marcar la autorización de datos para poder registrarte.
          </p>
        )}
      </form>

      <p className="text-center">
        ¿Ya tienes cuenta?{' '}
        <Link to="/ingresar" className="font-semibold text-primary-dark underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
