export interface FighterProfile {
  id: number;
  name: string;
  title: string;
  odds: string;
  winRate: number;
  avatar: string;
  element: 'fire' | 'ice' | 'lightning';
  power: number;
  speed: number;
  defense: number;
}

export const fighterProfiles: FighterProfile[] = [
  {
    id: 0,
    name: "Blaze Phoenix",
    title: "The Inferno Lord",
    odds: "1.85",
    winRate: 52.3,
    avatar: "fire",
    element: 'fire',
    power: 95,
    speed: 78,
    defense: 72,
  },
  {
    id: 1,
    name: "Frost Titan",
    title: "The Ice Emperor",
    odds: "2.10",
    winRate: 47.8,
    avatar: "ice",
    element: 'ice',
    power: 82,
    speed: 68,
    defense: 96,
  },
  {
    id: 2,
    name: "Storm Raider",
    title: "The Thunder God",
    odds: "3.50",
    winRate: 38.5,
    avatar: "lightning",
    element: 'lightning',
    power: 88,
    speed: 98,
    defense: 65,
  },
];

export function getFighterById(id: number) {
  return fighterProfiles.find((fighter) => fighter.id === id);
}

export function getElementColor(element: 'fire' | 'ice' | 'lightning') {
  switch (element) {
    case 'fire':
      return {
        primary: 'from-orange-500 to-red-600',
        glow: 'shadow-orange-500/50',
        text: 'text-orange-400',
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/50',
      };
    case 'ice':
      return {
        primary: 'from-cyan-400 to-blue-600',
        glow: 'shadow-cyan-500/50',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/20',
        border: 'border-cyan-500/50',
      };
    case 'lightning':
      return {
        primary: 'from-purple-400 to-violet-600',
        glow: 'shadow-purple-500/50',
        text: 'text-purple-400',
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
      };
  }
}
