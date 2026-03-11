import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import {
    getActiveTournaments,
    getTournament,
    joinTournament,
    createTournament,
    advanceTournamentRound,
    getTournamentStandings,
    isWeekendTournamentActive,
    getWeekendTournament,
    getTournamentHistory,
} from '../../services/tournaments';
import { trackEvent } from '../../services/analytics';
import { Trophy, Users, Clock, ChevronRight, Plus, Crown } from 'lucide-react';

export function TournamentLobby({ onBack }) {
    const { user } = useGame();
    const { toast } = useToast();
    const [view, setView] = useState('list'); // list | detail | create | history
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [standings, setStandings] = useState([]);
    const [createForm, setCreateForm] = useState({ name: '', format: 'bracket', maxPlayers: 16 });
    const [isWeekend, setIsWeekend] = useState(false);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setTournaments(getActiveTournaments());
        setIsWeekend(isWeekendTournamentActive());
    };

    const handleJoin = (tournamentId) => {
        try {
            joinTournament(tournamentId, user?.name || 'Anonymous', user?.avatar);
            toast.success('Joined tournament!');
            trackEvent('tournament_join', { tournamentId });
            refreshData();
            handleViewDetail(tournamentId);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        try {
            const t = createTournament({
                name: createForm.name || 'Custom Tournament',
                format: createForm.format,
                maxPlayers: createForm.maxPlayers,
                entryType: 'free',
            });
            toast.success('Tournament created!');
            trackEvent('tournament_create', { format: createForm.format });
            refreshData();
            handleViewDetail(t.id);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleViewDetail = (tournamentId) => {
        const t = getTournament(tournamentId);
        setSelectedTournament(t);
        try {
            setStandings(getTournamentStandings(tournamentId));
        } catch {
            setStandings([]);
        }
        setView('detail');
    };

    const handleAdvance = (tournamentId) => {
        try {
            advanceTournamentRound(tournamentId);
            toast.success('Round advanced!');
            handleViewDetail(tournamentId);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleWeekendTournament = () => {
        const wt = getWeekendTournament();
        if (wt) handleViewDetail(wt.id);
    };

    // LIST VIEW
    if (view === 'list') {
        return (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">&larr; Back</button>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><Trophy size={24} /> Tournaments</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setView('history')} className="text-white/40 hover:text-white/70 text-sm">History</button>
                        <button onClick={() => setView('create')} className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"><Plus size={16} className="text-white" /></button>
                    </div>
                </div>

                {isWeekend && (
                    <button onClick={handleWeekendTournament} className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all text-center">
                        <div className="text-2xl mb-1">🏆</div>
                        <div className="text-lg font-bold text-amber-300">Weekend Tournament Live!</div>
                        <div className="text-white/60 text-sm">Join now and compete for exclusive rewards</div>
                    </button>
                )}

                {tournaments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🏟️</div>
                        <p className="text-white/60 mb-4">No active tournaments</p>
                        <button onClick={() => setView('create')} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors">Create Tournament</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tournaments.map(t => (
                            <button key={t.id} onClick={() => handleViewDetail(t.id)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between text-left">
                                <div>
                                    <div className="text-white font-bold">{t.name}</div>
                                    <div className="text-white/50 text-sm flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Users size={14} /> {t.players.length}/{t.maxPlayers}</span>
                                        <span className="capitalize">{t.format}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>{t.status}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-white/30" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // DETAIL VIEW
    if (view === 'detail' && selectedTournament) {
        const t = selectedTournament;
        const isJoined = t.players.some(p => p.name === user?.name);
        const currentRound = t.rounds[t.rounds.length - 1];

        return (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
                <button onClick={() => { setView('list'); refreshData(); }} className="text-white/40 hover:text-white/70 text-sm mb-4">&larr; Back to Tournaments</button>

                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-display font-bold text-white">{t.name}</h2>
                    <div className="text-white/50 text-sm mt-1">{t.format} &middot; {t.players.length}/{t.maxPlayers} players &middot; {t.status}</div>
                </div>

                {!isJoined && t.status === 'upcoming' && (
                    <button onClick={() => handleJoin(t.id)} className="w-full mb-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors">Join Tournament</button>
                )}

                {t.status === 'upcoming' && t.players.length >= 2 && (
                    <button onClick={() => handleAdvance(t.id)} className="w-full mb-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">Start Tournament</button>
                )}

                {t.status === 'active' && currentRound && (
                    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <h3 className="text-white font-bold mb-3">Round {currentRound.roundNum}</h3>
                        <div className="space-y-2">
                            {currentRound.matchups.map((m, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                    <span className={`text-sm ${m.winner === m.player1 ? 'text-emerald-400 font-bold' : 'text-white/80'}`}>{m.player1}</span>
                                    <span className="text-white/30 text-xs">
                                        {m.score1 !== null ? m.score1 : '-'} vs {m.score2 !== null ? m.score2 : '-'}
                                    </span>
                                    <span className={`text-sm ${m.winner === m.player2 ? 'text-emerald-400 font-bold' : m.player2 ? 'text-white/80' : 'text-white/30'}`}>{m.player2 || 'BYE'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Standings */}
                <div className="mb-6">
                    <h3 className="text-white font-bold mb-3">
                        {t.status === 'completed' ? 'Final Standings' : 'Players'}
                    </h3>
                    <div className="space-y-2">
                        {(standings.length > 0 ? standings : t.players).map((entry, i) => (
                            <div key={entry.name || i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 text-sm w-6">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                    <span className="text-white font-semibold">{entry.name || entry.player}</span>
                                </div>
                                {entry.wins !== undefined && (
                                    <span className="text-white/50 text-sm">{entry.wins}W - {entry.losses}L</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {t.status === 'completed' && (
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                        <Crown size={32} className="mx-auto text-amber-400 mb-2" />
                        <div className="text-xl font-bold text-amber-300">Tournament Complete!</div>
                        <div className="text-white/60 text-sm mt-1">
                            Winner: {standings[0]?.name || standings[0]?.player || 'TBD'}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // CREATE VIEW
    if (view === 'create') {
        return (
            <div className="w-full max-w-md mx-auto animate-in fade-in duration-500 px-4">
                <button onClick={() => setView('list')} className="text-white/40 hover:text-white/70 text-sm mb-4">&larr; Back</button>
                <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">Create Tournament</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Tournament Name</label>
                        <input type="text" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Weekend Showdown" required />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Format</label>
                        <select value={createForm.format} onChange={(e) => setCreateForm(f => ({ ...f, format: e.target.value }))} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value="bracket">Bracket (Single Elimination)</option>
                            <option value="swiss">Swiss (5 Rounds)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Max Players</label>
                        <select value={createForm.maxPlayers} onChange={(e) => setCreateForm(f => ({ ...f, maxPlayers: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value={8}>8 Players</option>
                            <option value={16}>16 Players</option>
                            <option value={32}>32 Players</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-full hover:bg-purple-500 transition-colors">Create Tournament</button>
                </form>
            </div>
        );
    }

    // HISTORY VIEW
    if (view === 'history') {
        const history = getTournamentHistory();
        return (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
                <button onClick={() => setView('list')} className="text-white/40 hover:text-white/70 text-sm mb-4">&larr; Back</button>
                <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">Tournament History</h2>
                {history.length === 0 ? (
                    <p className="text-center text-white/60">No completed tournaments yet.</p>
                ) : (
                    <div className="space-y-3">
                        {history.map(t => (
                            <button key={t.id} onClick={() => handleViewDetail(t.id)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
                                <div className="text-white font-bold">{t.name}</div>
                                <div className="text-white/50 text-sm">{t.players.length} players &middot; {t.format} &middot; Completed</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}
