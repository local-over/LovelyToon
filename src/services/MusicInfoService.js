export const MusicInfoService = {
  async fetchSongInfo(title, artist) {
    if (!title) return null;
    try {
      const query = encodeURIComponent(`${title} ${artist}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          // Replace 100x100 with 600x600 for high resolution
          artwork: result.artworkUrl100 ? result.artworkUrl100.replace('100x100bb', '600x600bb') : null,
          duration: result.trackTimeMillis || 180000, // fallback to 3 mins
        };
      }
    } catch (e) {
      console.error('Failed to fetch song info', e);
    }
    return null;
  }
};
