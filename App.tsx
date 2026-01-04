
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
  const [isSaving, setIsSaving] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode>('simulated');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // AI State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiType, setAiType] = useState<'expand' | 'grammar' | null>(null);

  const saveTimeoutRef = useRef<any>(null);
  const isLoadedRef = useRef(false);

  // Sync state to persistence via useEffect
  useEffect(() => {
    // ONLY save if data has been successfully loaded first and there is a user
    if (!isLoadedRef.current || !user || books.length === 0) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const mode = await storageService.saveBooks(books, user.id);
        setStorageMode(mode);
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [books, user]);

  const initData = async (currentUser: User) => {
    setLoading(true);
    try {
      const result = await storageService.getBooks(currentUser.id);
      setBooks(result.books);
      setStorageMode(result.mode);
      setStorageError(result.error || null);
      if (result.books.length > 0) {
        setActiveBookId(result.books[0].id);
        setActiveChapterId(result.books[0].chapters[0].id);
      }
      // CRITICAL: Set loaded to true ONLY after state is populated
      isLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
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

    const handleUnload = () => {
      if (user && isLoadedRef.current && books.length > 0) {
        storageService.saveBooks(books, user.id);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
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
    isLoadedRef.current = false;
  };

  const activeBook = books.find(b => b.id === activeBookId) || null;
  const activeChapter = activeBook?.chapters.find(c => c.id === activeChapterId) || null;

  const countWords = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const handleUpdateContent = useCallback((content: string) => {
    if (!activeBookId || !activeChapterId) return;

    setBooks(prevBooks => prevBooks.map(book => {
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
    }));
  }, [activeBookId, activeChapterId]);

  const handleUpdateTitle = useCallback((title: string) => {
    if (!activeBookId || !activeChapterId) return;

    setBooks(prevBooks => prevBooks.map(book => {
      if (book.id === activeBookId) {
        return {
          ...book,
          chapters: book.chapters.map(ch => {
            if (ch.id === activeChapterId) {
              return { ...ch, title };
            }
            return ch;
          })
        };
      }
      return book;
    }));
  }, [activeBookId, activeChapterId]);

  const handleAddChapter = async () => {
    if (user && activeBookId) {
      const result = await storageService.addChapter(activeBookId, user.id);
      setBooks(result.books);
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
      console.error("Grammar error:", e);
      alert("AI Editor is momentarily busy. Please try again.");
    }
  };

  const onExpandText = async (selectedText: string) => {
    if (!activeChapter) return;
    
    const contextSnippet = selectedText || activeChapter.content.replace(/<[^>]*>/g, ' ').trim().slice(-400);
    
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
        alert("The Muse is quiet. Try highlighting a more descriptive sentence.");
      }
    } catch (e: any) {
      setIsAIProcessing(false);
      console.error("Expansion error:", e);
      alert(`Expansion failed: ${e.message || 'Check your connection.'}`);
    }
  };

  const applyAISuggestion = () => {
    if (!aiResult || !activeChapter) return;
    
    let newContent = activeChapter.content;
    if (aiType === 'grammar') {
      newContent = aiResult.suggestion;
    } else if (aiType === 'expand') {
      const formattedExpansion = ` <span class="text-indigo-600 border-b border-indigo-200">${aiResult.suggestion}</span>`;
      
      // Inject the expansion at the end of the last paragraph to maintain HTML structure
      const lastParagraphIndex = newContent.lastIndexOf('</p>');
      if (lastParagraphIndex !== -1) {
        newContent = newContent.substring(0, lastParagraphIndex) + formattedExpansion + newContent.substring(lastParagraphIndex);
      } else {
        newContent += formattedExpansion;
      }
    }
    
    handleUpdateContent(newContent);
    setAiResult(null);
    setAiType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <i className="fa-solid fa-feather-pointed text-white text-3xl"></i>
        </div>
        <p className="text-slate-500 font-medium">Preparing your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        user={user}
        books={books}
        activeBookId={activeBookId}
        activeChapterId={activeChapterId}
        storageMode={storageMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectBook={(id) => setActiveBookId(id)}
        onSelectChapter={(id) => setActiveChapterId(id)}
        onAddChapter={handleAddChapter}
        onAddBook={handleAddBook}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <i className="fa-solid fa-bars-staggered"></i>
            </button>
            <div className="hidden sm:block">
              <input 
                type="text"
                value={activeChapter?.title || ''}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                className="bg-transparent border-none text-lg font-bold text-slate-800 focus:outline-none focus:ring-0 w-64"
                placeholder="Chapter Title"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex flex-col items-end mr-2 text-[10px] uppercase tracking-wider font-bold">
              <span className={isSaving ? "text-indigo-500" : "text-slate-400"}>
                {isSaving ? "Saving..." : "Saved"}
              </span>
              <span className="text-slate-300">
                {activeChapter?.wordCount || 0} words
              </span>
            </div>

            <button 
              onClick={onFixGrammar}
              disabled={isAIProcessing}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50"
            >
              {isAIProcessing ? (
                <i className="fa-solid fa-spinner animate-spin"></i>
              ) : (
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              )}
              <span className="hidden sm:inline">Polish Prose</span>
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {activeChapter ? (
              <Editor 
                content={activeChapter.content}
                onChange={handleUpdateContent}
                onExpandRequest={onExpandText}
              />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <i className="fa-solid fa-book-open text-4xl mb-4 opacity-20"></i>
                <p>Select a book or chapter to start writing</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AIModal 
        isOpen={!!aiResult}
        type={aiType}
        result={aiResult}
        onClose={() => { setAiResult(null); setAiType(null); }}
        onAccept={applyAISuggestion}
      />
    </div>
  );
};

export default App;
