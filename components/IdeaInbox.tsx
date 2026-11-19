import React, { useEffect, useState } from 'react';
import type { Book, Idea } from '../types';
import { ideaService } from '../services/ideaService';

export function IdeaInbox({ book, onClose }: { book: Book; onClose: () => void }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => { try { setIdeas(await ideaService.list(book.id)); } catch (e: any) { setError(e.message); } };
  useEffect(() => { setIdeas([]); setError(''); void refresh(); }, [book.id]);
  const capture = async () => {
    if (!draft.trim()) return;
    setBusy(true); setError('');
    try { await ideaService.capture(book.id, draft); setDraft(''); await refresh(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const assign = async (idea: Idea, chapterId: string) => {
    setBusy(true); setError('');
    try {
      await ideaService.assign(book.id, idea.id, chapterId ? 'assigned' : 'inbox', chapterId ? [chapterId] : []);
      await refresh();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <div className="absolute inset-0 z-30 bg-slate-50 overflow-y-auto p-4 md:p-8">
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold">Idea Inbox</h2><p className="text-sm text-slate-500">{book.title} · Thoughts don't need a chapter yet</p></div>
        <button onClick={onClose} className="px-4 py-2 border rounded-xl bg-white">Back to editor</button></div>
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <label htmlFor="idea-content" className="font-semibold text-sm">Capture a thought</label>
        <textarea id="idea-content" value={draft} onChange={e => setDraft(e.target.value)} rows={4} maxLength={20000}
          placeholder="A plot twist, character detail, scene, question, or anything else…" className="w-full border rounded-xl p-3"/>
        <button onClick={capture} disabled={busy || !draft.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-xl disabled:opacity-50">Save to inbox</button>
      </div>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <h3 className="font-semibold">{ideas.length} saved ideas</h3>
      {ideas.map(idea => <article key={idea.id} className="bg-white border rounded-xl p-4 space-y-2">
        <div className="flex justify-between gap-3"><h4 className="font-semibold">{idea.title}</h4><span className="text-xs text-slate-500">{idea.status}</span></div>
        <p className="text-sm whitespace-pre-wrap">{idea.content}</p>
        <label className="text-xs text-slate-500 block">Place in chapter (optional)
          <select disabled={busy} value={idea.chapterIds[0] || ''} onChange={e => assign(idea, e.target.value)} className="block mt-1 border rounded-lg p-2 w-full">
            <option value="">Unassigned</option>{book.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
          </select>
        </label>
      </article>)}
    </div>
  </div>;
}
