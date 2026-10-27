import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { api } from '../api/client.js';

// Default marker assets bundled by Vite (no CDN — zero cost, CSP friendly).
// Leaflet's URL auto-detection breaks under bundlers; it must be removed first.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// RF-05: fallback when the user denies geolocation — center of Engativá.
const ENGATIVA_CENTER = { lat: 4.711, lng: -74.113 };

const TIPO_LABELS = {
  punto: 'Punto de reciclaje',
  estacion: 'Estación de clasificación',
  chatarreria: 'Chatarrería',
};

export default function Mapa() {
  const [origin, setOrigin] = useState(ENGATIVA_CENTER);
  const [usingFallback, setUsingFallback] = useState(true);
  const [puntos, setPuntos] = useState([]);
  const [material, setMaterial] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setUsingFallback(false);
      },
      () => setUsingFallback(true),
      { timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ lat: origin.lat, lng: origin.lng });
    if (material) params.set('material', material);
    api
      .get(`/puntos?${params.toString()}`)
      .then(setPuntos)
      .catch((err) => setError(err.message));
  }, [origin, material]);

  const materialOptions = useMemo(() => {
    const all = new Set();
    puntos.forEach((punto) => punto.materiales_aceptados.forEach((item) => all.add(item)));
    if (material) all.add(material);
    return [...all].sort((a, b) => a.localeCompare(b, 'es'));
  }, [puntos, material]);

  function directionsLinks(punto) {
    return {
      osm: `https://www.openstreetmap.org/directions?to=${punto.lat}%2C${punto.lng}`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${punto.lat},${punto.lng}`,
    };
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold text-primary-dark">Puntos de reciclaje</h1>
      <p className="text-gray-700">
        {usingFallback
          ? 'Mostrando puntos cerca del centro de Engativá. Permite la ubicación para ordenarlos según tu posición.'
          : 'Puntos ordenados según tu ubicación actual.'}
      </p>

      <div className="max-w-sm">
        <label htmlFor="filtro-material" className="mb-1 block font-semibold">
          Filtrar por material aceptado
        </label>
        <select
          id="filtro-material"
          className="input-field"
          value={material}
          onChange={(event) => setMaterial(event.target.value)}
        >
          <option value="">Todos los materiales</option>
          {materialOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-300" aria-hidden="true">
        <MapContainer
          center={[origin.lat, origin.lng]}
          zoom={13}
          style={{ height: '55vh', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {puntos.map((punto) => {
            const links = directionsLinks(punto);
            return (
              <Marker key={punto.id} position={[punto.lat, punto.lng]}>
                <Popup>
                  <strong>{punto.nombre}</strong>
                  <br />
                  {TIPO_LABELS[punto.tipo]} · a {punto.distancia_km} km
                  <br />
                  {punto.direccion}
                  <br />
                  <a href={links.google} target="_blank" rel="noreferrer">
                    Cómo llegar
                  </a>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <section aria-label="Lista de puntos de reciclaje" className="space-y-3">
        {puntos.map((punto) => {
          const links = directionsLinks(punto);
          return (
            <div key={punto.id} className="card space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">{punto.nombre}</h2>
                <span className="text-sm font-semibold text-primary-dark">
                  a {punto.distancia_km} km
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {TIPO_LABELS[punto.tipo]} · {punto.direccion}
              </p>
              <p className="text-sm text-gray-600">Horario: {punto.horario}</p>
              <p className="text-sm">
                <strong>Recibe:</strong> {punto.materiales_aceptados.join(', ')}
              </p>
              <p className="flex gap-3 pt-1 text-sm font-semibold">
                <a
                  className="text-primary-dark underline"
                  href={links.google}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cómo llegar (Google Maps)
                </a>
                <a
                  className="text-primary-dark underline"
                  href={links.osm}
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenStreetMap
                </a>
              </p>
            </div>
          );
        })}
        {puntos.length === 0 && !error && (
          <p role="status" className="card">
            No encontramos puntos con ese filtro.
          </p>
        )}
      </section>
    </div>
  );
}
