import { parseQueryFilter, QueryFilterToken } from './parseQuery';
import { escapeHtml } from '../utils/escapeHtml';

function isFunctionCallAt(tokens: QueryFilterToken[], index: number): boolean {
  if (tokens[index]?.type !== 'Literal') {
    return false;
  }

  for (let i = index + 1; i < tokens.length; i++) {
    if (tokens[i].type === 'Open') {
      return true;
    }
    if (tokens[i].type !== 'Whitespace') {
      return false;
    }
  }

  return false;
}

export function highlightCodeResult(code: string, {
  tokens,
  index,
  error,
}: { tokens: QueryFilterToken[], index: number, error: string | null }): string {
  const endIndex = Math.min(index, tokens[tokens.length - 1]?.end || 0);
  const startPointers: Record<number, string[]> = {};
  const endPointers: Record<number, string[]> = {};

  // Ignore empty code
  if (code.trim() === '') {
    return code;
  }

  // Add empty space if the error is after the code
  if (error && index === code.length) {
    code += ' ';
  }

  // Add pointer for error
  if (error) {
    startPointers[endIndex || index || 0] = ['Error'];
    endPointers[code.length] = ['Error'];
  }

  // Add pointers for all known tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const type = isFunctionCallAt(tokens, i) ? 'Call' : token.type;
    startPointers[token.start] = (startPointers[token.start] || []).concat([type]);
    endPointers[token.end] = (endPointers[token.end] || []).concat([type]);
  }

  // Build a code
  let html = '';
  let lastIndex = 0;
  for (let i = 0; i <= code.length; i++) {
    if (endPointers[i]) {
      html += escapeHtml(code.substring(lastIndex, i));
      html += endPointers[i].map(() => '</span>').join('');
      lastIndex = i;
    }
    if (startPointers[i]) {
      html += escapeHtml(code.substring(lastIndex, i));
      html += startPointers[i].map((x) => `<span class="QF_${x}">`).join('');
      lastIndex = i;
    }
  }

  return html;
}

export function highlightCode(code: string): string {
  return highlightCodeResult(code, parseQueryFilter(code));
}
