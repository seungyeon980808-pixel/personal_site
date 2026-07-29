/* =========================================================================
   tryit.js — 상세 페이지 "여기서 바로 써보기" 임베드
   섹션에 data-tryit-src 만 붙이면 어느 프로젝트 페이지에서도 동작한다.

   원칙
   · 앱은 방문 즉시 뜨지 않는다. 눌러야 뜬다.
     상세 페이지를 읽으러 온 사람에게 편집기 하나를 통째로 내려받게 하지 않는다.
   · 좁은 화면에서는 아예 실행하지 않는다.
     5E 는 좌우 패널과 캔버스를 함께 보는 도구라 폭이 모자라면 체험이 아니라 오해가 된다.
   · 임베드는 맛보기고, 진짜 작업은 새 창이다. 그 안내를 화면에서 지우지 않는다.
   ========================================================================= */

const MIN_WIDTH = 900;   // 이보다 좁으면 임베드 대신 안내 카드

function initTryIt(section) {
  const src     = section.dataset.tryitSrc;
  const stage   = section.querySelector('[data-tryit-stage]');
  const start   = section.querySelector('[data-tryit-start]');
  const blocked = section.querySelector('[data-tryit-blocked]');
  const fullBtn = section.querySelector('[data-tryit-full]');
  const reBtn   = section.querySelector('[data-tryit-reload]');
  const frame   = section.querySelector('.tryit-frame');
  if (!src || !stage || !start) return;

  let iframe = null;

  /* 폭이 모자라면 실행 버튼을 감추고 안내 카드를 띄운다.
     창 크기가 바뀌면 다시 판단한다 — 단, 이미 띄운 앱은 건드리지 않는다.
     실행 중에 리사이즈로 iframe 을 날리면 사용자가 그리던 것이 사라진다. */
  function syncWidth() {
    if (iframe) return;
    const narrow = window.innerWidth < MIN_WIDTH;
    section.dataset.state = narrow ? 'blocked' : 'idle';
    start.hidden = narrow;
    if (blocked) blocked.hidden = !narrow;
  }

  function run() {
    if (iframe) return;
    section.dataset.state = 'loading';
    start.hidden = true;

    iframe = document.createElement('iframe');
    iframe.className = 'tryit-iframe';
    iframe.title = section.dataset.tryitTitle || '앱 미리 실행';
    iframe.allow = 'fullscreen; clipboard-write';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.src = src;
    iframe.addEventListener('load', () => { section.dataset.state = 'live'; });
    stage.appendChild(iframe);

    if (fullBtn) fullBtn.hidden = false;
    if (reBtn)   reBtn.hidden   = false;
  }

  start.addEventListener('click', run);

  if (reBtn) reBtn.addEventListener('click', () => {
    if (!iframe) return;
    section.dataset.state = 'loading';
    iframe.src = src;            // 같은 주소를 다시 넣어 처음 상태로 되돌린다
  });

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

  window.addEventListener('resize', syncWidth, { passive: true });
  syncWidth();
}

document.querySelectorAll('[data-tryit]').forEach(initTryIt);
