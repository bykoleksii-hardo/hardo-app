import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<Size, { mark: number; word: string; gap: string; spacing: string }> = {
  sm: { mark: 18, word: 'text-base', gap: 'gap-2.5', spacing: 'tracking-[0.18em]' },
  md: { mark: 22, word: 'text-xl', gap: 'gap-3', spacing: 'tracking-[0.18em]' },
  lg: { mark: 28, word: 'text-2xl', gap: 'gap-3', spacing: 'tracking-[0.18em]' },
};

type Props = {
  size?: Size;
  href?: string | null;
  className?: string;
  /** When false, renders as a plain span (no link). Default: true. */
  link?: boolean;
};

export default function Brand({ size = 'md', href = '/', className = '', link = true }: Props) {
  const s = SIZE_MAP[size];

  const inner = (
    <span className={`inline-flex items-center ${s.gap} text-[#f5efe2] ${className}`}>
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        aria-hidden="true"
      >
        <rect x={4} y={4} width={16} height={16} rx={2} />
        <path d="M9 8v8M9 12h6M15 8v8" />
      </svg>
      <span className={`font-serif ${s.word} ${s.spacing} font-medium uppercase`}>HARDO</span>
    </span>
  );

  if (!link || !href) return inner;

  return (
    <Link href={href} className="inline-flex items-center hover:text-[#d4a04a] transition-colors" aria-label="HARDO home">
      {inner}
    </Link>
  );
}
