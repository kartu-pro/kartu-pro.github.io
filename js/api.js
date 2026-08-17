const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby1V2y3Kr5ZrF_VjJGJy3JiDmReRNifMYzVQrmgt1zvoOJFzq2jc0VqAESQh9ekufDVEg/exec";

async function request(url, options = {}) {
  const response = await fetch(url, { redirect: "follow", ...options });
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

  if (result.refreshedToken) {
    localStorage.setItem('token', result.refreshedToken);
  }

  return result.data;
}

export async function apiGet(pathAndQuery) {
  const sessionToken = localStorage.getItem('token');
  const [path, queryString] = pathAndQuery.split('?');
  const params = new URLSearchParams(queryString || '');
  
  params.set('path', path);
  if (sessionToken) params.set('token', sessionToken);

  return request(`${APPS_SCRIPT_URL}?${params.toString()}`, { method: "GET" });
}

export async function apiPost(path, data = {}) {
  const sessionToken = localStorage.getItem('token');
  const payload = { ...data, ...(sessionToken && { token: sessionToken }) };
  const url = `${APPS_SCRIPT_URL}?path=${encodeURIComponent(path)}`;

  return request(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload)
  });
}
