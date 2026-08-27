// ============================================
// WHAT THIS FILE DOES (plain English):
// Fingerprints for TV, movies, comedians, and characters. Each item sits on
// the five humor taste axes (0–1) and a comedy cluster (for breadth). Users
// never see axis names — only titles they recognize.
// ============================================

export type HumorAxisKey =
  | 'absurdity'
  | 'edge'
  | 'register'
  | 'craft'
  | 'irony';

export type HumorMediaItem = {
  id: string;
  label: string;
  cluster: string;
  /** Position on each axis, 0 = low pole, 1 = high pole. */
  axes: Record<HumorAxisKey, number>;
};

export const HUMOR_MEDIA = {
  tv: [
    { id: 'parks', label: 'Parks and Recreation', cluster: 'warm_workplace', axes: { absurdity: 0.375, edge: 0.2, register: 0.425, craft: 0.625, irony: 0.45 } },
    { id: 'veep', label: 'Veep', cluster: 'political_cringe', axes: { absurdity: 0.55, edge: 0.8, register: 0.55, craft: 0.75, irony: 0.7 } },
    { id: 'fleabag', label: 'Fleabag', cluster: 'meta_drama_comedy', axes: { absurdity: 0.575, edge: 0.65, register: 0.7, craft: 0.75, irony: 0.875 } },
    { id: 'office', label: 'The Office', cluster: 'cringe_mockumentary', axes: { absurdity: 0.55, edge: 0.55, register: 0.575, craft: 0.575, irony: 0.625 } },
    { id: 'arrested', label: 'Arrested Development', cluster: 'callback_clever', axes: { absurdity: 0.7, edge: 0.6, register: 0.65, craft: 0.8, irony: 0.75 } },
    { id: 'community', label: 'Community', cluster: 'meta_ensemble', axes: { absurdity: 0.75, edge: 0.55, register: 0.55, craft: 0.75, irony: 0.875 } },
    { id: 'sunny', label: 'It\'s Always Sunny', cluster: 'dark_chaos', axes: { absurdity: 0.8, edge: 0.95, register: 0.45, craft: 0.6, irony: 0.65 } },
    { id: 'curb', label: 'Curb Your Enthusiasm', cluster: 'awkward_deadpan', axes: { absurdity: 0.575, edge: 0.7, register: 0.875, craft: 0.65, irony: 0.675 } },
    { id: 'itysl', label: 'I Think You Should Leave', cluster: 'absurdist_sketch', axes: { absurdity: 0.975, edge: 0.7, register: 0.45, craft: 0.45, irony: 0.575 } },
    { id: 'nathan', label: 'Nathan for You', cluster: 'awkward_commitment', axes: { absurdity: 0.75, edge: 0.625, register: 0.75, craft: 0.625, irony: 0.725 } },
    { id: 'b99', label: 'Brooklyn Nine-Nine', cluster: 'warm_workplace', axes: { absurdity: 0.4, edge: 0.25, register: 0.3, craft: 0.575, irony: 0.425 } },
    { id: 'newgirl', label: 'New Girl', cluster: 'warm_ensemble', axes: { absurdity: 0.45, edge: 0.25, register: 0.35, craft: 0.55, irony: 0.4 } },
    { id: 'schitts', label: 'Schitt\'s Creek', cluster: 'warm_character', axes: { absurdity: 0.425, edge: 0.175, register: 0.55, craft: 0.65, irony: 0.45 } },
    { id: 'modern', label: 'Modern Family', cluster: 'broad_sitcom', axes: { absurdity: 0.35, edge: 0.3, register: 0.2, craft: 0.5, irony: 0.375 } },
    { id: 'derry', label: 'Derry Girls', cluster: 'chaotic_ensemble', axes: { absurdity: 0.65, edge: 0.575, register: 0.35, craft: 0.55, irony: 0.55 } },
    { id: 'abbott', label: 'Abbott Elementary', cluster: 'warm_workplace', axes: { absurdity: 0.4, edge: 0.25, register: 0.4, craft: 0.6, irony: 0.45 } },
  ] as HumorMediaItem[],
  movie: [
    { id: 'mitchells', label: 'The Mitchells vs. the Machines', cluster: 'animated_chaos', axes: { absurdity: 0.75, edge: 0.3, register: 0.35, craft: 0.45, irony: 0.575 } },
    { id: 'bottoms', label: 'Bottoms', cluster: 'raunchy_teen', axes: { absurdity: 0.65, edge: 0.8, register: 0.4, craft: 0.55, irony: 0.6 } },
    { id: 'airplane', label: 'Airplane!', cluster: 'spoof_slapstick', axes: { absurdity: 0.8, edge: 0.55, register: 0.2, craft: 0.25, irony: 0.625 } },
    { id: 'hotfuzz', label: 'Hot Fuzz', cluster: 'genre_clever', axes: { absurdity: 0.65, edge: 0.6, register: 0.6, craft: 0.75, irony: 0.7 } },
    { id: 'niceguys', label: 'The Nice Guys', cluster: 'buddy_clever', axes: { absurdity: 0.6, edge: 0.65, register: 0.55, craft: 0.675, irony: 0.6 } },
    { id: 'gamenight', label: 'Game Night', cluster: 'premise_escalation', axes: { absurdity: 0.625, edge: 0.55, register: 0.425, craft: 0.6, irony: 0.575 } },
    { id: 'superbad', label: 'Superbad', cluster: 'raunchy_teen', axes: { absurdity: 0.575, edge: 0.7, register: 0.3, craft: 0.525, irony: 0.45 } },
    { id: 'meangirls', label: 'Mean Girls', cluster: 'observational_satire', axes: { absurdity: 0.525, edge: 0.6, register: 0.45, craft: 0.7, irony: 0.625 } },
    { id: 'clue', label: 'Clue', cluster: 'farce_ensemble', axes: { absurdity: 0.675, edge: 0.55, register: 0.4, craft: 0.575, irony: 0.6 } },
    { id: 'python', label: 'Monty Python and the Holy Grail', cluster: 'surreal_sketch', axes: { absurdity: 0.95, edge: 0.575, register: 0.55, craft: 0.55, irony: 0.65 } },
    { id: 'groove', label: 'The Emperor\'s New Groove', cluster: 'animated_chaos', axes: { absurdity: 0.75, edge: 0.35, register: 0.3, craft: 0.55, irony: 0.575 } },
    { id: 'cloudy', label: 'Cloudy with a Chance of Meatballs', cluster: 'animated_chaos', axes: { absurdity: 0.725, edge: 0.3, register: 0.3, craft: 0.425, irony: 0.525 } },
  ] as HumorMediaItem[],
  comedian: [
    { id: 'conan', label: 'Conan O\'Brien', cluster: 'late_night_absurd', axes: { absurdity: 0.7, edge: 0.45, register: 0.4, craft: 0.625, irony: 0.6 } },
    { id: 'nate', label: 'Nate Bargatze', cluster: 'clean_deadpan', axes: { absurdity: 0.3, edge: 0.1, register: 0.85, craft: 0.575, irony: 0.35 } },
    { id: 'mulaney', label: 'John Mulaney', cluster: 'story_clever', axes: { absurdity: 0.45, edge: 0.45, register: 0.65, craft: 0.8, irony: 0.575 } },
    { id: 'taylor', label: 'Taylor Tomlinson', cluster: 'observational_standup', axes: { absurdity: 0.4, edge: 0.55, register: 0.45, craft: 0.7, irony: 0.55 } },
    { id: 'bo', label: 'Bo Burnham', cluster: 'meta_musical', axes: { absurdity: 0.7, edge: 0.625, register: 0.6, craft: 0.85, irony: 0.95 } },
    { id: 'norm', label: 'Norm Macdonald', cluster: 'deadpan_story', axes: { absurdity: 0.6, edge: 0.65, register: 0.95, craft: 0.7, irony: 0.725 } },
    { id: 'tig', label: 'Tig Notaro', cluster: 'deadpan_minimal', axes: { absurdity: 0.55, edge: 0.45, register: 0.9, craft: 0.65, irony: 0.625 } },
    { id: 'ali', label: 'Ali Wong', cluster: 'raunchy_standup', axes: { absurdity: 0.55, edge: 0.85, register: 0.35, craft: 0.65, irony: 0.525 } },
    { id: 'demetri', label: 'Demetri Martin', cluster: 'one_liner_clever', axes: { absurdity: 0.625, edge: 0.35, register: 0.7, craft: 0.875, irony: 0.6 } },
    { id: 'acaster', label: 'James Acaster', cluster: 'character_clever', axes: { absurdity: 0.675, edge: 0.45, register: 0.65, craft: 0.8, irony: 0.7 } },
  ] as HumorMediaItem[],
  character: [
    { id: 'ron', label: 'Ron Swanson', cluster: 'deadpan_character', axes: { absurdity: 0.45, edge: 0.4, register: 0.9, craft: 0.6, irony: 0.55 } },
    { id: 'april', label: 'April Ludgate', cluster: 'deadpan_character', axes: { absurdity: 0.575, edge: 0.6, register: 0.875, craft: 0.625, irony: 0.7 } },
    { id: 'selina', label: 'Selina Meyer', cluster: 'cringe_power', axes: { absurdity: 0.55, edge: 0.75, register: 0.575, craft: 0.7, irony: 0.675 } },
    { id: 'fleabag_c', label: 'Fleabag', cluster: 'meta_drama_comedy', axes: { absurdity: 0.575, edge: 0.65, register: 0.7, craft: 0.75, irony: 0.9 } },
    { id: 'michael', label: 'Michael Scott', cluster: 'cringe_mockumentary', axes: { absurdity: 0.6, edge: 0.55, register: 0.3, craft: 0.45, irony: 0.575 } },
    { id: 'gob', label: 'Gob Bluth', cluster: 'callback_clever', axes: { absurdity: 0.75, edge: 0.575, register: 0.4, craft: 0.6, irony: 0.65 } },
    { id: 'abed', label: 'Abed Nadir', cluster: 'meta_ensemble', axes: { absurdity: 0.7, edge: 0.4, register: 0.65, craft: 0.75, irony: 0.925 } },
    { id: 'jean', label: 'Jean-Ralphio', cluster: 'warm_workplace', axes: { absurdity: 0.7, edge: 0.55, register: 0.25, craft: 0.45, irony: 0.55 } },
    { id: 'moss', label: 'Moss (The IT Crowd)', cluster: 'british_awkward', axes: { absurdity: 0.725, edge: 0.45, register: 0.7, craft: 0.625, irony: 0.6 } },
  ] as HumorMediaItem[],
} as const;

export const ALL_HUMOR_MEDIA: HumorMediaItem[] = [
  ...HUMOR_MEDIA.tv,
  ...HUMOR_MEDIA.movie,
  ...HUMOR_MEDIA.comedian,
  ...HUMOR_MEDIA.character
];

export function findHumorMedia(id: string): HumorMediaItem | undefined {
  return ALL_HUMOR_MEDIA.find((m) => m.id === id);
}
