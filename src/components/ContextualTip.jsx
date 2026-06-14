import React, { useState, useEffect } from 'react';
import { getContextualTip, markTipSeen } from '../lib/contextualTips';

export function ContextualTip({ context, totalRounds }) {
  const [tip, setTip] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = getContextualTip(context, totalRounds);
    if (t) {
      setTip(t);
      setVisible(true);
      markTipSeen(t.id);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [context, totalRounds]);

  if (!tip || !visible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2">
      <span>💡</span>
      <span>{tip.text}</span>
      <button onClick={() => setVisible(false)} className="ml-auto text-white/30 hover:text-white/60">×</button>
    </div>
  );
}
