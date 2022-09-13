const wrapper = document.createElement('div');

export function escapeHtml(text: string): string {
  if (/^[a-zA-Z0-9\s]+/.test(text)) {
    return text;
  }
  wrapper.innerText = text;
  return wrapper.innerHTML;
}
