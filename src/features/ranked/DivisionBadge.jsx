import React from 'react';

const DIVISION_COLORS = {
  Bronze: { bg: 'from-amber-700 to-amber-900', text: 'text-amber-300', icon: '\u{1F949}' },
  Silver: { bg: 'from-gray-400 to-gray-600', text: 'text-gray-200', icon: '\u{1F948}' },
  Gold: { bg: 'from-yellow-500 to-yellow-700', text: 'text-yellow-200', icon: '\u{1F947}' },
  Platinum: { bg: 'from-cyan-400 to-cyan-600', text: 'text-cyan-100', icon: '\u{1F48E}' },
  Diamond: { bg: 'from-blue-400 to-blue-600', text: 'text-blue-100', icon: '\u{1F4A0}' },
  'Venn Master': { bg: 'from-purple-500 to-purple-700', text: 'text-purple-100', icon: '\u{1F451}' },
};

export function DivisionBadge({ tier, size = 'md' }) {
  const config = DIVISION_COLORS[tier] || DIVISION_COLORS.Bronze;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${config.bg} ${config.text} ${sizeClass} font-bold`}>
      {config.icon} {tier}
    </span>
  );
}
