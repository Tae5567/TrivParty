import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the content extraction module
vi.mock('@/lib/content-extraction', () => ({
  extractWikipediaContent: vi.fn(),
  ContentExtractionError: class ContentExtractionError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
      this.name = 'ContentExtractionError';
    }
  }
}));

// Import after mocking
const { extractWikipediaContent, ContentExtractionError } = await import('@/lib/content-extraction');
const mockExtractWikipediaContent = vi.mocked(extractWikipediaContent);

describe('/api/content/wikipedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract Wikipedia content successfully', async () => {
    const mockResult = {
      content: 'JavaScript is a programming language.',
      title: 'JavaScript',
      sourceUrl: 'https://en.wikipedia.org/wiki/JavaScript',
      type: 'wikipedia' as const
    };

    mockExtractWikipediaContent.mockResolvedValueOnce(mockResult);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://en.wikipedia.org/wiki/JavaScript' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      content: 'JavaScript is a programming language.',
      title: 'JavaScript',
      sourceUrl: 'https://en.wikipedia.org/wiki/JavaScript'
    });

    expect(mockExtractWikipediaContent).toHaveBeenCalledWith(
      'https://en.wikipedia.org/wiki/JavaScript'
    );
  });

  it('should return 400 for missing URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required and must be a string');
  });

  it('should return 400 for invalid URL type', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: JSON.stringify({ url: 123 })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('URL is required and must be a string');
  });

  it('should handle ContentExtractionError with custom status', async () => {
    const error = new ContentExtractionError('Invalid Wikipedia URL', 400);
    mockExtractWikipediaContent.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://google.com' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid Wikipedia URL');
  });

  it('should handle generic errors with 500 status', async () => {
    const error = new Error('Network error');
    mockExtractWikipediaContent.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://en.wikipedia.org/wiki/JavaScript' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while extracting Wikipedia content');
  });

  it('should handle malformed JSON request', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error while extracting Wikipedia content');
  });
});