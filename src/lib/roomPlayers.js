export function isSpectatorPlayer(player) {
    return Boolean(
        player?.is_spectator
        || player?.isSpectator
        || player?.role === 'spectator'
    );
}

export function getActivePlayers(players = []) {
    return (players || []).filter((player) => !isSpectatorPlayer(player));
}

export function getSpectatorPlayers(players = []) {
    return (players || []).filter((player) => isSpectatorPlayer(player));
}
