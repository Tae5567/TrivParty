import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateUrl,
  extractWikipediaPageTitle,
  extractYouTubeVideoId,
  extractWikipediaContent,
  extractYouTubeTranscript,
  ContentExtractionError
} from '../content-extraction';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Content Extraction Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateUrl', () => {
    it('should validate Wikipedia URLs correctly', () => {
      const validWikipediaUrls = [
        'https://en.wikipedia.org/wiki/JavaScript',
        'https://fr.wikipedia.org/wiki/Paris',
        'https://de.wikipedia.org/wiki/Berlin'
      ];

      validWikipediaUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('wikipedia');
      });
    });

    it('should validate YouTube URLs correctly', () => {
      const validYouTubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      validYouTubeUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.type).toBe('youtube');
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://google.com',
        'https://example.com',
        'not-a-url',
        ''
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unknown');
      });
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https://',
        'ftp://example.com'
      ];

      malformedUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.type).toBe('unknown');
      });
    });
  });

  describe('extractWikipediaPageTitle', () => {
    it('should extract page title from Wikipedia URLs', () => {
      const testCases = [
        {
          url: 'https://en.wikipedia.org/wiki/JavaScript',
          expected: 'JavaScript'
        },
        {
          url: 'https://en.wikipedia.org/wiki/Machine_learning',
          expected: 'Machine_learning'
        },
        {
          url: 'https://fr.wikipedia.org/wiki/Paris',
          expected: 'Paris'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractWikipediaPageTitle(url);
        expect(result).toBe(expected);
      });
    });

    it('should handle URL-encoded titles', () => {
      const url = 'https://en.wikipedia.org/wiki/Caf%C3%A9';
      const result = extractWikipediaPageTitle(url);
      expect(result).toBe('Café');
    });

    it('should return null for invalid Wikipedia URLs', () => {
      const invalidUrls = [
        'https://en.wikipedia.org/',
        'https://en.wikipedia.org/wiki/',
        'https://google.com',
        'not-a-url'
      ];

      invalidUrls.forEach(url => {
        const result = extractWikipediaPageTitle(url);
        expect(result).toBeNull();
      });
    });
  });

  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from youtube.com URLs', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtube.com/watch?v=abc123def456',
          expected: 'abc123def456'
        },
        {
          url: 'https://www.youtube.com/watch?v=xyz789&t=30s',
          expected: 'xyz789'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractYouTubeVideoId(url);
        expect(result).toBe(expected);
      });
    });

    it('should extract video ID from youtu.be URLs', () => {
      const testCases = [
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ'
        },
        {
          url: 'https://youtu.be/abc123def456?t=30',
          expected: 'abc123def456'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractYouTubeVideoId(url);
        expect(result).toBe(expected);
      });
    });

    it('should return null for invalid YouTube URLs', () => {
      const invalidUrls = [
        'https://www.youtube.com/',
        'https://www.youtube.com/watch',
        'https://youtu.be/',
        'https://google.com',
        'not-a-url'
      ];

      invalidUrls.forEach(url => {
        const result = extractYouTubeVideoId(url);
        expect(result).toBeNull();
      });
    });
  });

  describe('extractWikipediaContent', () => {
    it('should extract content from valid Wikipedia URL', async () => {
      const mockWikipediaResponse = {
        query: {
          pages: {
            '12345': {
              title: 'JavaScript',
              extract: 'JavaScript is a programming language that conforms to the ECMAScript specification.'
            }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWikipediaResponse)
      });

      const url = 'https://en.wikipedia.org/wiki/JavaScript';
      const result = await extractWikipediaContent(url);

      expect(result).toEqual({
        content: 'JavaScript is a programming language that conforms to the ECMAScript specification.',
        title: 'JavaScript',
        sourceUrl: url,
        type: 'wikipedia'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('en.wikipedia.org/w/api.php'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'User-Agent': 'TrivParty/1.0 (https://trivparty.app)'
          }
        })
      );
    });

    it('should throw error for invalid Wikipedia URL', async () => {
      const invalidUrl = 'https://google.com';
      
      await expect(extractWikipediaContent(invalidUrl))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should throw error for missing Wikipedia page', async () => {
      const mockWikipediaResponse = {
        query: {
          pages: {
            '-1': {
              missing: true
            }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWikipediaResponse)
      });

      const url = 'https://en.wikipedia.org/wiki/NonexistentPage';
      
      await expect(extractWikipediaContent(url))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should throw error for Wikipedia API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const url = 'https://en.wikipedia.org/wiki/JavaScript';
      
      await expect(extractWikipediaContent(url))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should throw error for network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const url = 'https://en.wikipedia.org/wiki/JavaScript';
      
      await expect(extractWikipediaContent(url))
        .rejects
        .toThrow(ContentExtractionError);
    });
  });

  describe('extractYouTubeTranscript', () => {
    it('should extract transcript from valid YouTube URL', async () => {
      const mockOEmbedResponse = {
        title: 'Test Video Title'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOEmbedResponse)
      });

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await extractYouTubeTranscript(url);

      expect(result).toEqual({
        content: expect.stringContaining('Test Video Title'),
        transcript: expect.stringContaining('Test Video Title'),
        title: 'Test Video Title',
        sourceUrl: url,
        videoId: 'dQw4w9WgXcQ',
        type: 'youtube'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json'
      );
    });

    it('should throw error for invalid YouTube URL', async () => {
      const invalidUrl = 'https://google.com';
      
      await expect(extractYouTubeTranscript(invalidUrl))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should throw error for non-existent video', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const url = 'https://www.youtube.com/watch?v=invalidvideo';
      
      await expect(extractYouTubeTranscript(url))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should throw error for network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      await expect(extractYouTubeTranscript(url))
        .rejects
        .toThrow(ContentExtractionError);
    });

    it('should handle youtu.be URLs', async () => {
      const mockOEmbedResponse = {
        title: 'Short URL Video'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOEmbedResponse)
      });

      const url = 'https://youtu.be/abc123def456';
      const result = await extractYouTubeTranscript(url);

      expect(result.videoId).toBe('abc123def456');
      expect(result.title).toBe('Short URL Video');
    });
  });

  describe('ContentExtractionError', () => {
    it('should create error with custom status code', () => {
      const error = new ContentExtractionError('Test error', 404);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ContentExtractionError');
    });

    it('should default to status code 500', () => {
      const error = new ContentExtractionError('Test error');
      
      expect(error.statusCode).toBe(500);
    });
  });
});