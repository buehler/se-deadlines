import { parse } from '@formkit/tempo';
import yaml from 'js-yaml';

export const CONFERENCES_URL =
  'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/conferences.yml';
export const TAGS_URL =
  'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/types.yml';

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

type SourceConference = {
  name: string;
  description: string;
  year: number;
  link: string;
  deadline: string[];
  date?: string;
  place?: string;
  note?: string;
  tags: string[];
};

export type Tag = {
  name: string;
  tag: string;
  type: 'venue' | 'track' | 'others';
};

export type Conference = Omit<SourceConference, 'deadline' | 'tags'> & {
  deadline: Date;
  tags: Tag[];
};

async function fetchYaml<T>(url: string) {
  const response = await fetch(url, {
    next: {
      revalidate: ONE_DAY_IN_SECONDS,
    },
  });

  return yaml.load(await response.text()) as T;
}

function normalizeToUtc(date: Date) {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  );
}

function convertConference(conference: SourceConference, tagsBySlug: Map<string, Tag>) {
  try {
    const parsedDeadline = parse(conference.deadline[0], 'YYYY-MM-DD HH:mm');

    return {
      ...conference,
      deadline: normalizeToUtc(parsedDeadline),
      tags: conference.tags
        .map((tagSlug) => tagsBySlug.get(tagSlug))
        .filter((tag): tag is Tag => tag !== undefined),
    } satisfies Conference;
  } catch {
    return null;
  }
}

export async function getConferences() {
  const [conferences, tags] = await Promise.all([
    fetchYaml<SourceConference[]>(CONFERENCES_URL),
    fetchYaml<Tag[]>(TAGS_URL),
  ]);

  const tagsBySlug = new Map(tags.map((tag) => [tag.tag, tag]));

  return conferences
    .map((conference) => convertConference(conference, tagsBySlug))
    .filter((conference): conference is Conference => conference !== null)
    .toSorted((left, right) => left.deadline.getTime() - right.deadline.getTime());
}
