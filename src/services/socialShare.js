const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const FACEBOOK_BASE_URL = 'https://www.facebook.com/sharer/sharer.php';
const LINKEDIN_BASE_URL = 'https://www.linkedin.com/sharing/share-offsite';
const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1350;

function clampText(text, maxLength = 140) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;
}

export function getAssetDisplayName(asset) {
  return asset?.label || asset?.title || asset?.name || 'Unknown';
}

function pickShareHook(score, scoreBand) {
  const highScoreTemplates = [
    'This one feels illegally clever.',
    'This belongs in the group chat immediately.',
    'Absurd. Clean. Repost-worthy.',
    'The overlap went way harder than expected.',
  ];
  const midScoreTemplates = [
    'This one is weird in the best way.',
    'A respectable amount of chaos.',
    'Still proud of this brainwave.',
    'Honestly, the concept art is carrying and I love that.',
  ];
  const lowScoreTemplates = [
    'Unhinged? Yes. Regret? No.',
    'Maybe not genius, but absolutely committed.',
    'It makes less sense the longer you stare at it.',
    'The confidence was the real victory.',
  ];

  const pool = score >= 8 ? highScoreTemplates : score >= 6 ? midScoreTemplates : lowScoreTemplates;
  const bandTag = scoreBand ? ` ${scoreBand}.` : '';
  return `${pool[Math.floor(Math.random() * pool.length)]}${bandTag}`;
}

export function createShareText(shareData) {
  const { submission, score = 0, scoreBand, commentary, assets } = shareData;
  const leftAsset = getAssetDisplayName(assets?.left);
  const rightAsset = getAssetDisplayName(assets?.right);
  const hook = pickShareHook(score, scoreBand);
  const cleanSubmission = clampText(submission, 90);
  const cleanCommentary = clampText(commentary, 110);
  const context = buildShareContext(shareData);
  const contextPrefix = context ? `${context}: ` : '';

  const templates = [
    `${contextPrefix}I turned "${leftAsset}" + "${rightAsset}" into "${cleanSubmission}" and pulled a ${score}/10. ${hook} ${cleanCommentary} #VennWithFriends`,
    `${contextPrefix}${score}/10 for "${cleanSubmission}". The prompt pair was ${leftAsset} x ${rightAsset}. ${hook} #VennWithFriends #CreativeChaos`,
    `${contextPrefix}Fresh Venn with Friends chaos: ${leftAsset} + ${rightAsset} = "${cleanSubmission}". ${score}/10 energy. ${hook} ${cleanCommentary} #PartyGame`,
    `${contextPrefix}This round gave me ${leftAsset}, ${rightAsset}, and a dangerous amount of confidence. "${cleanSubmission}" scored ${score}/10. #VennWithFriends`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function buildCardSubtitle(shareData) {
  const leftAsset = getAssetDisplayName(shareData.assets?.left);
  const rightAsset = getAssetDisplayName(shareData.assets?.right);
  return `${leftAsset}  ×  ${rightAsset}`;
}

function buildCardFooter(shareData) {
  const commentary = clampText(shareData.commentary, 120);
  if (commentary) return commentary;
  return pickShareHook(shareData.score || 0, shareData.scoreBand);
}

function getJudgeLabel(judgeMode) {
  if (judgeMode === 'friend') return 'Friend Judge';
  if (judgeMode === 'human') return 'Manual Judge';
  if (judgeMode === 'ai') return 'AI Judge';
  return null;
}

function buildShareContext(shareData) {
  const pieces = [];
  const judgeLabel = getJudgeLabel(shareData.judgeMode);
  if (judgeLabel) pieces.push(judgeLabel);
  if (shareData.isDailyChallenge) pieces.push('Daily Challenge');
  if (shareData.friendScore) pieces.push(`Friend score ${shareData.friendScore}/10`);
  return pieces.join(' · ');
}

function loadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = imageUrl;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const limitedLines = lines.slice(0, maxLines).map((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      return clampText(line, Math.max(8, Math.floor(line.length * 0.85)));
    }
    return line;
  });

  limitedLines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  return limitedLines.length;
}

