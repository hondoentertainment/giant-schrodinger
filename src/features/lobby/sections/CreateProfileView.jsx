import React from 'react';
import { Unlock, Image, Film, Music } from 'lucide-react';
import { THEMES, getThemeById, MEDIA_TYPES } from '../../../data/themes';
import { isAvatarUnlocked, isThemeUnlocked } from '../../../services/stats';
import { UnlockModal } from '../../../components/UnlockModal';
import { CustomImagesManager } from '../../../components/CustomImagesManager';
import { useTranslation } from '../../../hooks/useTranslation';

export function CreateProfileView({
    AVATARS,
    name,
    setName,
    avatar,
    setAvatar,
    themeId,
    setThemeId,
    scoringMode,
    setScoringMode,
    mediaType,
    setMediaType,
    useCustomImages,
    setUseCustomImages,
    customImages,
    refreshCustomImages,
    sessionLength,
    setSessionLength,
    stats,
    milestones,
    showUnlockModal,
    setShowUnlockModal,
    handleSubmit,
}) {
    const { t } = useTranslation();
    const theme = getThemeById(themeId);

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
            {showUnlockModal && <UnlockModal onClose={() => setShowUnlockModal(false)} />}
            <h2 className="text-2xl font-display font-bold text-white mb-2 text-center">{t('lobby.createProfile')}</h2>
            <p className="text-white/50 text-sm text-center mb-6">{t('lobby.customizeExperience')}</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <section aria-labelledby="profile-username">
                    <label id="profile-username" className="block text-sm font-medium text-white/60 mb-2">{t('lobby.username')}</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg pr-14"
                            placeholder={t('lobby.enterName')}
                            maxLength={12}
                            aria-describedby="name-char-count"
                            aria-invalid={!name.trim()}
                        />
                        <span
                            id="name-char-count"
                            className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm tabular-nums ${name.length >= 10 ? 'text-amber-400' : 'text-white/40'}`}
                            aria-live="polite"
                        >
                            {name.length}/12
                        </span>
                    </div>
                </section>

                <section aria-labelledby="profile-avatar">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-avatar" className="block text-sm font-medium text-white/60">{t('lobby.avatar')}</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="How to unlock more avatars"
                        >
                            <Unlock className="w-3 h-3" />
                            {t('lobby.unlockMore')}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2" role="group">
                        {AVATARS.map((a) => {
                            const locked = !isAvatarUnlocked(a, stats);
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => !locked && setAvatar(a)}
                                    disabled={locked}
                                    aria-pressed={avatar === a}
                                    aria-label={locked ? `Locked. Unlock with milestones.` : `Select avatar ${a}`}
                                    className={`aspect-square min-w-[44px] min-h-[44px] rounded-xl text-2xl flex items-center justify-center transition-all relative
                                        ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                        ${avatar === a ? 'bg-white/20 shadow-inner scale-95 ring-2 ring-purple-500' : 'bg-white/5 hover:bg-white/10'}
                                    `}
                                    title={locked ? 'Unlock with milestones' : a}
                                >
                                    {a}
                                    {locked && <span className="absolute bottom-0 right-0 text-xs" aria-hidden="true">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="profile-theme">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-theme" className="block text-sm font-medium text-white/60">{t('lobby.theme')}</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="How to unlock Mystery Box theme"
                        >
                            <Unlock className="w-3 h-3" />
                            {t('lobby.unlock')}
                        </button>
                    </div>
                    <div className="flex gap-2 justify-between flex-wrap" role="group">
                        {THEMES.map((t) => {
                            const locked = !isThemeUnlocked(t.id, stats);
                            const timeLimit = t.modifier?.timeLimit || 60;
                            const mult = t.modifier?.scoreMultiplier || 1;
                            const title = locked
                                ? 'Play 1 round per day for 7 days to unlock'
                                : `${t.label}: ${timeLimit}s · x${mult.toFixed(1)} multiplier`;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => !locked && setThemeId(t.id)}
                                    disabled={locked}
                                    aria-pressed={themeId === t.id}
                                    aria-label={locked ? `${t.label} — locked` : title}
                                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-gradient-to-br ${t.gradient} transition-all relative
                                        ${locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                        ${themeId === t.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}
                                    `}
                                    title={title}
                                >
                                    {locked && <span className="absolute -top-1 -right-1 text-xs" aria-hidden="true">🔒</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-center text-white/50 text-sm">
                        {theme.label}
                        {theme.unlockMilestone && !isThemeUnlocked(theme.id, stats)
                            ? ` — Play 1 round/day for 7 days to unlock`
                            : ` · ${theme.modifier?.timeLimit || 60}s · x${(theme.modifier?.scoreMultiplier || 1).toFixed(1)}`
                        }
                    </div>
                </section>

                <section aria-labelledby="profile-scoring">
                    <label id="profile-scoring" className="block text-sm font-medium text-white/60 mb-2">{t('lobby.scoring')}</label>
                    <div className="grid grid-cols-2 gap-3" role="group">
                        <button
                            type="button"
                            onClick={() => setScoringMode('human')}
                            aria-pressed={scoringMode === 'human'}
                            aria-label={t('lobby.manualJudgeDesc')}
                            className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'human'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {t('lobby.manualJudge')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setScoringMode('ai')}
                            aria-pressed={scoringMode === 'ai'}
                            aria-label={t('lobby.aiJudgeDesc')}
                            className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${scoringMode === 'ai'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            {t('lobby.aiJudge')}
                        </button>
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {scoringMode === 'human'
                            ? t('lobby.manualJudgeDesc')
                            : t('lobby.aiJudgeDesc')
                        }
                    </p>
                </section>

                {mediaType === MEDIA_TYPES.IMAGE && mediaType !== 'mixed' && (
                    <section aria-labelledby="profile-custom-images">
                        <CustomImagesManager
                            customImages={customImages}
                            onRefresh={refreshCustomImages}
                            useCustomImages={useCustomImages}
                            onUseCustomImagesChange={setUseCustomImages}
                        />
                    </section>
                )}

                <section aria-labelledby="profile-media">
                    <label id="profile-media" className="block text-sm font-medium text-white/60 mb-2">{t('lobby.mediaType')}</label>
                    <div className="grid grid-cols-4 gap-3" role="group">
                        {[
                            { type: MEDIA_TYPES.IMAGE, label: 'Images', Icon: Image, desc: 'Classic visual Venn' },
                            { type: MEDIA_TYPES.VIDEO, label: 'Videos', Icon: Film, desc: 'Looping video clips' },
                            { type: MEDIA_TYPES.AUDIO, label: 'Audio', Icon: Music, desc: 'Sound-based connections' },
                        ].map(({ type, label, Icon, desc }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setMediaType(type)}
                                aria-pressed={mediaType === type}
                                aria-label={`${label} — ${desc}`}
                                className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${mediaType === type
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setMediaType('mixed')}
                            aria-pressed={mediaType === 'mixed'}
                            aria-label="Mixed — random media type each round"
                            className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-1 ${mediaType === 'mixed'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <span className="text-lg">🎲</span>
                            Mixed
                        </button>
                    </div>
                    <p className="mt-2 text-center text-white/50 text-xs">
                        {mediaType === MEDIA_TYPES.IMAGE && t('lobby.imagesDesc')}
                        {mediaType === MEDIA_TYPES.VIDEO && t('lobby.videosDesc')}
                        {mediaType === MEDIA_TYPES.AUDIO && t('lobby.audioDesc')}
                        {mediaType === 'mixed' && 'Mixed mode — random media type each round.'}
                    </p>
                </section>

                <section aria-labelledby="profile-progress">
                    <div className="flex items-center justify-between mb-2">
                        <label id="profile-progress" className="block text-sm font-medium text-white/60">{t('lobby.progress')}</label>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            aria-label="View unlock progress"
                        >
                            <Unlock className="w-3 h-3" />
                            {t('lobby.details')}
                        </button>
                    </div>
                    <p className="text-white/50 text-xs mb-2">
                        {t('lobby.streakInfo')}
                    </p>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">{t('lobby.roundsPlayed')}</span>
                            <span className="text-white font-semibold">{stats.totalRounds}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-white/60">{t('lobby.bestStreak')}</span>
                            <span className="text-amber-400 font-semibold">{stats.maxStreak} days</span>
                        </div>
                        {stats.currentStreak > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-white/60">{t('lobby.currentStreak')}</span>
                                <span className="text-emerald-400 font-semibold">🔥 {stats.currentStreak} days</span>
                            </div>
                        )}
                        {milestones.filter((m) => !stats.milestonesUnlocked.includes(m.id)).length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                                {milestones.filter((m) => !stats.milestonesUnlocked.includes(m.id)).slice(0, 2).map((m) => {
                                    const value = m.type === 'rounds' ? stats.totalRounds : stats.currentStreak;
                                    const pct = Math.min(100, (value / m.threshold) * 100);
                                    return (
                                        <div key={m.id} className="flex items-center gap-2">
                                            <span className="text-xs text-white/40 w-24 truncate">🔒 {m.label}</span>
                                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/50 tabular-nums">{value}/{m.threshold}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                <section aria-labelledby="profile-session">
                    <label id="profile-session" className="block text-sm font-medium text-white/60 mb-2">{t('lobby.sessionLength')}</label>
                    <div className="grid grid-cols-3 gap-3" role="group">
                        {[3, 5, 7].map((rounds) => (
                            <button
                                key={rounds}
                                type="button"
                                onClick={() => setSessionLength(rounds)}
                                aria-pressed={sessionLength === rounds}
                                aria-label={`${rounds} ${t('lobby.rounds').toLowerCase()}`}
                                className={`min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-all ${sessionLength === rounds
                                        ? 'bg-white text-black shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {t('lobby.nRounds', { n: rounds })}
                            </button>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4"
                >
                    {t('lobby.joinLobby')}
                </button>
            </form>
        </div>
    );
}
