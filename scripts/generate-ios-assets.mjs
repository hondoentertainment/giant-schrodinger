#!/usr/bin/env node
/**
 * Generate App Store icon + splash kit from the in-repo brand mark.
 * Pure Node (zlib) — no extra image toolchain. Safe to re-run.
 */
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'store', 'ios');

const BG_TOP = [0x1a, 0x05, 0x33];
const BG_BOT = [0x0a, 0x01, 0x18];
const PURPLE = [0xa8, 0x55, 0xf7];
const INDIGO = [0x63, 0x66, 0xf1];
const MAGENTA = [0xd9, 0x46, 0xef];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2; // RGB, no alpha — iOS App Store forbids transparency
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const stride = width * 3;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0;
        for (let x = 0; x < width; x++) {
            const src = (y * width + x) * 4;
            const dest = y * (stride + 1) + 1 + x * 3;
            const a = rgba[src + 3] / 255;
            raw[dest] = Math.round(rgba[src] * a + BG_BOT[0] * (1 - a));
            raw[dest + 1] = Math.round(rgba[src + 1] * a + BG_BOT[1] * (1 - a));
            raw[dest + 2] = Math.round(rgba[src + 2] * a + BG_BOT[2] * (1 - a));
        }
    }

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function mix(c1, c2, t) {
    return [
        Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t)),
    ];
}

function dist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

function drawBrand(width, height, { markScale = 0.42 } = {}) {
    const rgba = Buffer.alloc(width * height * 4);
    const cx = (width - 1) / 2;
    const cy = height * (width === height ? 0.5 : 0.46);
    const mark = Math.min(width, height) * markScale;
    const r = mark * 0.36;
    const offset = mark * 0.19;
    const left = [cx - offset, cy];
    const right = [cx + offset, cy];
    const stroke = Math.max(2, mark * 0.028);
    const hair = Math.max(1.5, mark * 0.018);
    const hubR = mark * 0.085;
    const hubInner = mark * 0.028;

    for (let y = 0; y < height; y++) {
        const gy = y / (height - 1);
        const bg = mix(BG_TOP, BG_BOT, gy);
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            let rC = bg[0];
            let gC = bg[1];
            let bC = bg[2];

            const dL = dist(x, y, left[0], left[1]);
            const dR = dist(x, y, right[0], right[1]);
            const inL = dL <= r;
            const inR = dR <= r;

            if (inL && inR) {
                rC = Math.round(lerp(rC, MAGENTA[0], 0.38));
                gC = Math.round(lerp(gC, MAGENTA[1], 0.38));
                bC = Math.round(lerp(bC, MAGENTA[2], 0.38));
            } else if (inL) {
                rC = Math.round(lerp(rC, PURPLE[0], 0.22));
                gC = Math.round(lerp(gC, PURPLE[1], 0.22));
                bC = Math.round(lerp(bC, PURPLE[2], 0.22));
            } else if (inR) {
                rC = Math.round(lerp(rC, INDIGO[0], 0.22));
                gC = Math.round(lerp(gC, INDIGO[1], 0.22));
                bC = Math.round(lerp(bC, INDIGO[2], 0.22));
            }

            const ringL = Math.abs(dL - r) <= stroke;
            const ringR = Math.abs(dR - r) <= stroke;
            if (ringL) {
                const t = 0.85;
                rC = Math.round(lerp(rC, PURPLE[0], t));
                gC = Math.round(lerp(gC, PURPLE[1], t));
                bC = Math.round(lerp(bC, PURPLE[2], t));
            }
            if (ringR) {
                const t = 0.85;
                rC = Math.round(lerp(rC, INDIGO[0], t));
                gC = Math.round(lerp(gC, INDIGO[1], t));
                bC = Math.round(lerp(bC, INDIGO[2], t));
            }

            const dC = dist(x, y, cx, cy);
            if (Math.abs(dC - hubR) <= hair || dC <= hubInner) {
                rC = WHITE[0];
                gC = WHITE[1];
                bC = WHITE[2];
            }
            const arm = mark * 0.16;
            const onV = Math.abs(x - cx) <= hair && y >= cy - arm && y <= cy + arm && (y <= cy - hubR || y >= cy + hubR);
            const onH = Math.abs(y - cy) <= hair && x >= cx - arm && x <= cx + arm && (x <= cx - hubR || x >= cx + hubR);
            if (onV || onH) {
                rC = WHITE[0];
                gC = WHITE[1];
                bC = WHITE[2];
            }

            rgba[i] = rC;
            rgba[i + 1] = gC;
            rgba[i + 2] = bC;
            rgba[i + 3] = 255;
        }
    }
    return rgba;
}

