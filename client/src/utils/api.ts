export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
  return res;
}
