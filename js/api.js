const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby1V2y3Kr5ZrF_VjJGJy3JiDmReRNifMYzVQrmgt1zvoOJFzq2jc0VqAESQh9ekufDVEg/exec";

/**
 * Perform a GET request to the Apps Script backend.
 * @param {string} path - Endpoint path with query params (e.g., '/words' or '/context?pos=verb')
 * @returns {Promise<any>}
 */
export async function apiGet(pathAndQuery) {
  const sessionToken = localStorage.getItem('token');
  
  // Separate endpoint path from any query params passed in (e.g., '/context?pos=verb')
  const [path, queryString] = pathAndQuery.split('?');
  const params = new URLSearchParams(queryString || '');
  
  params.set('path', path);
  if (sessionToken) params.set('token', sessionToken);

  const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
    method: "GET",
    redirect: "follow"
  });

  const result = await response.json();

  if (result.status === 401) {
    localStorage.removeItem('token');
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirectTo=${currentPath}`;
    throw new Error('Session expired. Redirecting to login...');
  }

  if (result.status >= 400) {
    throw new Error(result.error || "Something went wrong.");
  }

  return result.data;
}

/**
 * Perform a POST request to the Apps Script backend.
 * @param {string} path 
 * @param {Object} data 
 * @returns {Promise<any>}
 */
export async function apiPost(path, data = {}) {
  const sessionToken = localStorage.getItem('token');
  const payload = { ...data, ...(sessionToken && { sessionToken }) };

  // Append ?path= to POST URL so e.parameter.path receives it in Apps Script
  const url = `${APPS_SCRIPT_URL}?path=${encodeURIComponent(path)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
    redirect: "follow"
  });

  const result = await response.json();

  if (result.status === 401) {
    localStorage.removeItem('token');
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirectTo=${currentPath}`;
    throw new Error('Session expired. Redirecting to login...');
  }

  if (result.status >= 400) {
    throw new Error(result.error || "Something went wrong.");
  }

  return result.data;
}
