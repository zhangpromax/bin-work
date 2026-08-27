'use client';

import React from 'react';
import type { Baby } from '../lib/types';

function parseMonths(birthday: string): number {
  if (!birthday) return 6;
  const bd = new Date(birthday);
  if (isNaN(bd.getTime())) return 6;
  return Math.max(0, (Date.now() - bd.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function parseNum(v: string | number | undefined, fallback: number): number {
  const n = Number(v);
  return isNaN(n) || n <= 0 ? fallback : n;
}

interface BabyAvatarProps {
  baby: Baby;
  size?: number;
  className?: string;
}

/**
 * 泡泡玛特风动态宝宝头像
 * 大头 Q 娃、潮玩质感，随年龄/身高/体重微调比例
 */
export function BabyAvatar({ baby, size = 96, className = '' }: BabyAvatarProps) {
  const months = parseMonths(baby.birthday);
  const gender = baby.gender || 'female';
  const h = parseNum(baby.height, 0);
  const w = parseNum(baby.weight, 0);

  // 年龄影响整体成熟度：越小头越大、身体越短；越大越“立起来”
  const ageRatio = Math.min(1, months / 36);
  const headScale = 1 - ageRatio * 0.12; // 1 -> 0.88
  const bodyY = 70 + ageRatio * 4; // 身体位置稍微下移

  // 胖瘦：根据体重/身高比微调脸的圆润度
  const bmiLike = h > 0 && w > 0 ? (w / h) * 100 : 0.55 + months * 0.015;
  const chubby = Math.max(0.92, Math.min(1.12, bmiLike / 0.68));

  const isBoy = gender === 'male';
  const skinLight = '#FFE8D8';
  const skinMid = '#FFD4BC';
  const skinShadow = '#F5C3A6';
  const hair = isBoy ? '#6B5344' : '#6B5344';
  const suitMain = isBoy ? '#BDE4F4' : '#FFD4E5';
  const suitDark = isBoy ? '#8ACDE6' : '#F7A8C6';
  const suitLight = isBoy ? '#E0F4FC' : '#FFF0F6';

  return (
    <div className={`baby-avatar-wrap ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="baby-avatar"
        aria-label="baby avatar"
      >
        <defs>
          <radialGradient id={`faceGrad-${baby.id}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={skinLight} />
            <stop offset="55%" stopColor={skinMid} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <radialGradient id={`suitGrad-${baby.id}`} cx="40%" cy="0%" r="90%">
            <stop offset="0%" stopColor={suitLight} />
            <stop offset="50%" stopColor={suitMain} />
            <stop offset="100%" stopColor={suitDark} />
          </radialGradient>
          <radialGradient id={`eyeGrad-${baby.id}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#5C4A3D" />
            <stop offset="100%" stopColor="#2E211A" />
          </radialGradient>
          <radialGradient id={`shadow-${baby.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.14)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id={`soft-${baby.id}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="baby-breathe">
          {/* 身体：泡泡玛特标志性的小身体 + 圆领衣服 */}
          <g transform={`translate(50, ${bodyY})`}>
            <ellipse cx="0" cy="0" rx={26 * chubby} ry={18} fill={`url(#suitGrad-${baby.id})`} filter={`url(#soft-${baby.id})`} />
            {/* 衣服圆领白边 */}
            <ellipse cx="0" cy="-13" rx="14" ry="7" fill="#FFF" opacity="0.95" />
            {/* 小手 */}
            <ellipse cx={-28 * chubby} cy="-2" rx="7" ry="9" fill={skinMid} />
            <ellipse cx={28 * chubby} cy="-2" rx="7" ry="9" fill={skinMid} />
          </g>

          {/* 大头 */}
          <g transform={`translate(50, 38) scale(${headScale})`}>
            {/* 头发：一小撮呆毛 */}
            <path
              d={`M -18 -28 Q -6 -42 0 -36 Q 6 -42 18 -28 Q 8 -34 0 -30 Q -8 -34 -18 -28`}
              fill={hair}
            />
            <path
              d="M -4 -34 Q 0 -48 4 -34"
              fill="none"
              stroke={hair}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* 脸型 */}
            <ellipse cx="0" cy="0" rx={38 * chubby} ry={34 * chubby} fill={`url(#faceGrad-${baby.id})`} filter={`url(#soft-${baby.id})`} />

            {/* 耳朵 */}
            <ellipse cx={-37 * chubby} cy="2" rx="7" ry="8" fill={skinMid} />
            <ellipse cx={37 * chubby} cy="2" rx="7" ry="8" fill={skinMid} />

            {/* 高光（塑料感） */}
            <ellipse cx="-16" cy="-18" rx="10" ry="6" fill="#fff" opacity="0.22" transform="rotate(-20)" />

            {/* 腮红 */}
            <ellipse cx={-22 * chubby} cy="10" rx="9" ry="6" fill="rgba(255, 130, 130, 0.35)" />
            <ellipse cx={22 * chubby} cy="10" rx="9" ry="6" fill="rgba(255, 130, 130, 0.35)" />

            {/* 大眼睛 */}
            <g className="baby-eyes">
              <ellipse cx="-13" cy="-2" rx="9" ry="10" fill={`url(#eyeGrad-${baby.id})`} />
              <ellipse cx="13" cy="-2" rx="9" ry="10" fill={`url(#eyeGrad-${baby.id})`} />
              {/* 眼神光 */}
              <circle cx="-10" cy="-6" r="3" fill="#fff" opacity="0.95" />
              <circle cx="16" cy="-6" r="3" fill="#fff" opacity="0.95" />
              <circle cx="-15" cy="1" r="1.5" fill="#fff" opacity="0.65" />
            </g>

            {/* 眨眼遮罩 */}
            <g className="baby-blink">
              <path d="M -22 -2 Q -13 2 -4 -2" stroke="#4A3B32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 4 -2 Q 13 2 22 -2" stroke="#4A3B32" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>

            {/* 鼻子 */}
            <ellipse cx="0" cy="8" rx="2.5" ry="1.8" fill="#D49A82" opacity="0.8" />

            {/* 小嘴巴 */}
            <path d="M -4 16 Q 0 19 4 16" stroke="#D47A7A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>
        </g>

        {/* 底部投影 */}
        <ellipse cx="50" cy="92" rx="22" ry="5" fill={`url(#shadow-${baby.id})`} className="baby-shadow" />
      </svg>
    </div>
  );
}
