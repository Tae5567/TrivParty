import { NextRequest, NextResponse } from 'next/server';
import { extractWikipediaContent, ContentExtractionError } from '@/lib/content-extraction';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await extractWikipediaContent(url);
    
    return NextResponse.json({
      content: result.content,
      title: result.title,
      sourceUrl: result.sourceUrl
    });

  } catch (error) {
    console.error('Wikipedia content extraction error:', error);
    
    if (error instanceof ContentExtractionError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.statusCode === 404 ? 'PAGE_NOT_FOUND' : 
                error.statusCode === 400 ? 'INVALID_URL' : 'EXTRACTION_FAILED'
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error while extracting Wikipedia content',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}