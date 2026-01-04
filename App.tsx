
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AIModal } from './components/AIModal';
import { Auth } from './components/Auth';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { geminiService } from './services/geminiService';
import { Book, Chapter, AIResult, User, StorageMode } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode>('simulated');
  const [storageError, setStorageError] = useState<string | null>(null);
  
  // AI State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiType, setAiType] = useState<'expand' | 'grammar' | null>(null);

  const initData = async (currentUser: User) => {
    setLoading(true);
    const result = await storageService.getBooks(currentUser.id);
    setBooks(result.books);
    setStorageMode(result.mode);
    setStorageError(result.error || null);
    if (result.books.length > 0) {
      setActiveBookId(result.books[0].id);
      setActiveChapterId(result.books[0].chapters[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await initData(currentUser);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAuthSuccess = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    await initData(authenticatedUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setBooks([]);
    setActiveBookId(null);
    setActiveChapterId(null);
  };

  const activeBook = books.find(b => b.id === activeBookId) || null;
  const activeChapter = activeBook?.chapters.find(c => c.id === activeChapterId) || null;

  const countWords = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  };

  const handleUpdateContent = useCallback(async (content: string) => {
    if (user && activeBookId && activeChapterId) {
      const result = await storageService.updateChapter(activeBookId, activeChapterId, content, user.id);
      setBooks(result.books);
      setStorageMode(result.mode);
    }
  }, [user, activeBookId, activeChapterId]);

  const handleUpdateTitle = useCallback(async (title: string) => {
    if (user && activeBookId && activeChapterId) {
      const result = await storageService.updateChapter(activeBookId, activeChapterId, activeChapter?.content || '', user.id, title);
      setBooks(result.books);
      setStorageMode(result.mode);
    }
  }, [user, activeBookId, activeChapterId, activeChapter?.content]);

  const handleAddChapter = async () => {
    if (user && activeBookId) {
      const result = await storageService.addChapter(activeBookId, user.id);
      setBooks(result.books);
      setStorageMode(result.mode);
      const updatedBook = result.books.find(b => b.id === activeBookId);
      if (updatedBook) {
        setActiveChapterId(updatedBook.chapters[updatedBook.chapters.length - 1].id);
      }
    }
  };

  const handleAddBook = async (title: string) => {
    if (user) {
      const result = await storageService.addBook(title, user.id);
      setBooks(result.books);
      setStorageMode(result.mode);
      const newBook = result.books[result.books.length - 1];
      setActiveBookId(newBook.id);
      setActiveChapterId(newBook.chapters[0].id);
    }
  };

  const onFixGrammar = async () => {
    if (!activeChapter) return;
    setIsAIProcessing(true);
    // Strip tags for AI context but keep structure if possible
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
    const textToExpand = selectedText || activeChapter.content.replace(/<[^>]*>/g, ' ').split('.').slice(-2).join('.');
    
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
      // For expand, if it's plain text expansion we might need careful replacement in HTML
      // Simplest: replace text content
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
          <p className="mt-4 text-slate-600 font-medium">Initializing Inkwell Studio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        user={user}
        books={books}
        activeBookId={activeBookId}
        activeChapterId={activeChapterId}
        storageMode={storageMode}
        onSelectBook={setActiveBookId}
        onSelectChapter={setActiveChapterId}
        onAddChapter={handleAddChapter}
        onAddBook={handleAddBook}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {storageMode === 'simulated' && (
          <div className="bg-amber-100/90 backdrop-blur-md border-b border-amber-200 px-4 py-2 flex flex-col items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[10px]"></i>
              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">
                Simulation Mode: MongoDB connection failed.
              </p>
            </div>
            {storageError && (
              <p className="text-[9px] text-amber-700 mt-0.5 font-medium max-w-2xl text-center truncate italic">
                Reason: {storageError}
              </p>
            )}
          </div>
        )}
        
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
              {activeBook?.title || 'No Book Selected'}
            </h2>
            <span className="text-slate-300">/</span>
            <input 
              disabled={!activeChapter}
              type="text"
              value={activeChapter?.title || ''}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              className="font-medium text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 w-64 disabled:opacity-50"
              placeholder={activeBook ? "Chapter Title" : "Create a book to start"}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 mr-2">
              {countWords(activeChapter?.content || '')} words
            </span>
            <button 
              onClick={onFixGrammar}
              disabled={isAIProcessing || !activeChapter}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
              Fix Grammar
            </button>
            <button 
              onClick={() => onExpandText('')}
              disabled={isAIProcessing || !activeChapter}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-plus"></i>
              Expand Prose
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-6 pb-24">
          <div className="max-w-4xl mx-auto px-6 h-full">
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
