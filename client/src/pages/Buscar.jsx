import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import SearchBox from '../components/SearchBox.jsx';
import WasteCard from '../components/WasteCard.jsx';

/** RF-01: search results; when nothing matches, closest suggestion + "sugerir residuo" form. */
export default function Buscar() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');

  useEffect(() => {
    if (!query) return;
    setData(null);
    setError('');
    setSuggestionSent(false);
    api
      .get(`/residuos?buscar=${encodeURIComponent(query)}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [query]);

  async function handleSuggest(event) {
    event.preventDefault();
    try {
      await api.post('/residuos/sugerencias', { nombre: query, descripcion: suggestionText });
      setSuggestionSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <SearchBox />
      <h1 className="text-2xl font-bold">
        Resultados para «{query}»
      </h1>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {!data && !error && (
        <p role="status" className="text-gray-600">
          Buscando…
        </p>
      )}

      {data && data.resultados.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.resultados.map((residuo) => (
            <li key={residuo.id}>
              <WasteCard residuo={residuo} />
            </li>
          ))}
        </ul>
      )}

      {data && data.resultados.length === 0 && (
        <div className="space-y-4">
          {data.sugerencia && (
            <div className="card space-y-3">
              <p className="font-semibold">{data.sugerencia.mensaje}</p>
              <WasteCard residuo={data.sugerencia.residuo} />
            </div>
          )}

          <div className="card space-y-3">
            <h2 className="text-lg font-bold">¿No era lo que buscabas? Sugiérenos este residuo</h2>
            {suggestionSent ? (
              <p role="status" className="rounded-lg bg-primary-light p-3 font-semibold text-primary-dark">
                ¡Gracias! Revisaremos «{query}» para incluirlo en la guía.
              </p>
            ) : (
              <form onSubmit={handleSuggest} className="space-y-3">
                <div>
                  <label htmlFor="descripcion-sugerencia" className="mb-1 block font-medium">
                    Cuéntanos qué es «{query}» (opcional)
                  </label>
                  <textarea
                    id="descripcion-sugerencia"
                    className="input-field"
                    rows={2}
                    maxLength={300}
                    value={suggestionText}
                    onChange={(event) => setSuggestionText(event.target.value)}
                  />
                </div>
                <button type="submit" className="btn-secondary">
                  Enviar sugerencia
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Link to="/" className="inline-block font-semibold text-primary-dark underline">
        ← Volver al inicio
      </Link>
    </div>
  );
}
