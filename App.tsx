
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AIModal } from './components/AIModal';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { Book, Chapter, AIResult } from './types';

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiType, setAiType] = useState<'expand' | 'grammar' | null>(null);

  useEffect(() => {
    const init = async () => {
      const data = await storageService.getBooks();
      setBooks(data);
      if (data.length > 0) {
        setActiveBookId(data[0].id);
        setActiveChapterId(data[0].chapters[0].id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const activeBook = books.find(b => b.id === activeBookId) || null;
  const activeChapter = activeBook?.chapters.find(c => c.id === activeChapterId) || null;

  const handleUpdateContent = useCallback(async (content: string) => {
    if (activeBookId && activeChapterId) {
      const updatedBooks = await storageService.updateChapter(activeBookId, activeChapterId, content);
      setBooks(updatedBooks);
    }
  }, [activeBookId, activeChapterId]);

  const handleUpdateTitle = useCallback(async (title: string) => {
    if (activeBookId && activeChapterId) {
      const updatedBooks = await storageService.updateChapter(activeBookId, activeChapterId, activeChapter?.content || '', title);
      setBooks(updatedBooks);
    }
  }, [activeBookId, activeChapterId, activeChapter?.content]);

  const handleAddChapter = async () => {
    if (activeBookId) {
      const updatedBooks = await storageService.addChapter(activeBookId);
      setBooks(updatedBooks);
      const updatedBook = updatedBooks.find(b => b.id === activeBookId);
      if (updatedBook) {
        setActiveChapterId(updatedBook.chapters[updatedBook.chapters.length - 1].id);
      }
    }
  };

  const handleAddBook = async (title: string) => {
    const updatedBooks = await storageService.addBook(title);
    setBooks(updatedBooks);
    const newBook = updatedBooks[updatedBooks.length - 1];
    setActiveBookId(newBook.id);
    setActiveChapterId(newBook.chapters[0].id);
  };

  // AI Actions
  const onFixGrammar = async () => {
    if (!activeChapter) return;
    setIsAIProcessing(true);
    const fixed = await geminiService.fixGrammar(activeChapter.content);
    setIsAIProcessing(false);
    
    if (fixed !== activeChapter.content) {
      setAiType('grammar');
      setAiResult({ original: activeChapter.content, suggestion: fixed });
    } else {
      alert("Grammar looks good! No major changes suggested.");
    }
  };

  const onExpandText = async (selectedText: string) => {
    if (!activeChapter) return;
    const textToExpand = selectedText || activeChapter.content.split('.').slice(-2).join('.');
    
    setIsAIProcessing(true);
    const expanded = await geminiService.expandText(textToExpand, activeChapter.content);
    setIsAIProcessing(false);

    setAiType('expand');
    setAiResult({ original: textToExpand, suggestion: expanded });
  };

  const applyAISuggestion = () => {
    if (!aiResult || !activeChapter) return;
    
    let newContent = activeChapter.content;
    if (aiType === 'grammar') {
      newContent = aiResult.suggestion;
    } else if (aiType === 'expand') {
      // Very simple replacement/insertion for expansion demo
      // In a real editor this would be more precise
      newContent = activeChapter.content.replace(aiResult.original, aiResult.suggestion);
    }
    
    handleUpdateContent(newContent);
    setAiResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Initializing Inkwell...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        books={books}
        activeBookId={activeBookId}
        activeChapterId={activeChapterId}
        onSelectBook={setActiveBookId}
        onSelectChapter={setActiveChapterId}
        onAddChapter={handleAddChapter}
        onAddBook={handleAddBook}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {activeBook?.title}
            </h2>
            <span className="text-slate-300">/</span>
            <input 
              type="text"
              value={activeChapter?.title || ''}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="font-medium text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 w-64"
              placeholder="Chapter Title"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 mr-2">
              {activeChapter?.wordCount || 0} words
            </span>
            <button 
              onClick={onFixGrammar}
              disabled={isAIProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
              Fix Grammar
            </button>
            <button 
              onClick={() => onExpandText('')}
              disabled={isAIProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-plus"></i>
              Expand Prose
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-12 pb-24">
          <div className="max-w-3xl mx-auto">
            <Editor 
              content={activeChapter?.content || ''} 
              onChange={handleUpdateContent}
              onExpandRequest={onExpandText}
            />
          </div>
        </div>

        {isAIProcessing && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-40">
            <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-200 flex flex-col items-center max-w-xs text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-slate-900">Gemini is thinking...</p>
              <p className="text-xs text-slate-500 mt-2">Crafting your perfect prose. Please wait a moment.</p>
            </div>
          </div>
        )}

        <AIModal 
          isOpen={!!aiResult} 
          type={aiType}
          result={aiResult}
          onClose={() => setAiResult(null)}
          onAccept={applyAISuggestion}
        />
      </main>
    </div>
  );
};

export default App;
