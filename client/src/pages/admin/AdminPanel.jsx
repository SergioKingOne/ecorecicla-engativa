import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import BagBadge from '../../components/BagBadge.jsx';

/** RF-17: admin panel — waste/points/routes CRUD + organization verification (RF-11). */
const TABS = [
  { id: 'residuos', label: 'Residuos' },
  { id: 'puntos', label: 'Puntos' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'organizaciones', label: 'Organizaciones' },
];

function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('residuos');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function notify(text) {
    setMessage(text);
    setError('');
  }

  function fail(err) {
    setError(err.message);
    setMessage('');
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-primary-dark">Panel administrativo</h1>

      <div role="tablist" aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 font-semibold ${
              tab === item.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => {
              setTab(item.id);
              setError('');
              setMessage('');
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-primary-light p-3 font-semibold text-primary-dark">
          {message}
        </p>
      )}

      {tab === 'residuos' && <ResiduosAdmin notify={notify} fail={fail} />}
      {tab === 'puntos' && <PuntosAdmin notify={notify} fail={fail} />}
      {tab === 'rutas' && <RutasAdmin notify={notify} fail={fail} />}
      {tab === 'organizaciones' && <OrganizacionesAdmin notify={notify} fail={fail} />}
    </div>
  );
}

// ---------------------------------------------------------------- Residuos

