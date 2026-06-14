import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reportAppEvent, reportAppError } from './telemetry';

describe('telemetry helpers', () => {
    beforeEach(() => {
        window.__VWF_TELEMETRY__ = [];
    });

    it('pushes structured events into an array sink', () => {
        reportAppEvent('room_created', { secureMode: true });

        expect(window.__VWF_TELEMETRY__).toHaveLength(1);
        expect(window.__VWF_TELEMETRY__[0]).toMatchObject({
            type: 'event',
            name: 'room_created',
            payload: { secureMode: true },
        });
    });

    it('calls a function sink with error payloads', () => {
        const sink = vi.fn();
        window.__VWF_TELEMETRY__ = sink;

        reportAppError('judge_round', new Error('boom'), { shareMode: 'backend' });

        expect(sink).toHaveBeenCalledTimes(1);
        expect(sink.mock.calls[0][0]).toMatchObject({
            type: 'error',
            scope: 'judge_round',
            payload: { shareMode: 'backend' },
        });
    });
});
