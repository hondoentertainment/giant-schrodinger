import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JudgeRound } from './JudgeRound';

// ── Mock ToastContext ──
const mockToast = { error: vi.fn(), success: vi.fn(), info: vi.fn(), warn: vi.fn() };

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

// ── Mock services ──
vi.mock('../../services/judgements', () => ({
    saveJudgement: vi.fn(),
}));

vi.mock('../../services/backend', () => ({
    saveJudgementToBackend: vi.fn().mockResolvedValue(true),
    getSharedRound: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/share', () => ({
    clearJudgeFromUrl: vi.fn(),
}));

vi.mock('../../hooks/useFocusTrap', () => ({
    useFocusTrap: vi.fn(),
}));

// Mock VennDiagram to simplify rendering
vi.mock('../round/VennDiagram', () => ({
    VennDiagram: ({ leftAsset, rightAsset }) => (
        <div data-testid="venn-diagram">
            <span>{leftAsset?.label}</span>
            <span>{rightAsset?.label}</span>
        </div>
    ),
}));

describe('JudgeRound', () => {
    const mockPayload = {
        assets: {
            left: { id: 'cat', label: 'Cat', type: 'image', url: 'https://example.com/cat.jpg' },
            right: { id: 'dog', label: 'Dog', type: 'image', url: 'https://example.com/dog.jpg' },
        },
        submission: 'They both have fur',
        imageUrl: 'https://example.com/fusion.jpg',
        shareFrom: 'Alice',
        collisionId: 'test-collision-1',
        roundId: 'round-1',
    };
    const mockOnDone = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the score form fields', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByPlaceholderText('10')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Highly Logical')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Share your verdict...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit Judgement/i })).toBeInTheDocument();
    });

    it('submits a score through the form', async () => {
        const { saveJudgement } = await import('../../services/judgements');
        const user = userEvent.setup();
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);

        await user.type(screen.getByPlaceholderText('10'), '10');
        await user.click(screen.getByRole('button', { name: /Submit Judgement/i }));

        expect(saveJudgement).toHaveBeenCalledWith(
            expect.objectContaining({
                roundId: 'round-1',
                collisionId: 'test-collision-1',
                judgement: expect.objectContaining({ score: 10 }),
            })
        );
        expect(mockToast.success).toHaveBeenCalledWith('Judgement submitted!');
    });

    it('shows the submission text being judged', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByText(/They both have fur/)).toBeInTheDocument();
    });

    it('shows the judge heading', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByText(/Judge a Friend/)).toBeInTheDocument();
    });

    it('shows shared fusion image context when available', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByAltText(/Fusion created from this connection/i)).toHaveAttribute('src', mockPayload.imageUrl);
        expect(screen.getByText(/Alice made a Venn connection/i)).toBeInTheDocument();
    });
});
