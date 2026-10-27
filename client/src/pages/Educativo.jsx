import { Link } from 'react-router-dom';
import BagBadge from '../components/BagBadge.jsx';

/** RF-04: educational module about the national color code (no signup needed). */
const BAGS = [
  {
    color: 'blanca',
    nombre: 'Aprovechables',
    ejemplos: 'Plástico, vidrio, metales, papel, cartón y tetrapak.',
    clave: 'Todo debe estar limpio y seco. Un residuo sucio contamina la bolsa completa.',
  },
  {
    color: 'verde',
    nombre: 'Orgánicos',
    ejemplos: 'Restos de comida, cáscaras, borra de café y residuos de poda y jardín.',
    clave: 'Sin bolsas plásticas pequeñas adentro: arruinan el compostaje.',
  },
  {
    color: 'negra',
    nombre: 'No aprovechables',
    ejemplos: 'Papel higiénico, servilletas usadas, icopor, colillas y residuos sanitarios.',
    clave: 'Es la bolsa del «no se puede recuperar». Si dudas, primero busca en la guía.',
  },
];

export default function Educativo() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold text-primary-dark">
          El código de colores, explicado fácil
        </h1>
        <p className="text-gray-700">
          Desde 2021, toda Colombia separa los residuos en 3 bolsas según la{' '}
          <strong>Resolución 2184 de 2019</strong>. Separar bien en casa es el primer
          eslabón para que los recicladores de oficio puedan aprovechar el material.
        </p>
      </header>

      <section aria-label="Las tres bolsas" className="space-y-4">
        {BAGS.map((bag) => (
          <div key={bag.color} className="card space-y-2">
            <BagBadge colorBolsa={bag.color} categoria={bag.nombre} size="lg" />
            <p>
              <strong>Qué va aquí:</strong> {bag.ejemplos}
            </p>
            <p className="rounded-lg bg-primary-light p-2 text-primary-dark">
              <strong>La clave:</strong> {bag.clave}
            </p>
          </div>
        ))}
      </section>

      <section aria-labelledby="titulo-por-que" className="space-y-2">
        <h2 id="titulo-por-que" className="text-2xl font-bold">
          ¿Por qué importa en Engativá?
        </h2>
        <ul className="list-inside list-disc space-y-1 text-gray-800">
          <li>
            La mayoría del material aprovechable se pierde cuando se mezcla con residuos
            húmedos u ordinarios.
          </li>
          <li>
            4 de cada 5 hogares botan el tetrapak en la bolsa negra, aunque es
            aprovechable si se enjuaga y aplana.
          </li>
          <li>
            La bolsa blanca bien separada se convierte en ingreso formal para las
            organizaciones de recicladores (Decreto 596 de 2016).
          </li>
        </ul>
      </section>

      <section aria-labelledby="titulo-casos" className="space-y-2">
        <h2 id="titulo-casos" className="text-2xl font-bold">
          Los 3 casos que más confunden
        </h2>
        <ol className="list-inside list-decimal space-y-1 text-gray-800">
          <li>
            <strong>Tetrapak:</strong> bolsa blanca, enjuagado y aplanado.
          </li>
          <li>
            <strong>Icopor:</strong> bolsa negra en Bogotá — no tiene cadena de
            aprovechamiento local.
          </li>
          <li>
            <strong>Aceite de cocina usado:</strong> nunca al desagüe ni a una bolsa;
            envásalo y llévalo a un punto limpio.
          </li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">
          Probar el buscador
        </Link>
        <Link to="/mapa" className="btn-secondary">
          Ver puntos de reciclaje
        </Link>
      </div>
    </article>
  );
}
