import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import SearchBox from '../components/SearchBox.jsx';
import BagBadge from '../components/BagBadge.jsx';

// RF-01: direct shortcuts to the three most confusing items (diagnosis data).
const SHORTCUTS = [
  { label: 'Tetrapak', query: 'tetrapak', emoji: '🥛' },
  { label: 'Icopor', query: 'icopor', emoji: '🍱' },
  { label: 'Aceite usado', query: 'aceite de cocina usado', emoji: '🫗' },
];

const CATEGORY_CARD_STYLES = {
  blanca: 'bg-bag-white border-2 border-gray-500 text-gray-900',
  verde: 'bg-bag-green border-2 border-green-900 text-gray-950',
  negra: 'bg-bag-black border-2 border-gray-700 text-white',
};

export default function Home() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    api
      .get('/categorias')
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  return (
    <div className="space-y-8">
      <section aria-label="Buscador de residuos" className="space-y-4">
        <h1 className="text-3xl font-extrabold text-primary-dark sm:text-4xl">
          ¿En qué bolsa va?
        </h1>
        <p className="text-gray-700">
          Consulta gratis y sin registrarte cómo separar tus residuos en Engativá.
        </p>
        <SearchBox autoFocus />
      </section>

      <section aria-labelledby="titulo-atajos">
        <h2 id="titulo-atajos" className="mb-3 text-xl font-bold">
          Los que más nos confunden
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.query}
              to={`/buscar?q=${encodeURIComponent(shortcut.query)}`}
              className="card flex items-center gap-3 text-lg font-semibold hover:border-primary"
            >
              <span aria-hidden="true" className="text-2xl">
                {shortcut.emoji}
              </span>
              {shortcut.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="mb-3 text-xl font-bold">
          Las 3 bolsas del código de colores
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              to={`/categorias/${categoria.id}`}
              className={`rounded-xl p-4 shadow-sm hover:opacity-90 ${CATEGORY_CARD_STYLES[categoria.color_bolsa]}`}
            >
              <p className="text-lg font-extrabold uppercase">Bolsa {categoria.color_bolsa}</p>
              <p className="font-semibold">{categoria.nombre}</p>
              <p className="mt-1 text-sm opacity-90">{categoria.total_residuos} residuos en la guía</p>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Código de colores nacional según la Resolución 2184 de 2019.{' '}
          <Link to="/educativo" className="font-semibold text-primary-dark underline">
            Aprende cómo funciona
          </Link>
        </p>
      </section>

      <section aria-labelledby="titulo-servicios" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <h2 id="titulo-servicios" className="sr-only">
          Otros servicios
        </h2>
        <Link to="/mapa" className="card hover:border-primary">
          <p className="text-lg font-bold">🗺️ Puntos de reciclaje</p>
          <p className="text-gray-700">
            Encuentra puntos limpios, estaciones y chatarrerías cerca de ti.
          </p>
        </Link>
        <Link to="/mi-ruta" className="card hover:border-primary">
          <p className="text-lg font-bold">📅 Mi ruta de recolección</p>
          <p className="text-gray-700">
            Consulta el día y la hora de la ruta selectiva en tu UPZ.
          </p>
        </Link>
      </section>

      <section className="rounded-xl bg-primary-light p-4">
        <h2 className="text-lg font-bold text-primary-dark">
          ¿Tienes reciclaje acumulado?
        </h2>
        <p className="mb-3 text-gray-800">
          Agenda una recolección con recicladores de oficio de Engativá y aporta a su
          remuneración formal.
        </p>
        <Link to="/registro" className="btn-primary">
          Crear cuenta de hogar
        </Link>
      </section>
    </div>
  );
}
