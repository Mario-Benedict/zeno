export const AVATAR_COLORS = [
  'accent-red',
  'accent-orange',
  'accent-yellow',
  'accent-lime',
  'accent-green',
  'accent-cyan',
  'accent-blue',
  'accent-purple',
  'accent-pink',
  'accent-brown',
  'accent-red-light',
  'accent-orange-light',
  'accent-yellow-light',
  'accent-lime-light',
  'accent-green-light',
  'accent-cyan-light',
  'accent-blue-light',
  'accent-purple-light',
  'accent-pink-light',
  'accent-brown-light',
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const AVATAR_COLOR_HEX: Record<string, string> = {
  'accent-red': '#D32F2F',
  'accent-orange': '#F57C00',
  'accent-yellow': '#FBC02D',
  'accent-lime': '#7CB342',
  'accent-green': '#00897B',
  'accent-cyan': '#0288D1',
  'accent-blue': '#3949AB',
  'accent-purple': '#8E24AA',
  'accent-pink': '#C2185B',
  'accent-brown': '#8D6E63',
  'accent-red-light': '#FFB3B3',
  'accent-orange-light': '#FFD1A1',
  'accent-yellow-light': '#FFF0B3',
  'accent-lime-light': '#DCEDC8',
  'accent-green-light': '#B2DFDB',
  'accent-cyan-light': '#B3E5FC',
  'accent-blue-light': '#C5CAE9',
  'accent-purple-light': '#E1BEE7',
  'accent-pink-light': '#F8BBD0',
  'accent-brown-light': '#D7CCC8',
};

export const avatarHex = (color: string): string =>
  AVATAR_COLOR_HEX[color] ?? '#3949AB';
