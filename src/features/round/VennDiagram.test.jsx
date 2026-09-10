import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VennDiagram } from './VennDiagram';
import { MEDIA_TYPES } from '../../data/themes';

describe('VennDiagram', () => {
    beforeEach(() => {
        HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
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
        expect(screen.getAllByText('Big Brain Moment').length).toBeGreaterThan(0);
        expect(screen.getAllByText('City Pulse').length).toBeGreaterThan(0);
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
        expect(screen.getByText('the overlap')).toBeInTheDocument();
        expect(screen.getByTestId('venn-lens-mobile')).toHaveAttribute('viewBox', '0 0 200 120');
        expect(screen.getByTestId('venn-lens-desktop')).toHaveAttribute('viewBox', '0 0 200 110');
        expect(screen.getAllByText('Cat').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Dog').length).toBeGreaterThanOrEqual(2);
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
});
