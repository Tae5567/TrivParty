import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeTranscript, ContentExtractionError } from '@/lib/content-extraction';

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

    const result = await extractYouTubeTranscript(url);

    return NextResponse.json({
      transcript: result.transcript,
      title: result.title,
      sourceUrl: result.sourceUrl,
      videoId: result.videoId
    });

  } catch (error) {
    console.error('YouTube content extraction error:', error);
    
    if (error instanceof ContentExtractionError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.statusCode === 403 ? 'API_QUOTA_EXCEEDED' : 
                error.statusCode === 404 ? 'VIDEO_NOT_FOUND' : 'EXTRACTION_FAILED'
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error while extracting YouTube content',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}