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

export interface LineSeries { label: string; unit: string; color: string; data: Pt[] }

export function SvgMultiLine({ series }: { series: LineSeries[] }) {
  const w = 340, h = 170, pad = { top: 34, right: 44, bottom: 22, left: 34 };
  const all = series.filter((s) => s.data.length > 0);
  if (!all.length) return null;

  const labels = all[0].data.map((d) => d.l);
  const n = labels.length || 1;
  const bw = (w - pad.left - pad.right) / (n - 1 || 1);

  const scales = all.map((s) => {
    const vs = s.data.map((d) => d.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const span = Math.max(0.1, max - min);
    return { min, max, span };
  });

  const dots: { cx: number; cy: number; color: string; v: number }[] = [];
  const lines: { points: string; color: string }[] = [];

  all.forEach((s, si) => {
    const { min, span } = scales[si];
    const pts = s.data.map((d, i) => {
      const x = pad.left + bw * i;
      const y = h - pad.bottom - ((d.v - min) / span) * (h - pad.top - pad.bottom);
      return [x, y, d.v] as const;
    });
    lines.push({ points: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), color: s.color });
    pts.forEach((p) => dots.push({ cx: p[0], cy: p[1], color: s.color, v: p[2] }));
  });

  const step = Math.ceil(n / 5 || 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet">
      {/* 横向网格虚线 */}
      {[0, 1, 2].map((i) => {
        const y = pad.top + ((h - pad.top - pad.bottom) / 2) * i;
        return <line key={i} x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#EADFD4" strokeWidth={1} strokeDasharray="3 3" />;
      })}
      {/* 折线 */}
      {lines.map((ln, i) => (
        <polyline key={i} points={ln.points} fill="none" stroke={ln.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {/* 数据点 */}
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.cx.toFixed(1)} cy={d.cy.toFixed(1)} r={3} fill={d.color} stroke="#fff" strokeWidth={1.5} />
          {(i === dots.length - 1 || i === 0) && (
            <text x={d.cx.toFixed(1)} y={(d.cy - 6).toFixed(1)} fontSize={9} fill={d.color} textAnchor="middle" fontWeight={600}>{d.v}</text>
          )}
        </g>
      ))}
      {/* X 轴日期 */}
      {labels.map((l, i) => (i % step === 0 || i === n - 1) && (
        <text key={i} x={pad.left + bw * i} y={h - 6} fontSize={9} fill="#999" textAnchor="middle">{l}</text>
      ))}
      {/* 右侧单位标签 */}
      {all.map((s, i) => {
        const y = pad.top + 12 + i * 18;
        return (
          <g key={i}>
            <line x1={w - pad.right + 4} y1={y - 4} x2={w - 6} y2={y - 4} stroke={s.color} strokeWidth={2} />
            <text x={w - 6} y={y} fontSize={9} fill="#666" textAnchor="end" fontWeight={500}>{s.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** 独立 mini 折线图：每个指标单独一图，标题/单位/最新值/刻度/数值全显 */
export function SvgMiniLine({ label, unit, color, data }: LineSeries) {
  const w = 320, h = 110, pad = { top: 28, right: 16, bottom: 20, left: 44 };
  if (!data.length) return null;
  const vs = data.map((d) => d.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = Math.max(0.001, max - min);
  const n = data.length;
  const bw = (w - pad.left - pad.right) / (n - 1 || 1);
  const fmt = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1);

  const pts = data.map((d, i) => {
    const x = pad.left + bw * i;
    const y = h - pad.bottom - ((d.v - min) / span) * (h - pad.top - pad.bottom);
    return { x, y, v: d.v, l: d.l };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const step = Math.max(1, Math.ceil(n / 4));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* 标题区：标签 + 最新数值 */}
      <circle cx={12} cy={15} r={4} fill={color} />
      <text x={22} y={18} fontSize={12} fill="#5A3E2B" fontWeight={600}>{label}</text>
      <text x={w - 10} y={18} fontSize={12} fill={color} fontWeight={700} textAnchor="end">{`${fmt(last.v)} ${unit}`}</text>

      {/* 背景网格 */}
      <line x1={pad.left} y1={pad.top} x2={w - pad.right} y2={pad.top} stroke="#F0E6DA" strokeWidth={1} />
      <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="#F0E6DA" strokeWidth={1} />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="#F0E6DA" strokeWidth={1} />

      {/* 左右 Y 轴刻度 */}
      <text x={pad.left - 6} y={h - pad.bottom} fontSize={9} fill="#999" textAnchor="end" dominantBaseline="middle">{fmt(min)}</text>
      <text x={pad.left - 6} y={pad.top + 4} fontSize={9} fill="#999" textAnchor="end" dominantBaseline="middle">{fmt(max)}</text>
      <text x={pad.left - 6} y={(pad.top + h - pad.bottom) / 2 + 2} fontSize={9} fill="#999" textAnchor="end" dominantBaseline="middle">{fmt((min + max) / 2)}</text>

      {/* 折线 */}
      <polyline points={poly} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* 数据点 + 数值 + X 轴日期 */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />
          <text x={p.x.toFixed(1)} y={(p.y - 6).toFixed(1)} fontSize={9} fill={color} textAnchor="middle" fontWeight={600}>{fmt(p.v)}</text>
          {(i % step === 0 || i === n - 1) && (
            <text x={p.x.toFixed(1)} y={h - 4} fontSize={9} fill="#999" textAnchor="middle">{p.l}</text>
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
      {total <= 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#eee" strokeWidth={16} />}
      {total > 0 && segs.map((sg, i) => {
        const len = (sg.v / total) * c;
        const el = (
          <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={sg.color} strokeWidth={16}
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
