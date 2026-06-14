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

    // Chain Detail View
    if (selectedChain) {
        const { chain, standings } = selectedChain;
        return (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
                <button onClick={() => setSelectedChain(null)} className="text-white/40 hover:text-white/70 text-sm mb-4">&larr; Back</button>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-display font-bold text-white">Challenge Chain</h2>
                    <div className="text-white/50 text-sm mt-1">
                        {chain.players.join(' \u2192 ')} \u2192 {chain.players[0]}
                    </div>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${chain.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                        {chain.status}
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    {standings.map((entry, i) => (
                        <div key={entry.player} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                <span className="text-white/40">{i === 0 ? '\ud83e\uddc1' : i === 1 ? '\ud83e\udd48' : i === 2 ? '\ud83e\udd49' : `#${i + 1}`}</span>
                                <span className="text-white font-semibold">{entry.player}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-bold">{entry.totalScore} pts</div>
                                <div className="text-white/40 text-xs">{entry.scores.length}/{chain.promptCount} rounds</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in duration-500 px-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-white/40 hover:text-white/70 text-sm">&larr; Back</button>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><Link size={24} /> Challenges</h2>
                <button onClick={() => setShowCreate(true)} className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors text-white text-sm px-3">+ New</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setTab('chains')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'chains' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    <Users size={14} className="inline mr-1" /> Chains ({chains.length})
                </button>
                <button onClick={() => setTab('mailbox')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'mailbox' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    <Mail size={14} className="inline mr-1" /> Mailbox ({mailbox.filter(m => m.status === 'pending').length})
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <form onSubmit={handleCreateChain} className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 animate-in slide-in-from-top-4 duration-300 space-y-3">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Players (comma-separated)</label>
                        <input type="text" value={newChainPlayers} onChange={(e) => setNewChainPlayers(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Alice, Bob, Charlie" />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Rounds per player</label>
                        <select value={newChainPrompts} onChange={(e) => setNewChainPrompts(Number(e.target.value))} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                            <option value={3}>3 rounds</option>
                            <option value={5}>5 rounds</option>
                            <option value={10}>10 rounds</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500">Create Chain</button>
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20">Cancel</button>
                    </div>
                </form>
            )}

            {/* Chains Tab */}
            {tab === 'chains' && (
                <div className="space-y-3">
                    {chains.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">&#x1F517;</div>
                            <p className="text-white/60">No challenge chains yet</p>
                            <p className="text-white/40 text-sm mt-1">Create one to challenge friends in a circular tournament!</p>
                        </div>
                    ) : chains.map(chain => (
                        <button key={chain.id} onClick={() => handleViewChain(chain.id)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between text-left">
                            <div>
                                <div className="text-white font-bold">{chain.players.join(' \u2192 ')}</div>
                                <div className="text-white/50 text-sm">{chain.promptCount} rounds &middot; {chain.status}</div>
                            </div>
                            <ChevronRight size={20} className="text-white/30" />
                        </button>
                    ))}
                </div>
            )}

            {/* Mailbox Tab */}
            {tab === 'mailbox' && (
                <div className="space-y-3">
                    {mailbox.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">&#x1F4EC;</div>
                            <p className="text-white/60">Mailbox empty</p>
                            <p className="text-white/40 text-sm mt-1">Incoming challenges will appear here</p>
                        </div>
                    ) : mailbox.map(item => (
                        <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex justify-between items-center">
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
        </div>
    );
}
