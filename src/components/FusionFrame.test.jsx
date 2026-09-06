import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FusionFrame, buildFusionAlt } from './FusionFrame';

const pair = { leftLabel: 'Cat', rightLabel: 'Dog', submission: 'They both have fur' };

describe('FusionFrame', () => {
    it('builds a descriptive alt from the pair and the line', () => {
        expect(buildFusionAlt(pair)).toBe('Fusion of Cat and Dog: "They both have fur"');
        expect(buildFusionAlt({ submission: 'x' })).toBe('Fusion of the two prompts: "x"');
    });

    it('reserves the square and shows both prompts while rendering', () => {
        render(<FusionFrame image={null} {...pair} />);
        const frame = screen.getByTestId('fusion-frame');
        expect(frame).toHaveAttribute('data-state', 'rendering');
        expect(screen.getByTestId('fusion-rendering')).toBeInTheDocument();
        expect(frame).toHaveTextContent('Cat');
        expect(frame).toHaveTextContent('Dog');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('crossfades the AI render in with priority hints and a caption', () => {
        render(
            <FusionFrame
                image={{ url: 'https://example.com/fusion.png', fallbackUrl: 'https://images.unsplash.com/photo-abc?w=1080', isFallback: false }}
                {...pair}
            />
        );
        const img = screen.getByAltText('Fusion of Cat and Dog: "They both have fur"');
        expect(img).toHaveAttribute('src', 'https://example.com/fusion.png');
        expect(img).toHaveAttribute('loading', 'eager');
        expect(img).toHaveAttribute('decoding', 'async');
        expect(img).toHaveAttribute('fetchpriority', 'high');
        expect(img.className).toContain('opacity-0');
        expect(screen.getByTestId('fusion-frame')).toHaveAttribute('data-state', 'loading');

        fireEvent.load(img);
        expect(img.className).toContain('opacity-100');
        expect(screen.getByTestId('fusion-frame')).toHaveAttribute('data-state', 'ready');
        expect(screen.getByTestId('fusion-source')).toHaveTextContent('AI render');
        expect(screen.getByText('Concept')).toBeInTheDocument();
        expect(screen.getByText('They both have fur')).toBeInTheDocument();
    });

    it('labels curated art honestly', () => {
        render(
            <FusionFrame
                image={{ url: 'https://images.unsplash.com/photo-curated?w=1080', isFallback: true }}
                {...pair}
            />
        );
        expect(screen.getByTestId('fusion-source')).toHaveTextContent('Curated art');
    });

    it('walks url → fallback → text card without ever showing a broken image', () => {
        render(
            <FusionFrame
                image={{ url: 'https://example.com/broken.png', fallbackUrl: 'https://example.com/fallback.png', isFallback: false }}
                {...pair}
            />
        );
        const first = screen.getByRole('img', { name: /Fusion of Cat and Dog/ });
        fireEvent.error(first);

        const second = screen.getByRole('img', { name: /Fusion of Cat and Dog/ });
        expect(second).toHaveAttribute('src', 'https://example.com/fallback.png');
        expect(screen.getByTestId('fusion-source')).toHaveTextContent('Curated art');

        fireEvent.error(second);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByTestId('fusion-failed')).toHaveTextContent('Cat × Dog');
        expect(screen.getByTestId('fusion-failed')).toHaveTextContent('They both have fur');
        expect(screen.getByTestId('fusion-frame')).toHaveAttribute('data-state', 'failed');
    });
});
