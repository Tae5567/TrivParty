import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the content extraction module
vi.mock('@/lib/content-extraction', () => ({
  extractYouTubeTranscript: vi.fn(),
  ContentExtractionError: class ContentExtractionError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
      this.name = 'ContentExtractionError';
    }
  }
}));

// Import after mocking
const { extractYouTubeTranscript, ContentExtractionError } = await import('@/lib/content-extraction');
const mockExtractYouTubeTranscript = vi.mocked(extractYouTubeTranscript);

describe('/api/content/youtube', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract YouTube transcript successfully', async () => {
    const mockResult = {
      content: 'This is a test transcript.',
      transcript: 'This is a test transcript.',
      title: 'Test Video',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      type: 'youtube' as const
    };

    mockExtractYouTubeTranscript.mockResolvedValueOnce(mockResult);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      transcript: 'This is a test transcript.',
      title: 'Test Video',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ'
    });

    expect(mockExtractYouTubeTranscript).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
  });

  it('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required and must be a string');
  });

  it('should return 400 for invalid URL type', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 123 })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required and must be a string');
  });

  it('should handle ContentExtractionError with custom status', async () => {
    const error = new ContentExtractionError('Invalid YouTube URL', 400);
    mockExtractYouTubeTranscript.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://google.com' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid YouTube URL');
    expect(data.code).toBe('EXTRACTION_FAILED');
  });

  it('should handle API quota exceeded errors', async () => {
    const error = new ContentExtractionError('YouTube API quota exceeded', 403);
    mockExtractYouTubeTranscript.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=test' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('YouTube API quota exceeded');
    expect(data.code).toBe('API_QUOTA_EXCEEDED');
  });

  it('should handle video not found errors', async () => {
    const error = new ContentExtractionError('Video not found or unavailable', 404);
    mockExtractYouTubeTranscript.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=invalid' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Video not found or unavailable');
    expect(data.code).toBe('VIDEO_NOT_FOUND');
  });

  it('should handle generic errors with 500 status', async () => {
    const error = new Error('Network error');
    mockExtractYouTubeTranscript.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while extracting YouTube content');
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('should handle malformed JSON request', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while extracting YouTube transcript');
  });

  it('should handle youtu.be URLs', async () => {
    const mockResult = {
      content: 'Short URL transcript.',
      transcript: 'Short URL transcript.',
      title: 'Short URL Video',
      sourceUrl: 'https://youtu.be/abc123def456',
      videoId: 'abc123def456',
      type: 'youtube' as const
    };

    mockExtractYouTubeTranscript.mockResolvedValueOnce(mockResult);

    const request = new NextRequest('http://localhost:3000/api/content/youtube', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://youtu.be/abc123def456' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.videoId).toBe('abc123def456');
    expect(data.title).toBe('Short URL Video');
  });
});