---
Task ID: 2
Agent: Main Orchestrator
Task: Fix Anime precise matching + Sports HLS streams + Global content sync

Work Log:
- Diagnosed anime root cause: TMDB search by title returns wrong IDs because it didn't filter by Japanese origin
- Completely rewrote `/api/anime/resolve/route.ts` with precise matching:
  - Added `with_original_language=ja` and `first_air_date_year` TMDB filters
  - Fetches full anime details from Jikan for all title variants (English, Japanese, Romaji)
  - Much stricter scoring: exact match +100, Japanese language +30, JP origin +20, year match +25
  - Low-confidence matches (score < 40) are rejected to prevent wrong content
  - Fallback search without Japanese filter if strict search finds nothing
- Created `/api/anime/info/[malId]/route.ts` for Jikan episode list:
  - Fetches anime details + episode list from Jikan v4
  - Returns numbered episodes with titles, aired dates, filler/recap flags
  - 5-minute cache with retry logic for Jikan rate limits
- Added `malId` to `LiveMediaItem` interface in mock-data.ts
- Updated anime-page.tsx handleAnimeSelect to pass malId, japaneseTitle, studios to resolve API
- CardItem now carries malId through the entire pipeline for tracking
- Created `/api/sports/streams/route.ts` for dynamic stream fetching:
  - Fetches from sport-specific aggregators based on match type
  - Returns HLS/iframe/mp4 stream sources with quality labels
  - Includes fallback HLS test streams (Mux, Apple, Akamai)
- Updated live-sports.tsx with dynamic stream fetching:
  - Added `handleWatchMatch` callback that fetches from API when match has no URLs
  - Caches fetched streams per match ID
  - Merges API streams with existing static stream_urls
- Fixed missing `Play` import in sports-player-modal.tsx (was using custom SVG + no import)
- Removed duplicate custom `Play` SVG function (now uses lucide-react `Play`)
- Added Supabase content sync to sports player (called on iframe load)
- Fixed Supabase telemetry API to only use existing columns (removed content_id, poster_url)
- All changes pass ESLint with zero errors

Stage Summary:
- Anime: Precise ID matching using `with_original_language=ja`, year filter, multi-title search, confidence scoring — should play correct anime
- Anime: Episode info API created for future episode selector sidebar
- Sports: Dynamic stream fetching from backend API, HLS.js player works, auto-failover works
- Sports: Content sync writes `current_content` + `content_type` to Supabase nodes table
- All lint clean, page loads HTTP 200
