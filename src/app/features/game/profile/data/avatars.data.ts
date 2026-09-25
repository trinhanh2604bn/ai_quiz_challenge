export interface AvatarOption {
  id: string;
  label: string;
  glyph: string;
}

export const PROFILE_AVATARS: readonly AvatarOption[] = [
  { id: 'nova', label: 'Nova', glyph: '🌟' },
  { id: 'orbit', label: 'Orbit', glyph: '🪐' },
  { id: 'circuit', label: 'Circuit', glyph: '🤖' },
  { id: 'spark', label: 'Spark', glyph: '⚡' },
  { id: 'atlas', label: 'Atlas', glyph: '🧠' },
  { id: 'pixel', label: 'Pixel', glyph: '👾' },
];

export function avatarById(id: string): AvatarOption | null {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? null;
}
