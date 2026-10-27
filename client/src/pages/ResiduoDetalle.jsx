import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import BagBadge from '../components/BagBadge.jsx';

/** RF-03: waste ficha — bag color WITH text, preparation and frequent error. */
export default function ResiduoDetalle() {
  const { id } = useParams();
  const [residuo, setResiduo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/residuos/${id}`)
      .then(setResiduo)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
        <Link to="/" className="font-semibold text-primary-dark underline">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  if (!residuo) {
    return (
      <p role="status" className="text-gray-600">
        Cargando…
      </p>
    );
  }

  return (
    <article className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-extrabold">{residuo.nombre}</h1>

      <BagBadge colorBolsa={residuo.color_bolsa} categoria={residuo.categoria} size="lg" />

      <section aria-labelledby="titulo-preparacion" className="card">
        <h2 id="titulo-preparacion" className="mb-1 text-lg font-bold">
          ✅ Preparación previa
        </h2>
        <p className="text-lg">{residuo.preparacion_previa}</p>
      </section>

      <section
        aria-labelledby="titulo-error"
        className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4"
      >
        <h2 id="titulo-error" className="mb-1 text-lg font-bold text-amber-900">
          ⚠️ Error frecuente
        </h2>
        <p className="text-lg text-amber-950">{residuo.error_frecuente}</p>
      </section>

      {residuo.sinonimos?.length > 0 && (
        <p className="text-sm text-gray-600">
          También conocido como: {residuo.sinonimos.join(', ')}.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to={`/categorias/${residuo.categoria_id}`} className="btn-secondary">
          Ver más {residuo.categoria.toLowerCase()}
        </Link>
        <Link to="/" className="btn-primary">
          Buscar otro residuo
        </Link>
      </div>
    </article>
  );
}
