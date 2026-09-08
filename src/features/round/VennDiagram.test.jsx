import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VennDiagram } from './VennDiagram';
import { MEDIA_TYPES } from '../../data/themes';
import { trackEvent } from '../../services/analytics';
import { haptic } from '../../lib/haptics';

vi.mock('../../services/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('../../lib/haptics', () => ({
    haptic: vi.fn(),
}));

const CAT = { id: 'a', label: 'Cat', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/cat.jpg' };
const DOG = { id: 'b', label: 'Dog', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/dog.jpg' };

const leftCaption = () => screen.getByRole('button', { name: 'Left concept: Cat' });
const rightCaption = () => screen.getByRole('button', { name: 'Right concept: Dog' });
const circle = (side) => screen.getByTestId(`venn-hit-${side}`).closest('.venn-circle');

describe('VennDiagram', () => {
    beforeEach(() => {
        HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        vi.mocked(trackEvent).mockClear();
        vi.mocked(haptic).mockClear();
    });
    it('renders per-side meme and video badges with matching captions', () => {
        render(
            <VennDiagram
                leftAsset={{
                    id: 'left-meme',
                    label: 'Big Brain Moment',
                    type: MEDIA_TYPES.MEME,
                    url: 'https://example.com/meme.jpg',
                }}
                rightAsset={{
                    id: 'right-video',
                    label: 'City Pulse',
                    type: MEDIA_TYPES.VIDEO,
                    url: 'https://example.com/video.mp4',
                    posterUrl: 'https://example.com/poster.jpg',
                }}
            />
        );

        expect(screen.getAllByText('Meme').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Video').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Big Brain Moment')).toBeInTheDocument();
        expect(screen.getByText('City Pulse')).toBeInTheDocument();
        expect(screen.getByAltText('Big Brain Moment')).toBeInTheDocument();
    });

    it('renders YouTube embed for YouTube video assets', () => {
        render(
            <VennDiagram
                leftAsset={{
                    id: 'yt-left',
                    label: 'Tutorial Clip',
                    type: MEDIA_TYPES.VIDEO,
                    provider: 'youtube',
                    youtubeId: 'dQw4w9WgXcQ',
                    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    posterUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
                }}
                rightAsset={{
                    id: 'right-meme',
                    label: 'Reaction',
                    type: MEDIA_TYPES.MEME,
                    url: 'https://example.com/meme.jpg',
                }}
            />
        );

        expect(screen.getByTitle('Tutorial Clip')).toBeInTheDocument();
        expect(screen.getByTitle('Tutorial Clip')).toHaveAttribute(
            'src',
            expect.stringContaining('youtube-nocookie.com/embed/dQw4w9WgXcQ')
        );
    });

    it('shows Giphy attribution for API-resolved memes', () => {
        render(
            <VennDiagram
                leftAsset={{
                    id: 'left-giphy',
                    label: 'Reaction GIF',
                    type: MEDIA_TYPES.MEME,
                    url: 'https://media.giphy.com/media/test/giphy.gif',
                    memeSource: 'giphy',
                }}
                rightAsset={{
                    id: 'right-meme',
                    label: 'Static Meme',
                    type: MEDIA_TYPES.MEME,
                    url: 'https://example.com/meme.jpg',
                }}
            />
        );

        expect(screen.getByRole('link', { name: 'Meme via Giphy' })).toHaveAttribute('href', 'https://giphy.com/');
    });

    it('shows concept captions for image-only rounds', () => {
        render(
            <VennDiagram
                leftAsset={{ id: 'a', label: 'Cat', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/cat.jpg' }}
                rightAsset={{ id: 'b', label: 'Dog', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/dog.jpg' }}
            />
        );

        expect(screen.getAllByText('Concept')).toHaveLength(2);
    });

    it('loads still images with a blur shell, responsive sizes, and high fetch priority', () => {
        render(
            <VennDiagram
                leftAsset={{ id: 'a', label: 'Cat', type: MEDIA_TYPES.IMAGE, url: 'https://images.unsplash.com/photo-cat?auto=format&w=1080&h=1080' }}
                rightAsset={{ id: 'b', label: 'Dog', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/dog.jpg', fallbackUrl: 'https://picsum.photos/seed/dog/1080/1080' }}
            />
        );

        const cat = screen.getByAltText('Cat');
        expect(cat).toHaveAttribute('fetchpriority', 'high');
        expect(cat).toHaveAttribute('decoding', 'async');
        expect(cat).toHaveAttribute('srcset', expect.stringContaining('400w'));
        expect(cat).toHaveAttribute('sizes');
        expect(screen.getAllByRole('status', { name: /Loading (Cat|Dog)/ })).toHaveLength(2);

        const dog = screen.getByAltText('Dog');
        fireEvent.error(dog);
        expect(screen.getByAltText('Dog')).toHaveAttribute('src', 'https://picsum.photos/seed/dog/1080/1080');
        fireEvent.error(screen.getByAltText('Dog'));
        expect(screen.queryByAltText('Dog')).not.toBeInTheDocument();
        expect(screen.getByText('Dog', { selector: 'div' })).toBeInTheDocument();
    });

    describe('side selection', () => {
        it('starts with neither side selected and one accessible control per side', () => {
            render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);

            expect(leftCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(circle('left')).toHaveAttribute('data-selected', 'false');
            expect(circle('right')).toHaveAttribute('data-selected', 'false');
            // The pointer hit-areas are not a second set of buttons for assistive tech.
            expect(screen.getByTestId('venn-hit-left')).toHaveAttribute('aria-hidden', 'true');
            expect(screen.getByTestId('venn-hit-left')).toHaveAttribute('tabindex', '-1');
            expect(screen.getAllByRole('button')).toHaveLength(2);
        });

        it('tapping a circle selects it, dims the other side, and announces the change', () => {
            render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);

            fireEvent.click(screen.getByTestId('venn-hit-left'));

            expect(leftCaption()).toHaveAttribute('aria-pressed', 'true');
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(circle('left')).toHaveAttribute('data-selected', 'true');
            expect(circle('left')).toHaveClass('venn-circle--selected');
            expect(circle('right')).toHaveClass('venn-circle--dimmed');
            expect(screen.getByText('Spotlight on Cat (Left)')).toBeInTheDocument();
            expect(haptic).toHaveBeenCalledWith('light');
            expect(trackEvent).toHaveBeenCalledWith('venn_side_selected', {
                side: 'left',
                via: 'circle',
                mediaType: 'image',
            });
        });

        it('tapping the selected circle again clears the selection', () => {
            render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);

            fireEvent.click(screen.getByTestId('venn-hit-right'));
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'true');

            fireEvent.click(screen.getByTestId('venn-hit-right'));
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(circle('left')).not.toHaveClass('venn-circle--dimmed');
            expect(screen.getByText('Spotlight cleared')).toBeInTheDocument();
            // Clearing is not reported as a selection.
            expect(trackEvent).toHaveBeenCalledTimes(1);
        });

        it('captions toggle their own side and switching sides moves the selection', () => {
            render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);

            fireEvent.click(leftCaption());
            expect(leftCaption()).toHaveAttribute('aria-pressed', 'true');
            expect(trackEvent).toHaveBeenLastCalledWith('venn_side_selected', expect.objectContaining({ side: 'left', via: 'caption' }));

            fireEvent.click(rightCaption());
            expect(leftCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'true');
            expect(circle('left')).toHaveClass('venn-circle--dimmed');
        });

        it('arrow keys pick a side and Escape clears it', () => {
            render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);

            fireEvent.keyDown(leftCaption(), { key: 'ArrowRight' });
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'true');
            expect(trackEvent).toHaveBeenLastCalledWith('venn_side_selected', expect.objectContaining({ side: 'right', via: 'keyboard' }));

            fireEvent.keyDown(rightCaption(), { key: 'ArrowLeft' });
            expect(leftCaption()).toHaveAttribute('aria-pressed', 'true');
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'false');

            fireEvent.keyDown(leftCaption(), { key: 'Escape' });
            expect(leftCaption()).toHaveAttribute('aria-pressed', 'false');
            expect(rightCaption()).toHaveAttribute('aria-pressed', 'false');
        });

        it('keeps the answer input focused when a circle is tapped with a pointer', () => {
            render(
                <>
                    <VennDiagram leftAsset={CAT} rightAsset={DOG} />
                    <input aria-label="answer" />
                </>
            );
            const input = screen.getByLabelText('answer');
            input.focus();
            expect(input).toHaveFocus();

            const mouseDown = fireEvent.mouseDown(screen.getByTestId('venn-hit-left'));
            // A cancelled mousedown is what stops the browser from moving focus.
            expect(mouseDown).toBe(false);
            expect(input).toHaveFocus();
        });

        it('resets the selection when a new pair arrives', () => {
            const { rerender } = render(<VennDiagram leftAsset={CAT} rightAsset={DOG} />);
            fireEvent.click(leftCaption());
            expect(leftCaption()).toHaveAttribute('aria-pressed', 'true');

            const OWL = { id: 'c', label: 'Owl', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/owl.jpg' };
            const FOX = { id: 'd', label: 'Fox', type: MEDIA_TYPES.IMAGE, url: 'https://example.com/fox.jpg' };
            rerender(<VennDiagram leftAsset={OWL} rightAsset={FOX} />);

            expect(screen.getByRole('button', { name: 'Left concept: Owl' })).toHaveAttribute('aria-pressed', 'false');
            expect(screen.getByRole('button', { name: 'Right concept: Fox' })).toHaveAttribute('aria-pressed', 'false');
            expect(screen.queryByText(/Spotlight/)).not.toBeInTheDocument();
        });

        it('media controls still work and do not toggle the selection', () => {
            render(
                <VennDiagram
                    leftAsset={CAT}
                    rightAsset={{
                        id: 'clip',
                        label: 'City Pulse',
                        type: MEDIA_TYPES.VIDEO,
                        url: 'https://example.com/video.mp4',
                        posterUrl: 'https://example.com/poster.jpg',
                    }}
                />
            );

            const video = document.querySelector('video');
            fireEvent.loadedData(video);
            // jsdom never flips `paused`, so only the selection side-effects are asserted here.
            fireEvent.click(screen.getByRole('button', { name: 'Pause video' }));
            fireEvent.click(screen.getByRole('button', { name: 'Unmute video' }));

            expect(screen.getByRole('button', { name: 'Right video: City Pulse' })).toHaveAttribute('aria-pressed', 'false');
            expect(circle('right')).toHaveAttribute('data-selected', 'false');
            expect(trackEvent).not.toHaveBeenCalled();
            expect(haptic).not.toHaveBeenCalled();
        });

        it('reports the media type of the selected side', () => {
            render(
                <VennDiagram
                    leftAsset={{ id: 'gif', label: 'Reaction', type: MEDIA_TYPES.MEME, url: 'https://example.com/meme.gif' }}
                    rightAsset={DOG}
                />
            );

            fireEvent.click(screen.getByRole('button', { name: 'Left meme: Reaction' }));
            expect(trackEvent).toHaveBeenCalledWith('venn_side_selected', expect.objectContaining({ side: 'left', mediaType: 'meme' }));
        });
    });
});
