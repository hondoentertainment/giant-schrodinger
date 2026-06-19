export function isE2EMockRoomEnabled() {
    try {
        return import.meta.env.MODE === 'e2e'
            && typeof window !== 'undefined'
            && window.localStorage.getItem('vwf_e2e_mock_room') === 'true';
    } catch {
        return false;
    }
}

export function buildE2EMockRoom({ code = 'MOCK42', hostName = 'Host', playerName = 'Guest', themeId = 'neon', totalRounds = 3, scoringMode = 'human' } = {}) {
    const room = {
        id: 'e2e-room',
        code,
        host_name: hostName,
        theme_id: themeId,
        total_rounds: totalRounds,
        scoring_mode: scoringMode,
        status: 'waiting',
        round_number: 1,
        assets: null,
    };

    const players = [
        { id: 'e2e-host', player_name: hostName, avatar: 'H', is_host: true },
        { id: 'e2e-guest', player_name: playerName, avatar: 'G', is_host: false },
    ];

    return { room, players };
}

export function subscribeToE2EMockRoom(callbacks = {}) {
    const handleOffline = () => callbacks.onConnectionStatus?.('TIMED_OUT');
    const handleOnline = () => callbacks.onConnectionStatus?.('SUBSCRIBED');

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    callbacks.onConnectionStatus?.('SUBSCRIBED');

    return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
    };
}
