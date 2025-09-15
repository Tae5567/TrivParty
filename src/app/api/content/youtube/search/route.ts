import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos, ContentExtractionError } from '@/lib/content-extraction';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (maxResults < 1 || maxResults > 50) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 50' },
        { status: 400 }
      );
    }

    const results = await searchYouTubeVideos(query, maxResults);
    
    return NextResponse.json({
      query,
      results,
      totalResults: results.length
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    
    if (error instanceof ContentExtractionError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.statusCode === 403 ? 'API_QUOTA_EXCEEDED' : 'SEARCH_FAILED'
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error during YouTube search',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}