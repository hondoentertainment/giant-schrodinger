import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { createCustomTheme, getCustomThemes, deleteCustomTheme, shareThemeUrl, getFeaturedThemes, calculateMultiplier, exportThemeAsLink } from '../../services/themeBuilder';
import { Plus, Copy, Trash2, Palette, Clock, Star } from 'lucide-react';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';
import { haptic } from '../../lib/haptics';

const COLOR_PALETTES = [
    'from-purple-500 to-pink-500',
    'from-cyan-400 to-blue-500',
    'from-amber-400 to-red-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-purple-500',
    'from-indigo-400 to-violet-500',
];

export function ThemeBuilder({ onBack }) {
    const { user } = useGame();
    const { addToast } = useToast();

    const [name, setName] = useState('');
    const [selectedPalette, setSelectedPalette] = useState(0);
    const [timer, setTimer] = useState(60);
    const [imageUrls, setImageUrls] = useState('');
    const [creating, setCreating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const customThemes = useMemo(() => getCustomThemes(), [refreshKey]);
    const featuredThemes = useMemo(() => getFeaturedThemes(), [refreshKey]);
    const multiplier = useMemo(() => calculateMultiplier(timer).toFixed(2), [timer]);

    const handleCreate = async () => {
        if (!name.trim()) {
            addToast('Please enter a theme name', 'error');
            return;
        }

        const urls = imageUrls
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean);

        if (urls.length < 2) {
            addToast('Add at least 2 image URLs', 'error');
            return;
        }

        setCreating(true);
        try {
            createCustomTheme({
                name: name.trim(),
                colorPalette: COLOR_PALETTES[selectedPalette],
                timerSeconds: timer,
                multiplier: parseFloat(multiplier),
                imageUrls: urls,
                creatorName: user?.name || 'Anonymous',
            });

            addToast('Theme created!', 'success');
            haptic('success');
            setName('');
            setSelectedPalette(0);
            setTimer(60);
            setImageUrls('');
            setRefreshKey((k) => k + 1);
        } catch {
            addToast('Failed to create theme', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (themeId) => {
        deleteCustomTheme(themeId);
        addToast('Theme deleted', 'success');
        setRefreshKey((k) => k + 1);
    };

    const handleCopyLink = (shareCode) => {
        const url = shareThemeUrl(shareCode);
        navigator.clipboard.writeText(url).then(() => {
            addToast('Share link copied!', 'success');
        }).catch(() => {
            addToast('Could not copy link', 'error');
        });
    };

    return (
        <GameScreenShell onBack={onBack} title="Theme Builder" icon={Palette} maxWidth="max-w-xl" backLabel="Back to lobby">
            <section className="wordle-card p-5 space-y-5 mb-6 !shadow-none">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <Plus className="w-5 h-5 text-game-accent" />
                    <span>New Theme</span>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium">Theme Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Retro Vibes"
                        className="game-input"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color Palette
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {COLOR_PALETTES.map((palette, i) => (
                            <button
                                key={palette}
                                type="button"
                                onClick={() => setSelectedPalette(i)}
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette} transition-all min-h-[44px] ${
                                    selectedPalette === i
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#07070a] scale-110'
                                        : 'opacity-60 hover:opacity-90'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timer: {timer}s
                    </label>
                    <input
                        type="range"
                        min={30}
                        max={90}
                        step={5}
                        value={timer}
                        onChange={(e) => setTimer(Number(e.target.value))}
                        className="w-full accent-[#0A84FF]"
                    />
                    <div className="flex justify-between text-xs text-white/30">
                        <span>30s (Hard)</span>
                        <span>90s (Easy)</span>
                    </div>
                </div>

                <div className="game-highlight-banner flex items-center justify-between">
                    <span className="text-sm text-white/60">Score Multiplier</span>
                    <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${COLOR_PALETTES[selectedPalette]}`}>
                        {multiplier}x
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-white/60 font-medium">Image URLs (one per line)</label>
                    <textarea
                        value={imageUrls}
                        onChange={(e) => setImageUrls(e.target.value)}
                        rows={5}
                        placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
                        className="game-input resize-none text-sm min-h-[120px]"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full wordle-button wordle-primary text-lg disabled:opacity-50"
                >
                    {creating ? 'Creating...' : 'Create Theme'}
                </button>
            </section>

            {customThemes.length > 0 ? (
                <section className="wordle-card p-5 space-y-4 mb-6 !shadow-none">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Palette className="w-5 h-5 text-cyan-300" />
                        <span>My Themes</span>
                        <span className="ml-auto text-sm text-white/30">{customThemes.length}</span>
                    </div>

                    <div className="space-y-3">
                        {customThemes.map((theme) => (
                            <div
                                key={theme.id}
                                className="game-list-row flex-col items-stretch !py-4 space-y-3"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.colorPalette} shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{theme.name}</div>
                                        <div className="text-xs text-white/40">
                                            {theme.timerSeconds}s · {theme.multiplier}x · {theme.imageUrls?.length || 0} images
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-white/40 w-full">
                                    <span className="font-mono bg-white/5 px-2 py-1 rounded-lg truncate">
                                        {theme.code || 'No code'}
                                    </span>
                                    <span className="ml-auto">{theme.playCount || 0} plays</span>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <button
                                        type="button"
                                        onClick={() => handleCopyLink(theme.code)}
                                        className="flex-1 wordle-button text-sm flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const link = exportThemeAsLink(theme);
                                            navigator.clipboard?.writeText(link).then(() => {
                                                addToast('Theme link copied!', 'success');
                                            }).catch(() => {
                                                addToast('Could not copy theme link', 'error');
                                            });
                                        }}
                                        className="wordle-button text-sm text-game-accent border border-game-accent/30"
                                    >
                                        Share
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(theme.id)}
                                        className="px-4 wordle-button text-sm text-red-400 border border-red-500/20"
                                        aria-label="Delete theme"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <EmptyState
                    icon="🎨"
                    title="No custom themes yet"
                    description="Create your first theme above and share it with friends."
                    className="mb-6"
                />
            )}

            {featuredThemes.length > 0 && (
                <section className="wordle-card p-5 space-y-4 !shadow-none">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Star className="w-5 h-5 text-amber-300" />
                        <span>Featured Themes</span>
                    </div>

                    <div className="space-y-3">
                        {featuredThemes.map((theme, i) => (
                            <div
                                key={theme.id}
                                className="game-list-row"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.colorPalette} shrink-0 flex items-center justify-center text-sm font-bold`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate">{theme.name}</div>
                                    <div className="text-xs text-white/40">
                                        by {theme.creatorName} · {theme.playCount || 0} plays
                                    </div>
                                </div>
                                <div className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-br ${theme.colorPalette}`}>
                                    {theme.multiplier}x
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </GameScreenShell>
    );
}
