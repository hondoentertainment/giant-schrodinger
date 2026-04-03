// Social media sharing service for Venn with Friends

const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const FACEBOOK_BASE_URL = 'https://www.facebook.com/sharer/sharer.php';
const LINKEDIN_BASE_URL = 'https://www.linkedin.com/sharing/share-offsite';

// Convert base64 data URL to a File object for sharing
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

// --- A/B Testing for Share Copy ---

const AB_STORAGE_KEY = 'vwf_share_variant';
const AB_RESULTS_KEY = 'vwf_share_ab_results';

/**
 * Get or assign a share copy variant (A, B, or C) for this session.
 */
function getShareVariant() {
    try {
        let variant = sessionStorage.getItem(AB_STORAGE_KEY);
        if (!variant) {
            variant = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
            sessionStorage.setItem(AB_STORAGE_KEY, variant);
        }
        return variant;
    } catch {
        return 'A';
    }
}

/**
 * Record a share click for A/B tracking.
 */
export function recordShareClick(variant, platform) {
    try {
        const results = JSON.parse(localStorage.getItem(AB_RESULTS_KEY) || '{}');
        const key = `${variant}_${platform}`;
        results[key] = (results[key] || 0) + 1;
        results[`${variant}_total`] = (results[`${variant}_total`] || 0) + 1;
        localStorage.setItem(AB_RESULTS_KEY, JSON.stringify(results));
    } catch { /* silent */ }
}

/**
 * Get A/B test results for analysis.
 */
export function getShareABResults() {
    try {
        return JSON.parse(localStorage.getItem(AB_RESULTS_KEY) || '{}');
    } catch {
        return {};
    }
}

const SHARE_VARIANTS = {
    high: {  // score >= 9
        A: (left, right, score) => `Absolutely unhinged. I connected "${left}" and "${right}" and scored ${score}/10. Can you do better?`,
        B: (left, right, score) => `${score}/10 connecting "${left}" and "${right}". I'm basically a genius. Prove me wrong.`,
        C: (left, right, score) => `"${left}" + "${right}" = ${score}/10. My brain did something beautiful. Your turn.`,
    },
    mid: {  // score 7-8
        A: (left, right, score) => `Pretty sharp. Connected "${left}" + "${right}" for ${score}/10. Your turn.`,
        B: (left, right, score) => `${score}/10 on "${left}" \u00d7 "${right}". Not bad, but I bet you can't beat it.`,
        C: (left, right, score) => `Connected "${left}" to "${right}" and scored ${score}/10. Think you're wittier?`,
    },
    low_mid: {  // score 4-6
        A: (left, right, score) => `Decent attempt at "${left}" \u00d7 "${right}"... ${score}/10. Bet you can't beat it.`,
        B: (left, right, score) => `"${left}" + "${right}" = ${score}/10. Room for improvement. Can you do better?`,
        C: (left, right, score) => `I scored ${score}/10 connecting "${left}" and "${right}". Surely that's beatable.`,
    },
    low: {  // score 1-3
        A: (left, right, score) => `I tried connecting "${left}" and "${right}". ${score}/10. Surely you can beat this.`,
        B: (left, right, score) => `${score}/10 on "${left}" \u00d7 "${right}". This is embarrassing. Please avenge me.`,
        C: (left, right, score) => `"${left}" + "${right}" broke my brain. ${score}/10. Even you could beat this.`,
    },
};

// Generate personality-rich, tiered share text based on score
export function generateShareText(score, conceptLeft, conceptRight, submission, extras = {}) {
    const { streak, rank } = extras;
    const variant = getShareVariant();

    let tier;
    if (score >= 9) tier = 'high';
    else if (score >= 7) tier = 'mid';
    else if (score >= 4) tier = 'low_mid';
    else tier = 'low';

    const templateFn = SHARE_VARIANTS[tier]?.[variant] || SHARE_VARIANTS[tier]?.A;
    let text = templateFn(conceptLeft, conceptRight, score);

    let suffix = '';
    if (streak > 3) suffix += ` (${streak}-day streak \ud83d\udd25)`;
    if (rank) suffix += ` Rank #${rank}`;
    if (suffix) text += suffix;

    recordShareClick(variant, 'generated');
    return `${text}\n\n#VennWithFriends`;
}

