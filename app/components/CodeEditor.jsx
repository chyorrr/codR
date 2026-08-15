'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Code } from 'lucide-react';

/**
 * A textarea that behaves enough like an editor to be pleasant under time
 * pressure: gutter line numbers, real tab indentation, bracket/quote closing,
 * and Ctrl/Cmd+Enter to submit. Deliberately dependency-free — the arena should
 * not ship a full editor bundle for a 20-line function.
 */

const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };

export default function CodeEditor({
  value,
  onChange,
  onSubmit,
  disabled = false,
  fontSize = 14,
  placeholder = '',
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const lineCount = useMemo(() => Math.max(value.split('\n').length, 12), [value]);
  const lineHeight = Math.round(fontSize * 1.55);

  // Keep the gutter aligned while scrolling the code.
  const syncScroll = useCallback((e) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  }, []);

  const replaceSelection = useCallback((text, cursorOffset) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const pos = start + cursorOffset;
      el.selectionStart = el.selectionEnd = pos;
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback((e) => {
    const el = textareaRef.current;
    if (!el) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      replaceSelection('  ', 2);
      return;
    }

    // Auto-close brackets and quotes when nothing is selected.
    if (PAIRS[e.key] && el.selectionStart === el.selectionEnd) {
      e.preventDefault();
      replaceSelection(e.key + PAIRS[e.key], 1);
      return;
    }

    // Enter keeps the current indentation, and adds a level inside a block.
    if (e.key === 'Enter') {
      const start = el.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const indent = (value.slice(lineStart, start).match(/^[ \t]*/) || [''])[0];
      const opensBlock = /[{([]$/.test(value.slice(0, start).trimEnd());
      if (indent || opensBlock) {
        e.preventDefault();
        const extra = opensBlock ? '  ' : '';
        replaceSelection('\n' + indent + extra, 1 + indent.length + extra.length);
      }
    }
  }, [value, onSubmit, replaceSelection]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="codr-editor" className="text-cyan-400 font-mono text-sm font-bold flex items-center gap-2">
          <Code className="w-4 h-4" /> YOUR CODE
        </label>
        <span className="text-gray-600 font-mono text-xs">
          {value.split('\n').length} lines · {value.length} chars
        </span>
      </div>

      <div className="flex rounded-xl border-2 border-gray-700 focus-within:border-cyan-500 transition-colors overflow-hidden bg-gray-900">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none overflow-hidden bg-gray-950/60 text-gray-600 font-mono text-right py-4 px-3 border-r border-gray-800"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          id="codr-editor"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Solution code editor"
          className="flex-1 bg-transparent text-green-400 font-mono p-4 focus:outline-none resize-none disabled:opacity-60"
          style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, height: `${lineHeight * 14}px` }}
        />
      </div>
    </div>
  );
}
