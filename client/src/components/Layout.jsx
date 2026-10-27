import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function dashboardPath(rol) {
  if (rol === 'hogar') return '/hogar';
  if (rol === 'reciclador') return '/reciclador';
  if (rol === 'admin') return '/admin';
  return '/';
}

const NAV_LINKS = [
  { to: '/', label: 'Guía' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/mi-ruta', label: 'Mi ruta' },
  { to: '/educativo', label: 'Aprende' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-primary-dark"
      >
        Saltar al contenido principal
      </a>

      <header className="bg-primary-dark text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-lg font-bold">
            ♻️ EcoRecicla <span className="font-normal">Engativá</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <Link
                  to={dashboardPath(user.rol)}
                  className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25"
                >
                  Mi panel
                </Link>
                <Link to="/perfil" className="underline-offset-2 hover:underline">
                  Perfil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="underline-offset-2 hover:underline"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/ingresar"
                className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
        <nav aria-label="Navegación principal" className="bg-primary">
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block whitespace-nowrap px-3 py-2 text-sm font-semibold text-white ${
                      isActive ? 'border-b-4 border-white' : 'hover:underline'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl space-y-1 px-4 py-4 text-sm text-gray-600">
          <p>
            Autores: Sergio Mauricio Robayo Rojas (investigador principal) y Jorge Iván Ávila
            Pinilla (coinvestigador).
          </p>
          <p>
            Proyecto de grado — UNAD, Ingeniería de Sistemas. Prototipo TRL5 sin fines
            comerciales.
          </p>
          <p>
            Tus datos se tratan según la Ley 1581 de 2012: solo pedimos barrio aproximado y
            puedes revocar tu autorización en el perfil.
          </p>
        </div>
      </footer>
    </div>
  );
}
