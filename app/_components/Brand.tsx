import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  size?: Size;
  href?: string | null;
  className?: string;
};

const sizes: Record<Size, { gap: string; svg: number; word: string }> = {
  sm: { gap: 'gap-2', svg: 18, word: 'text-[13px]' },
  md: { gap: 'gap-2.5', svg: 22, word: 'text-[14.5px]' },
  lg: { gap: 'gap-3', svg: 28, word: 'text-[18px]' },
};

function Mark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      aria-hidden
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="1.2" />
      <path d="M8.5 7v10M15.5 7v10M8.5 12h7" />
    </svg>
  );
}

export default function Brand({ size = 'md', href = '/', className = '' }: Props) {
  const s = sizes[size];
  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <Mark size={s.svg} />
      <span
        className={`font-serif font-medium tracking-[0.18em] uppercase ${s.word}`}
      >
        HARDO
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link
      href={href}
      className="inline-flex items-center hover:text-gold transition-colors"
    >
      {inner}
    </Link>
  );
}
