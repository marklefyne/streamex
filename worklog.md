---
Task ID: 1
Agent: Main Orchestrator
Task: Fix 3 critical bugs - Manga Engine, Anime Section, Live Sports

Work Log:
- Explored full project structure: 17 streamex components, 20 API routes, 9 lib files
- Analyzed manga-page.tsx (1240 lines), sports-player-modal.tsx (405 lines), live-sports.tsx (790 lines)
- Tested all APIs: manga popular, manga search, tmdb anime, jikan anime
- Diagnosed manga cover URL issue: tested `.jpg.512.jpg` (200 OK), `.512.jpg` stripped (404) - original format was correct
- Added `referrerPolicy="no-referrer"` to all manga images as defensive measure against CDN hotlink blocking
- Created anime API route at `/src/app/api/anime/route.ts` (Jikan v4 proxy with 2min cache, rate limit handling)
- Created anime page component at `/src/components/streamex/anime-page.tsx` (32KB, 4 sections: Trending, Season, Top Rated, Upcoming)
- Integrated AnimePage into page.tsx replacing single MediaRow
- Updated sports-player-modal.tsx with iframe error detection, M3U8/HLS support, auto-expand custom URL, URL validation
- Updated live-sports.tsx: 8 matches retain YouTube highlight embeds, 21 matches have empty stream_urls (triggers custom URL UI)
- Ran lint: zero errors

Stage Summary:
- Manga: API working, covers load (HTTP 200), added referrerPolicy to 4 img tags
- Anime: Full page with Jikan API integration, 4 browsing sections, Sub/Dub tags, search mode
- Sports: Enhanced player modal with error detection, custom URL expanded by default, M3U8 support
- All changes pass ESLint
