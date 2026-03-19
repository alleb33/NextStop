const normalizeCityKey = (value: string) =>
  value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

const cityAttractions: Record<string, string[]> = {
  [normalizeCityKey("Paris")]: [
    "Eiffel Tower",
    "Louvre Museum",
    "Palace of Versailles",
    "Catacombs of Paris",
    "Notre-Dame Cathedral",
    "Arc de Triomphe",
    "Sacre-Coeur Basilica",
    "Musee d'Orsay",
    "Luxembourg Gardens",
  ],
  [normalizeCityKey("London")]: [
    "Buckingham Palace",
    "Tower of London",
    "Big Ben",
    "British Museum",
    "London Eye",
    "Westminster Abbey",
    "St Paul's Cathedral",
    "Tower Bridge",
    "Hyde Park",
  ],
  [normalizeCityKey("Rome")]: [
    "Colosseum",
    "Roman Forum",
    "Trevi Fountain",
    "Pantheon",
    "Vatican Museums",
    "St. Peter's Basilica",
    "Spanish Steps",
    "Piazza Navona",
    "Villa Borghese",
  ],
  [normalizeCityKey("New York")]: [
    "Statue of Liberty",
    "Central Park",
    "Times Square",
    "Empire State Building",
    "Brooklyn Bridge",
    "The Metropolitan Museum of Art",
    "One World Observatory",
    "Rockefeller Center",
    "Grand Central Terminal",
  ],
  [normalizeCityKey("Tokyo")]: [
    "Senso-ji Temple",
    "Tokyo Skytree",
    "Shibuya Crossing",
    "Meiji Shrine",
    "Tokyo Tower",
    "Tsukiji Outer Market",
    "Ueno Park",
    "Imperial Palace",
    "teamLab Planets",
  ],
};

export const getCityAttractions = (city: string) => {
  const normalized = normalizeCityKey(city);
  const cityOnly = normalizeCityKey(city.split(",")[0] ?? city);

  return cityAttractions[normalized] || cityAttractions[cityOnly] || [];
};

export const hasCityAttractions = (city: string) => getCityAttractions(city).length > 0;
