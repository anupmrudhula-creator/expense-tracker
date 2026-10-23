import type { LucideIcon } from 'lucide-react';

interface TileProps {
  icon: LucideIcon;
  color: string;
  size?: 'sm' | 'md';
}

// Rounded icon square with a soft tint of the accent colour.
export function Tile({ icon: Icon, color, size = 'md' }: TileProps) {
  const box = size === 'sm' ? 32 : 44;
  return (
    <span
      className={`tile tile-${size}`}
      style={{ background: `${color}1f`, color, width: box, height: box }}
      aria-hidden="true"
    >
      <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.2} />
    </span>
  );
}
