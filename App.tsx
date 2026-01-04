
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // AI State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiType, setAiType] = useState<'expand' | 'grammar' | null>(null);

  // Debounce Ref
  const saveTimeoutRef = useRef<any>(null);

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

  const debouncedUpdate = useCallback((newBooks: Book[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (user) {
        const mode = await storageService.saveBooks(newBooks, user.id);
        setStorageMode(mode);
      }
    }, 1000);
  }, [user]);

  const handleUpdateContent = useCallback(async (content: string) => {
    if (user && activeBookId && activeChapterId) {
      const newBooks = books.map(book => {
        if (book.id === activeBookId) {
          return {
            ...book,
            chapters: book.chapters.map(ch => {
              if (ch.id === activeChapterId) {
                return { ...ch, content, wordCount: countWords(content) };
              }
              return ch;
            })
          };
        }
        return book;
      });
      
      setBooks(newBooks);
      debouncedUpdate(newBooks);
    }
  }, [user, activeBookId, activeChapterId, books, debouncedUpdate]);

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
        setSidebarOpen(false);
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
      setSidebarOpen(false);
    }
  };

  const onFixGrammar = async () => {
    if (!activeChapter || !activeChapter.content.trim()) return;
    setIsAIProcessing(true);
    try {
      const fixed = await geminiService.fixGrammar(activeChapter.content);
      setIsAIProcessing(false);
      
      if (fixed && fixed !== activeChapter.content) {
        setAiResult({ original: activeChapter.content, suggestion: fixed });
        setAiType('grammar');
      } else {
        alert("Your editor analyzed your prose and found it already meets elite standards!");
      }
    } catch (e) {
      setIsAIProcessing(false);
      alert("The editor is currently unavailable. Please check your connection.");
    }
  };

  const onExpandText = async (selectedText: string) => {
    if (!activeChapter) return;
    
    // If no text is selected, we use the last paragraph or bit of text as the expansion seed
    const contextSnippet = selectedText || activeChapter.content.replace(/<[^>]*>/g, ' ').trim().slice(-300);
    
    setIsAIProcessing(true);
    try {
      const expandedPart = await geminiService.expandText(contextSnippet, activeChapter.content);
      setIsAIProcessing(false);

      if (expandedPart && expandedPart.trim().length > 0) {
        setAiResult({ 
          original: selectedText ? `Expanding: "${selectedText}"` : "Continuing the scene...", 
          suggestion: expandedPart 
        });
        setAiType('expand');
      } else {
        alert("Gemini couldn't find a way to expand this specific moment. Try selecting a different sentence.");
      }
    } catch (e) {
      setIsAIProcessing(false);
      alert("Expansion failed. Please try again.");
    }
  };

  const applyAISuggestion = () => {
    if (!aiResult || !activeChapter) return;
    
    let newContent = activeChapter.content;
    if (aiType === 'grammar') {
      newContent = aiResult.suggestion;
    } else if (aiType === 'expand') {
      const formattedExpansion = ` <span class="text-indigo-600 font-medium">${aiResult.suggestion}</span>`;
      
      // Robust insertion: Find the last closing paragraph tag or just append
      const lastParagraphIndex = newContent.lastIndexOf('</p>');
      if (lastParagraphIndex !== -1) {
        newContent = 
          newContent.substring(0, lastParagraphIndex) + 
          formattedExpansion + 
          newContent.substring(lastParagraphIndex);
      } else {
        newContent = newContent + "<p>" + formattedExpansion + "</p>";
      }
    }
    
    handleUpdateContent(newContent);
    setAiResult(null);
  };

  const handleSelectBook = (id: string) => {
    setActiveBookId(id);
    const book = books.find(b => b.id === id);
    if (book && book.chapters.length > 0) {
      setActiveChapterId(book.chapters[0].id);
    }
  };

  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Opening your manuscript...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar 
        user={user}
        books={books}
        activeBookId={activeBookId}
        activeChapterId={activeChapterId}
        storageMode={storageMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectBook={handleSelectBook}
        onSelectChapter={handleSelectChapter}
        onAddChapter={handleAddChapter}
        onAddBook={handleAddBook}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-bars-staggered text-lg"></i>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
              <h2 className="hidden sm:block text-sm font-semibold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
                {activeBook?.title || 'No Book'}
              </h2>
              <span className="hidden sm:block text-slate-300">/</span>
              <input 
                disabled={!activeChapter}
                type="text"
                value={activeChapter?.title || ''}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                className="font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full sm:w-64 disabled:opacity-50 text-base md:text-lg truncate"
                placeholder={activeBook ? "Chapter Title" : "Create a book"}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:block text-xs text-slate-400 mr-2">
              {activeChapter?.wordCount || 0} words
            </span>
            <button 
              onClick={onFixGrammar}
              disabled={isAIProcessing || !activeChapter}
              className="p-2 md:px-3 md:py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Polishing Editor"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 md:mr-2"></i>
              <span className="hidden md:inline">Polish Prose</span>
            </button>
            <button 
              onClick={() => onExpandText('')}
              disabled={isAIProcessing || !activeChapter}
              className="p-2 md:px-3 md:py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
              title="Inspire & Expand"
            >
              <i className="fa-solid fa-plus md:mr-2"></i>
              <span className="hidden md:inline">Expand Scene</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pt-4 md:pt-10 pb-24 bg-slate-100 px-4">
          <div className="max-w-screen-xl mx-auto flex justify-center">
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
              <p className="text-sm font-medium text-slate-900">Your co-writer is thinking...</p>
              <p className="text-xs text-slate-500 mt-2 italic">"The first draft is just you telling yourself the story."</p>
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
