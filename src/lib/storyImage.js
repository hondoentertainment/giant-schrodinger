export async function generateStoryImage(score, conceptLeft, conceptRight, submission, playerName) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#1a0533');
  grad.addColorStop(1, '#0a0118');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Score circle
  ctx.beginPath();
  ctx.arc(540, 600, 200, 0, Math.PI * 2);
  ctx.fillStyle = score >= 8 ? '#22c55e' : score >= 5 ? '#a855f7' : '#ef4444';
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = score >= 8 ? '#22c55e' : score >= 5 ? '#a855f7' : '#ef4444';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Score text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`${score}/10`, 540, 640);

  // Concepts
  ctx.font = 'bold 36px system-ui';
  ctx.fillStyle = '#a855f7';
  ctx.fillText(`${conceptLeft} \u00d7 ${conceptRight}`, 540, 900);

  // Submission
  ctx.font = '28px system-ui';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  wrapText(ctx, `"${submission}"`, 540, 1000, 900, 40);

  // Player name
  ctx.globalAlpha = 0.5;
  ctx.font = '24px system-ui';
  ctx.fillText(`\u2014 ${playerName}`, 540, 1200);

  // CTA
  ctx.globalAlpha = 1;
  ctx.font = 'bold 32px system-ui';
  ctx.fillStyle = '#a855f7';
  ctx.fillText('Can you beat this?', 540, 1500);
  ctx.font = '24px system-ui';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.4;
  ctx.fillText('Venn with Friends', 540, 1550);

  return canvas.toDataURL('image/png');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
