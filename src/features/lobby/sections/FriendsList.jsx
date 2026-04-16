import React from 'react';
import { getFriends } from '../../../services/friends';

export function FriendsList({ show, onSelectFriend }) {
    if (!show) return null;
    const friends = getFriends();
    if (friends.length === 0) return null;
    return (
        <div className="w-full max-w-md mb-4" role="group" aria-labelledby="friends-list-label">
            <span id="friends-list-label" className="block text-white/50 text-xs uppercase tracking-wider mb-2">Friends</span>
            <div className="flex flex-wrap gap-2">
                {friends.map((f) => (
                    <button
                        key={f.name}
                        onClick={() => onSelectFriend(f)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    >
                        {f.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
