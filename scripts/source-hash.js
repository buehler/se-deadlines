import { createHash } from 'node:crypto';

export const CONFERENCES_URL =
  'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/conferences.yml';
export const TYPES_URL = 'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/types.yml';

const SOURCE_DELIMITER = '\n--SOURCE-DELIMITER--\n';

export function createSourceHash(conferencesText, typesText) {
  return createHash('sha256').update(conferencesText).update(SOURCE_DELIMITER).update(typesText).digest('hex');
}
