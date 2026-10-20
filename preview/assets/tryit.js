/* =========================================================================
   tryit.js — 상세 페이지 "여기서 바로 써보기" 임베드
   섹션에 data-tryit-src 만 붙이면 어느 프로젝트 페이지에서도 동작한다.

   원칙
   · 누르게 하지 않는다. 페이지가 열리는 순간 같이 띄운다.
     스크롤해서 닿았을 땐 이미 돌아가고 있어야 한다.
     (화면에 들어올 때 띄우는 방법도 있지만, 탭이 뒤에 있거나 렌더링이
      멈춘 상황에서 안 뜬다. 5E 는 1초 남짓이라 그 위험을 살 이유가 없다.)
   · 폭이 좁다고 막지 않는다. 좁으면 좁은 대로 띄우고, 안내만 한 줄 남긴다.
   · 임베드는 맛보기고, 진짜 작업은 새 창이다. 그 안내를 화면에서 지우지 않는다.
   ========================================================================= */

function initTryIt(section) {
  const src     = section.dataset.tryitSrc;
  const stage   = section.querySelector('[data-tryit-stage]');
  const fullBtn = section.querySelector('[data-tryit-full]');
  const reBtn   = section.querySelector('[data-tryit-reload]');
  const frame   = section.querySelector('.tryit-frame');
  if (!src || !stage) return;

  const ph      = section.querySelector('.tryit-placeholder');
  const phTitle = ph && ph.querySelector('.ts-title');
  const phSub   = ph && ph.querySelector('.ts-sub');

  let iframe = null;
  let timer  = null;

  function run() {
    section.dataset.state = 'loading';
    clearTimeout(timer);

    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'tryit-iframe';
      iframe.title = section.dataset.tryitTitle || '앱 미리 실행';
      iframe.allow = 'fullscreen; clipboard-write';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.addEventListener('load', () => {
        clearTimeout(timer);
        section.dataset.state = 'live';
      });
      stage.appendChild(iframe);
    }
    iframe.src = src;

    /* 끝내 안 뜨면 숨 쉬는 로고만 남는다. 그건 고장 난 화면이지 기다리는 화면이 아니다.
       12초면 충분히 기다린 것으로 보고 새 창으로 보낸다. */
    timer = setTimeout(() => {
      if (section.dataset.state === 'live') return;
      section.dataset.state = 'failed';
      if (phTitle) phTitle.textContent = '여기서는 안 뜨네요';
      if (phSub) phSub.innerHTML =
        '네트워크나 브라우저 설정 때문일 수 있습니다. ' +
        '<a href="' + src + '" target="_blank" rel="noopener">새 창에서 열어보세요 ↗</a>';
    }, 12000);
  }

  if (reBtn) reBtn.addEventListener('click', run);   // 같은 주소를 다시 넣어 처음 상태로 되돌린다

  if (fullBtn) fullBtn.addEventListener('click', () => {
    const target = frame || stage;
    if (document.fullscreenElement) document.exitFullscreen();
    else target.requestFullscreen?.();
  });

  document.addEventListener('fullscreenchange', () => {
    const on = !!document.fullscreenElement;
    section.classList.toggle('is-full', on);
    if (fullBtn) fullBtn.textContent = on ? '전체화면 끄기' : '전체화면';
  });

  run();
}

document.querySelectorAll('[data-tryit]').forEach(initTryIt);
