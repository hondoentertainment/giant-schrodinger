import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Leaderboard } from '../../components/Leaderboard';
import { ASSET_THEMES } from '../../data/assets';
import { useSound } from '../../hooks/useSound';
import { getHighScores, getBestStreak, getCollisions } from '../../services/storage';
import { getDailyPair, getTimeUntilReset } from '../../services/daily';

const AVATARS = ['👽', '🎨', '🧠', '👾', '🤖', '🔮', '🎪', '🎭'];
const GRADIENTS = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500'
];

// First-time user: Create Profile
function CreateProfile({ onComplete }) {
    const { playSuccess } = useSound();
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [gradient, setGradient] = useState(GRADIENTS[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        playSuccess();
        onComplete({ name, avatar, gradient });
    };

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-8">
                <div className="inline-block px-4 py-1 rounded-full bg-purple-600/20 text-sm font-bold tracking-widest text-purple-400 mb-4 border border-purple-600/30">
                    ✨ NEW PLAYER
                </div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Create Your Player</h2>
                <p className="text-white/60">Choose your avatar and enter the arena</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Preview */}
                <div className="flex justify-center mb-2">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl shadow-2xl ring-4 ring-white/20 animate-in zoom-in duration-500`}>
                        {avatar}
                    </div>
                </div>

                {/* Avatar Picker */}
                <div>
                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-3 text-center">Choose Avatar</label>
                    <div className="grid grid-cols-4 gap-3">
                        {AVATARS.map((a) => (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setAvatar(a)}
                                className={`aspect-square rounded-xl text-3xl flex items-center justify-center btn-kinetic ${avatar === a
                                    ? 'bg-white/20 shadow-inner scale-90 ring-2 ring-purple-500'
                                    : 'bg-white/5 '
                                    }`}
                                aria-label={`Select ${a} as avatar`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Name Input */}
                <div>
                    <label htmlFor="player-name" className="block text-xs text-white/40 uppercase tracking-widest mb-2">Your Name</label>
                    <input
                        id="player-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/30 border-2 border-white/10 rounded-xl px-4 py-4 text-white text-xl text-center placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                        placeholder="Enter your name..."
                        maxLength={12}
                        autoFocus
                    />
                </div>

                {/* Color Theme Picker */}
                <div>
                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-3 text-center">Color Theme</label>
                    <div className="flex gap-3 justify-center">
                        {GRADIENTS.map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGradient(g)}
                                className={`w-12 h-12 rounded-full bg-gradient-to-br ${g} transition-all ${gradient === g
                                    ? 'ring-4 ring-white scale-110 shadow-lg'
                                    : 'opacity-40 hover:opacity-80 hover:scale-105'
                                    }`}
                                aria-label="Select color theme"
                            />
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-5 bg-white text-black font-bold text-xl rounded-2xl btn-kinetic disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.3)] mt-6"
                >
                    ✨ Let's Play!
                </button>
            </form>
        </div>
    );
}

// Returning user: Welcome Back
function WelcomeBack({ user, onPlay, onEditProfile, onGallery }) {
    const [selectedJudge, setSelectedJudge] = useState('ai');
    const [selectedTheme, setSelectedTheme] = useState('random');
    const [selectedSpeed, setSelectedSpeed] = useState(60);
    const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());
    const [dailyPair, setDailyPair] = useState(null);
    const [dailyHighest, setDailyHighest] = useState(0);

    // ... (stats)

    // ... (useEffect)

    // ... (formatTime)

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
            {/* ... (Avatar, Welcome, Stats) ... */}

            {/* Daily Challenge Card - Enforce 60s for fairness */}
            <div className="mb-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-1 rounded-2xl animate-pulse ring-1 ring-purple-500/50">
                {/* ... (Daily content) ... */}
                <button
                    onClick={() => onPlay('daily', 'ai', 'random', 60)}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-lg mb-2"
                >
                    Play Daily #{dailyPair?.id.replace('#', '')}
                </button>
                {/* ... */}
            </div>

            {/* Play Buttons */}
            <div className="space-y-3 mb-6">
                <button
                    onClick={() => onPlay('quick', selectedJudge, selectedTheme, selectedSpeed)}
                    className="w-full py-5 bg-white text-black font-bold text-xl rounded-2xl btn-kinetic shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                    ⚡ Quick Play
                    <span className="block text-sm font-normal text-black/50">1 Round • {selectedSpeed}s</span>
                </button>
                <button
                    onClick={() => onPlay('championship', selectedJudge, selectedTheme, selectedSpeed)}
                    className="w-full py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-xl rounded-2xl btn-kinetic shadow-[0_0_30px_rgba(255,200,0,0.3)]"
                >
                    🏆 Championship
                    <span className="block text-sm font-normal text-white/70">Best of 3 • {selectedSpeed}s</span>
                </button>
            </div>

            {/* Game Options (collapsed) */}
            <details className="mb-6 group">
                <summary className="cursor-pointer text-xs text-white/40 uppercase tracking-widest mb-3 text-center list-none flex items-center justify-center gap-2">
                    ⚙️ Game Options
                    <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="space-y-4 mt-4 animate-in fade-in duration-300">
                    {/* Judge Mode Toggle */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Judge</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedJudge('ai')}
                                className={`flex-1 py-2 px-3 rounded-lg font-medium btn-kinetic ${selectedJudge === 'ai'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-white/60'
                                    }`}
                            >
                                🤖 AI
                            </button>
                            <button
                                onClick={() => setSelectedJudge('human')}
                                className={`flex-1 py-2 px-3 rounded-lg font-medium btn-kinetic ${selectedJudge === 'human'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white/5 text-white/60'
                                    }`}
                            >
                                👤 Human
                            </button>
                        </div>
                    </div>

                    {/* Personality Mode Toggle */}
                    {selectedJudge === 'ai' && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Host Personality</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPersonality('classic')}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium btn-kinetic ${personality === 'classic'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white/5 text-white/60'
                                        }`}
                                >
                                    ⚖️ Classic
                                </button>
                                <button
                                    onClick={() => setPersonality('chaos')}
                                    className={`flex-1 py-2 px-3 rounded-lg font-medium btn-kinetic ${personality === 'chaos'
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-white/5 text-white/60'
                                        }`}
                                >
                                    🔥 Chaos
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Theme Selector */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Theme</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(ASSET_THEMES).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedTheme(key)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedTheme === key
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {theme.emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Speed Selector */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Timer Speed</div>
                        <div className="flex gap-2">
                            {[15, 30, 60, 120].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSpeed(s)}
                                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSpeed === s
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {s}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </details>

            {/* Gallery Button */}
            <button
                onClick={onGallery}
                className="w-full py-3 bg-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
                🖼️ Gallery
            </button>

            {/* Leaderboard */}
            <Leaderboard />

            {/* Edit Profile Link */}
            <button
                onClick={onEditProfile}
                className="w-full mt-4 text-sm text-white/40 hover:text-white transition-colors"
            >
                ✏️ Edit Profile
            </button>
        </div>
    );
}

// Main Lobby Component
export function Lobby() {
    const { user, login, setGameState, startGame } = useGame();

    if (user) {
        return (
            <WelcomeBack
                user={user}
                onPlay={(mode, judge, theme, duration) => startGame(mode, judge, theme, duration)}
                onEditProfile={() => login(null)}
                onGallery={() => setGameState('GALLERY')}
            />
        );
    }

    return <CreateProfile onComplete={login} />;
}
