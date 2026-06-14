import React, { useMemo } from 'react';
import { getCollisions } from '../../services/storage';

export function ScoreHistoryChart({ limit = 30 }) {
  const scores = useMemo(() => {
    const collisions = getCollisions() || [];
    return collisions
      .slice(-limit)
      .map(c => c.score || c.finalScore || 0);
  }, [limit]);

  if (scores.length < 2) {
    return <div className="text-white/40 text-sm text-center py-8">Play more rounds to see your score history</div>;
  }

  const width = 400;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxScore = 10;
  const minScore = 0;

  const points = scores.map((s, i) => ({
    x: padding.left + (i / (scores.length - 1)) * chartW,
    y: padding.top + chartH - ((s - minScore) / (maxScore - minScore)) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Running average
  const avgScores = scores.map((_, i) => {
    const slice = scores.slice(0, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
  const avgPoints = avgScores.map((s, i) => ({
    x: padding.left + (i / (scores.length - 1)) * chartW,
    y: padding.top + chartH - ((s - minScore) / (maxScore - minScore)) * chartH,
  }));
  const avgPath = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Personal best
  const bestIdx = scores.indexOf(Math.max(...scores));
  const bestPoint = points[bestIdx];

  return (
    <div className="w-full max-w-md">
      <h3 className="text-white/70 text-sm font-semibold mb-2">Score History (Last {scores.length} rounds)</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10].map(v => {
          const y = padding.top + chartH - (v / 10) * chartH;
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="white" strokeOpacity="0.05" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="white" fillOpacity="0.3" fontSize="10">{v}</text>
            </g>
          );
        })}

        {/* Average line */}
        <path d={avgPath} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.5" />

        {/* Score line */}
        <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="2" />

        {/* Score dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={scores[i] >= 8 ? '#22c55e' : scores[i] >= 5 ? '#a855f7' : '#ef4444'} />
        ))}

        {/* Personal best marker */}
        {bestPoint && (
          <g>
            <circle cx={bestPoint.x} cy={bestPoint.y} r="6" fill="none" stroke="#eab308" strokeWidth="2" />
            <text x={bestPoint.x} y={bestPoint.y - 10} textAnchor="middle" fill="#eab308" fontSize="9" fontWeight="bold">Best</text>
          </g>
        )}

        {/* Legend */}
        <text x={padding.left} y={height - 5} fill="white" fillOpacity="0.3" fontSize="9">Oldest</text>
        <text x={width - padding.right} y={height - 5} textAnchor="end" fill="white" fillOpacity="0.3" fontSize="9">Recent</text>
      </svg>
      <div className="flex justify-between text-xs text-white/40 mt-1">
        <span>Avg: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}</span>
        <span className="text-purple-400">— Average</span>
        <span>Best: {Math.max(...scores)}</span>
      </div>
    </div>
  );
}
