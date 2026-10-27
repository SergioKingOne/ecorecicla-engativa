import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import BagBadge from '../components/BagBadge.jsx';
import WasteCard from '../components/WasteCard.jsx';

/** RF-02: browsable catalog for one of the three color-code categories. */
export default function Categoria() {
  const { id } = useParams();
  const [categoria, setCategoria] = useState(null);
  const [residuos, setResiduos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/categorias'), api.get(`/residuos?categoria=${id}`)])
      .then(([categorias, busqueda]) => {
        const found = categorias.find((item) => String(item.id) === String(id));
        if (!found) {
          setError('La categoría no existe.');
          return;
        }
        setCategoria(found);
        setResiduos(busqueda.resultados);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
        {error}
      </p>
    );
  }
  if (!categoria) {
    return (
      <p role="status" className="text-gray-600">
        Cargando…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{categoria.nombre}</h1>
      <BagBadge colorBolsa={categoria.color_bolsa} categoria={categoria.nombre} size="lg" />
      <p className="text-gray-700">{categoria.descripcion}</p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {residuos.map((residuo) => (
          <li key={residuo.id}>
            <WasteCard residuo={residuo} />
          </li>
        ))}
      </ul>

      <Link to="/" className="inline-block font-semibold text-primary-dark underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}
