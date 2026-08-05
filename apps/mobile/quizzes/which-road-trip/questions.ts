// ============================================
// WHAT THIS FILE DOES (plain English):
// The questions for the road-trip quiz in demo mode. Each option carries
// light weights so the client can pick Coastal / Mountain / Desert without
// calling the server. Live mode ignores these weights and posts to the API.
// ============================================

export type RoadTripOption = {
  id: string;
  label: string;
  /** Demo-only scoring weights (PRIVACY: never sent in live mode). */
  weights: { coastal: number; mountain: number; desert: number };
};

export type RoadTripQuestion = {
  id: string;
  prompt: string;
  options: RoadTripOption[];
};

export const QUESTIONS: RoadTripQuestion[] = [
  {
    id: 'q1',
    prompt: 'First stop after leaving town?',
    options: [
      {
        id: 'q1a',
        label: 'A overlook above the ocean',
        weights: { coastal: 3, mountain: 0, desert: 0 }
      },
      {
        id: 'q1b',
        label: 'A trailhead before the switchbacks',
        weights: { coastal: 0, mountain: 3, desert: 0 }
      },
      {
        id: 'q1c',
        label: 'A dusty diner at a lonely junction',
        weights: { coastal: 0, mountain: 0, desert: 3 }
      }
    ]
  },
  {
    id: 'q2',
    prompt: 'What is riding shotgun?',
    options: [
      {
        id: 'q2a',
        label: 'Salt-air playlist + windows down',
        weights: { coastal: 3, mountain: 1, desert: 0 }
      },
      {
        id: 'q2b',
        label: 'Layers, snacks, and a paper map',
        weights: { coastal: 0, mountain: 3, desert: 1 }
      },
      {
        id: 'q2c',
        label: 'Sunglasses and a cooler of citrus',
        weights: { coastal: 1, mountain: 0, desert: 3 }
      }
    ]
  },
  {
    id: 'q3',
    prompt: 'Ideal overnight?',
    options: [
      {
        id: 'q3a',
        label: 'Cabin with waves you can hear',
        weights: { coastal: 3, mountain: 1, desert: 0 }
      },
      {
        id: 'q3b',
        label: 'Tent under pine trees',
        weights: { coastal: 0, mountain: 3, desert: 1 }
      },
      {
        id: 'q3c',
        label: 'Motel neon + wide open sky',
        weights: { coastal: 0, mountain: 0, desert: 3 }
      }
    ]
  },
  {
    id: 'q4',
    prompt: 'Souvenir you actually keep?',
    options: [
      {
        id: 'q4a',
        label: 'A smooth sea glass piece',
        weights: { coastal: 3, mountain: 0, desert: 0 }
      },
      {
        id: 'q4b',
        label: 'A trail stub from the summit',
        weights: { coastal: 0, mountain: 3, desert: 0 }
      },
      {
        id: 'q4c',
        label: 'A postcard from nowhere special',
        weights: { coastal: 0, mountain: 1, desert: 3 }
      }
    ]
  }
];
