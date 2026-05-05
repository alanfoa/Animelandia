import React from 'react';
import { FavoriteIconProps } from '../types';

export function FavoriteIcon({ isActive, onClick }: FavoriteIconProps) {
  return (
    <button onClick={onClick} style={{ position: 'relative', width: '24px', height: '36px', zIndex: 30, background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}>
      <svg viewBox="0 0 24 36" style={{ width: '100%', height: '100%', transition: 'all 0.3s' }}>
        <path
          className={`transition-all duration-300 ${isActive ? 'fill-[#FFB800] stroke-[#FFB800]' : 'fill-[#808080] stroke-[#808080]'}`}
          strokeWidth="2"
          strokeLinejoin="round"
          d="M5,2 L19,2 Q22,2 22,5 L22,28 L12,34 L2,28 L2,5 Q2,2 5,2 Z"
        />
        <path
          className={`transition-all duration-300 ${isActive ? 'fill-white stroke-none' : 'fill-white stroke-white'}`}
          strokeWidth="2"
          strokeLinejoin="round"
          d="M12,10 L14,13 L18,14 L15,16 L16,20 L12,18 L8,20 L9,16 L6,14 L10,13 Z"
        />
      </svg>
    </button>
  );
}
