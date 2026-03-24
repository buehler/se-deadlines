import { CONFERENCES_URL, TYPES_URL, createSourceHash } from './source-hash.js';
const SOURCE_HASH_PATTERN = /source-hash:\s*([0-9a-f]{64})/i;

async function fetchRequiredText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'se-deadlines-hash-check/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchOptionalText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'se-deadlines-hash-check/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  }
}

function extractSourceHash(text) {
  const match = text.match(SOURCE_HASH_PATTERN);
  return match ? match[1].toLowerCase() : null;
}

async function main() {
  const pagesUri = process.env.DEPLOYED_URI?.trim();

  if (!pagesUri) {
    throw new Error('DEPLOYED_URI is required');
  }

  const [conferencesText, typesText, deployedFeed] = await Promise.all([
    fetchRequiredText(CONFERENCES_URL),
    fetchRequiredText(TYPES_URL),
    fetchOptionalText(pagesUri),
  ]);

  if (deployedFeed == null) {
    process.stdout.write('true\n');
    return;
  }

  const currentHash = createSourceHash(conferencesText, typesText);
  const deployedHash = extractSourceHash(deployedFeed);

  process.stdout.write(`${deployedHash !== currentHash}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
