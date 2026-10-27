import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../components/Layout.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const usuario = await login(email, password);
      navigate(dashboardPath(usuario.rol));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-dark">Ingresar</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block font-semibold">
            Correo electrónico
          </label>
          <input
            id="login-email"
            type="email"
            className="input-field"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block font-semibold">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            className="input-field"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="text-center">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-primary-dark underline">
          Regístrate como hogar
        </Link>
      </p>
    </div>
  );
}