function ResiduosAdmin({ notify, fail }) {
  const [residuos, setResiduos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} | residuo

  const load = useCallback(() => {
    Promise.all([api.get('/residuos'), api.get('/categorias')])
      .then(([busqueda, cats]) => {
        setResiduos(busqueda.resultados);
        setCategorias(cats);
      })
      .catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      nombre: formData.get('nombre'),
      categoria_id: Number(formData.get('categoria_id')),
      preparacion_previa: formData.get('preparacion_previa'),
      error_frecuente: formData.get('error_frecuente'),
      sinonimos: String(formData.get('sinonimos') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      if (editing?.id) {
        await api.put(`/admin/residuos/${editing.id}`, payload);
        notify('Residuo actualizado.');
      } else {
        await api.post('/admin/residuos', payload);
        notify('Residuo creado.');
      }
      setEditing(null);
      load();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDelete(residuo) {
    if (!window.confirm(`¿Eliminar «${residuo.nombre}» del catálogo?`)) return;
    try {
      await api.delete(`/admin/residuos/${residuo.id}`);
      notify('Residuo eliminado.');
      load();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <section aria-label="Gestión de residuos" className="space-y-3">
      <button type="button" className="btn-primary" onClick={() => setEditing({})}>
        + Nuevo residuo
      </button>
      <ul className="space-y-2">
        {residuos.map((residuo) => (
          <li key={residuo.id} className="card flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-3 font-semibold">
              {residuo.nombre} <BagBadge colorBolsa={residuo.color_bolsa} />
            </span>
            <span className="flex gap-3 text-sm font-semibold">
              <button type="button" className="text-primary-dark underline" onClick={() => setEditing(residuo)}>
                Editar
              </button>
              <button type="button" className="text-red-700 underline" onClick={() => handleDelete(residuo)}>
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <Modal
          title={editing.id ? `Editar: ${editing.nombre}` : 'Nuevo residuo'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={handleSave} className="space-y-3">
            <Field id="residuo-nombre" label="Nombre">
              <input
                id="residuo-nombre"
                name="nombre"
                className="input-field"
                required
                minLength={2}
                defaultValue={editing.nombre || ''}
              />
            </Field>
            <Field id="residuo-categoria" label="Categoría">
              <select
                id="residuo-categoria"
                name="categoria_id"
                className="input-field"
                required
                defaultValue={editing.categoria_id || ''}
              >
                <option value="">Selecciona…</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre} (bolsa {categoria.color_bolsa})
                  </option>
                ))}
              </select>
            </Field>
            <Field id="residuo-preparacion" label="Preparación previa">
              <textarea
                id="residuo-preparacion"
                name="preparacion_previa"
                className="input-field"
                rows={2}
                required
                defaultValue={editing.preparacion_previa || ''}
              />
            </Field>
            <Field id="residuo-error" label="Error frecuente">
              <textarea
                id="residuo-error"
                name="error_frecuente"
                className="input-field"
                rows={2}
                required
                defaultValue={editing.error_frecuente || ''}
              />
            </Field>
            <Field id="residuo-sinonimos" label="Sinónimos (separados por coma)">
              <input
                id="residuo-sinonimos"
                name="sinonimos"
                className="input-field"
                defaultValue={(editing.sinonimos || []).join(', ')}
              />
            </Field>
            <button type="submit" className="btn-primary w-full">
              Guardar
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Puntos

function PuntosAdmin({ notify, fail }) {
  const [puntos, setPuntos] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    api.get('/puntos').then(setPuntos).catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      nombre: formData.get('nombre'),
      tipo: formData.get('tipo'),
      lat: Number(formData.get('lat')),
      lng: Number(formData.get('lng')),
      direccion: formData.get('direccion'),
      horario: formData.get('horario'),
      materiales_aceptados: String(formData.get('materiales') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      if (editing?.id) {
        await api.put(`/admin/puntos/${editing.id}`, payload);
        notify('Punto actualizado.');
      } else {
        await api.post('/admin/puntos', payload);
        notify('Punto creado.');
      }
      setEditing(null);
      load();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDelete(punto) {
    if (!window.confirm(`¿Eliminar «${punto.nombre}»?`)) return;
    try {
      await api.delete(`/admin/puntos/${punto.id}`);
      notify('Punto eliminado.');
      load();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <section aria-label="Gestión de puntos de reciclaje" className="space-y-3">
      <button type="button" className="btn-primary" onClick={() => setEditing({})}>
        + Nuevo punto
      </button>
      <ul className="space-y-2">
        {puntos.map((punto) => (
          <li key={punto.id} className="card flex flex-wrap items-center justify-between gap-2">
            <span>
              <span className="font-semibold">{punto.nombre}</span>{' '}
              <span className="text-sm text-gray-600">({punto.tipo})</span>
            </span>
            <span className="flex gap-3 text-sm font-semibold">
              <button type="button" className="text-primary-dark underline" onClick={() => setEditing(punto)}>
                Editar
              </button>
              <button type="button" className="text-red-700 underline" onClick={() => handleDelete(punto)}>
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <Modal
          title={editing.id ? `Editar: ${editing.nombre}` : 'Nuevo punto'}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={handleSave} className="space-y-3">
            <Field id="punto-nombre" label="Nombre">
              <input id="punto-nombre" name="nombre" className="input-field" required defaultValue={editing.nombre || ''} />
            </Field>
            <Field id="punto-tipo" label="Tipo">
              <select id="punto-tipo" name="tipo" className="input-field" required defaultValue={editing.tipo || 'punto'}>
                <option value="punto">Punto de reciclaje</option>
                <option value="estacion">Estación de clasificación</option>
                <option value="chatarreria">Chatarrería</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="punto-lat" label="Latitud">
                <input id="punto-lat" name="lat" type="number" step="any" className="input-field" required defaultValue={editing.lat ?? ''} />
              </Field>
              <Field id="punto-lng" label="Longitud">
                <input id="punto-lng" name="lng" type="number" step="any" className="input-field" required defaultValue={editing.lng ?? ''} />
              </Field>
            </div>
            <Field id="punto-direccion" label="Dirección">
              <input id="punto-direccion" name="direccion" className="input-field" defaultValue={editing.direccion || ''} />
            </Field>
            <Field id="punto-horario" label="Horario">
              <input id="punto-horario" name="horario" className="input-field" defaultValue={editing.horario || ''} />
            </Field>
            <Field id="punto-materiales" label="Materiales aceptados (separados por coma)">
              <input id="punto-materiales" name="materiales" className="input-field" defaultValue={(editing.materiales_aceptados || []).join(', ')} />
            </Field>
            <button type="submit" className="btn-primary w-full">
              Guardar
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Rutas

function RutasAdmin({ notify, fail }) {
  const [rutas, setRutas] = useState([]);
  const [upzList, setUpzList] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    Promise.all([api.get('/rutas'), api.get('/upz')])
      .then(([rutasData, upzData]) => {
        setRutas(rutasData);
        setUpzList(upzData);
      })
      .catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function handleSave(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      upz_id: Number(formData.get('upz_id')),
      dia_semana: formData.get('dia_semana'),
      franja_horaria: formData.get('franja_horaria'),
      operador: formData.get('operador'),
    };
    try {
      if (editing?.id) {
        await api.put(`/admin/rutas/${editing.id}`, payload);
        notify('Ruta actualizada.');
      } else {
        await api.post('/admin/rutas', payload);
        notify('Ruta creada.');
      }
      setEditing(null);
      load();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDelete(ruta) {
    if (!window.confirm(`¿Eliminar la ruta de ${ruta.upz_nombre}?`)) return;
    try {
      await api.delete(`/admin/rutas/${ruta.id}`);
      notify('Ruta eliminada.');
      load();
    } catch (err) {
      fail(err);
    }
  }

  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <section aria-label="Gestión de rutas" className="space-y-3">
      <button type="button" className="btn-primary" onClick={() => setEditing({})}>
        + Nueva ruta
      </button>
      <ul className="space-y-2">
        {rutas.map((ruta) => (
          <li key={ruta.id} className="card flex flex-wrap items-center justify-between gap-2">
            <span>
              <span className="font-semibold">{ruta.upz_nombre}</span>{' '}
              <span className="text-sm text-gray-600">
                — {ruta.dia_semana}, {ruta.franja_horaria}
              </span>
            </span>
            <span className="flex gap-3 text-sm font-semibold">
              <button type="button" className="text-primary-dark underline" onClick={() => setEditing(ruta)}>
                Editar
              </button>
              <button type="button" className="text-red-700 underline" onClick={() => handleDelete(ruta)}>
                Eliminar
              </button>
            </span>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <Modal title={editing.id ? 'Editar ruta' : 'Nueva ruta'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field id="ruta-upz" label="UPZ">
              <select id="ruta-upz" name="upz_id" className="input-field" required defaultValue={editing.upz_id || ''}>
                <option value="">Selecciona…</option>
                {upzList.map((upz) => (
                  <option key={upz.id} value={upz.id}>
                    {upz.nombre} (UPZ {upz.codigo})
                  </option>
                ))}
              </select>
            </Field>
            <Field id="ruta-dia" label="Día de la semana">
              <select id="ruta-dia" name="dia_semana" className="input-field" required defaultValue={editing.dia_semana || ''}>
                <option value="">Selecciona…</option>
                {DIAS.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="ruta-franja" label="Franja horaria">
              <input
                id="ruta-franja"
                name="franja_horaria"
                className="input-field"
                required
                placeholder="Ej.: 6:00 a. m. – 10:00 a. m."
                defaultValue={editing.franja_horaria || ''}
              />
            </Field>
            <Field id="ruta-operador" label="Operador">
              <input id="ruta-operador" name="operador" className="input-field" defaultValue={editing.operador || ''} />
            </Field>
            <button type="submit" className="btn-primary w-full">
              Guardar
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Organizaciones

function OrganizacionesAdmin({ notify, fail }) {
  const [organizaciones, setOrganizaciones] = useState([]);

  const load = useCallback(() => {
    api.get('/admin/organizaciones').then(setOrganizaciones).catch(fail);
  }, [fail]);

  useEffect(load, [load]);

  async function handleVerify(organizacion) {
    try {
      await api.patch(`/admin/organizaciones/${organizacion.id}/verificar`);
      notify(`Organización «${organizacion.nombre}» verificada.`);
      load();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <section aria-label="Verificación de organizaciones" className="space-y-3">
      {organizaciones.map((organizacion) => (
        <div key={organizacion.id} className="card space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">{organizacion.nombre}</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold uppercase ${
                organizacion.estado === 'verificada'
                  ? 'bg-primary-light text-primary-dark'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {organizacion.estado}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            NIT {organizacion.nit} · Tel. {organizacion.telefono || 'no registrado'} ·{' '}
            {organizacion.total_recicladores} reciclador(es)
          </p>
          {organizacion.estado === 'pendiente' && (
            <button type="button" className="btn-primary" onClick={() => handleVerify(organizacion)}>
              ✓ Verificar organización
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
