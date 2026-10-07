let desktopApiUrl = null;
if (typeof window !== 'undefined') {
  const queryApiUrl = new URLSearchParams(window.location.search).get('apiBaseUrl');
  const isLocalApiUrl = (value) => /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(value || '');
  try {
    if (isLocalApiUrl(queryApiUrl)) window.localStorage.setItem('bdat-api-base-url', queryApiUrl);
    const storedApiUrl = window.localStorage.getItem('bdat-api-base-url');
    desktopApiUrl = isLocalApiUrl(queryApiUrl)
      ? queryApiUrl
      : isLocalApiUrl(storedApiUrl)
        ? storedApiUrl
        : window.bdatDesktop?.apiBaseUrl;
  } catch {
    desktopApiUrl = isLocalApiUrl(queryApiUrl) ? queryApiUrl : window.bdatDesktop?.apiBaseUrl;
  }
}

export const API_BASE_URL = desktopApiUrl || process.env.REACT_APP_API_URL || 'http://localhost:5000';
