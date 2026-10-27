import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import BagBadge from './BagBadge.jsx';

const MIN_CHARS = 3;
const DEBOUNCE_MS = 250;

/**
 * RF-01: main search with autocomplete from 3 characters.
 * Selecting a suggestion opens the ficha directly (≤ 3 interactions).
 */
export default function SearchBox({ autoFocus = false }) {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const query = term.trim();
    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/residuos?buscar=${encodeURIComponent(query)}`);
        setSuggestions(data.resultados.slice(0, 8));
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const query = term.trim();
    if (!query) return;
    setOpen(false);
    navigate(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="buscador-residuos" className="mb-2 block text-lg font-semibold">
          Escribe un residuo, por ejemplo: «tetrapak», «icopor», «botella»
        </label>
        <div className="flex gap-2">
          <input
            id="buscador-residuos"
            type="search"
            className="input-field text-lg"
            placeholder="¿Qué quieres botar?"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            autoComplete="off"
            autoFocus={autoFocus}
          />
          <button type="submit" className="btn-primary shrink-0">
            Buscar
          </button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="sugerencias-busqueda"
          aria-label="Sugerencias de residuos"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {suggestions.map((residuo) => (
            <li key={residuo.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-primary-light"
                onClick={() => {
                  setOpen(false);
                  navigate(`/residuos/${residuo.id}`);
                }}
              >
                <span className="font-medium">{residuo.nombre}</span>
                <BagBadge colorBolsa={residuo.color_bolsa} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
