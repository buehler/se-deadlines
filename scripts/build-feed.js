import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Feed } from 'feed';
import yaml from 'js-yaml';
import { marked } from 'marked';

import { CONFERENCES_URL, TYPES_URL, createSourceHash } from './source-hash.js';

const FEED_OUTPUT_FILE = resolve(process.cwd(), 'confs.rss');
const HTML_OUTPUT_FILE = resolve(process.cwd(), 'index.html');
const README_FILE = resolve(process.cwd(), 'README.md');
const MARKDOWN_CSS_FILE = resolve(process.cwd(), 'node_modules/github-markdown-css/github-markdown-light.css');

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
  return [
    sanitizeText(conference.name),
    String(conference.year ?? ''),
    sanitizeText(conference.link),
    canonicalDeadline.toISOString(),
  ].join('|');
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

function buildHtml(readmeHtml, markdownCss, siteUrl) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SE Deadlines RSS</title>
    <style>
${markdownCss}
body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 24px;
  background: #f6f8fa;
}
.markdown-body {
  padding: 32px;
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 12px;
}
@media (max-width: 767px) {
  body {
    padding: 16px;
  }
  .markdown-body {
    padding: 24px;
  }
}
    </style>
    <link rel="alternate" type="application/rss+xml" title="SE Deadlines RSS" href="${joinUrl(siteUrl, 'confs.rss')}">
  </head>
  <body>
    <main class="markdown-body">
${readmeHtml}
    </main>
  </body>
</html>
`;
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
  const [conferencesText, typesText, readmeMarkdown, markdownCss] = await Promise.all([
    fetchText(CONFERENCES_URL),
    fetchText(TYPES_URL),
    readFile(README_FILE, 'utf8'),
    readFile(MARKDOWN_CSS_FILE, 'utf8'),
  ]);

  const sourceHash = createSourceHash(conferencesText, typesText);
  const conferenceEntries = parseYaml(conferencesText, 'conferences.yml');
  const typeEntries = parseYaml(typesText, 'types.yml');
  const tagLookup = buildTagLookup(typeEntries);
  const filteredConferences = filterConferences(conferenceEntries);
  const siteUrl = process.env.SITE_URL?.trim() || 'https://example.invalid/';
  const rss = buildFeed(filteredConferences, tagLookup, sourceHash, siteUrl);
  const readmeHtml = marked.parse(readmeMarkdown);
  const html = buildHtml(readmeHtml, markdownCss, siteUrl);

  await Promise.all([writeFile(FEED_OUTPUT_FILE, rss, 'utf8'), writeFile(HTML_OUTPUT_FILE, html, 'utf8')]);
  process.stdout.write(`Wrote ${filteredConferences.length} items to ${FEED_OUTPUT_FILE} and ${HTML_OUTPUT_FILE}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
