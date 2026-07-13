const MEBIBYTE = 1024 * 1024;

export const FILE_SIZE_LIMITS = {
  avatar: 2 * MEBIBYTE,
  noteImage: 5 * MEBIBYTE,
  cardAttachment: 20 * MEBIBYTE,
  chatAttachment: 50 * MEBIBYTE,
  chatRequest: 50 * MEBIBYTE,
} as const;

export const isFileTooLarge = (file: File, limit: number): boolean =>
  file.size > limit;
