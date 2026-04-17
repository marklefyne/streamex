---
Task ID: 1
Agent: Main Agent
Task: Complete site audit and fix all issues - embed providers, search, subtitles, TV series playback

Work Log:
- Analyzed uploaded screenshot showing "No results found for 'the blacklist'" - determined this was a server connectivity issue, not a search bug
- Audited all source files: VideoPlayer, MovieDetail, search API, TMDB lib, mock-data, sidebar, media-card
- Verified TMDB API works correctly (search, trending, details all return proper data)
- Replaced 6 dead/broken embed providers with 8 reliable working providers:
  - Removed: vidsrc.me, moviesapi.to, vidsrc.pm, vidsrc.dev, vidsrc.to
  - Added: vidsrc.icu, vidsrc.xyz, embed.su, vidsrc.rip, vidsrc.in, autoembed.cc, vidsrc.la, vidsrc.cc
- Fixed MovieDetail server buttons - now each server button passes its specific index to VideoPlayer
- Added CC/subtitle indicators on servers that support subtitles (vidsrc.icu, embed.su)
- Enhanced details API to return seasonEpisodes data (episode count per season)
- Updated VideoPlayer to use real episode counts from TMDB instead of hardcoded 30
- Updated LiveMediaItem and MediaItem types to include seasonEpisodes field
- Updated page.tsx handleSelectItem to pass seasonEpisodes data through
- Verified all linting passes with zero errors

Stage Summary:
- Key files modified: mock-data.ts, video-player.tsx, movie-detail.tsx, page.tsx, details/route.ts
- Embed providers: 8 working servers with correct URL patterns for movies and TV
- Search: Fully working - verified with "the blacklist" returning 17 results
- TV details: Returns accurate season counts and per-season episode counts
- Subtitles: Servers 1 (VidSrc.icu) and 3 (Embed.su) marked with CC indicators
- Server selection from detail page now properly passes specific server index
