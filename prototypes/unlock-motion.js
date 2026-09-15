for (const frame of document.querySelectorAll('.device iframe')) {
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    const entrance = doc.querySelector('#entrance');
    const screen = doc.querySelector('.screen-viewport');
    const stylesheet = doc.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/prototypes/unlock-motion.css';
    stylesheet.addEventListener('load', () => {
      frame.closest('.device').dataset.uiReady = 'true';
      doc.dispatchEvent(new Event('studio:entrancelayout'));
    });
    doc.head.append(stylesheet);
    const overlay = doc.createElement('div');
    overlay.className = 'unlock-preview';
    overlay.setAttribute('aria-hidden', 'true');

    const isMac = frame.closest('.device').id === 'desktop';
    const keys = doc.createElement('div');
    keys.className = 'typing-keys';
    keys.setAttribute('aria-hidden', 'true');
    if (isMac) {
      overlay.classList.add('password-preview');
      overlay.innerHTML = '<div class="lock-clock"><div class="lock-date"></div><time class="lock-time"></time></div><div class="lock-account"><img class="login-avatar" src="/assets/about/hammer.webp" alt="망치"><strong class="login-name">게으른 교사</strong><div class="password-dots">' + Array.from({length:6},(_,i)=>'<i style="--delay:'+ (410+i*120)+'ms"></i>').join('') + '<span>↵</span></div></div>';
      for (const [i,x] of [430,690,525,970,810,1200].entries()) {
        const key = doc.createElement('img');
        key.src = '/assets/studio/notebook-refined-open.webp';
        key.alt = '';
        key.style.clipPath = 'inset(81% '+((1536-x-48)/1536*100)+'% 18.1% '+(x/1536*100)+'%)';
        key.style.setProperty('--delay',(350+i*120)+'ms');
        keys.append(key);
      }
      doc.querySelector('.device-frame').append(keys);
    } else {
      overlay.classList.add('passcode-preview');
      doc.documentElement.classList.add('passcode-loading');
      stylesheet.addEventListener('load',()=>doc.documentElement.classList.remove('passcode-loading'));
      const digits = ['1','2','3','4','5','6','7','8','9','0'];
      const letters = ['', 'ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ',''];
      overlay.innerHTML = '<div class="passcode-title">암호 입력</div><div class="passcode-dots">' + Array.from({length:6},(_,i)=>'<i style="--delay:'+(320+i*145)+'ms"></i>').join('') + '</div><div class="passcode-pad">'+digits.map((digit,i)=>'<div class="passcode-key" data-digit="'+digit+'"><b>'+digit+'</b><small>'+letters[i]+'</small></div>').join('')+'</div>';
    }
    screen.append(overlay);
    let previous = entrance.dataset.phase;
    let presses=[];
    const sequence=['9','8','0','8','0','8'];
    new MutationObserver(() => {
      const phase = entrance.dataset.phase;
      if (phase === previous) return;
      previous = phase;
      if (phase === 'opening') {
        if (isMac) {
          const now = new Date();
          overlay.querySelector('.lock-date').textContent = new Intl.DateTimeFormat('ko-KR', {month:'long',day:'numeric',weekday:'long'}).format(now);
          overlay.querySelector('.lock-time').textContent = new Intl.DateTimeFormat('ko-KR', {hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
        }
        overlay.classList.add('playing');keys.classList.add('playing');
        if(!isMac){
          for(const digit of new Set(sequence)){
            const frames=[{offset:0,background:'#ffffff25'}];
            sequence.forEach((value,i)=>{if(value===digit){const t=260+i*145;frames.push({offset:t/1200,background:'#ffffff25'},{offset:(t+40)/1200,background:'#ffffff90'},{offset:(t+120)/1200,background:'#ffffff25'});}});
            frames.push({offset:1,background:'#ffffff25'});
            presses.push(overlay.querySelector('[data-digit="'+digit+'"]').animate(frames,{duration:1200,fill:'both'}));
          }
        }
      }
      if (phase === 'closed' || phase === 'inside' || phase === 'closing') {overlay.classList.remove('playing');keys.classList.remove('playing');for(const press of presses)press.cancel();presses=[];}
    }).observe(entrance, {attributes: true, attributeFilter: ['data-phase']});
  });
}
