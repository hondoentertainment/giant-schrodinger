// Strip HTML tags and script content
function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

export function validateSubmission(text) {
  if (!text || typeof text !== 'string') return { valid: false, error: 'Submission is required' };
  const cleaned = stripHtml(text.trim());
  if (cleaned.length === 0) return { valid: false, error: 'Submission cannot be empty' };
  if (cleaned.length > 200) return { valid: false, error: 'Submission must be 200 characters or less' };
  return { valid: true, value: cleaned };
}

export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') return { valid: false, error: 'Name is required' };
  const cleaned = stripHtml(name.trim());
  if (cleaned.length === 0) return { valid: false, error: 'Name cannot be empty' };
  if (cleaned.length > 30) return { valid: false, error: 'Name must be 30 characters or less' };
  if (/[<>"'&]/.test(cleaned)) return { valid: false, error: 'Name contains invalid characters' };
  return { valid: true, value: cleaned };
}

export function validatePackName(name) {
  if (!name || typeof name !== 'string') return { valid: false, error: 'Pack name is required' };
  const cleaned = stripHtml(name.trim());
  if (cleaned.length === 0) return { valid: false, error: 'Pack name cannot be empty' };
  if (cleaned.length > 50) return { valid: false, error: 'Pack name must be 50 characters or less' };
  return { valid: true, value: cleaned };
}

export function sanitizeForCanvas(text) {
  // Remove control characters and normalize whitespace for canvas rendering
  return text.replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim();
}