function writePng(relPath, width, height, rgba) {
    const abs = join(outDir, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, encodePng(width, height, rgba));
    return abs;
}

function copyPublicAppleTouch() {
    const src = join(root, 'public', 'icon-192.png');
    const dest = join(root, 'public', 'apple-touch-icon.png');
    writeFileSync(dest, readFileSync(src));
}

const kit = [
    { file: 'AppIcon-1024.png', w: 1024, h: 1024, markScale: 0.46 },
    { file: 'icon-180.png', w: 180, h: 180, markScale: 0.46 },
    { file: 'icon-167.png', w: 167, h: 167, markScale: 0.46 },
    { file: 'icon-152.png', w: 152, h: 152, markScale: 0.46 },
    { file: 'icon-120.png', w: 120, h: 120, markScale: 0.46 },
    { file: 'splash-2732.png', w: 2732, h: 2732, markScale: 0.28 },
    { file: 'splash-1290x2796.png', w: 1290, h: 2796, markScale: 0.22 },
    { file: 'splash-1242x2688.png', w: 1242, h: 2688, markScale: 0.22 },
    { file: 'splash-1170x2532.png', w: 1170, h: 2532, markScale: 0.22 },
    { file: 'splash-2048x2732.png', w: 2048, h: 2732, markScale: 0.2 },
];

mkdirSync(outDir, { recursive: true });
for (const item of kit) {
    const rgba = drawBrand(item.w, item.h, { markScale: item.markScale });
    const abs = writePng(item.file, item.w, item.h, rgba);
    console.log(`wrote ${abs.replace(`${root}/`, '')} (${item.w}×${item.h})`);
}
copyPublicAppleTouch();
console.log('wrote public/apple-touch-icon.png');

const iosIcon = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const iosSplashDir = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
try {
    writeFileSync(iosIcon, readFileSync(join(outDir, 'AppIcon-1024.png')));
    const splash = readFileSync(join(outDir, 'splash-2732.png'));
    writeFileSync(join(iosSplashDir, 'splash-2732x2732.png'), splash);
    writeFileSync(join(iosSplashDir, 'splash-2732x2732-1.png'), splash);
    writeFileSync(join(iosSplashDir, 'splash-2732x2732-2.png'), splash);
    console.log('copied kit into ios/App/App/Assets.xcassets');
} catch {
    console.log('ios/ asset catalog not present yet — run npx cap add ios, then npm run ios:assets');
}

writeFileSync(join(outDir, 'CONTENTS.md'), `# iOS store icon + splash kit

Generated from the in-repo Venn brand (overlapping circles + crosshair on \`#1a0533\` → \`#0a0118\`).
Re-run with \`npm run ios:assets\`. All PNGs are opaque RGB (App Store rule).

| File | Size | Use |
|------|------|-----|
| AppIcon-1024.png | 1024×1024 | App Store / marketing icon |
| icon-180.png | 180×180 | iPhone @3x |
| icon-167.png | 167×167 | iPad Pro |
| icon-152.png | 152×152 | iPad @2x |
| icon-120.png | 120×120 | iPhone @2x |
| splash-2732.png | 2732×2732 | Universal Capacitor splash source |
| splash-1290x2796.png | 1290×2796 | iPhone 6.7" |
| splash-1242x2688.png | 1242×2688 | iPhone 6.5" |
| splash-1170x2532.png | 1170×2532 | iPhone 6.1" |
| splash-2048x2732.png | 2048×2732 | iPad 12.9" |

Drop \`AppIcon-1024.png\` into \`ios/App/App/Assets.xcassets/AppIcon.appiconset/\` after \`npx cap add ios\` if Xcode's empty slot is still placeholder.
`);
