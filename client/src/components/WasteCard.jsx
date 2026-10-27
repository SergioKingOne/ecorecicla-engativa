import { Link } from 'react-router-dom';
import BagBadge from './BagBadge.jsx';

export default function WasteCard({ residuo }) {
  return (
    <Link
      to={`/residuos/${residuo.id}`}
      className="card flex items-center justify-between gap-3 hover:border-primary"
    >
      <span className="font-semibold">{residuo.nombre}</span>
      <BagBadge colorBolsa={residuo.color_bolsa} />
    </Link>
  );
}
