import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the content extraction module
vi.mock('@/lib/content-extraction', () => ({
  searchYouTubeVideos: vi.fn(),
  ContentExtractionError: class ContentExtractionError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
      this.name = 'ContentExtractionError';
    }
  }
}));

// Import after mocking
const { searchYouTubeVideos, ContentExtractionError } = await import('@/lib/content-extraction');
const mockSearchYouTubeVideos = vi.mocked(searchYouTubeVideos);

describe('/api/content/youtube/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search YouTube videos successfully', async () => {
    const mockResults = [
      {
        videoId: 'abc123',
        title: 'Test Video 1',
        channelTitle: 'Test Channel',
        description: 'Test description',
        thumbnailUrl: 'https://img.youtube.com/vi/abc123/default.jpg',
        publishedAt: '2024-01-01T00:00:00Z'
      },
      {
        videoId: 'def456',
        title: 'Test Video 2',
        channelTitle: 'Another Channel',
        description: 'Another description',
        thumbnailUrl: 'https://img.youtube.com/vi/def456/default.jpg',
        publishedAt: '2024-01-02T00:00:00Z'
      }
    ];

    mockSearchYouTubeVideos.mockResolvedValueOnce(mockResults);

    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=javascript&maxResults=2');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe('javascript');
    expect(data.results).toEqual(mockResults);
    expect(data.totalResults).toBe(2);

    expect(mockSearchYouTubeVideos).toHaveBeenCalledWith('javascript', 2);
  });

  it('should return 400 for missing query parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/youtube/search');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Search query is required');
  });

  it('should return 400 for invalid maxResults', async () => {
    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=test&maxResults=100');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('maxResults must be between 1 and 50');
  });

  it('should use default maxResults when not provided', async () => {
    const mockResults = [];
    mockSearchYouTubeVideos.mockResolvedValueOnce(mockResults);

    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=test');

    const response = await GET(request);
    
    expect(response.status).toBe(200);
    expect(mockSearchYouTubeVideos).toHaveBeenCalledWith('test', 10);
  });

  it('should handle API quota exceeded errors', async () => {
    const error = new ContentExtractionError('YouTube API quota exceeded', 403);
    mockSearchYouTubeVideos.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('YouTube API quota exceeded');
    expect(data.code).toBe('API_QUOTA_EXCEEDED');
  });

  it('should handle search errors', async () => {
    const error = new ContentExtractionError('Search failed', 500);
    mockSearchYouTubeVideos.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Search failed');
    expect(data.code).toBe('SEARCH_FAILED');
  });

  it('should handle generic errors', async () => {
    const error = new Error('Network error');
    mockSearchYouTubeVideos.mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/content/youtube/search?q=test');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error during YouTube search');
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});