// Create shareable text for different contexts
export function createShareText(shareData) {
  const { submission, score, assets } = shareData;
  const leftAsset = assets?.left?.label || assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.label || assets?.right?.title || 'Unknown';

  // Use the new tiered template
  return generateShareText(score, leftAsset, rightAsset, submission);
}

// Share to Twitter/X
export function shareToTwitter(shareData) {
  const text = createShareText(shareData);
  const hashtags = 'VennWithFriends,PartyGames,Creative';
  
  // Twitter character limit is 280, keep text concise
  const truncatedText = text.length > 250 ? text.substring(0, 247) + '...' : text;
  
  const params = new URLSearchParams({
    text: truncatedText,
    hashtags: hashtags
  });
  
  const url = `${TWITTER_BASE_URL}?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Share to Facebook
export function shareToFacebook(shareData) {
  const { submission, score, assets, pageUrl = window.location.href } = shareData;
  const leftAsset = assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.title || 'Unknown';
  
  const quote = `I just connected "${leftAsset}" and "${rightAsset}" with "${submission}" and scored ${score}/10! Can you beat my score?`;
  
  const params = new URLSearchParams({
    u: pageUrl,
    quote: quote,
    hashtag: '#VennWithFriends'
  });
  
  const url = `${FACEBOOK_BASE_URL}?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Share to LinkedIn
export function shareToLinkedIn(shareData) {
  const { submission, score, assets, pageUrl = window.location.href } = shareData;
  const leftAsset = assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.title || 'Unknown';
  
  const summary = `Creative thinking exercise! Connected "${leftAsset}" to "${rightAsset}" with "${submission}" and scored ${score}/10. Venn with Friends helps build creative connections and lateral thinking skills.`;
  
  const params = new URLSearchParams({
    url: pageUrl,
    summary: summary
  });
  
  const url = `${LINKEDIN_BASE_URL}?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Copy link to clipboard
export async function copyShareLink(shareData) {
  const { submission, score, assets } = shareData;
  const leftAsset = assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.title || 'Unknown';
  
  const shareText = `I just scored ${score}/10 connecting "${leftAsset}" and "${rightAsset}" with "${submission}" in Venn with Friends! Try it: ${window.location.href}`;
  
  try {
    await navigator.clipboard.writeText(shareText);
    return { success: true, message: 'Link copied to clipboard!' };
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: true, message: 'Link copied to clipboard!' };
  }
}

// Download fusion image
export function downloadFusionImage(imageDataUrl, filename = 'venn-with-friends-result.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Share via Web Share API (mobile-friendly)
export async function shareViaWebShare(shareData) {
  const { submission, score, commentary, imageUrl, assets } = shareData;
  const leftAsset = assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.title || 'Unknown';
  
  const shareText = `Venn with Friends - I scored ${score}/10!\n\nMy connection: "${submission}" (${leftAsset} + ${rightAsset})\n${commentary}\n\nPlay now!`;
  
  const shareDataObj = {
    title: 'Venn with Friends',
    text: shareText,
    url: window.location.href
  };
  
  // Add image if available and supported
  if (imageUrl && navigator.canShare && navigator.canShare({ files: [new File([], 'image.png')] })) {
    try {
      const imageFile = dataURLtoFile(imageUrl, 'venn-result.png');
      shareDataObj.files = [imageFile];
    } catch (err) {
      console.warn('Could not attach image to share:', err);
    }
  }
  
  try {
    await navigator.share(shareDataObj);
    return { success: true };
  } catch (err) {
    // User cancelled or Web Share API not supported
    if (err.name !== 'AbortError') {
      console.warn('Web Share API failed:', err);
      return { success: false, error: err.message };
    }
    return { success: true }; // User cancelled is still a success
  }
}