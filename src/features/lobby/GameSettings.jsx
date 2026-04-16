import React from 'react';
import { MEDIA_TYPES } from '../../data/themes';
import { CustomImagesManager } from '../../components/CustomImagesManager';
import { getBuiltInPacks, getCustomPacks } from '../../services/promptPacks';

export function GameSettings({
    user,
    login,
    scoringMode,
    setScoringMode,
    sessionLength,
    setSessionLength,
    sessionId,
    customImages,
    refreshCustomImages,
    useCustomImages,
    onUseCustomImagesChange,
}) {
    return (
        <>
            {/* Scoring mode toggle */}
            <div className="mb-4" role="group" aria-labelledby="game-settings-scoring-label">
                <span id="game-settings-scoring-label" className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">Scoring</span>
                <div className="flex gap-2 justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            setScoringMode('human');
                            login({ ...user, scoringMode: 'human' });
                        }}
                        aria-pressed={scoringMode === 'human'}
                        aria-label="Manual judge — you or a friend score each round"
                        className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'human'
                            ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        Manual Judge
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setScoringMode('ai');
                            login({ ...user, scoringMode: 'ai' });
                        }}
                        aria-pressed={scoringMode === 'ai'}
                        aria-label="AI judge — Gemini scores your connections automatically"
                        className={`min-h-[44px] py-2.5 px-5 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'ai'
                            ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        AI Judge
                    </button>
                </div>
                <p className="text-center text-white/40 text-xs mt-1">
                    {scoringMode === 'human'
                        ? 'You or a friend score each round manually.'
                        : 'Gemini AI scores your connections automatically.'
                    }
                </p>
            </div>
            {(user?.mediaType || MEDIA_TYPES.IMAGE) === MEDIA_TYPES.IMAGE && (
                <div className="mb-4">
                    <CustomImagesManager
                        customImages={customImages}
                        onRefresh={refreshCustomImages}
                        useCustomImages={useCustomImages}
                        onUseCustomImagesChange={onUseCustomImagesChange}
                    />
                </div>
            )}

            {/* Prompt Pack Selector */}
            <div className="w-full max-w-md mb-4">
                <label htmlFor="game-settings-prompt-pack" className="block text-white/50 text-xs uppercase tracking-wider mb-2">Concept Pack</label>
                <select
                    id="game-settings-prompt-pack"
                    value={user?.promptPack || ''}
                    onChange={(e) => login({ ...user, promptPack: e.target.value || null })}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="">Random (Default)</option>
                    {getBuiltInPacks().map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.name} — {pack.description}</option>
                    ))}
                    {getCustomPacks().map(pack => (
                        <option key={pack.id} value={pack.id}>{pack.name} (Custom)</option>
                    ))}
                </select>
            </div>

            {/* Session length (only when not in active session) */}
            {!sessionId && (
                <div className="mb-4" role="group" aria-labelledby="game-settings-session-length-label">
                    <span id="game-settings-session-length-label" className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2 text-center">Session length</span>
                    <div className="flex gap-2 justify-center">
                        {[3, 5, 7].map((rounds) => (
                            <button
                                key={rounds}
                                type="button"
                                onClick={() => setSessionLength(rounds)}
                                aria-pressed={sessionLength === rounds}
                                aria-label={`${rounds} rounds`}
                                className={`min-w-[52px] min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                                    sessionLength === rounds
                                        ? 'bg-white text-black shadow-lg ring-2 ring-white/50'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {rounds}
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-white/40 text-xs mt-1">{sessionLength} rounds · beat your average</p>
                </div>
            )}
        </>
    );
}
