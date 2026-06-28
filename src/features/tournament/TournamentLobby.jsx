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
import { Trophy, Users, ChevronRight, Plus, Crown } from 'lucide-react';
import { LocalPreviewBadge } from '../../components/LocalPreviewBadge';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';

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
            <GameScreenShell
                onBack={onBack}
                title="Tournaments"
                icon={Trophy}
                backLabel="Back to lobby"
                badge={(
                    <div className="flex gap-2 shrink-0 items-center flex-wrap justify-end">
                        <LocalPreviewBadge />
                        <button type="button" onClick={() => setView('history')} className="wordle-button text-xs min-h-[40px] px-3">History</button>
                        <button type="button" onClick={() => setView('create')} className="wordle-button wordle-primary text-xs min-h-[40px] px-3" aria-label="Create tournament">
                            <Plus size={16} />
                        </button>
                    </div>
                )}
            >
                {isWeekend && (
                    <button type="button" onClick={handleWeekendTournament} className="w-full mb-4 p-4 rounded-[22px] game-highlight-banner hover:bg-amber-500/15 transition-all text-center border-amber-500/25">
                        <div className="text-2xl mb-1">🏆</div>
                        <div className="text-lg font-bold text-amber-200">Weekend Tournament Live!</div>
                        <div className="text-white/60 text-sm">Join now and compete for exclusive rewards</div>
                    </button>
                )}

                {tournaments.length === 0 ? (
                    <EmptyState
                        icon="🏟️"
                        title="No active tournaments"
                        description="Create one and invite friends to compete."
                        action={(
                            <button type="button" onClick={() => setView('create')} className="wordle-button wordle-primary">
                                Create Tournament
                            </button>
                        )}
                    />
                ) : (
                    <div className="space-y-3">
                        {tournaments.map(t => (
                            <button key={t.id} type="button" onClick={() => handleViewDetail(t.id)} className="w-full game-list-row hover:bg-white/[0.08] text-left">
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-bold">{t.name}</div>
                                    <div className="text-white/50 text-sm flex items-center gap-3 flex-wrap">
                                        <span className="flex items-center gap-1"><Users size={14} /> {t.players.length}/{t.maxPlayers}</span>
                                        <span className="capitalize">{t.format}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{t.status}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-white/30 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </GameScreenShell>
        );
    }

    // DETAIL VIEW
    if (view === 'detail' && selectedTournament) {
        const t = selectedTournament;
        const isJoined = t.players.some(p => p.name === user?.name);
        const currentRound = t.rounds[t.rounds.length - 1];

        return (
            <GameScreenShell onBack={() => { setView('list'); refreshData(); }} title={t.name} icon={Trophy} backLabel="Back to tournaments">
                <div className="mb-6 text-center">
                    <div className="text-white/50 text-sm">{t.format} · {t.players.length}/{t.maxPlayers} players · {t.status}</div>
                </div>

                {!isJoined && t.status === 'upcoming' && (
                    <button type="button" onClick={() => handleJoin(t.id)} className="w-full mb-4 wordle-button wordle-primary">Join Tournament</button>
                )}

                {t.status === 'upcoming' && t.players.length >= 2 && (
                    <button type="button" onClick={() => handleAdvance(t.id)} className="w-full mb-4 wordle-button border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">Start Tournament</button>
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
                    <div className="text-center p-6 rounded-[22px] game-highlight-banner border-amber-500/25">
                        <Crown size={32} className="mx-auto text-amber-400 mb-2" />
                        <div className="text-xl font-bold text-amber-200">Tournament Complete!</div>
                        <div className="text-white/60 text-sm mt-1">
                            Winner: {standings[0]?.name || standings[0]?.player || 'TBD'}
                        </div>
                    </div>
                )}
            </GameScreenShell>
        );
    }

    // CREATE VIEW
    if (view === 'create') {
        return (
            <GameScreenShell onBack={() => setView('list')} title="Create Tournament" icon={Plus} maxWidth="max-w-md" backLabel="Back to tournaments">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Tournament Name</label>
                        <input type="text" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} className="game-input" placeholder="Weekend Showdown" required />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Format</label>
                        <select value={createForm.format} onChange={(e) => setCreateForm(f => ({ ...f, format: e.target.value }))} className="game-input">
                            <option value="bracket">Bracket (Single Elimination)</option>
                            <option value="swiss">Swiss (5 Rounds)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Max Players</label>
                        <select value={createForm.maxPlayers} onChange={(e) => setCreateForm(f => ({ ...f, maxPlayers: Number(e.target.value) }))} className="game-input">
                            <option value={8}>8 Players</option>
                            <option value={16}>16 Players</option>
                            <option value={32}>32 Players</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full wordle-button wordle-primary text-lg">Create Tournament</button>
                </form>
            </GameScreenShell>
        );
    }

    // HISTORY VIEW
    if (view === 'history') {
        const history = getTournamentHistory();
        return (
            <GameScreenShell onBack={() => setView('list')} title="Tournament History" icon={Trophy} backLabel="Back to tournaments">
                {history.length === 0 ? (
                    <EmptyState icon="📜" title="No history yet" description="Completed tournaments will appear here." />
                ) : (
                    <div className="space-y-3">
                        {history.map(t => (
                            <button key={t.id} type="button" onClick={() => handleViewDetail(t.id)} className="w-full game-list-row hover:bg-white/[0.08] text-left">
                                <div>
                                    <div className="text-white font-bold">{t.name}</div>
                                    <div className="text-white/50 text-sm">{t.players.length} players · {t.format} · Completed</div>
                                </div>
                                <ChevronRight size={20} className="text-white/30 shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </GameScreenShell>
        );
    }

    return null;
}
