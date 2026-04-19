---
Task ID: 1
Agent: Main
Task: Fix live sports showing fake/random stream content instead of real sports

Work Log:
- Analyzed user screenshot via VLM — identified that match DATA (Mainz vs Borussia Mönchengladbach) was correct from ESPN, but stream URLs were random YouTube videos (Costa Rica 4K) and HLS test streams
- Found root cause: `DEFAULT_STREAM_URLS` constant in ESPN API route was assigning random YouTube embed URLs and HLS test streams to every match
- Removed all fake stream URLs from `src/app/api/sports/espn/route.ts` — matches now have empty `stream_urls: {}`
- Cleaned up `src/app/api/sports/streams/route.ts` — no longer returns fake fallback streams
- Updated player modal `src/components/streamex/sports-player-modal.tsx`:
  - Changed "No Stream Available" placeholder to "Paste a Stream URL" with team names shown
  - Added `configuredServers.size > 0` condition to hide server selector panel when no servers are configured
  - Improved UX with better messaging about finding streams and pasting URLs
- Verified clean lint pass

Stage Summary:
- Matches now display correct ESPN data (teams, scores, times, leagues) without fake stream URLs
- Player modal opens directly with custom URL input prompt instead of playing random unrelated videos
- Server selector panel hidden when no servers are configured
- Users can paste any streaming URL (YouTube, Twitch, M3U8/HLS) to watch matches
