import { format } from '@formkit/tempo';
import { RsqlFilter } from '@mw-experts/rsql';
import { Feed } from 'feed';
import ical, { ICalCalendarMethod, ICalEventClass } from 'ical-generator';
import { Conference, getConferences } from '@/lib/data';
import { NextURL } from 'next/dist/server/web/next-url';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

async function formatText(venues: Conference[]) {
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
      data.push(`  Tags: ${v.tags.map((tag) => tag.name).join(', ')}`);
    }
    data.push('');
  }

  return { contentType, data: data.join('\n') };
}

function createVenueId(venue: Conference) {
  return createHash('sha256').update(JSON.stringify(venue)).digest('hex');
}

function buildFeed(venues: Conference[], uri: NextURL) {
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
          name: t.name,
        })) ?? [],
      date: v.deadline,
    });
  }

  return feed;
}

async function formatRSS(venues: Conference[], uri: NextURL) {
  const contentType = 'application/rss+xml;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).rss2() };
}

async function formatJsonFeed(venues: Conference[], uri: NextURL) {
  const contentType = 'application/feed+json;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).json1() };
}

async function formatJson(venues: Conference[]) {
  const contentType = 'application/json;charset=utf-8';
  return { contentType, data: JSON.stringify(venues) };
}

async function formatAtom(venues: Conference[], uri: NextURL) {
  const contentType = 'application/atom+xml;charset=utf-8';
  return { contentType, data: buildFeed(venues, uri).atom1() };
}

async function formatICAL(venues: Conference[], uri: NextURL) {
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
      categories: v.tags.map((t) => ({ name: t.name })),
      class: ICalEventClass.PUBLIC,
      url: v.link,
    });
  }

  return { contentType, data: calendar.toString() };
}

const converters: {
  [key: string]: (venues: Conference[], uri: NextURL) => Promise<{ contentType: string; data: string }>;
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
  const venues = await getConferences();
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
