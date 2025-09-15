import { NextRequest, NextResponse } from 'next/server';
import { searchWikipediaArticles, ContentExtractionError } from '@/lib/content-extraction';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const language = searchParams.get('lang') || 'en';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate language code (basic validation)
    if (!/^[a-z]{2,3}$/.test(language)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    const results = await searchWikipediaArticles(query, language, limit);
    
    return NextResponse.json({
      query,
      language,
      results,
      totalResults: results.length
    });

  } catch (error) {
    console.error('Wikipedia search error:', error);
    
    if (error instanceof ContentExtractionError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.statusCode === 404 ? 'NO_RESULTS' : 'SEARCH_FAILED'
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error during Wikipedia search',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}