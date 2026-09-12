import {$,escape as e,safeURL,toast} from './utils.js';
import {content} from './window.js';
import {state} from './store.js';
export function separateWindow(url){
 const safe=safeURL(new URL(url,location.href).href);if(!safe)return;
 const width=Math.min(1120,screen.availWidth-48),height=Math.min(780,screen.availHeight-80);
 const popup=window.open(safe,'_blank',`popup=yes,width=${width},height=${height},left=${Math.max(0,(screen.availWidth-width)/2)},top=${Math.max(0,(screen.availHeight-height)/2)}`);
 if(popup)popup.opener=null;else toast('팝업이 차단되었습니다. 주소 표시줄의 팝업 허용을 확인해주세요.');
}
export function browserView(id,mode='detail'){
 const app=state.site.programs.find(p=>p.id===id);if(!app)return;
 const url=mode==='launch'?app.url:new URL(`projects/${app.slug}.html`,location.href).href;
 if(!safeURL(url))return;
 const title=mode==='launch'?`${app.label} · 실행`:`${app.label} · 설명`;
 content(title,`<div class="browser-view"><div class="browser-toolbar"><button id="browser-reload" aria-label="페이지 새로고침">↻</button><span class="browser-address" title="${e(url)}">${e(new URL(url).host+new URL(url).pathname)}</span><button id="browser-separate">별도 창 ↗</button></div><p class="browser-help">이 창 안에서 이용할 수 있습니다. 화면이 열리지 않거나 로그인이 필요하면 <button id="browser-fallback">별도 창으로 열기</button></p><iframe id="browser-frame" title="${e(title)}" src="${e(url)}" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals" allow="clipboard-write; fullscreen"></iframe></div>`);
 $('#workspace-window').classList.remove('maximized');$('#window-expand').setAttribute('aria-pressed','false');$('#workspace-window').classList.add('browser-window');
 $('#browser-reload').onclick=()=>{$('#browser-frame').src=url;};
 $('#browser-separate').onclick=$('#browser-fallback').onclick=()=>separateWindow(url);
}
