# YouTube Data API v3 Setup Guide

This guide explains how to set up YouTube Data API v3 integration for the TrivParty quiz generation feature.

## Prerequisites

- Google Cloud Platform account
- YouTube Data API v3 enabled
- API key with proper permissions

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable YouTube Data API v3

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on the API and press **Enable**

### 3. Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. (Optional) Restrict the API key:
   - Click on the API key to edit it
   - Under **API restrictions**, select "Restrict key"
   - Choose "YouTube Data API v3"
   - Under **Application restrictions**, you can restrict by HTTP referrers, IP addresses, etc.

### 4. Configure Environment Variables

Add your YouTube API key to your `.env.local` file:

```bash
# YouTube Data API v3 Key
YOUTUBE_API_KEY=your_actual_api_key_here
```

### 5. API Quotas and Limits

The YouTube Data API v3 has the following default quotas:

- **Daily quota**: 10,000 units per day
- **Per-minute quota**: 100 units per minute per user

#### API Operation Costs:
- `videos.list`: 1 unit per request
- `search.list`: 100 units per request
- `captions.list`: 50 units per request

#### Quota Management:
- Monitor usage in Google Cloud Console > APIs & Services > Quotas
- Request quota increases if needed
- Implement caching to reduce API calls
- Use error handling for quota exceeded scenarios

### 6. Supported Features

#### Video Content Extraction
- Extract video metadata (title, description, channel, duration, views, etc.)
- Get video statistics and category information
- Handle various YouTube URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`

#### Video Search (Future Feature)
- Search for videos by query
- Get video thumbnails and metadata
- Filter by relevance, date, view count, etc.

### 7. Error Handling

The implementation handles various error scenarios:

- **403 Forbidden**: API quota exceeded or invalid API key
- **404 Not Found**: Video not found, private, or unavailable
- **400 Bad Request**: Invalid video ID or malformed request
- **500 Internal Server Error**: Network issues or API downtime

### 8. Limitations

#### Transcript Access
- Full video transcripts require OAuth2 authentication
- Public API only provides video metadata
- Captions API requires additional permissions
- Current implementation uses video metadata for quiz generation

#### Content Restrictions
- Private videos are not accessible
- Age-restricted content may have limitations
- Some videos may not have captions available

### 9. Testing

Test the integration with various YouTube URLs:

```bash
# Test video extraction
curl -X POST http://localhost:3000/api/content/youtube \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Test video search
curl "http://localhost:3000/api/content/youtube/search?q=javascript&maxResults=5"
```

### 10. Best Practices

1. **Cache Results**: Store extracted content to avoid repeated API calls
2. **Rate Limiting**: Implement client-side rate limiting
3. **Error Handling**: Provide user-friendly error messages
4. **Quota Monitoring**: Monitor API usage and implement alerts
5. **Fallback Content**: Have backup content when API is unavailable

### 11. Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Referrer Restrictions**: Restrict API key usage to your domain
3. **Rate Limiting**: Implement server-side rate limiting
4. **Input Validation**: Validate all YouTube URLs before processing

## Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Check if the API key is correct
   - Ensure YouTube Data API v3 is enabled
   - Verify API key restrictions

2. **"Quota exceeded"**
   - Check daily quota usage in Google Cloud Console
   - Implement caching to reduce API calls
   - Consider requesting quota increase

3. **"Video unavailable"**
   - Video may be private, deleted, or region-restricted
   - Check video URL format
   - Verify video exists and is publicly accessible

### Support

For additional help:
- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3/docs)
- [Google Cloud Support](https://cloud.google.com/support)
- [YouTube API Forum](https://developers.google.com/youtube/v3/support)