export async function createShareCard(imageUrl, shareData) {
  if (!imageUrl) return null;

  try {
    const image = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = SHARE_CARD_WIDTH;
    canvas.height = SHARE_CARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
    gradient.addColorStop(0, '#13071d');
    gradient.addColorStop(0.35, '#31123f');
    gradient.addColorStop(0.7, '#4d1450');
    gradient.addColorStop(1, '#160914');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ff4fd8';
    ctx.beginPath();
    ctx.arc(180, 190, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#53d8ff';
    ctx.beginPath();
    ctx.arc(920, 1120, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    roundRect(ctx, 64, 64, 952, 1222, 46);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();

    roundRect(ctx, 108, 154, 864, 720, 36);
    ctx.save();
    ctx.clip();

    const imageRatio = image.width / image.height;
    const frameRatio = 864 / 720;
    let drawWidth = 864;
    let drawHeight = 720;
    let drawX = 108;
    let drawY = 154;

    if (imageRatio > frameRatio) {
      drawWidth = 720 * imageRatio;
      drawX = 108 - (drawWidth - 864) / 2;
    } else {
      drawHeight = 864 / imageRatio;
      drawY = 154 - (drawHeight - 720) / 2;
    }

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const overlay = ctx.createLinearGradient(0, 154, 0, 874);
    overlay.addColorStop(0, 'rgba(12,4,18,0.08)');
    overlay.addColorStop(0.55, 'rgba(12,4,18,0.12)');
    overlay.addColorStop(1, 'rgba(12,4,18,0.72)');
    ctx.fillStyle = overlay;
    ctx.fillRect(108, 154, 864, 720);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '700 28px Georgia, serif';
    ctx.fillText('VENN with Friends', 120, 118);

    roundRect(ctx, 790, 96, 170, 74, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.fillStyle = '#160914';
    ctx.font = '700 22px Arial';
    ctx.fillText('SCORED', 820, 126);
    ctx.font = '900 34px Arial';
    ctx.fillText(`${shareData.score || 0}/10`, 818, 158);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 22px Arial';
    ctx.fillText(buildCardSubtitle(shareData), 120, 932);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 62px Arial';
    drawWrappedText(ctx, `"${clampText(shareData.submission, 90)}"`, 120, 1015, 840, 74, 3);

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '500 30px Arial';
    drawWrappedText(ctx, buildCardFooter(shareData), 120, 1212, 840, 42, 3);

    roundRect(ctx, 120, 1126, 240, 58, 24);
    ctx.fillStyle = 'rgba(83,216,255,0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(83,216,255,0.35)';
    ctx.stroke();
    ctx.fillStyle = '#8ee9ff';
    ctx.font = '700 24px Arial';
    ctx.fillText(shareData.scoreBand || 'Creative Chaos', 146, 1163);

    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '600 24px Arial';
    ctx.fillText('Play. Share. Start arguments.', 640, 1254);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export function dataURLtoFile(dataURL, filename) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

export function shareToTwitter(shareData) {
  const text = createShareText(shareData);
  const truncatedText = text.length > 250 ? `${text.substring(0, 247)}...` : text;
  const params = new URLSearchParams({
    text: truncatedText,
    hashtags: 'VennWithFriends,PartyGames,CreativeChaos',
  });

  window.open(`${TWITTER_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

export function shareToFacebook(shareData) {
  const { pageUrl = window.location.href } = shareData;
  const quote = createShareText(shareData);
  const params = new URLSearchParams({
    u: pageUrl,
    quote,
    hashtag: '#VennWithFriends',
  });

  window.open(`${FACEBOOK_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

export function shareToLinkedIn(shareData) {
  const { pageUrl = window.location.href } = shareData;
  const summary = createShareText(shareData);
  const params = new URLSearchParams({
    url: pageUrl,
    summary,
  });

  window.open(`${LINKEDIN_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

export async function copyShareLink(shareData) {
  const shareText = `${createShareText(shareData)} Try it: ${window.location.href}`;

  try {
    await navigator.clipboard.writeText(shareText);
    return { success: true, message: 'Share caption copied!' };
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: true, message: 'Share caption copied!' };
  }
}

export async function downloadFusionImage(imageDataUrl, shareData, filename = 'venn-with-friends-share-card.png') {
  const shareCard = await createShareCard(imageDataUrl, shareData);
  const link = document.createElement('a');
  link.download = filename;
  link.href = shareCard || imageDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function shareViaWebShare(shareData) {
  const { imageUrl } = shareData;
  const shareText = createShareText(shareData);
  const shareDataObj = {
    title: 'Venn with Friends',
    text: shareText,
    url: window.location.href,
  };

  if (imageUrl && navigator.canShare && navigator.canShare({ files: [new File([], 'image.png')] })) {
    try {
      const shareCard = await createShareCard(imageUrl, shareData);
      const file = dataURLtoFile(shareCard || imageUrl, 'venn-with-friends-share-card.png');
      shareDataObj.files = [file];
    } catch (err) {
      console.warn('Could not attach image to share:', err);
    }
  }

  try {
    await navigator.share(shareDataObj);
    return { success: true };
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Web Share API failed:', err);
      return { success: false, error: err.message };
    }
    return { success: true };
  }
}
