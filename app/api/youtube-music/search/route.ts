import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    // Validate API key
    if (!GOOGLE_API_KEY) {
      console.error('[v0] Missing GOOGLE_API_KEY for YouTube search');
      return NextResponse.json(
        { error: 'YouTube search not configured' },
        { status: 500 }
      );
    }

    // Search YouTube using public API key (no authentication needed)
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&videoCategoryId=10&key=${GOOGLE_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[v0] YouTube search failed:', searchResponse.status, errorText);
      throw new Error(`YouTube search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    return NextResponse.json({
      results: searchData.items || [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Search error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to search', details: errorMessage },
      { status: 500 }
    );
  }
}
