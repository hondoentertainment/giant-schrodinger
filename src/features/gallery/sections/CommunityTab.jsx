import React, { useState, useMemo } from 'react';
import { getScoreBand } from '../../../lib/scoreBands';
import { CommunityCard } from './CommunityCard';

const MOCK_COMMUNITY = [
    { id: 'c1', playerName: 'WitMaster', avatar: '\uD83E\uDDE0', submission: 'Both peak at 3AM when no one is watching', score: 9, theme: 'neon', conceptLeft: '3AM Taxi Ride', conceptRight: 'Midnight Arcade Fever', votes: 42, createdAt: Date.now() - 3600000 },
    { id: 'c2', playerName: 'PunQueen', avatar: '\uD83D\uDC51', submission: 'They both make waves that no one asked for', score: 8, theme: 'ocean', conceptLeft: "Poseidon's Living Room", conceptRight: 'The Wave That Writes Poetry', votes: 38, createdAt: Date.now() - 7200000 },
    { id: 'c3', playerName: 'CosmicJester', avatar: '\uD83C\uDCCF', submission: 'Neither has an off switch once you start', score: 7, theme: 'neon', conceptLeft: 'Infinite Jukebox', conceptRight: 'The Thought That Won\'t Sleep', votes: 31, createdAt: Date.now() - 10800000 },
    { id: 'c4', playerName: 'ZenMaster42', avatar: '\uD83E\uDDD8', submission: 'Both are louder when the room is silent', score: 9, theme: 'nature', conceptLeft: 'Morning\'s First Songbird', conceptRight: 'A Ringing in Your Ears', votes: 55, createdAt: Date.now() - 14400000 },
    { id: 'c5', playerName: 'NightOwlNinja', avatar: '\uD83E\uDD89', submission: 'You only notice them when they stop', score: 6, theme: 'nature', conceptLeft: 'The Background Hum of Civilization', conceptRight: 'A Heartbeat', votes: 19, createdAt: Date.now() - 18000000 },
    { id: 'c6', playerName: 'PixelPoet', avatar: '\uD83C\uDFA8', submission: 'Both promise you the world but deliver a headache', score: 5, theme: 'retro', conceptLeft: 'A First Date', conceptRight: 'Assembly Instructions from IKEA', votes: 27, createdAt: Date.now() - 21600000 },
    { id: 'c7', playerName: 'ChaosBard', avatar: '\uD83C\uDFB8', submission: 'They both sound better with reverb', score: 8, theme: 'neon', conceptLeft: 'A Cathedral\'s Echo', conceptRight: 'Your Voice in the Shower', votes: 34, createdAt: Date.now() - 25200000 },
    { id: 'c8', playerName: 'LogicLlama', avatar: '\uD83E\uDD99', submission: 'Both require faith and a running start', score: 7, theme: 'nature', conceptLeft: 'A Leap of Faith', conceptRight: 'Learning to Ride a Bicycle', votes: 22, createdAt: Date.now() - 28800000 },
    { id: 'c9', playerName: 'VelvetThunder', avatar: '\u26A1', submission: 'They both leave you wondering what just happened', score: 10, theme: 'ocean', conceptLeft: 'A Magic Trick', conceptRight: 'A Rogue Wave', votes: 61, createdAt: Date.now() - 32400000 },
    { id: 'c10', playerName: 'QuietStorm', avatar: '\uD83C\uDF0A', submission: 'Both are journeys you take while standing still', score: 3, theme: 'retro', conceptLeft: 'A Good Book', conceptRight: 'An Escalator', votes: 8, createdAt: Date.now() - 36000000 },
];

const COMMUNITY_THEMES = ['All', 'Neon', 'Ocean', 'Nature', 'Retro'];
const SCORE_RANGES = [
    { id: 'all', label: 'All' },
    { id: '8+', label: '8+', fn: (s) => s >= 8 },
    { id: '6-7', label: '6-7', fn: (s) => s >= 6 && s <= 7 },
    { id: '<6', label: '<6', fn: (s) => s < 6 },
];
const COMMUNITY_SORTS = [
    { id: 'most-voted', label: 'Most Voted', fn: (a, b) => b.votes - a.votes },
    { id: 'highest-score', label: 'Highest Score', fn: (a, b) => b.score - a.score },
    { id: 'newest', label: 'Newest', fn: (a, b) => b.createdAt - a.createdAt },
];

export function CommunityTab() {
    const [themeFilter, setThemeFilter] = useState('All');
    const [scoreRange, setScoreRange] = useState('all');
    const [sortBy, setSortBy] = useState('most-voted');

    const filtered = useMemo(() => {
        let items = [...MOCK_COMMUNITY];
        if (themeFilter !== 'All') {
            items = items.filter((e) => e.theme.toLowerCase() === themeFilter.toLowerCase());
        }
        const range = SCORE_RANGES.find((r) => r.id === scoreRange);
        if (range?.fn) {
            items = items.filter((e) => range.fn(e.score));
        }
        const sort = COMMUNITY_SORTS.find((s) => s.id === sortBy) || COMMUNITY_SORTS[0];
        items.sort(sort.fn);
        return items;
    }, [themeFilter, scoreRange, sortBy]);

    const trending = useMemo(() =>
        [...MOCK_COMMUNITY].sort((a, b) => b.votes - a.votes).slice(0, 5),
    []);

    return (
        <div className="animate-in fade-in duration-500">
            {/* Trending Today */}
            <div className="mb-8">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-orange-400">&#9733;</span> Trending Today
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {trending.map((entry, i) => {
                        const band = getScoreBand(entry.score);
                        return (
                            <div
                                key={entry.id}
                                className={`relative p-3 rounded-2xl border transition-all ${
                                    i === 0
                                        ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-orange-500/30'
                                        : 'bg-white/5 border-white/10'
                                }`}
                            >
                                {i === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                        #1
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-lg">{entry.avatar}</span>
                                    <span className="text-white text-xs font-bold truncate">{entry.playerName}</span>
                                </div>
                                <div className="text-white/70 text-sm italic truncate mb-1">&ldquo;{entry.submission}&rdquo;</div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-black text-transparent bg-clip-text bg-gradient-to-r ${band.color}`}>{entry.score}/10</span>
                                    <span className="text-white/40 text-xs">&#9650; {entry.votes}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Theme</span>
                    {COMMUNITY_THEMES.map((t) => (
                        <button
                            key={t}
                            onClick={() => setThemeFilter(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                themeFilter === t
                                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Score</span>
                    {SCORE_RANGES.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setScoreRange(r.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                scoreRange === r.id
                                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <label htmlFor="community-sort" className="sr-only">Sort by</label>
                    <select
                        id="community-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-black/30 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        aria-label="Sort community gallery"
                    >
                        {COMMUNITY_SORTS.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-3xl">
                    <p className="text-white/40 text-lg">No submissions match your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Community submissions">
                    {filtered.map((entry) => (
                        <CommunityCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}
