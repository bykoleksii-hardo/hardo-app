import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  size?: Size;
  href?: string | null;
  className?: string;
};

const sizes: Record<Size, { gap: string; svg: number; word: string }> = {
  sm: { gap: 'gap-2', svg: 16, word: 'text-[13px]' },
  md: { gap: 'gap-2.5', svg: 18, word: 'text-[15px]' },
  lg: { gap: 'gap-3', svg: 22, word: 'text-[19px]' },
};

function Mark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      width={size}
      height={size}
      aria-hidden
    >
      <path d="M5 4v16M5 8h2M5 14h2M12 2v20M12 6h2.5M12 10h2.5M12 16h2.5M19 7v13M19 11h2M19 17h2" />
    </svg>
  );
}

export default function Brand({ size = 'md', href = '/', className = '' }: Props) {
  const s = sizes[size];
  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <Mark size={s.svg} />
      <span className={`font-serif uppercase tracking-[0.18em] font-medium ${s.word}`}>
        HARDO
      </span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center hover:text-gold transition-colors">
      {inner}
    </Link>
  );
}
