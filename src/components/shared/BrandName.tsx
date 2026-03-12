'use client';

/**
 * Handlebar mustache SVG matching the neon sign style.
 * Classic handlebar with center dip and upward-curling tips.
 */
function MustacheSVG({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 40"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left half of handlebar mustache */}
      <path d="
        M60 12
        C56 18, 48 24, 38 24
        C28 24, 18 20, 12 14
        C8 10, 4 6, 2 8
        C0 10, 2 16, 6 16
        C10 16, 12 14, 16 16
        C22 20, 34 30, 46 28
        C54 27, 58 22, 60 18
        Z
      " />
      {/* Right half of handlebar mustache (mirror) */}
      <path d="
        M60 12
        C64 18, 72 24, 82 24
        C92 24, 102 20, 108 14
        C112 10, 116 6, 118 8
        C120 10, 118 16, 114 16
        C110 16, 108 14, 104 16
        C98 20, 86 30, 74 28
        C66 27, 62 22, 60 18
        Z
      " />
    </svg>
  );
}

/**
 * MAN OF CAVE brand text with mustache decoration on the "A" in MAN.
 * Matches the neon sign design where "A" has a handlebar mustache.
 */
export function BrandName({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeMap = {
    sm: { text: 'text-lg', mustacheW: 'w-[18px]', bottom: '-bottom-[3px]' },
    md: { text: 'text-xl', mustacheW: 'w-[22px]', bottom: '-bottom-[4px]' },
    lg: { text: 'text-3xl', mustacheW: 'w-[30px]', bottom: '-bottom-[5px]' },
    xl: { text: 'text-4xl', mustacheW: 'w-[38px]', bottom: '-bottom-[6px]' },
  };

  const s = sizeMap[size];

  return (
    <span className={`font-cinzel font-bold tracking-tight ${s.text} ${className}`}>
      M
      <span className="relative inline-block">
        A
        <MustacheSVG className={`absolute left-1/2 -translate-x-1/2 ${s.bottom} ${s.mustacheW}`} />
      </span>
      N OF CAVE
    </span>
  );
}

/**
 * Inline mustache "A" for use inside existing text.
 * Renders just the letter A with mustache decoration below it.
 */
export function MustacheA({ className = '' }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      A
      <MustacheSVG className="absolute left-1/2 -translate-x-1/2 -bottom-[18%] w-[140%]" />
    </span>
  );
}
