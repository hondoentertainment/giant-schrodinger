export const CONCEPTS = [
  'Tax Returns',
  'Rollercoasters',
  'Poetry',
  'Outer Space',
  'Breakfast Cereal',
  'Ancient Rome',
  'Social Media',
  'Thunderstorms',
  'Jazz Music',
  'Sushi',
  'Time Travel',
  'Laundry',
  'Vampires',
  'Board Games',
  'Quantum Physics',
  'Wedding Cakes',
  'Pirate Ships',
  'Yoga',
  'Conspiracy Theories',
  'Bubble Wrap',
  'Shakespeare',
  'Black Holes',
  'Grocery Shopping',
  'Ninjas',
  'Stand-Up Comedy',
  'Volcanoes',
  'Knitting',
  'Artificial Intelligence',
  'Camping',
  'Opera',
  'Dinosaurs',
  'Rush Hour Traffic',
  'Magic Tricks',
  'Penguins',
  'Reality TV',
  'Chocolate',
  'Haunted Houses',
  'Marathon Running',
  'Dreams',
  'Elevator Music',
  'Beekeeping',
  'Karaoke',
  'Origami',
  'Dentist Visits',
  'Surfing',
  'Libraries',
  'Tattoos',
  'Homework',
  'Fireworks',
  'Cats',
  'Cryptocurrency',
  'Gardening',
  'First Dates',
  'Skydiving',
];

/**
 * Returns a random pairing of two distinct concepts.
 */
export function getRandomPairing() {
  const shuffled = [...CONCEPTS].sort(() => Math.random() - 0.5);
  return { left: shuffled[0], right: shuffled[1] };
}

/**
 * Returns a deterministic pairing seeded by today's date.
 * The same date always produces the same pairing.
 */
export function getDailyPairing() {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  hash = Math.abs(hash);

  const leftIndex = hash % CONCEPTS.length;
  let rightIndex = (hash * 31 + 7) % CONCEPTS.length;
  if (rightIndex === leftIndex) {
    rightIndex = (rightIndex + 1) % CONCEPTS.length;
  }

  return { left: CONCEPTS[leftIndex], right: CONCEPTS[rightIndex] };
}
