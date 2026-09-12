export const $ = (s, root = document) => root.querySelector(s);
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function plain(value) {
  const doc = new DOMParser().parseFromString(String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n'), 'text/html');
  doc.querySelectorAll('script,style,iframe').forEach(n => n.remove());
  return doc.body.textContent.replace(/\u00a0/g, ' ').trim();
}
export function safeURL(value) {
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
export const external = (url, label, cls = 'primary') => safeURL(url) ? `<a class="${cls}" href="${escape(safeURL(url))}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>` : '';
export const day = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; $('#toast').showPopover(); clearTimeout(toast.timer); toast.timer = setTimeout(() => { $('#toast').hidePopover(); $('#toast').hidden = true; }, 5500); }
export function readLocal(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
export function writeLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
export function download(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `작업실-${day()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
