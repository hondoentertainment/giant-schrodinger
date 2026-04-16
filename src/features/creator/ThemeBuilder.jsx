import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { createCustomTheme, getCustomThemes, deleteCustomTheme, shareThemeUrl, getFeaturedThemes, calculateMultiplier, exportThemeAsLink } from '../../services/themeBuilder';
import { ArrowLeft, Plus, Copy, Trash2, Palette, Clock, Star } from 'lucide-react';

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

    // Form state
    const [name, setName] = useState('');
    const [selectedPalette, setSelectedPalette] = useState(0);
    const [timer, setTimer] = useState(60);
    const [imageUrls, setImageUrls] = useState('');
    const [creating, setCreating] = useState(false);

    // Data
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
            setName('');
            setSelectedPalette(0);
            setTimer(60);
            setImageUrls('');
            setRefreshKey((k) => k + 1);
        } catch (err) {
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
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Theme Builder</h1>
                        <p className="text-white/40 text-sm">Create and share custom themes</p>
                    </div>
                </div>

                {/* Create Theme Form */}
                <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 space-y-5">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Plus className="w-5 h-5 text-purple-400" />
                        <span>New Theme</span>
                    </div>

                    {/* Theme Name */}
                    <div className="space-y-2">
                        <label htmlFor="theme-builder-name" className="text-sm text-white/60 font-medium">Theme Name</label>
                        <input
                            id="theme-builder-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Retro Vibes"
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
                        />
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-2">
                        <span className="text-sm text-white/60 font-medium flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Color Palette
                        </span>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PALETTES.map((palette, i) => (
                                <button
                                    key={palette}
                                    onClick={() => setSelectedPalette(i)}
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette} transition-all ${
                                        selectedPalette === i
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                            : 'opacity-60 hover:opacity-90'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Timer Slider */}
                    <div className="space-y-2">
                        <label htmlFor="theme-builder-timer" className="text-sm text-white/60 font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Timer: {timer}s
                        </label>
                        <input
                            id="theme-builder-timer"
                            type="range"
                            min={30}
                            max={90}
                            step={5}
                            value={timer}
                            onChange={(e) => setTimer(Number(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-white/30">
                            <span>30s (Hard)</span>
                            <span>90s (Easy)</span>
                        </div>
                    </div>

                    {/* Multiplier */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                        <span className="text-sm text-white/60">Score Multiplier</span>
                        <span className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br ${COLOR_PALETTES[selectedPalette]}`}>
                            {multiplier}x
                        </span>
                    </div>

                    {/* Image URLs */}
                    <div className="space-y-2">
                        <label htmlFor="theme-builder-images" className="text-sm text-white/60 font-medium">Image URLs (one per line)</label>
                        <textarea
                            id="theme-builder-images"
                            value={imageUrls}
                            onChange={(e) => setImageUrls(e.target.value)}
                            rows={5}
                            placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none text-sm"
                        />
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className={`w-full py-3 rounded-2xl font-bold text-lg transition-all bg-gradient-to-r ${COLOR_PALETTES[selectedPalette]} hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {creating ? 'Creating...' : 'Create Theme'}
                    </button>
                </div>

                {/* My Themes */}
                {customThemes.length > 0 && (
                    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Palette className="w-5 h-5 text-cyan-400" />
                            <span>My Themes</span>
                            <span className="ml-auto text-sm text-white/30">{customThemes.length}</span>
                        </div>

                        <div className="space-y-3">
                            {customThemes.map((theme) => (
                                <div
                                    key={theme.id}
                                    className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.colorPalette} shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">{theme.name}</div>
                                            <div className="text-xs text-white/40">
                                                {theme.timerSeconds}s &middot; {theme.multiplier}x &middot; {theme.imageUrls?.length || 0} images
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <span className="font-mono bg-white/5 px-2 py-1 rounded-lg truncate">
                                            {theme.code || 'No code'}
                                        </span>
                                        <span className="ml-auto">{theme.playCount || 0} plays</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleCopyLink(theme.code)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy Share Link
                                        </button>
                                        <button
                                            onClick={() => {
                                                const link = exportThemeAsLink(theme);
                                                navigator.clipboard?.writeText(link).then(() => {
                                                    addToast('Theme link copied!', 'success');
                                                }).catch(() => {
                                                    addToast('Could not copy theme link', 'error');
                                                });
                                            }}
                                            className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition"
                                        >
                                            Share Theme Link
                                        </button>
                                        <button
                                            onClick={() => handleDelete(theme.id)}
                                            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Featured Themes */}
                {featuredThemes.length > 0 && (
                    <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 space-y-4">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            <Star className="w-5 h-5 text-amber-400" />
                            <span>Featured Themes</span>
                        </div>

                        <div className="space-y-3">
                            {featuredThemes.map((theme, i) => (
                                <div
                                    key={theme.id}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.colorPalette} shrink-0 flex items-center justify-center text-sm font-bold`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{theme.name}</div>
                                        <div className="text-xs text-white/40">
                                            by {theme.creatorName} &middot; {theme.playCount || 0} plays
                                        </div>
                                    </div>
                                    <div className={`text-lg font-black text-transparent bg-clip-text bg-gradient-to-br ${theme.colorPalette}`}>
                                        {theme.multiplier}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
