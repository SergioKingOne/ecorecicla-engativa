/**
 * Bag color band/badge. WCAG 2.1 criterion 1.4.1: the color is NEVER the only
 * channel — the bag name and category always appear as text.
 */
const BAG_STYLES = {
  blanca: {
    label: 'BOLSA BLANCA',
    className: 'bg-bag-white text-gray-900 border-2 border-gray-500',
  },
  verde: {
    label: 'BOLSA VERDE',
    className: 'bg-bag-green text-gray-950 border-2 border-green-900',
  },
  negra: {
    label: 'BOLSA NEGRA',
    className: 'bg-bag-black text-white border-2 border-gray-700',
  },
};

export default function BagBadge({ colorBolsa, categoria, size = 'sm' }) {
  const bag = BAG_STYLES[colorBolsa];
  if (!bag) return null;

  const sizeClasses =
    size === 'lg'
      ? 'w-full rounded-xl px-4 py-5 text-xl sm:text-2xl justify-center'
      : 'rounded-full px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-2 font-bold tracking-wide ${bag.className} ${sizeClasses}`}
    >
      {bag.label}
      {categoria ? <span className="font-semibold">— {categoria}</span> : null}
    </span>
  );
}
