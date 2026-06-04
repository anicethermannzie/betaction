const CLUB_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 2, name: 'Champions League', country: 'World' },
  { id: 3, name: 'Europa League', country: 'World' },
  { id: 253, name: 'MLS', country: 'USA' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands' },
  { id: 94, name: 'Liga Portugal', country: 'Portugal' },
  { id: 71, name: 'Brazilian Serie A', country: 'Brazil' }
];

const INTERNATIONAL_COMPETITIONS = [
  { id: 1, name: 'FIFA World Cup', country: 'World' },
  { id: 4, name: 'UEFA Euro', country: 'Europe' },
  { id: 9, name: 'Copa America', country: 'South America' },
  { id: 6, name: 'Africa Cup of Nations', country: 'Africa' },
  { id: 7, name: 'CONCACAF Gold Cup', country: 'North America' },
  { id: 5, name: 'UEFA Nations League', country: 'Europe' },
  { id: 8, name: 'Asian Cup', country: 'Asia' },
  { id: 32, name: 'World Cup Qualifiers - Europe', country: 'Europe' },
  { id: 33, name: 'World Cup Qualifiers - South America', country: 'South America' },
  { id: 34, name: 'World Cup Qualifiers - Africa', country: 'Africa' },
  { id: 35, name: 'World Cup Qualifiers - Asia', country: 'Asia' },
  { id: 36, name: 'World Cup Qualifiers - CONCACAF', country: 'North America' },
  { id: 481, name: 'CONCACAF Nations League', country: 'North America' },
  { id: 10, name: 'International Friendlies', country: 'World' }
];

const ALL_LEAGUES = [...CLUB_LEAGUES, ...INTERNATIONAL_COMPETITIONS];

module.exports = {
  CLUB_LEAGUES,
  INTERNATIONAL_COMPETITIONS,
  ALL_LEAGUES
};
