import { afterEach, describe, expect, it, vi } from 'vitest';
import { LINK_COPIED_MESSAGE, shareOrCopy } from './shareOrCopy';

describe('shareOrCopy', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses the native share sheet when available', async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

        const result = await shareOrCopy({
            title: 'Judge my Venn connection',
            text: 'Score this line',
            url: 'https://example.com/judge/1',
        });

        expect(share).toHaveBeenCalledWith({
            title: 'Judge my Venn connection',
            text: 'Score this line',
            url: 'https://example.com/judge/1',
        });
        expect(result).toEqual({ method: 'share_sheet', copied: false });
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('returns dismissed when the share sheet is cancelled', async () => {
        const share = vi.fn().mockRejectedValue(Object.assign(new Error('nope'), { name: 'AbortError' }));
        const writeText = vi.fn();
        vi.stubGlobal('navigator', { share, clipboard: { writeText } });

        await expect(shareOrCopy({ url: 'https://example.com' })).resolves.toEqual({
            method: 'dismissed',
            copied: false,
        });
        expect(writeText).not.toHaveBeenCalled();
    });

    it('copies to the clipboard when share is unavailable', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { clipboard: { writeText } });

        const result = await shareOrCopy({
            text: 'My best Venn: "green roommate"',
            url: 'https://example.com',
        });

        expect(writeText).toHaveBeenCalledWith('My best Venn: "green roommate" https://example.com');
        expect(result).toEqual({ method: 'clipboard', copied: true });
        expect(LINK_COPIED_MESSAGE).toBe('Link copied');
    });
});
