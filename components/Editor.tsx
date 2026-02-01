
import React, { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onExpandRequest: (selectedText: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, onExpandRequest }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);

  // Sync external content changes
  useEffect(() => {
    if (editorRef.current && content !== lastContentRef.current) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
        lastContentRef.current = content;
      }
    }
  }, [content]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      lastContentRef.current = newHtml;
      onChange(newHtml);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      lastContentRef.current = newHtml;
      onChange(newHtml);
    }
  };

  const onExpandClick = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    onExpandRequest(selectedText);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-full">
      {/* Floating Toolbar */}
      <div className="sticky top-4 z-20 w-full md:max-w-2xl bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl mb-8 p-1.5 flex flex-wrap items-center gap-1 shadow-lg shadow-slate-200/50">
        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('formatBlock', '<h1>')}
            title="Heading 1"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center font-bold"
          >
            H1
          </button>
          <button 
            onClick={() => execCommand('formatBlock', '<h2>')}
            title="Heading 2"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center font-bold"
          >
            H2
          </button>
          <button 
            onClick={() => execCommand('formatBlock', '<p>')}
            title="Normal Text"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-paragraph text-xs"></i>
          </button>
        </div>

        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('bold')}
            title="Bold"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-bold"></i>
          </button>
          <button 
            onClick={() => execCommand('italic')}
            title="Italic"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-italic"></i>
          </button>
          <button 
            onClick={() => execCommand('underline')}
            title="Underline"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-underline"></i>
          </button>
        </div>

        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-list-ul"></i>
          </button>
          <button 
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-list-ol"></i>
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => execCommand('removeFormat')}
            title="Clear Formatting"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-eraser"></i>
          </button>
          <button 
            onClick={onExpandClick}
            title="Expand with AI"
            className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors w-9 h-9 flex items-center justify-center border border-indigo-100"
          >
            <i className="fa-solid fa-maximize"></i>
          </button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div className="relative w-full max-w-[816px] mb-20">
        <style>{`
          .a4-page {
            outline: none;
            min-height: 1122px; /* A4 aspect ratio height approx at 96dpi */
            background: white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
            width: 100%;
            margin: 0 auto;
            padding: 1.5in 1.2in; /* Standard manuscript/academic margins */
            font-size: 1.15rem;
            line-height: 1.8;
            color: #334155;
            word-wrap: break-word;
          }
          
          @media (max-width: 768px) {
            .a4-page {
              padding: 2rem 1.5rem;
              min-height: auto;
              font-size: 1rem;
            }
          }

          .a4-page:empty:before {
            /* Fix: Changed placeholder to data-placeholder to match HTML attribute and resolve TS error */
            content: attr(data-placeholder);
            color: #94a3b8;
            cursor: text;
          }

          .a4-page h1 {
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 2rem;
            color: #0f172a;
            line-height: 1.2;
            text-align: center;
          }

          .a4-page h2 {
            font-size: 1.75rem;
            font-weight: 600;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: #1e293b;
            line-height: 1.3;
          }

          .a4-page p {
            margin-bottom: 1.5rem;
            text-align: justify;
            text-justify: inter-word;
          }

          .a4-page ul {
            list-style-type: disc;
            margin-left: 2rem;
            margin-bottom: 1.5rem;
          }

          .a4-page ol {
            list-style-type: decimal;
            margin-left: 2rem;
            margin-bottom: 1.5rem;
          }

          .a4-page li {
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
          }

          .a4-page b, .a4-page strong {
            font-weight: 700;
            color: #0f172a;
          }

          .a4-page i, .a4-page em {
            font-style: italic;
          }
        `}</style>
        
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="a4-page editor-font"
          /* Fix: Using data-placeholder instead of placeholder to comply with React/TS div properties */
          data-placeholder="Begin your story here..."
        />
        
        {/* Subtle page indicator for aesthetics */}
        <div className="absolute -bottom-10 left-0 right-0 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
          Manuscript Page 01
        </div>
      </div>
    </div>
  );
};
