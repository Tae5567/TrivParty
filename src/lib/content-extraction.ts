// Content extraction utility functions

export interface ContentExtractionResult {
  content: string;
  title: string;
  sourceUrl: string;
  type: 'wikipedia' | 'youtube';
}

export interface YouTubeExtractionResult extends ContentExtractionResult {
  type: 'youtube';
  videoId: string;
  transcript: string;
}

export interface WikipediaExtractionResult extends ContentExtractionResult {
  type: 'wikipedia';
}

export class ContentExtractionError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ContentExtractionError';
  }
}

// Helper function to parse ISO 8601 duration format (PT4M13S -> 4:13)
function parseYouTubeDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to format view count
function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
}

// Helper function to extract clean text from HTML
function extractTextFromHtml(html: string): string {
  return html
    // Remove script and style elements
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove specific Wikipedia elements that don't add content value
    .replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '')
    .replace(/<div[^>]*class="[^"]*references[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Convert common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to format page views
function formatPageViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M daily views`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K daily views`;
  }
  return `${views} daily views`;
}

// Interface for Wikipedia search results
export interface WikipediaSearchResult {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: string;
  pageId: number;
}

// Function to search Wikipedia articles (for future features)
export async function searchWikipediaArticles(
  query: string,
  language: string = 'en',
  limit: number = 10
): Promise<WikipediaSearchResult[]> {
  try {
    const searchApiUrl = `https://${language}.wikipedia.org/api/rest_v1/page/search/${encodeURIComponent(query)}`;
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(`${searchApiUrl}?${params}`, {
      headers: {
        'User-Agent': 'TrivParty/1.0 (https://trivparty.app)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new ContentExtractionError(`Wikipedia search API request failed: ${response.status}`, 500);
    }

    const data = await response.json();

    return (data.pages || []).map((page: {
      title: string;
      description?: string;
      extract: string;
      thumbnail?: { source: string };
      pageid: number;
    }) => ({
      title: page.title,
      description: page.description,
      extract: page.extract,
      thumbnail: page.thumbnail?.source,
      pageId: page.pageid
    }));

  } catch (error) {
    if (error instanceof ContentExtractionError) {
      throw error;
    }

    throw new ContentExtractionError(
      `Failed to search Wikipedia articles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

// Interface for YouTube search results
export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
}

// Function to search YouTube videos (for future features)
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 10
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ContentExtractionError('YouTube API key not configured', 500);
  }

  try {
    const searchApiUrl = `https://www.googleapis.com/youtube/v3/search`;
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      key: apiKey,
      order: 'relevance',
      safeSearch: 'moderate'
    });

    const response = await fetch(`${searchApiUrl}?${searchParams}`, {
      headers: {
        'Referer': 'https://trivparty.app'
      }
    });

    if (!response.ok) {
      throw new ContentExtractionError(`YouTube search API request failed: ${response.status}`, 500);
    }

    const data = await response.json();

    return (data.items || []).map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        description: string;
        thumbnails: {
          medium?: { url: string };
          default?: { url: string };
        };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt
    }));

  } catch (error) {
    if (error instanceof ContentExtractionError) {
      throw error;
    }

    throw new ContentExtractionError(
      `Failed to search YouTube videos: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

export function validateUrl(url: string): { isValid: boolean; type: 'wikipedia' | 'youtube' | 'unknown' } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for Wikipedia
    if (hostname.includes('wikipedia.org')) {
      return { isValid: true, type: 'wikipedia' };
    }

    // Check for YouTube
    if (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'm.youtube.com'
    ) {
      return { isValid: true, type: 'youtube' };
    }

    return { isValid: false, type: 'unknown' };
  } catch {
    return { isValid: false, type: 'unknown' };
  }
}

export function extractWikipediaPageTitle(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const wikiIndex = pathParts.findIndex(part => part === 'wiki');

    if (wikiIndex !== -1 && pathParts[wikiIndex + 1]) {
      return decodeURIComponent(pathParts[wikiIndex + 1]);
    }

    return null;
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtu.be format
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      // Remove any additional parameters (like timestamp)
      return videoId.split('?')[0] || null;
    }

    // Handle youtube.com format
    if (urlObj.hostname.includes('youtube.com')) {
      const searchParams = urlObj.searchParams;
      const videoId = searchParams.get('v');
      return videoId || null;
    }

    // Handle youtube.com/embed/ format
    if (urlObj.pathname.startsWith('/embed/')) {
      const videoId = urlObj.pathname.split('/embed/')[1];
      return videoId?.split('?')[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function extractWikipediaContent(url: string): Promise<WikipediaExtractionResult> {
  const validation = validateUrl(url);

  if (!validation.isValid || validation.type !== 'wikipedia') {
    throw new ContentExtractionError('Invalid Wikipedia URL', 400);
  }

  const pageTitle = extractWikipediaPageTitle(url);
  if (!pageTitle) {
    throw new ContentExtractionError('Could not extract page title from Wikipedia URL', 400);
  }

  try {
    // Extract language code from URL
    const urlObj = new URL(url);
    const langCode = urlObj.hostname.split('.')[0];

    // Use Wikimedia REST API for better performance and caching
    const restApiUrl = `https://${langCode}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

    // Get page summary first for metadata
    const summaryResponse = await fetch(restApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TrivParty/1.0 (https://trivparty.app)',
        'Accept': 'application/json'
      }
    });

    if (!summaryResponse.ok) {
      if (summaryResponse.status === 404) {
        throw new ContentExtractionError('Wikipedia page not found', 404);
      }
      throw new ContentExtractionError(`Wikipedia REST API request failed: ${summaryResponse.status}`, 500);
    }

    const summaryData = await summaryResponse.json();

    // Get full page content using REST API
    const contentApiUrl = `https://${langCode}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;

    const contentResponse = await fetch(contentApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TrivParty/1.0 (https://trivparty.app)',
        'Accept': 'text/html'
      }
    });

    let fullContent = '';

    if (contentResponse.ok) {
      const htmlContent = await contentResponse.text();
      fullContent = extractTextFromHtml(htmlContent);
    }

    // Fallback to summary extract if full content extraction fails
    const content = fullContent || summaryData.extract || '';

    if (!content) {
      throw new ContentExtractionError('No content available for this Wikipedia page', 404);
    }

    // Get additional metadata using REST API
    let pageViews = 0;
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');

      const pageViewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${langCode}.wikipedia/all-access/user/${encodeURIComponent(pageTitle)}/daily/${dateStr}/${dateStr}`;

      const pageViewsResponse = await fetch(pageViewsUrl, {
        headers: {
          'User-Agent': 'TrivParty/1.0 (https://trivparty.app)'
        }
      });

      if (pageViewsResponse.ok) {
        const pageViewsData = await pageViewsResponse.json();
        pageViews = pageViewsData.items?.[0]?.views || 0;
      }
    } catch (pageViewError) {
      // Continue without page views if API call fails
      console.warn('Failed to fetch page views:', pageViewError);
    }

    // Create enhanced content with metadata
    const enhancedContent = `
Title: ${summaryData.title}
${summaryData.description ? `Description: ${summaryData.description}` : ''}
${pageViews > 0 ? `Popularity: ${formatPageViews(pageViews)}` : ''}
${summaryData.coordinates ? `Location: ${summaryData.coordinates.lat}, ${summaryData.coordinates.lon}` : ''}
${summaryData.thumbnail ? `Featured Image: Available` : ''}
Language: ${langCode}
Last Modified: ${summaryData.timestamp ? new Date(summaryData.timestamp).toLocaleDateString() : 'Unknown'}

Article Content:
${content}

${summaryData.extract && summaryData.extract !== content ? `\nSummary: ${summaryData.extract}` : ''}
    `.trim();

    return {
      content: enhancedContent,
      title: summaryData.title || pageTitle,
      sourceUrl: url,
      type: 'wikipedia'
    };

  } catch (error) {
    if (error instanceof ContentExtractionError) {
      throw error;
    }

    throw new ContentExtractionError(
      `Failed to extract Wikipedia content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

export async function extractYouTubeTranscript(url: string): Promise<YouTubeExtractionResult> {
  const validation = validateUrl(url);

  if (!validation.isValid || validation.type !== 'youtube') {
    throw new ContentExtractionError('Invalid YouTube URL', 400);
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new ContentExtractionError('Could not extract video ID from YouTube URL', 400);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ContentExtractionError('YouTube API key not configured', 500);
  }

  try {
    // Get video details using YouTube Data API v3
    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos`;
    const videoParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: apiKey
    });

    const videoResponse = await fetch(`${videoApiUrl}?${videoParams}`, {
      headers: {
        'Referer': 'https://trivparty.app'
      }
    });

    if (!videoResponse.ok) {
      if (videoResponse.status === 403) {
        throw new ContentExtractionError('YouTube API quota exceeded or invalid API key', 403);
      } else if (videoResponse.status === 400) {
        throw new ContentExtractionError('Invalid video ID or API request', 400);
      }
      throw new ContentExtractionError(`YouTube API request failed: ${videoResponse.status}`, 500);
    }

    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      throw new ContentExtractionError('Video not found, private, or unavailable', 404);
    }

    const video = videoData.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    const title = snippet.title;
    const description = snippet.description || '';
    const channelTitle = snippet.channelTitle || '';
    const tags = snippet.tags || [];
    const publishedAt = snippet.publishedAt;
    const duration = parseYouTubeDuration(contentDetails.duration);
    const viewCount = statistics.viewCount ? formatViewCount(statistics.viewCount) : 'Unknown views';
    const likeCount = statistics.likeCount || '0';
    const categoryId = snippet.categoryId;

    // Try to get captions/transcript
    let transcript = '';
    try {
      const captionsApiUrl = `https://www.googleapis.com/youtube/v3/captions`;
      const captionsParams = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        key: apiKey
      });

      const captionsResponse = await fetch(`${captionsApiUrl}?${captionsParams}`);
      if (captionsResponse.ok) {
        const captionsData = await captionsResponse.json();

        // Look for auto-generated or manual captions
        const availableCaptions = captionsData.items || [];
        const englishCaptions = availableCaptions.find((caption: { snippet: { language: string } }) =>
          caption.snippet.language === 'en' || caption.snippet.language === 'en-US'
        );

        if (englishCaptions) {
          // Note: Getting actual caption content requires additional OAuth2 authentication
          // For now, we'll use the video metadata as content
          transcript = `Video transcript not available via public API. Using video metadata instead.`;
        }
      }
    } catch (captionError) {
      // Captions API failed, continue with metadata only
      console.warn('Failed to fetch captions:', captionError);
    }

    // Get video category name
    let categoryName = 'Unknown';
    if (categoryId) {
      try {
        const categoryApiUrl = `https://www.googleapis.com/youtube/v3/videoCategories`;
        const categoryParams = new URLSearchParams({
          part: 'snippet',
          id: categoryId,
          key: apiKey
        });

        const categoryResponse = await fetch(`${categoryApiUrl}?${categoryParams}`);
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          if (categoryData.items && categoryData.items.length > 0) {
            categoryName = categoryData.items[0].snippet.title;
          }
        }
      } catch (categoryError) {
        // Continue without category name if API call fails
        console.warn('Failed to fetch video category:', categoryError);
      }
    }

    // Create comprehensive content from available metadata
    const publishDate = publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Unknown';

    const content = `
Video Title: ${title}
Channel: ${channelTitle}
Published: ${publishDate}
Duration: ${duration}
Views: ${viewCount}
Likes: ${likeCount}
Category: ${categoryName}
${tags.length > 0 ? `Tags: ${tags.slice(0, 10).join(', ')}` : ''}

Video Description:
${description.length > 1000 ? description.substring(0, 1000) + '...' : description}

${transcript || 'Note: Full video transcript requires additional OAuth2 authentication. Quiz questions will be generated from the video metadata, title, description, and available information.'}
    `.trim();

    return {
      content,
      transcript: content,
      title,
      sourceUrl: url,
      videoId,
      type: 'youtube'
    };

  } catch (error) {
    if (error instanceof ContentExtractionError) {
      throw error;
    }

    throw new ContentExtractionError(
      `Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}