import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Leaderboard } from '../../components/Leaderboard';
import { ASSET_THEMES } from '../../data/assets';

const AVATARS = ['👽', '🎨', '🧠', '👾', '🤖', '🔮', '🎪', '🎭'];
const GRADIENTS = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500'
];

export function Lobby() {
    const { user, login, setGameState, startGame } = useGame();
    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || AVATARS[0]);
    const [gradient, setGradient] = useState(user?.gradient || GRADIENTS[0]);
    const [selectedJudge, setSelectedJudge] = useState('ai');
    const [selectedTheme, setSelectedTheme] = useState('random');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        login({ name, avatar, gradient });
    };

    if (user) {
        return (
            <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-3xl animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <div className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${user.gradient} flex items-center justify-center text-5xl mb-4 shadow-lg`}>
                        {user.avatar}
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">
                        Hi, {user.name}!
                    </h2>
                    <p className="text-white/60 mb-6">Ready to make some connections?</p>

                    {/* Judge Mode Toggle */}
                    <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Judge</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedJudge('ai')}
                                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${selectedJudge === 'ai'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                🤖 AI
                            </button>
                            <button
                                onClick={() => setSelectedJudge('human')}
                                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${selectedJudge === 'human'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                👤 Human
                            </button>
                        </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Theme</div>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(ASSET_THEMES).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedTheme(key)}
                                    className={`px-3 py-2 rounded-lg font-medium transition-all ${selectedTheme === key
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {theme.emoji} {theme.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => startGame('quick', selectedJudge, selectedTheme)}
                            className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            ⚡ Quick Play
                            <span className="block text-sm font-normal text-black/60">1 Round</span>
                        </button>
                        <button
                            onClick={() => startGame('championship', selectedJudge, selectedTheme)}
                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-xl rounded-xl hover:scale-105 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,200,0,0.3)]"
                        >
                            🏆 Championship
                            <span className="block text-sm font-normal text-white/80">Best of 3</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setGameState('GALLERY')}
                        className="w-full py-3 bg-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                        🖼️ Gallery
                    </button>

                    <Leaderboard />

                    <button
                        onClick={() => login(null)}
                        className="mt-4 text-sm text-white/40 hover:text-white underline"
                    >
                        Edit Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">Create Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Username</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg"
                        placeholder="Enter your name..."
                        maxLength={12}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Avatar</label>
                    <div className="grid grid-cols-4 gap-2">
                        {AVATARS.map((a) => (
                            <button
                                key={a}
                                type="button"
                                onClick={() => setAvatar(a)}
                                className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${avatar === a
                                    ? 'bg-white/20 shadow-inner scale-95 ring-2 ring-purple-500'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">Theme</label>
                    <div className="flex gap-2 justify-between">
                        {GRADIENTS.map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGradient(g)}
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${g} transition-all ${gradient === g
                                    ? 'ring-2 ring-white scale-110 shadow-lg'
                                    : 'opacity-50 hover:opacity-100'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-4"
                >
                    Join Lobby
                </button>
            </form>
        </div>
    );
}
