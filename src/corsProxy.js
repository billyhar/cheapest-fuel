const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest='
];

export const fetchWithProxy = async (url) => {
  let lastError = null;

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': new URL(url).origin
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different proxy response formats
      const data = proxy.includes('allorigins') ? JSON.parse(result.contents) : result;
      
      console.log(`Successfully fetched data from ${url} using ${proxy}`);
      return data;
    } catch (error) {
      console.warn(`Failed to fetch using ${proxy}: ${error.message}`);
      lastError = error;
      continue;
    }
  }

  console.error(`All proxies failed for ${url}:`, lastError);
  return null;
};