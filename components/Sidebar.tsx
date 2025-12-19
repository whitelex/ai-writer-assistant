
import React, { useState } from 'react';
import { Book } from '../types';

interface SidebarProps {
  books: Book[];
  activeBookId: string | null;
  activeChapterId: string | null;
  onSelectBook: (id: string) => void;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onAddBook: (title: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  books,
  activeBookId,
  activeChapterId,
  onSelectBook,
  onSelectChapter,
  onAddChapter,
  onAddBook
}) => {
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');

  const activeBook = books.find(b => b.id === activeBookId);

  const handleAddBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBookTitle.trim()) {
      onAddBook(newBookTitle.trim());
      setNewBookTitle('');
      setIsAddingBook(false);
    }
  };

  return (
    <div className="w-72 h-full border-r bg-slate-900 flex flex-col text-slate-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
            <i className="fa-solid fa-feather-pointed text-white"></i>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Inkwell</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Books</h3>
            <button 
              onClick={() => setIsAddingBook(true)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
          
          {isAddingBook && (
            <form onSubmit={handleAddBookSubmit} className="mb-3 px-2">
              <input 
                autoFocus
                type="text"
                placeholder="Book title..."
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                onBlur={() => !newBookTitle && setIsAddingBook(false)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </form>
          )}

          <div className="space-y-1">
            {books.map(book => (
              <button
                key={book.id}
                onClick={() => onSelectBook(book.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center gap-3 ${
                  activeBookId === book.id 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <i className={`fa-solid fa-book ${activeBookId === book.id ? 'text-indigo-400' : 'text-slate-600'}`}></i>
                <span className="truncate">{book.title}</span>
              </button>
            ))}
          </div>
        </div>

        {activeBook && (
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chapters</h3>
              <button 
                onClick={onAddChapter}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[50vh]">
              {activeBook.chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all group relative ${
                    activeChapterId === ch.id 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono ${activeChapterId === ch.id ? 'text-indigo-400' : 'text-slate-700'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate pr-4">{ch.title}</span>
                  </div>
                  {activeChapterId === ch.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
            AU
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">The Author</p>
            <p className="text-xs text-slate-500">Pro Account</p>
          </div>
        </div>
      </div>
    </div>
  );
};
