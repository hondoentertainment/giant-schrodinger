import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import {
    createChallengeChain,
    getChallengeChains,
    getChainResults,
    getMailbox,
    clearExpiredMailbox,
} from '../../services/asyncPlay';
import { trackEvent } from '../../services/analytics';
import { Link, Users, Mail, ChevronRight } from 'lucide-react';
import { GameScreenShell } from '../../components/GameScreenShell';
import { EmptyState } from '../../components/EmptyState';

export function AsyncChains({ onBack }) {
    const { user } = useGame();
    const { toast } = useToast();
    const [tab, setTab] = useState('chains'); // chains | mailbox
    const [chains, setChains] = useState([]);
    const [mailbox, setMailbox] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newChainPlayers, setNewChainPlayers] = useState('');
    const [newChainPrompts, setNewChainPrompts] = useState(3);
    const [selectedChain, setSelectedChain] = useState(null);

    useEffect(() => {
        setChains(getChallengeChains());
        clearExpiredMailbox();
        setMailbox(getMailbox());
    }, []);

    const handleCreateChain = (e) => {
        e.preventDefault();
        const players = newChainPlayers.split(',').map(p => p.trim()).filter(Boolean);
        if (!players.includes(user?.name)) {
            players.unshift(user?.name || 'You');
        }
        if (players.length < 2) {
            toast.error('Need at least 2 players');
            return;
        }
        const chain = createChallengeChain(players, newChainPrompts);
        if (chain) {
            toast.success('Challenge chain created!');
            trackEvent('chain_create', { players: players.length });
            setChains(getChallengeChains());
            setShowCreate(false);
            setNewChainPlayers('');
        }
    };

    const handleViewChain = (chainId) => {
        const result = getChainResults(chainId);
        setSelectedChain(result);
    };

    if (selectedChain) {
        const { chain, standings } = selectedChain;
        return (
            <GameScreenShell onBack={() => setSelectedChain(null)} title="Challenge Chain" icon={Link} backLabel="Back to challenges">
                <div className="text-center mb-6">
                    <div className="text-white/50 text-sm">
                        {chain.players.join(' → ')} → {chain.players[0]}
                    </div>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${chain.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {chain.status}
                    </div>
                </div>

                <div className="space-y-3">
                    {standings.map((entry, i) => (
                        <div key={entry.player} className="game-list-row">
                            <div className="flex items-center gap-3">
                                <span className="text-white/40">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                <span className="text-white font-semibold">{entry.player}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-bold tabular-nums">{entry.totalScore} pts</div>
                                <div className="text-white/40 text-xs">{entry.scores.length}/{chain.promptCount} rounds</div>
                            </div>
                        </div>
                    ))}
                </div>
            </GameScreenShell>
        );
    }

    return (
        <GameScreenShell
            onBack={onBack}
            title="Challenges"
            icon={Link}
            backLabel="Back to lobby"
            badge={(
                <button type="button" onClick={() => setShowCreate(true)} className="wordle-button wordle-primary text-xs min-h-[40px] px-3 shrink-0">
                    + New
                </button>
            )}
        >
            <div className="flex gap-2 mb-6">
                <button type="button" onClick={() => setTab('chains')} className={`game-segment flex-1 ${tab === 'chains' ? 'game-segment-selected' : ''}`}>
                    <Users size={14} className="inline mr-1" /> Chains ({chains.length})
                </button>
                <button type="button" onClick={() => setTab('mailbox')} className={`game-segment flex-1 ${tab === 'mailbox' ? 'game-segment-selected' : ''}`}>
                    <Mail size={14} className="inline mr-1" /> Mailbox ({mailbox.filter(m => m.status === 'pending').length})
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateChain} className="mb-6 wordle-card p-4 space-y-3 !shadow-none animate-in slide-in-from-top-4 duration-300">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Players (comma-separated)</label>
                        <input type="text" value={newChainPlayers} onChange={(e) => setNewChainPlayers(e.target.value)} className="game-input" placeholder="Alice, Bob, Charlie" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Rounds per player</label>
                        <select value={newChainPrompts} onChange={(e) => setNewChainPrompts(Number(e.target.value))} className="game-input">
                            <option value={3}>3 rounds</option>
                            <option value={5}>5 rounds</option>
                            <option value={10}>10 rounds</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 wordle-button wordle-primary">Create Chain</button>
                        <button type="button" onClick={() => setShowCreate(false)} className="wordle-button">Cancel</button>
                    </div>
                </form>
            )}

            {tab === 'chains' && (
                <div className="space-y-3">
                    {chains.length === 0 ? (
                        <EmptyState icon="🔗" title="No challenge chains yet" description="Create one to challenge friends in a circular tournament!" />
                    ) : chains.map(chain => (
                        <button key={chain.id} type="button" onClick={() => handleViewChain(chain.id)} className="w-full game-list-row hover:bg-white/[0.08] text-left">
                            <div>
                                <div className="text-white font-bold">{chain.players.join(' → ')}</div>
                                <div className="text-white/50 text-sm">{chain.promptCount} rounds · {chain.status}</div>
                            </div>
                            <ChevronRight size={20} className="text-white/30 shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {tab === 'mailbox' && (
                <div className="space-y-3">
                    {mailbox.length === 0 ? (
                        <EmptyState icon="📬" title="Mailbox empty" description="Incoming challenges will appear here." />
                    ) : mailbox.map(item => (
                        <div key={item.id} className="game-list-row flex-col items-stretch !py-4">
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <div className="text-white font-bold">From: {item.fromPlayer}</div>
                                    <div className="text-white/50 text-sm">{new Date(item.receivedAt).toLocaleDateString()}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                    {item.status === 'pending' ? 'Pending' : `Score: ${item.myScore}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </GameScreenShell>
    );
}
