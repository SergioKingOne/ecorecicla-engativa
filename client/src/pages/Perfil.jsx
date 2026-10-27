import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';

/** RF-18: profile with the Ley 1581 revocation option (deactivates the account). */
export default function Perfil() {
  const { user, revokeAuthorization } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setError('');
    setLoading(true);
    try {
      await revokeAuthorization();
      navigate('/', {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const fechaAutorizacion = user.fecha_autorizacion
    ? new Date(user.fecha_autorizacion).toLocaleString('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-dark">Mi perfil</h1>

      <div className="card space-y-2">
        <p>
          <strong>Nombre:</strong> {user.nombre}
        </p>
        <p>
          <strong>Correo:</strong> {user.email}
        </p>
        <p>
          <strong>Rol:</strong> {user.rol}
        </p>
        {user.barrio_aproximado && (
          <p>
            <strong>Barrio aproximado:</strong> {user.barrio_aproximado}
          </p>
        )}
        {fechaAutorizacion && (
          <p className="text-sm text-gray-600">
            Autorizaste el tratamiento de tus datos el {fechaAutorizacion}.
          </p>
        )}
      </div>

      <section aria-labelledby="titulo-revocatoria" className="card space-y-3 border-red-200">
        <h2 id="titulo-revocatoria" className="text-lg font-bold text-red-800">
          Revocar autorización de datos
        </h2>
        <p className="text-gray-700">
          Al revocar tu autorización (Ley 1581 de 2012) dejaremos de tratar tus datos
          personales y tu cuenta quedará <strong>desactivada</strong>.
        </p>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        <button
          type="button"
          className="rounded-lg border border-red-700 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50"
          onClick={() => setShowConfirm(true)}
        >
          Revocar autorización y desactivar mi cuenta
        </button>
      </section>

      {showConfirm && (
        <Modal title="¿Revocar tu autorización?" onClose={() => setShowConfirm(false)}>
          <p className="mb-4">
            Esta acción desactivará tu cuenta de inmediato y cerrará tu sesión. Podrás
            pedir la reactivación contactando al equipo del proyecto.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-red-700 px-4 py-2.5 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              onClick={handleRevoke}
              disabled={loading}
            >
              {loading ? 'Revocando…' : 'Sí, revocar'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowConfirm(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
