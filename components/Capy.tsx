'use client';

/** 水豚噜噜 logo：复用 public/logo.png */
export function CapyLogo({ size = 40, round = false }: { size?: number; round?: boolean }) {
  return (
    <img
      src="/logo.png"
      alt="水豚噜噜"
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: round ? '50%' : '14px',
        flexShrink: 0,
      }}
    />
  );
}
