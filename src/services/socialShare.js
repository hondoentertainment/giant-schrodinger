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