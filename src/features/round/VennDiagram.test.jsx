import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
