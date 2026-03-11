// Social media sharing service for Venn with Friends

const TWITTER_BASE_URL = 'https://twitter.com/intent/tweet';
const FACEBOOK_BASE_URL = 'https://www.facebook.com/sharer/sharer.php';
const LINKEDIN_BASE_URL = 'https://www.linkedin.com/sharing/share-offsite';

// Default OG values (must match index.html)
const DEFAULT_OG = {
  'og:title': 'Venn with Friends - The Creative Connection Game',
  'og:description': 'Connect two random concepts with one clever phrase. Score points for wit, logic, originality, and clarity. Play solo or challenge your friends!',
  'og:image': 'https://placehold.co/1200x630/1a0533/ffffff?text=Venn+with+Friends%0AConnect+Concepts+with+Wit',
  'og:url': 'https://hondoentertainment.github.io/giant-schrodinger/',
  'twitter:title': 'Venn with Friends - The Creative Connection Game',
  'twitter:description': 'Connect two random concepts with one clever phrase. Play solo or challenge your friends!',
  'twitter:image': 'https://placehold.co/1200x630/1a0533/ffffff?text=Venn+with+Friends%0AConnect+Concepts+with+Wit',
};

/**
 * Update Open Graph and Twitter meta tags in document.head.
 * Useful before triggering a share action so crawlers / link-preview
 * bots that re-fetch the page (or the Web Share API preview) pick up
 * contextual information about the round being shared.
 *
 * @param {object} shareData - { submission, score, scoreBand, commentary, assets, imageDataUrl }
 */
export function updateMetaTags(shareData) {
  const { submission, score, scoreBand, assets, imageDataUrl } = shareData;
  const leftAsset = assets?.left?.title || assets?.left?.label || 'Concept A';
  const rightAsset = assets?.right?.title || assets?.right?.label || 'Concept B';

  const title = `I scored ${score}/10 on Venn with Friends!`;
  const description = `Connected "${leftAsset}" and "${rightAsset}" with "${submission}". ${scoreBand ? scoreBand + '!' : ''} Can you beat this?`;

  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);

  // If a canvas data-URL was generated, use it as the OG image.
  // Note: most crawlers cannot resolve data-URLs, but the Web Share API
  // preview on some platforms does honour it, and it costs nothing to set.
  if (imageDataUrl) {
    setMeta('og:image', imageDataUrl);
    setMeta('twitter:image', imageDataUrl);
  }
}

/**
 * Restore the default (static) OG / Twitter meta tags.
 * Call this after the share action completes so the page returns to its
 * generic preview state.
 */
export function restoreDefaultMetaTags() {
  for (const [key, value] of Object.entries(DEFAULT_OG)) {
    setMeta(key, value);
  }
}

/** Helper: set a <meta> tag value by property or name attribute. */
function setMeta(key, value) {
  // OG tags use property="…", Twitter tags use name="…"
  const isOg = key.startsWith('og:');
  const attr = isOg ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

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

// Create shareable text for different contexts
export function createShareText(shareData) {
  const { submission, score, scoreBand, commentary, assets } = shareData;
  const leftAsset = assets?.left?.title || 'Unknown';
  const rightAsset = assets?.right?.title || 'Unknown';
  
  const templates = [
    `I just connected "${leftAsset}" and "${rightAsset}" with "${submission}" and scored ${score}/10! ${commentary} 🎮 #VennWithFriends #PartyGames`,
    `🎯 ${score}/10! My connection: "${submission}" (${leftAsset} + ${rightAsset}). ${commentary} Play now! #VennWithFriends`,
    `💡 Creative win! Connected "${leftAsset}" to "${rightAsset}" with "${submission}" - scored ${score}/10! ${commentary} #VennWithFriends`,
    `🎉 Just got "${scoreBand}" in Venn with Friends! "${submission}" (${leftAsset} + ${rightAsset}) ${commentary} Join the fun!`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Share to Twitter/X
export function shareToTwitter(shareData) {
  updateMetaTags(shareData);
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
  updateMetaTags(shareData);
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
  updateMetaTags(shareData);
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
  updateMetaTags(shareData);
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
  updateMetaTags(shareData);
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