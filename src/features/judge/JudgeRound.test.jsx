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

// Mock JudgeCalibration to skip calibration gate
vi.mock('./JudgeCalibration', () => ({
    JudgeCalibration: ({ onComplete }) => (
        <button data-testid="skip-calibration" onClick={onComplete}>Skip Calibration</button>
    ),
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
        shareFrom: 'Alice',
        collisionId: 'test-collision-1',
        roundId: 'round-1',
    };
    const mockOnDone = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mark judge as calibrated so calibration gate is skipped
        localStorage.setItem('venn_judge_calibrated', 'true');
    });

    it('shows quick judge buttons (Fire, Solid, Meh)', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByText('Fire')).toBeInTheDocument();
        expect(screen.getByText('Solid')).toBeInTheDocument();
        expect(screen.getByText('Meh')).toBeInTheDocument();
    });

    it('quick judge buttons submit appropriate scores', async () => {
        const { saveJudgement } = await import('../../services/judgements');
        const user = userEvent.setup();
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);

        const fireBtn = screen.getByText('Fire').closest('button');
        await user.click(fireBtn);

        expect(saveJudgement).toHaveBeenCalledWith(
            'round-1',
            expect.objectContaining({ score: 10 })
        );
        expect(mockToast.success).toHaveBeenCalledWith('Judgement submitted!');
    });

    it('Solid button submits score of 8', async () => {
        const { saveJudgement } = await import('../../services/judgements');
        const user = userEvent.setup();
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);

        const solidBtn = screen.getByText('Solid').closest('button');
        await user.click(solidBtn);

        expect(saveJudgement).toHaveBeenCalledWith(
            'round-1',
            expect.objectContaining({ score: 8 })
        );
    });

    it('Meh button submits score of 5', async () => {
        const { saveJudgement } = await import('../../services/judgements');
        const user = userEvent.setup();
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);

        const mehBtn = screen.getByText('Meh').closest('button');
        await user.click(mehBtn);

        expect(saveJudgement).toHaveBeenCalledWith(
            'round-1',
            expect.objectContaining({ score: 5 })
        );
    });

    it('shows the submission text being judged', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByText(/They both have fur/)).toBeInTheDocument();
    });

    it('shows the judge heading', () => {
        render(<JudgeRound payload={mockPayload} onDone={mockOnDone} />);
        expect(screen.getByText(/Judge a Friend/)).toBeInTheDocument();
    });
});
