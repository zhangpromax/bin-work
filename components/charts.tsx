'use client';

const C = '#FF8C5A';

export interface Pt { l: string; v: number }

export function SvgBar({ data }: { data: Pt[] }) {
  const w = 340, h = 150, pad = 24;
  const n = data.length || 1;
  const max = Math.max(1, ...data.map((d) => d.v));
  const bw = Math.max(8, ((w - pad * 2) / n) * 0.6);
  const gap = (w - pad * 2) / n;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const bh = max ? (d.v / max) * (h - pad * 2) : 0;
        const x = pad + gap * i + (gap - bw) / 2;
        const y = h - pad - bh;
        return (
          <g key={i}>
            <rect x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)} rx={3} fill={C} />
            <text x={(x + bw / 2).toFixed(1)} y={(y - 3).toFixed(1)} fontSize={9} fill="#888" textAnchor="middle">{d.v || ''}</text>
            <text x={(x + bw / 2).toFixed(1)} y={h - 6} fontSize={9} fill="#aaa" textAnchor="middle">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SvgLine({ data }: { data: Pt[] }) {
  const w = 340, h = 150, pad = 28;
  const n = data.length || 1;
  const max = Math.max(0.1, ...data.map((d) => d.v));
  const min = Math.min(0, ...data.map((d) => d.v));
  const span = Math.max(0.1, max - min);
  const bw = (w - pad * 2) / (n - 1 || 1);
  const pts = data.map((d, i) => {
    const x = pad + bw * i;
    const y = h - pad - ((d.v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const poly = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const step = Math.ceil(n / 5 || 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet">
      <polyline points={poly} fill="none" stroke={C} strokeWidth={2} />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={3} fill={C} />
          {(i === 0 || i === pts.length - 1) && (
            <text x={p[0].toFixed(1)} y={(p[1] - 6).toFixed(1)} fontSize={9} fill="#888" textAnchor="middle">{data[i].v}</text>
          )}
          {(i % step === 0 || i === n - 1) && (
            <text x={pad + bw * i} y={h - 6} fontSize={9} fill="#aaa" textAnchor="middle">{data[i].l}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export interface Seg { label: string; v: number; color: string }

import { t, getLang } from '../lib/i18n';

export function SvgDonut({ segs }: { segs: Seg[] }) {
  const total = segs.reduce((a, b) => a + b.v, 0) || 1;
  const r = 50;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      {total <= 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#eee" strokeWidth="16" />}
      {total > 0 && segs.map((sg, i) => {
        const len = (sg.v / total) * c;
        const el = (
          <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={sg.color} strokeWidth="16"
            strokeDasharray={`${len.toFixed(2)} ${(c - len).toFixed(2)}`} strokeDashoffset={(-off).toFixed(2)}
            transform="rotate(-90 60 60)" />
        );
        off += len;
        return el;
      })}
      <text x="60" y="58" fontSize={14} fill="#333" textAnchor="middle" fontWeight={700}>{total}</text>
      <text x="60" y="74" fontSize={10} fill="#999" textAnchor="middle">{getLang() === 'zh' ? '总计' : 'total'}</text>
    </svg>
  );
}
