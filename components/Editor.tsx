
import React, { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onExpandRequest: (selectedText: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, onExpandRequest }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external content changes (e.g., from AI or switching chapters)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const onExpandClick = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : '';
    onExpandRequest(selectedText);
  };

  return (
    <div className="flex flex-col h-full">
      {/* WYSIWYG Toolbar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl mb-6 p-1.5 flex items-center gap-1 shadow-sm">
        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('formatBlock', '<h1>')}
            title="Heading 1"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center font-bold"
          >
            H1
          </button>
          <button 
            onClick={() => execCommand('formatBlock', '<h2>')}
            title="Heading 2"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center font-bold"
          >
            H2
          </button>
          <button 
            onClick={() => execCommand('formatBlock', '<p>')}
            title="Normal Text"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-paragraph text-xs"></i>
          </button>
        </div>

        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('bold')}
            title="Bold"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-bold"></i>
          </button>
          <button 
            onClick={() => execCommand('italic')}
            title="Italic"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-italic"></i>
          </button>
          <button 
            onClick={() => execCommand('underline')}
            title="Underline"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-underline"></i>
          </button>
        </div>

        <div className="flex items-center border-r border-slate-200 pr-1 mr-1">
          <button 
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-list-ul"></i>
          </button>
          <button 
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
            className="p-2 hover:bg-slate-100 rounded text-slate-700 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-list-ol"></i>
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => execCommand('removeFormat')}
            title="Clear Formatting"
            className="p-2 hover:bg-slate-100 rounded text-slate-500 transition-colors w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-eraser"></i>
          </button>
          <button 
            onClick={onExpandClick}
            title="Expand selected text with AI"
            className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-600 transition-colors w-9 h-9 flex items-center justify-center ml-2 border border-indigo-100"
          >
            <i className="fa-solid fa-maximize"></i>
          </button>
        </div>
      </div>

      <div className="relative group flex-1">
        <style>{`
          .wysiwyg-editor {
            outline: none;
            min-height: 70vh;
          }
          .wysiwyg-editor h1 {
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #0f172a;
          }
          .wysiwyg-editor h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #1e293b;
          }
          .wysiwyg-editor p {
            margin-bottom: 1.25rem;
          }
          .wysiwyg-editor ul {
            list-style-type: disc;
            margin-left: 1.5rem;
            margin-bottom: 1.25rem;
          }
          .wysiwyg-editor ol {
            list-style-type: decimal;
            margin-left: 1.5rem;
            margin-bottom: 1.25rem;
          }
          .wysiwyg-editor li {
            margin-bottom: 0.5rem;
          }
          .wysiwyg-editor b, .wysiwyg-editor strong {
            font-weight: 700;
          }
          .wysiwyg-editor i, .wysiwyg-editor em {
            font-style: italic;
          }
        `}</style>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="wysiwyg-editor w-full bg-white border border-slate-100 shadow-sm rounded-2xl editor-font text-xl leading-relaxed text-slate-800 p-12 md:p-16"
          placeholder="Start writing your masterpiece..."
        />
      </div>
    </div>
  );
};
