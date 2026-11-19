import { authService } from './authService';
async function request(action: 'grammar' | 'expand', html: string, snippet?: string): Promise<string> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authService.authHeaders() },
    body: JSON.stringify({ action, html, snippet })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'AI unavailable');
  return data.result || '';
}
export const geminiService = {
  fixGrammar: async (html: string) => html.trim() ? request('grammar', html) : html,
  expandText: async (snippet: string, fullHtml: string) => request('expand', fullHtml, snippet)
};
