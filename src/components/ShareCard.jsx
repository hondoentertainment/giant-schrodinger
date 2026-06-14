import React, { useState, useEffect, useRef, useCallback } from 'react';

const CARD_WIDTH = 800;
const CARD_HEIGHT = 420;

const ShareCard = React.memo(function ShareCard({
    submission,
    score,
    playerName,
    leftAsset,
    rightAsset,
    fusionImageUrl,
    onGenerated,
}) {
    const canvasRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const drawCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            // Gradient background: dark purple to black
            const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
            gradient.addColorStop(0, '#2d1b69');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

            // Subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2);

            drawText(ctx);

            const dataUrl = canvas.toDataURL('image/png');
            setPreviewUrl(dataUrl);
            onGenerated?.(dataUrl);
        } catch (err) {
            console.error('ShareCard: canvas draw failed', err);
        }
    }, [submission, score, playerName, leftAsset, rightAsset, onGenerated]);

    const drawText = useCallback(
        (ctx) => {
            const textX = fusionImageUrl ? 400 : 60;
            const textWidth = fusionImageUrl ? 360 : 680;

            // Player name
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '500 16px system-ui, sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(playerName || 'Player', textX, 40);

            // Score
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 72px system-ui, sans-serif';
            ctx.fillText(`${score ?? 0}`, textX, 68);

            // "/10" suffix
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 32px system-ui, sans-serif';
            const scoreWidth = ctx.measureText(`${score ?? 0}`).width;
            ctx.fillText('/10', textX + scoreWidth + 4, 92);

            // Submission in quotes
            ctx.fillStyle = '#e0d0ff';
            ctx.font = 'italic 22px system-ui, sans-serif';
            const quotedText = `"${submission || ''}"`;
            wrapText(ctx, quotedText, textX, 170, textWidth, 28);

            // Asset names
            const leftTitle = leftAsset?.title || '???';
            const rightTitle = rightAsset?.title || '???';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '500 15px system-ui, sans-serif';
            ctx.fillText(`${leftTitle}  +  ${rightTitle}`, textX, 280);

            // CTA
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'bold 18px system-ui, sans-serif';
            ctx.fillText('Can you beat this?', textX, 320);

            // Branding
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '600 14px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Venn with Friends', CARD_WIDTH / 2, CARD_HEIGHT - 30);
            ctx.textAlign = 'left';
        },
        [submission, score, playerName, leftAsset, rightAsset, fusionImageUrl]
    );

    useEffect(() => {
        if (!fusionImageUrl) {
            drawCard();
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                // Gradient background
                const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
                gradient.addColorStop(0, '#2d1b69');
                gradient.addColorStop(1, '#0a0a0a');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2);

                // Draw fusion image on left half
                const imgSize = 320;
                const imgX = 40;
                const imgY = (CARD_HEIGHT - imgSize) / 2;

                // Rounded clip for image
                ctx.save();
                roundedRect(ctx, imgX, imgY, imgSize, imgSize, 16);
                ctx.clip();
                ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
                ctx.restore();

                // Subtle image border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1.5;
                roundedRect(ctx, imgX, imgY, imgSize, imgSize, 16);
                ctx.stroke();

                drawText(ctx);

                const dataUrl = canvas.toDataURL('image/png');
                setPreviewUrl(dataUrl);
                onGenerated?.(dataUrl);
            } catch (err) {
                console.error('ShareCard: canvas draw with image failed', err);
                drawCard();
            }
        };

        img.onerror = () => {
            console.warn('ShareCard: failed to load fusion image, drawing without it');
            drawCard();
        };

        img.src = fusionImageUrl;
    }, [fusionImageUrl, drawCard, drawText, onGenerated]);

    return (
        <div className="w-full flex flex-col items-center gap-3">
            <canvas
                ref={canvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                style={{ display: 'none' }}
            />
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt="Share card preview"
                    className="w-full max-w-lg rounded-2xl border border-white/10 shadow-lg"
                />
            )}
        </div>
    );
});

export default ShareCard;

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && line) {
            ctx.fillText(line, x, currentY);
            line = word;
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }

    if (line) {
        ctx.fillText(line, x, currentY);
    }
}
