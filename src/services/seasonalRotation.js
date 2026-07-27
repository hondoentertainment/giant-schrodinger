// Calendar-driven rotation for seasonal themes and prompt packs.
// Items tagged with a seasonId only surface during that season's months;
// untagged items are always available.

export const SEASONS = [
    { id: 'spring', label: 'Spring', months: [2, 3, 4] },
    { id: 'summer', label: 'Summer', months: [5, 6, 7] },
    { id: 'autumn', label: 'Autumn', months: [8, 9, 10] },
    { id: 'winter', label: 'Winter', months: [11, 0, 1] },
];

export function getActiveSeason(date = new Date()) {
    const month = date.getMonth();
    return SEASONS.find((season) => season.months.includes(month)) || null;
}

export function getActiveSeasonId(date = new Date()) {
    return getActiveSeason(date)?.id || null;
}

export function isInSeason(seasonId, date = new Date()) {
    if (!seasonId) return true;
    return getActiveSeasonId(date) === seasonId;
}
