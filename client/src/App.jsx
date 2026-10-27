import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Buscar from './pages/Buscar.jsx';
import ResiduoDetalle from './pages/ResiduoDetalle.jsx';
import Categoria from './pages/Categoria.jsx';
import Educativo from './pages/Educativo.jsx';
import MiRuta from './pages/MiRuta.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Perfil from './pages/Perfil.jsx';
import DashboardHogar from './pages/hogar/DashboardHogar.jsx';
import Agendar from './pages/hogar/Agendar.jsx';
import DashboardReciclador from './pages/reciclador/DashboardReciclador.jsx';
import AdminPanel from './pages/admin/AdminPanel.jsx';

// RNF-02: the map (Leaflet) loads only when the user visits /mapa.
const Mapa = lazy(() => import('./pages/Mapa.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/residuos/:id" element={<ResiduoDetalle />} />
        <Route path="/categorias/:id" element={<Categoria />} />
        <Route path="/educativo" element={<Educativo />} />
        <Route path="/mi-ruta" element={<MiRuta />} />
        <Route
          path="/mapa"
          element={
            <Suspense
              fallback={
                <p className="p-6 text-center" role="status">
                  Cargando mapa…
                </p>
              }
            >
              <Mapa />
            </Suspense>
          }
        />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hogar"
          element={
            <ProtectedRoute roles={['hogar']}>
              <DashboardHogar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hogar/agendar"
          element={
            <ProtectedRoute roles={['hogar']}>
              <Agendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reciclador"
          element={
            <ProtectedRoute roles={['reciclador']}>
              <DashboardReciclador />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
