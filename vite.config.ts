import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function searchMusicPlugin(): Plugin {
  return {
    name: 'search-music-api',
    configureServer(server) {
      server.middlewares.use('/api/search-music', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:5000');
          const query = urlObj.searchParams.get('q') || '';
          if (!query.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [] }));
            return;
          }

          // Search YouTube for the song
          const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim() + ' audio song')}`;
          const response = await fetch(ytSearchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const html = await response.text();

          const results: Array<{ id: string; title: string; channel: string }> = [];
          const seenIds = new Set<string>();

          // Parse initialData if present or extract via regex
          const itemMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\].*?"ownerText":\{"runs":\[\{"text":"(.*?)"\}\]/g)];

          for (const match of itemMatches) {
            const vid = match[1];
            let title = match[2] || '';
            let rawChannel = match[3] || 'Artist';
            // Stop at first quote or escaped quote
            const cleanChannelMatch = rawChannel.match(/^([^"\\,]+)/);
            let channel = cleanChannelMatch ? cleanChannelMatch[1].trim() : rawChannel.slice(0, 30);
            if (!seenIds.has(vid)) {
              seenIds.add(vid);
              // Clean up escaped unicode
              try {
                title = JSON.parse(`"${title}"`);
              } catch (e) {}
              channel = channel || 'Artist';
              results.push({ id: vid, title, channel });
              if (results.length >= 6) break;
            }
          }

          // Fallback if structured match was empty
          if (results.length === 0) {
            const idMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
            for (const match of idMatches) {
              const vid = match[1];
              if (!seenIds.has(vid)) {
                seenIds.add(vid);
                results.push({ id: vid, title: query, channel: 'YouTube Audio' });
                if (results.length >= 5) break;
              }
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ results }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, results: [] }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), searchMusicPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true
  }
});
