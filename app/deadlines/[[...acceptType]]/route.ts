import { format, parse } from '@formkit/tempo';
import { RsqlFilter } from '@mw-experts/rsql';
import { Feed } from 'feed';
import ical, { ICalCalendarMethod, ICalEventClass } from 'ical-generator';
import yaml from 'js-yaml';
import { NextURL } from 'next/dist/server/web/next-url';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

export const CONFERENCES_URL =
  'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/conferences.yml';
// export const TYPES_URL =
//   'https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/types.yml';

type Type = 'venue' | 'track' | 'others';
type Tag = {
  name: string;
  tag: string;
  type: Type;
};

type Venue = {
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

type ConvertedVenue = Venue & {
  deadline: Date;
};

async function getData() {
  const revalidate = 60 * 60 * 24; // revalidate every 24 hours
  const [confs] = await Promise.all([
    fetch(CONFERENCES_URL, {
      next: {
        revalidate,
      },
    }).then((r) => r.text()),
    // fetch(TYPES_URL, {
    //   next: {
    //     revalidate,
    //   },
    // }).then((r) => r.text()),
  ]);

  return yaml.load(confs) as Venue[];
}

async function formatText(venues: ConvertedVenue[]) {
  const contentType = 'text/plain;charset=utf-8';
  const data = [];

  for (const v of venues) {
    data.push(`${v.name} (${v.year})`);
    data.push(`  Description: ${v.description}`);
    data.push(`  Deadline: ${format(v.deadline, { date: 'long', time: 'short' }, 'en-CH')}`);
    if (v.date) {
      data.push(`  Date: ${v.date}`);
    }
    if (v.place) {
      data.push(`  Place: ${v.place}`);
    }
    if (v.note) {
      data.push(`  Note: ${v.note}`);
    }
    data.push(`  Link: ${v.link}`);
    if (v.tags.length > 0) {
      data.push(`  Tags: ${v.tags.join(', ')}`);
    }
    data.push('');
  }

  return { contentType, data: data.join('\n') };
}

function createVenueId(venue: ConvertedVenue) {
  return createHash('sha256').update(JSON.stringify(venue)).digest('hex');
}

function buildFeed(venues: ConvertedVenue[], uri: NextURL) {
  const feed = new Feed({
    title: 'SE Deadlines',
    description: 'Software engineering conference deadlines from the SE Deadlines dataset.',
    id: uri.toString(),
    link: uri.toString(),
    language: 'en',
    generator: 'se-deadlines feed generator',
  });

  for (const v of venues) {
    feed.addItem({
      id: createVenueId(v),
      title: `${v.name} (${v.year})`,
      link: v.link,
      description: v.description,
      content: [
        `<p><strong>${v.name} (${v.year})</strong></p>`,
        `<p>Deadline: ${format(v.deadline, { date: 'long', time: 'short' }, 'en-CH')}</p>`,
        v.date ? `<p>Date: ${v.date}</p>` : null,
        v.place ? `<p>Place: ${v.place}</p>` : null,
        v.note ? `<p>Note: ${v.note}</p>` : null,
        v.link ? `<p>Link: <a href="${v.link}">${v.name}</a></p>` : null,
      ]
        .filter(Boolean)
        .join(''),
      category:
        v.tags.map((t) => ({
          name: t,
        })) ?? [],
      date: v.deadline,
    });
  }

  return feed;
}

async function formatRSS(venues: ConvertedVenue[], uri: NextURL) {
  const contentType = 'application/rss+xml;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).rss2() };
}

async function formatJsonFeed(venues: ConvertedVenue[], uri: NextURL) {
  const contentType = 'application/feed+json;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).json1() };
}

async function formatJson(venues: ConvertedVenue[], uri: NextURL) {
  const contentType = 'application/json;charset=utf-8';
  return { contentType, data: JSON.stringify(venues) };
}

async function formatAtom(venues: ConvertedVenue[], uri: NextURL) {
  const contentType = 'application/atom+xml;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).atom1() };
}

async function formatICAL(venues: ConvertedVenue[], uri: NextURL) {
  const contentType = 'text/calendar;charset=utf-8';
  const calendar = ical({
    name: 'SE Deadlines',
    description: 'Software engineering conference deadlines from the SE Deadlines dataset.',
    url: uri.toString(),
    prodId: '//se-deadlines//ical-generator//EN',
    source: uri.toString(),
    ttl: 60 * 60 * 24, // 1 day
    method: ICalCalendarMethod.PUBLISH,
  });

  for (const v of venues) {
    calendar.createEvent({
      id: createVenueId(v),
      start: v.deadline,
      stamp: v.deadline,
      allDay: true,
      summary: `${v.name} (${v.year})`,
      description: [
        `${v.name} (${v.year})`,
        `Deadline: ${format(v.deadline, { date: 'long', time: 'short' }, 'en-CH')}`,
        v.date ? `Date: ${v.date}` : null,
        v.place ? `Place: ${v.place}` : null,
        v.note ? `Note: ${v.note}` : null,
        v.link ? `Link: ${v.link}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      location: v.place,
      categories: v.tags.map((t) => ({ name: t })),
      class: ICalEventClass.PUBLIC,
      url: v.link,
    });
  }

  return { contentType, data: calendar.toString() };
}

const converters: {
  [key: string]: (venues: ConvertedVenue[], uri: NextURL) => Promise<{ contentType: string; data: string }>;
} = {
  rss: formatRSS,
  'json-feed': formatJsonFeed,
  json: formatJson,
  atom: formatAtom,
  ical: formatICAL,
  default: formatText,
};

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ acceptType?: string[] }>;
  }
) {
  const venues = (await getData())
    .map((v) => {
      try {
        return {
          ...v,
          deadline: parse(v.deadline[0], 'YYYY-MM-DD HH:mm'),
        } as ConvertedVenue;
      } catch {
        return null;
      }
    })
    .filter((v) => v !== null)
    .toSorted((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const { acceptType } = await params;
  const requestedType = acceptType?.[0] ?? 'text';
  const searchQ = request.nextUrl.searchParams.get('q');
  const result = !!searchQ ? RsqlFilter.getInstance().filter(searchQ, venues) : venues;

  const { contentType, data } = await (converters[requestedType] || converters['default'])(result, request.nextUrl);

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
    },
  });
}
