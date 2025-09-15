# Wikimedia REST API Integration Guide

This guide explains the enhanced Wikipedia integration using the Wikimedia REST API for optimal performance and rich content extraction.

## Overview

The TrivParty application now uses the **Wikimedia REST API** instead of the traditional MediaWiki Action API for several key advantages:

### Why Wikimedia REST API?

1. **High Performance**: Optimized for high-volume scenarios with better caching
2. **Low Latency**: Designed to work seamlessly with Wikipedia's caching infrastructure
3. **Rich Metadata**: Access to enhanced page information, statistics, and related content
4. **Better Rate Limits**: More generous rate limiting compared to Action API
5. **Modern Architecture**: RESTful design with JSON responses
6. **No API Key Required**: Public endpoints don't require authentication

## API Endpoints Used

### 1. Page Summary API
```
GET https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}
```
- Provides page metadata, description, thumbnail, coordinates
- Includes page statistics and basic information
- Fast response with cached data

### 2. Page Content API
```
GET https://{lang}.wikipedia.org/api/rest_v1/page/html/{title}
```
- Returns full HTML content of the page
- More comprehensive than extract-only APIs
- Includes all article sections and content

### 3. Page Search API
```
GET https://{lang}.wikipedia.org/api/rest_v1/page/search/{query}
```
- Search for articles by query
- Returns ranked results with descriptions
- Includes thumbnails and page IDs

### 4. Page Views API
```
GET https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/{project}/all-access/user/{title}/daily/{start}/{end}
```
- Get page view statistics
- Helps determine article popularity
- Useful for content ranking

## Features Implemented

### Enhanced Content Extraction

The new implementation provides richer content for quiz generation:

```typescript
// Example extracted content structure
{
  title: "JavaScript",
  description: "High-level programming language",
  popularity: "45.2K daily views",
  location: "37.7749, -122.4194", // if applicable
  featuredImage: "Available",
  language: "en",
  lastModified: "2024-01-15",
  content: "Full article text...",
  summary: "Concise article summary..."
}
```

### Content Processing

1. **HTML to Text Conversion**: Clean extraction of readable content
2. **Metadata Enhancement**: Includes popularity metrics and article statistics
3. **Multi-language Support**: Works with any Wikipedia language edition
4. **Error Handling**: Comprehensive error handling for various scenarios

### Search Functionality

```bash
# Search for articles
GET /api/content/wikipedia/search?q=javascript&lang=en&limit=10
```

Returns:
- Article titles and descriptions
- Page extracts for preview
- Thumbnails when available
- Page IDs for further processing

## API Usage Examples

### Extract Article Content

```bash
curl -X POST http://localhost:3000/api/content/wikipedia \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/JavaScript"}'
```

### Search Articles

```bash
curl "http://localhost:3000/api/content/wikipedia/search?q=programming&lang=en&limit=5"
```

## Performance Benefits

### Caching Advantages

1. **CDN Integration**: Wikimedia REST API uses global CDN
2. **Edge Caching**: Responses cached at edge locations
3. **Reduced Latency**: Faster response times globally
4. **High Availability**: Better uptime and reliability

### Rate Limiting

- **No Authentication Required**: Public endpoints don't need API keys
- **Generous Limits**: Higher rate limits compared to Action API
- **Per-IP Limits**: Reasonable limits for application usage
- **Graceful Degradation**: Fallback options when limits are reached

## Error Handling

The implementation handles various scenarios:

### HTTP Status Codes

- **200 OK**: Successful content extraction
- **400 Bad Request**: Invalid URL or malformed request
- **404 Not Found**: Page doesn't exist or was deleted
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: API or network issues

### Error Response Format

```json
{
  "error": "Page not found",
  "code": "PAGE_NOT_FOUND"
}
```

### Error Codes

- `PAGE_NOT_FOUND`: Article doesn't exist
- `INVALID_URL`: Malformed Wikipedia URL
- `EXTRACTION_FAILED`: Content extraction failed
- `SEARCH_FAILED`: Search operation failed
- `NO_RESULTS`: Search returned no results
- `INTERNAL_ERROR`: Server or network error

## Supported Languages

The API supports all Wikipedia language editions:

- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `zh` - Chinese
- And 300+ other languages

## Content Quality

### Enhanced Metadata

1. **Page Statistics**: View counts, edit frequency
2. **Geographic Data**: Coordinates for location-based articles
3. **Media Information**: Thumbnail and image availability
4. **Categorization**: Article topics and classifications
5. **Timestamps**: Last modification dates

### Content Processing

1. **Clean Text Extraction**: Removes navigation, infoboxes, references
2. **Section Handling**: Preserves article structure
3. **Link Processing**: Maintains important cross-references
4. **Media Descriptions**: Includes alt text and captions

## Best Practices

### Performance Optimization

1. **Cache Results**: Store extracted content to avoid repeated calls
2. **Batch Processing**: Group multiple requests when possible
3. **Compression**: Use gzip compression for large responses
4. **Conditional Requests**: Use ETags for cache validation

### Content Quality

1. **Language Detection**: Automatically detect article language
2. **Content Validation**: Verify article quality and length
3. **Fallback Handling**: Use summary when full content fails
4. **Error Recovery**: Graceful degradation for missing content

### Rate Limiting

1. **Request Spacing**: Add delays between requests
2. **Exponential Backoff**: Implement retry logic with backoff
3. **Monitor Usage**: Track request patterns and volumes
4. **User-Agent**: Always include proper User-Agent header

## Monitoring and Analytics

### Key Metrics

1. **Response Times**: Monitor API latency
2. **Success Rates**: Track successful extractions
3. **Error Patterns**: Identify common failure modes
4. **Content Quality**: Measure extracted content usefulness

### Logging

```typescript
// Example logging structure
{
  timestamp: "2024-01-15T10:30:00Z",
  operation: "wikipedia_extract",
  url: "https://en.wikipedia.org/wiki/JavaScript",
  language: "en",
  responseTime: 245,
  contentLength: 15420,
  status: "success"
}
```

## Troubleshooting

### Common Issues

1. **"Page not found"**
   - Check URL format and spelling
   - Verify page exists and isn't deleted
   - Try different language editions

2. **"Content extraction failed"**
   - Check network connectivity
   - Verify Wikipedia API availability
   - Review request format and headers

3. **"Rate limit exceeded"**
   - Implement request throttling
   - Add retry logic with exponential backoff
   - Consider caching frequently accessed content

### Debug Tools

1. **API Testing**: Use curl or Postman to test endpoints
2. **Network Monitoring**: Check request/response headers
3. **Content Validation**: Verify extracted content quality
4. **Performance Profiling**: Monitor response times and sizes

## Migration from Action API

If migrating from the old MediaWiki Action API:

### Key Differences

1. **URL Structure**: REST endpoints vs query parameters
2. **Response Format**: Structured JSON vs nested objects
3. **Content Access**: Direct HTML vs extract-only
4. **Metadata**: Rich metadata vs basic information
5. **Performance**: Better caching and CDN integration

### Migration Steps

1. Update endpoint URLs to REST API format
2. Modify response parsing for new JSON structure
3. Enhance error handling for new error codes
4. Update content processing for HTML responses
5. Test thoroughly with various article types

## Support Resources

- [Wikimedia REST API Documentation](https://en.wikipedia.org/api/rest_v1/)
- [Wikipedia API Portal](https://www.mediawiki.org/wiki/API:Main_page)
- [Wikimedia Technical Documentation](https://doc.wikimedia.org/)
- [Community Support](https://www.mediawiki.org/wiki/Communication)