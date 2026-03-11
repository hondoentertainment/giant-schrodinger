import React, { useRef, useEffect, useState } from 'react';
import { updateMetaTags } from '../services/socialShare';

export function ShareCardCanvas({ submission, score, leftLabel, rightLabel, fusionImageUrl, playerName, onGenerated }) {
    const canvasRef = useRef(null);
    const [dataUrl, setDataUrl] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 1200;
        const H = 630;
        canvas.width = W;
        canvas.height = H;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1a0533');
        grad.addColorStop(0.5, '#2d1065');
        grad.addColorStop(1, '#4a044e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Decorative circles (Venn diagram hint)
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(W * 0.35, H * 0.45, 180, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W * 0.65, H * 0.45, 180, 0, Math.PI * 2);
        ctx.fillStyle = '#ec4899';
        ctx.fill();
        ctx.globalAlpha = 1;

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VENN with Friends', W / 2, 80);

        // Concept labels
        ctx.font = '28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#c084fc';
        ctx.fillText(leftLabel || 'Concept A', W * 0.3, H * 0.38);
        ctx.fillStyle = '#f472b6';
        ctx.fillText(rightLabel || 'Concept B', W * 0.7, H * 0.38);

        // Connection (submission)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 32px system-ui, -apple-system, sans-serif';
        const displaySubmission = submission.length > 50 ? submission.slice(0, 47) + '...' : submission;
        ctx.fillText(`"${displaySubmission}"`, W / 2, H * 0.55);

        // Score
        const scoreColor = score >= 9 ? '#fbbf24' : score >= 7 ? '#34d399' : score >= 5 ? '#60a5fa' : '#f87171';
        ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = scoreColor;
        ctx.fillText(`${score}/10`, W / 2, H * 0.75);

        // CTA
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Can you beat this? Play now!', W / 2, H * 0.88);

        // Player name
        if (playerName) {
            ctx.font = '20px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.textAlign = 'right';
            ctx.fillText(`by ${playerName}`, W - 40, H - 20);
        }

        const url = canvas.toDataURL('image/png');
        setDataUrl(url);
        onGenerated?.(url);
    }, [submission, score, leftLabel, rightLabel, playerName, onGenerated]);

    const handleDownload = () => {
        if (!dataUrl) return;
        const link = document.createElement('a');
        link.download = `venn-score-${score}.png`;
        link.href = dataUrl;
        link.click();
    };

    const handleShare = async () => {
        if (!dataUrl) return;

        // Update OG meta tags before sharing so link previews are contextual
        updateMetaTags({
            submission,
            score,
            assets: {
                left: { label: leftLabel },
                right: { label: rightLabel },
            },
            imageDataUrl: dataUrl,
        });

        try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `venn-score-${score}.png`, { type: 'image/png' });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `I scored ${score}/10 on Venn with Friends!`,
                    text: `"${submission}" — Can you beat my score?`,
                    files: [file],
                });
            }
        } catch {
            // Fallback - just download
            handleDownload();
        }
    };

    return (
        <div className="w-full">
            <canvas ref={canvasRef} className="hidden" />
            {dataUrl && (
                <div className="space-y-3">
                    <img src={dataUrl} alt="Share card" className="w-full rounded-xl border border-white/10 shadow-lg" />
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-all"
                        >
                            Download Card
                        </button>
                        {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                                onClick={handleShare}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold transition-all hover:scale-[1.02]"
                            >
                                Share Card
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
