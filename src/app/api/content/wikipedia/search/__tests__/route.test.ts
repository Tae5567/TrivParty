import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the content extraction module
vi.mock('@/lib/content-extraction', () => ({
  searchWikipediaArticles: vi.fn(),
  ContentExtractionError: class ContentExtractionError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
      this.name = 'ContentExtractionError';
    }
  }
}));

// Import after mocking
const { searchWikipediaArticles, ContentExtractionError } = await import('@/lib/content-extraction');
const mockSearchWikipediaArticles = vi.mocked(searchWikipediaArticles);

describe('/api/content/wikipedia/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search Wikipedia articles successfully', async () => {
    const mockResults = [
      {
        title: 'JavaScript',
        description: 'Programming language',
        extract: 'JavaScript is a programming language...',
        thumbnail: 'https://example.com/thumb.jpg',
        pageId: 123456
      },
      {
        title: 'TypeScript',
        description: 'Typed superset of JavaScript',
        extract: 'TypeScript is a typed superset...',
        pageId: 789012
      }
    ];

    mockSearchWikipediaArticles.mockResolvedValueOnce(mockResults);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=javascript&lang=en&limit=2');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe('javascript');
    expect(data.language).toBe('en');
    expect(data.results).toEqual(mockResults);
    expect(data.totalResults).toBe(2);

    expect(mockSearchWikipediaArticles).toHaveBeenCalledWith('javascript', 'en', 2);
  });

  it('should use default parameters when not provided', async () => {
    const mockResults = [];
    mockSearchWikipediaArticles.mockResolvedValueOnce(mockResults);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test');

    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockSearchWikipediaArticles).toHaveBeenCalledWith('test', 'en', 10);
  });

  it('should return 400 for missing query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is required');
  });

  it('should return 400 for invalid limit', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test&limit=100');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Limit must be between 1 and 50');
  });

  it('should return 400 for invalid language code', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test&lang=invalid');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid language code');
  });

  it('should handle search errors', async () => {
    const error = new ContentExtractionError('Search failed', 500);
    mockSearchWikipediaArticles.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Search failed');
    expect(data.code).toBe('SEARCH_FAILED');
  });

  it('should handle no results', async () => {
    const error = new ContentExtractionError('No results found', 404);
    mockSearchWikipediaArticles.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=nonexistent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No results found');
    expect(data.code).toBe('NO_RESULTS');
  });

  it('should handle generic errors', async () => {
    const error = new Error('Network error');
    mockSearchWikipediaArticles.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error during Wikipedia search');
    expect(data.code).toBe('INTERNAL_ERROR');
  });

  it('should handle different language codes', async () => {
    const mockResults = [];
    mockSearchWikipediaArticles.mockResolvedValueOnce(mockResults);

    const request = new NextRequest('http://localhost:3000/api/content/wikipedia/search?q=test&lang=es');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.language).toBe('es');
    expect(mockSearchWikipediaArticles).toHaveBeenCalledWith('test', 'es', 10);
  });
});