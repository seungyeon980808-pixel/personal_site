import {applyIconVariant} from './iphone-icon-variants.js';
import {shortcutIcon} from './iphone-icons.js';
import {initPreviewNotch} from './iphone-notch.js';
import {svg} from '../src/studio/icons.js';

const programs = [
 {name:'ExamPool',logo:'exampool',slug:'exam-pool',description:'문항을 모으고, 시험 출제에 필요한 문제를 찾아보는 도구.'},
 {name:'5E',logo:'5e',slug:'physics-draw',description:'수업과 시험에 사용할 물리 그림을 그리는 도구.',url:'https://seungyeon980808-pixel.github.io/5E/'},
 {name:'HwpPalette',logo:'hwp',slug:'hwp-palette',description:'한글 문서의 편집과 서식을 돕는 도구.'},
 {name:'EveryKey',logo:'everykey',slug:'everykey',description:'반복되는 작업을 더 간편하게 만드는 도구.'},
 {name:'DocFinder',logo:'docfinder',slug:'docfinder',description:'필요한 문서를 찾아보는 도구.'},
 {name:'ModiPdf',logo:'modipdf',slug:'modipdf',description:'PDF 문서를 다루는 도구.'},
 {name:'Obsidian Hub',logo:'obsidian-hub',slug:'edunote',description:'기록과 지식을 연결하는 작업 공간.'}
];
const dialog=document.querySelector('#workspace-dialog');
const title=document.querySelector('#dialog-title');
const content=document.querySelector('#dialog-content');
const today=new Date();
document.querySelectorAll('.day').forEach(node=>node.textContent=String(today.getDate()));
document.querySelectorAll('.month').forEach(node=>node.textContent=`${today.getMonth()+1}월`);
document.querySelector('.weekday').textContent=today.toLocaleDateString('ko-KR',{weekday:'long'});
document.querySelectorAll('[data-symbol]').forEach(node=>node.innerHTML=shortcutIcon(node.dataset.symbol));
const logo=program=>`<img src="../assets/logo-${program.logo}.svg" width="60" height="60" alt="">`;
document.querySelector('#folder-mini').innerHTML=programs.map(logo).join('');
const row=(name,detail,url,kind='link')=>`<a class="row" href="${url}" target="_blank" rel="noopener">${svg(kind)}<span>${name}<small>${detail}</small></span></a>`;
const renderPrograms=()=>`<div class="folder-grid">${programs.map((program,index)=>`<button class="app" data-program="${index}"><span class="icon">${logo(program)}</span><span>${program.name}</span></button>`).join('')}</div>`;
const views={
 hammer:{title:'망치',kind:'sheet',html:()=>'<div class="program-header"><h3>잠깐, 쉬어가기.</h3></div><p class="description">기존 작업실의 망치 놀이는 Dock 왼쪽에 그대로 둡니다. 이 미리보기에서는 위치와 여는 동작을 확인할 수 있습니다.</p><a class="primary" href="../">기존 작업실에서 놀기</a>'},
 training:{title:'연수 자료',kind:'full',html:()=>`<p class="description">연수 발표 자료와 실습 파일을 찾아보세요.</p>${row('공유 자료실','Google Drive에서 자료 보기','https://drive.google.com/drive/folders/1xk1Vr_bjfhLwKdnZW3EW7NplFPQFHToc','folder')}`},
 archive:{title:'보관함',kind:'full',html:()=>'<p class="description">보관한 파일과 작업을 모아 보는 공간입니다.</p><article class="record"><h3>보관함 미리보기</h3><p>이 시안에는 저장된 개인 자료를 불러오지 않았습니다. 기존 작업실에서 자료를 확인할 수 있습니다.</p></article><a class="primary" href="../">기존 작업실 열기</a>'},
 guestbook:{title:'방명록',kind:'full',html:()=>'<p class="description">작업실에 방문한 이야기를 남기는 공간입니다.</p><article class="record"><h3>방명록 미리보기</h3><p>이 시안에서는 글을 저장하지 않습니다. 실제 방명록은 기존 작업실에서 이용할 수 있습니다.</p></article><a class="primary" href="../">기존 작업실 열기</a>'},
 contact:{title:'연락하기',kind:'sheet',html:()=>`<p class="description">작업실의 채널로 연결합니다.</p>${row('Threads','@iwatpt','https://www.threads.com/@iwatpt','threads')}${row('GitHub','프로젝트와 코드','https://github.com/seungyeon980808-pixel','github')}`},
 programs:{title:'프로그램',kind:'folder',html:renderPrograms},
 resources:{title:'공유 자료',kind:'full',html:()=>`<p class="description">수업과 연수에 사용한 자료를<br>한곳에서 찾아보세요.</p><p class="section-caption">자료실</p>${row('배포 중인 자료','Google Drive에서 자료와 실습 파일 보기','https://drive.google.com/drive/folders/1xk1Vr_bjfhLwKdnZW3EW7NplFPQFHToc','folder')}<p class="settings-note">자료실은 새 탭에서 열립니다.</p>`},
 recommend:{title:'추천 도구',kind:'full',html:()=>`<p class="description">작업을 조금 더 가볍게 해주는 도구들.</p>${row('lazy-starter-kit','AI 개발 환경 설치 도구','https://github.com/Heoooooon/lazy-starter-kit')}${row('OMO','여러 AI 에이전트가 함께하는 개발 환경','https://github.com/code-yeongyu/oh-my-openagent')}${row('rHWP','브라우저에서 HWP/HWPX 문서 편집','https://edwardkim.github.io/rhwp/')}${row('Recordly','화면 녹화와 데모 영상 편집','https://recordly.dev/')}${row('Aside','AI 브라우저','https://aside.com/')}`},
 about:{title:'작업실 소개',kind:'full',html:()=>`<div class="program-header"><h3>교사가 한가해야,<br>교육이 성장한다.</h3></div><p class="description">교사의 반복되는 작업을 덜어주는 도구와 수업에 도움이 되는 자료를 모으는 작업실입니다.</p>${row('GitHub','만들고 있는 도구들','https://github.com/seungyeon980808-pixel','github')}${row('Brunch','글과 생각','https://brunch.co.kr/@8bdd87c9870b451','brunch')}`},
 calendar:{title:'캘린더',kind:'full',html:()=>`<p class="description">${today.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</p><p class="section-caption">최근 기록</p><article class="record"><small>2026년 8월 30일 · 생각</small><h3>개학하고 2주밖에 안 지났건만...</h3><p>1. 드디어 사놓고 방치하던 맥을 사용하기 시작했다.<br>2. 해커톤(도전형) 이수 완료.<br>3. 이번 출제에 내가 개발한 시험문제출제 워크플로우 사용 예정.<br>4. 2학기 수업 준비 방식은 html기반으로 해볼까 고려중</p></article><article class="record"><small>2026년 7월 24일 · 생각</small><h3>방학에 할 일</h3><p>해커톤 연수 준비, 학교업무관리시스템 구축, 시험문제출제 워크플로우 검증과 수업 준비.</p></article>`},
 settings:{title:'설정',kind:'sheet',html:()=>`<p class="description">모바일 작업실 미리보기</p><div class="record"><small>화면 구성</small><h3>iPhone 스타일</h3><p>홈 화면 · 프로그램 폴더 · 자료 보기</p></div><a class="primary" href="../">기존 작업실 열기</a><p class="settings-note">화면과 동작을 확인하는 미리보기입니다. 로그인이나 저장된 설정은 변경하지 않습니다.</p>`}
};
function showView(name){
 const view=views[name];
 if(!view)return;
 title.textContent=view.title;
 dialog.className=view.kind;
 content.innerHTML=view.html();
 content.scrollTop=0;
 if(!dialog.open)dialog.showModal();
 else dialog.querySelector('[data-close]').focus();
}
function showProgram(index){
 const program=programs[index];
 if(!program)return;
 title.textContent=program.name;
 dialog.className='sheet';
 content.innerHTML=`<button class="detail-back" data-open="programs">‹ 프로그램</button><div class="program-header">${logo(program)}<h3>${program.name}</h3></div><p class="description">${program.description}</p><a class="primary" href="../projects/${program.slug}.html" target="_blank" rel="noopener">프로그램 소개 보기 ↗</a>${program.url?row('웹 앱 실행','새 탭에서 열기',program.url,'play'):''}`;
 content.scrollTop=0;
 content.querySelector('.detail-back').focus();
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button)return;
 if(button.hasAttribute('data-close'))dialog.close();
 else if(button.dataset.open)showView(button.dataset.open);
 else if(button.dataset.program!==undefined)showProgram(Number(button.dataset.program));
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
function alignDialog(){
 const box=document.querySelector('.phone').getBoundingClientRect();
 const style=dialog.style;
 style.setProperty('--preview-left',`${box.left}px`);
 style.setProperty('--preview-top',`${box.top}px`);
 style.setProperty('--preview-bottom',`${window.innerHeight-box.bottom}px`);
 style.setProperty('--preview-width',`${box.width}px`);
 style.setProperty('--preview-height',`${box.height}px`);
}
alignDialog();
window.addEventListener('resize',alignDialog);
window.addEventListener('scroll',alignDialog,{passive:true});

initPreviewNotch(document.querySelector('.preview-notch'),dialog);

const requestedStyle=new URLSearchParams(location.search).get('iconStyle');
applyIconVariant(['ios','glass','mono','object','color'].includes(requestedStyle)?requestedStyle:'ios');
