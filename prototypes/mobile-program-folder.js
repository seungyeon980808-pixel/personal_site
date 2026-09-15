const frame=document.querySelector('iframe');
async function initFolder(){
 const doc=frame.contentDocument;
 const style=doc.createElement('link');style.rel='stylesheet';style.href='/prototypes/mobile-program-folder.css';doc.head.append(style);
 let programs=[];
 const icons=()=>programs.slice(0,4).map(([,name,logo])=>`<img src="${new URL(logo,doc.baseURI).href}" alt="${name}">`).join('');
 const waitFor=selector=>new Promise(resolve=>{const check=()=>{const el=doc.querySelector(selector);if(el){observer.disconnect();resolve(el)}};const observer=new MutationObserver(check);observer.observe(doc,{subtree:true,childList:true,attributes:true});check()});
 await waitFor('#entrance[data-ready="true"]');doc.querySelector('#enter').click();
 await waitFor('#entrance[hidden]');
 const welcome=doc.querySelector('#welcome');
 const skip=[...welcome.querySelectorAll('button')].find(b=>b.textContent==='넘어가기');skip?.click();
 await waitFor('#dock .hammer-tool');
 const trigger=doc.querySelector('#dock [data-route*=programs]');trigger.click();
 programs=[...doc.querySelectorAll('.app-folder-grid .folder-app')].map(button=>[JSON.parse(button.dataset.route).id,button.querySelector('strong').textContent,button.querySelector('img').getAttribute('src')]);
 doc.querySelector('#window-close').click();
 trigger.removeAttribute('data-route');trigger.removeAttribute('title');trigger.setAttribute('aria-label','프로그램 폴더 열기');trigger.innerHTML=`<span class="program-mini">${icons()}</span><span>프로그램</span>`;
 const dialog=doc.createElement('dialog');dialog.className='mobile-app-folder';dialog.setAttribute('aria-labelledby','mobile-folder-title');dialog.innerHTML=`<h2 id="mobile-folder-title">프로그램</h2><div class="mobile-folder-grid">${programs.map(([id,name,logo])=>`<button data-route='${JSON.stringify({view:'program',id})}'><img src="${new URL(logo,doc.baseURI).href}" alt=""><span>${name}</span></button>`).join('')}</div><button class="folder-close" aria-label="프로그램 폴더 닫기">닫기</button>`;doc.body.append(dialog);
 trigger.onclick=()=>{dialog.showModal();doc.documentElement.classList.add('folder-preview-open')};
 dialog.addEventListener('close',()=>{doc.documentElement.classList.remove('folder-preview-open');trigger.focus()});
 dialog.querySelector('.folder-close').onclick=()=>dialog.close();
 dialog.addEventListener('click',event=>{if(event.target.closest('[data-route]'))dialog.close();if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
}
if(frame.contentDocument?.readyState==='complete'&&frame.contentDocument.URL!=='about:blank')initFolder();
else frame.addEventListener('load',initFolder,{once:true});
