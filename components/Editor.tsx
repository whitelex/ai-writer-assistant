
import React, { useRef, useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onExpandRequest: (selectedText: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ content, onChange, onExpandRequest }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected.length > 5) {
        // We could show a floating bubble here, but for now we rely on the top bar button
      }
    }
  };

  const onExpandClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      onExpandRequest(selectedText);
    }
  };

  return (
    <div className="relative group">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onMouseUp={handleTextSelection}
        className="w-full min-h-[60vh] bg-transparent resize-none focus:outline-none editor-font text-lg leading-relaxed text-slate-800 p-8"
        placeholder="Start writing your masterpiece..."
      />
      
      {/* Floating utility - only visible on hover of the general editor area for a clean UI */}
      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white border rounded-lg shadow-lg p-1 flex flex-col">
          <button 
            onClick={onExpandClick}
            title="Expand selected text"
            className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-maximize"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
