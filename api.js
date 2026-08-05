const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby1V2y3Kr5ZrF_VjJGJy3JiDmReRNifMYzVQrmgt1zvoOJFzq2jc0VqAESQh9ekufDVEg/exec";

async function apiPost(path, data = {}) {
  const url = `${APPS_SCRIPT_URL}?path=${encodeURIComponent(path)}`;
  const sessionToken = localStorage.getItem('sessionToken');
  const payload = {
    ...data,
    ...(sessionToken && { sessionToken })
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
    redirect: "follow"
  });
  
  const result = await response.json();

  // Handle explicit status or authorization failures
  if (result.status === 401 || (result.error && result.error.toLowerCase().includes('unauthorized'))) {
    localStorage.removeItem('sessionToken');
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?redirectTo=${currentPath}`;
    throw new Error('Session expired. Redirecting to login...');
  }

  if (result.status >= 400) {
    throw new Error(result.error || "Something went wrong. Please try again.");
  }

  return result.data;
}
