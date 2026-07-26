const IMG_WIDTH = 1080;

export function buildPicsumFallback(labelOrKeyword) {
    const slug = String(labelOrKeyword || 'placeholder')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `https://picsum.photos/seed/${slug || 'venn'}/${IMG_WIDTH}/${IMG_WIDTH}`;
}

export { IMG_WIDTH };
