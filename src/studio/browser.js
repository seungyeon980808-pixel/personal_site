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
 const url=mode==='launch'?app.url:new URL(`projects/${app.slug}.html?embedded=1&v=desktop-refinement-1`,location.href).href;
 if(!safeURL(url))return;
 const title=mode==='launch'?`${app.label} · 실행`:`${app.label} · 설명`,external=mode==='launch',origin=new URL(url).host;
 content(title,`<div class="browser-view"><p id="browser-error" class="browser-error" role="alert" hidden>화면을 불러오지 못했습니다. <button id="browser-fallback">별도 창으로 열기</button></p><iframe id="browser-frame" title="${e(title)}" src="${e(url)}" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals" allow="clipboard-write; fullscreen"></iframe></div>`);
 $('#workspace-window').classList.remove('maximized');$('#window-expand').setAttribute('aria-pressed','false');$('#workspace-window').classList.add('browser-window');
 const controls=$('#browser-controls'),originLabel=$('#browser-origin'),frame=$('#browser-frame'),error=$('#browser-error'),openSeparate=()=>separateWindow(url);
 controls.hidden=false;originLabel.hidden=!external;originLabel.textContent=external?origin:'';originLabel.title=external?origin:'';
 $('#browser-reload').onclick=()=>{error.hidden=true;frame.src=url;};
 $('#browser-separate').onclick=$('#browser-fallback').onclick=openSeparate;
 frame.addEventListener('error',()=>{if(error.isConnected)error.hidden=false;});
}
