import React from 'react';

export const GROUP_COLORS: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#eab308',
    purple: '#a855f7',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
};

export const resolveColor = (color: string): string => GROUP_COLORS[color] ?? color;

export default ({ color, size = 8 }: { color: string; size?: number }) => (
    <span
        className={'rounded-full flex-shrink-0 inline-block'}
        style={{ width: size, height: size, backgroundColor: resolveColor(color) }}
    />
);
