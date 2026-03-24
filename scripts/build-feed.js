import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Feed } from 'feed';
import yaml from 'js-yaml';

import { CONFERENCES_URL, TYPES_URL, createSourceHash } from './source-hash.js';

const OUTPUT_FILE = resolve(process.cwd(), 'confs.rss');

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'se-deadlines-feed-generator/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseYaml(text, label) {
  const parsed = yaml.load(text);

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} did not parse into an array`);
  }

  return parsed;
}

function buildTagLookup(typeEntries) {
  const lookup = new Map();

  for (const entry of typeEntries) {
    const tag = typeof entry?.tag === 'string' ? entry.tag.trim() : '';
    const name = typeof entry?.name === 'string' ? entry.name.trim() : '';

    if (!tag || !name || lookup.has(tag)) {
      continue;
    }

    lookup.set(tag, name);
  }

  return lookup;
}

function parseDeadlineValue(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.toUpperCase() === 'TBA') {
    return null;
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds))
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function getCanonicalDeadline(rawDeadline) {
  const values = Array.isArray(rawDeadline) ? rawDeadline : [rawDeadline];
  const candidates = values.map(parseDeadlineValue).filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => left.getTime() - right.getTime());
  return candidates[0];
}

function subtractCalendarMonths(date, months) {
  const copy = new Date(date.getTime());
  copy.setUTCMonth(copy.getUTCMonth() - months);
  return copy;
}

function toIsoMinute(date) {
  return date.toISOString().slice(0, 16) + 'Z';
}

function joinUrl(baseUrl, pathName) {
  return new URL(pathName, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

function expandTags(tags, tagLookup) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => {
      if (typeof tag !== 'string') {
        return null;
      }

      const trimmed = tag.trim();
      if (!trimmed) {
        return null;
      }

      return tagLookup.has(trimmed) ? `${trimmed} (${tagLookup.get(trimmed)})` : trimmed;
    })
    .filter(Boolean);
}

function buildItemDescription(conference, canonicalDeadline, tagLookup) {
  const parts = [];

  if (conference.description) {
    parts.push(conference.description);
  }

  parts.push(`Deadline: ${toIsoMinute(canonicalDeadline)}`);

  if (conference.date) {
    parts.push(`Event date: ${conference.date}`);
  }

  if (conference.place) {
    parts.push(`Place: ${conference.place}`);
  }

  const expandedTags = expandTags(conference.tags, tagLookup);
  if (expandedTags.length > 0) {
    parts.push(`Tags: ${expandedTags.join(', ')}`);
  }

  if (conference.note) {
    parts.push(`Note: ${conference.note}`);
  }

  return parts.join('\n');
}

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function createGuid(conference, canonicalDeadline) {
  return createHash('sha256')
    .update(sanitizeText(conference.name))
    .update('|')
    .update(String(conference.year ?? ''))
    .update('|')
    .update(sanitizeText(conference.link))
    .update('|')
    .update(canonicalDeadline.toISOString())
    .digest('hex');
}

function buildFeed(conferences, tagLookup, sourceHash, siteUrl) {
  const feedUrl = joinUrl(siteUrl, 'confs.rss');
  const latestDeadline = conferences.at(-1)?.canonicalDeadline ?? new Date();
  const feed = new Feed({
    id: siteUrl,
    title: 'SE Deadlines RSS',
    description: 'Software engineering conference deadlines from the SE Deadlines dataset.',
    link: siteUrl,
    language: 'en',
    favicon: joinUrl(siteUrl, 'favicon.ico'),
    updated: latestDeadline,
    feedLinks: {
      rss2: feedUrl,
    },
    generator: 'se-deadlines feed generator',
  });

  for (const conference of conferences) {
    const titleParts = [sanitizeText(conference.name)];
    if (conference.year != null) {
      titleParts.push(String(conference.year));
    }

    feed.addItem({
      id: createGuid(conference, conference.canonicalDeadline),
      title: titleParts.join(' ').trim(),
      link: sanitizeText(conference.link) || feedUrl,
      description: buildItemDescription(conference, conference.canonicalDeadline, tagLookup),
      date: conference.canonicalDeadline,
    });
  }

  const rss = feed.rss2();
  const sourceComment = `<!-- source-hash: ${sourceHash} -->`;

  return rss.startsWith('<?xml')
    ? rss.replace(/^<\?xml[^>]*\?>/, (match) => `${match}\n${sourceComment}`)
    : `${sourceComment}\n${rss}`;
}

function filterConferences(conferences) {
  const now = new Date();
  const cutoff = subtractCalendarMonths(now, 6);

  return conferences
    .map((conference) => {
      const canonicalDeadline = getCanonicalDeadline(conference?.deadline);

      if (!canonicalDeadline) {
        return null;
      }

      if (canonicalDeadline < cutoff) {
        return null;
      }

      return {
        ...conference,
        canonicalDeadline,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.canonicalDeadline.getTime() - right.canonicalDeadline.getTime());
}

async function main() {
  const [conferencesText, typesText] = await Promise.all([fetchText(CONFERENCES_URL), fetchText(TYPES_URL)]);

  const sourceHash = createSourceHash(conferencesText, typesText);

  if (process.argv.includes('--hash-only')) {
    process.stdout.write(`${sourceHash}\n`);
    return;
  }

  const conferenceEntries = parseYaml(conferencesText, 'conferences.yml');
  const typeEntries = parseYaml(typesText, 'types.yml');
  const tagLookup = buildTagLookup(typeEntries);
  const filteredConferences = filterConferences(conferenceEntries);
  const siteUrl = process.env.SITE_URL?.trim() || 'https://example.invalid/';
  const rss = buildFeed(filteredConferences, tagLookup, sourceHash, siteUrl);

  await writeFile(OUTPUT_FILE, rss, 'utf8');
  process.stdout.write(`Wrote ${filteredConferences.length} items to ${OUTPUT_FILE}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
