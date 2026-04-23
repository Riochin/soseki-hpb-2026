import { NextResponse } from 'next/server';
import { IS_UI_MOCK } from '@/lib/mock';

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const RESULT_LIMIT = 5;
const SEARCH_QUERY = '#アクメ漱石生誕祭2026 -is:retweet -from:Asou999 lang:ja';
const MOCK_TWEETS = [
  { id: '2046973279437836343', url: 'https://x.com/katahabain/status/2046973279437836343' },
  { id: '2046974150565310793', url: 'https://x.com/totten_JO_LS/status/2046974150565310793' },
  { id: '2046975398479859922', url: 'https://x.com/karaten_nidoage/status/2046975398479859922' },
  { id: '2046977501906505908', url: 'https://x.com/tsuyoi_BG/status/2046977501906505908' },
  { id: '2046981928683971050', url: 'https://x.com/kotakieki_ls/status/2046981928683971050' },
];

interface XRecentSearchResponse {
  data?: Array<{ id: string; author_id: string }>;
  includes?: {
    users?: Array<{ id: string; username: string }>;
  };
}

export async function GET() {
  if (IS_UI_MOCK) {
    return NextResponse.json({ enabled: true, tweets: MOCK_TWEETS }, { status: 200 });
  }

  if (!X_BEARER_TOKEN) {
    return NextResponse.json({ enabled: false, tweets: [] }, { status: 200 });
  }

  const endpoint = new URL('https://api.x.com/2/tweets/search/recent');
  endpoint.searchParams.set('query', SEARCH_QUERY);
  endpoint.searchParams.set('max_results', '10');
  endpoint.searchParams.set('expansions', 'author_id');
  endpoint.searchParams.set('user.fields', 'username');

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        Authorization: `Bearer ${X_BEARER_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ enabled: false, tweets: [] }, { status: 200 });
    }

    const payload = (await response.json()) as XRecentSearchResponse;
    const users = new Map((payload.includes?.users ?? []).map((user) => [user.id, user.username]));
    const tweets = (payload.data ?? [])
      .slice(0, RESULT_LIMIT)
      .map((tweet) => {
        const username = users.get(tweet.author_id);
        if (!username) return null;
        return {
          id: tweet.id,
          url: `https://x.com/${username}/status/${tweet.id}`,
        };
      })
      .filter((tweet): tweet is { id: string; url: string } => tweet !== null);

    return NextResponse.json(
      { enabled: true, tweets },
      { status: 200, headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    );
  } catch {
    return NextResponse.json({ enabled: false, tweets: [] }, { status: 200 });
  }
}
