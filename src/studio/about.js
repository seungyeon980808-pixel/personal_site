import {state, editDraft, isAdmin, update} from './store.js';
import {content} from './window.js';
import {escape as e, toast} from './utils.js';
import {normalizeProfile} from './profile-data.js';

const ownerAction = (label, attrs = '') => `<button type="button" class="about-owner-action admin-only danger" ${attrs}>${label}</button>`;
const ownerSummary = label => `<summary class="about-owner-summary admin-only">${label}</summary>`;
const identifier = prefix => `${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
const profileState = () => normalizeProfile(state.workspace.profile);

function saveProfile(change) {
  try {
    const body = document.querySelector('#window-body'), scrollTop = body?.scrollTop || 0;
    if (!state.editor) editDraft();
    const next = structuredClone(state.workspace);
    next.profile = normalizeProfile(next.profile);
    change(next.profile);
    update(next);
    about();
    requestAnimationFrame(() => { if (body) body.scrollTop = scrollTop; });
  } catch (error) {
    toast(error.message);
  }
}

function goals(kind, title, values, owner) {
  const entries = values.map((goal, index) => `<li><span>${e(goal)}</span>${owner ? `<details class="about-edit-detail">${ownerSummary('수정')}<form data-profile-goal="${kind}:${index}"><label>목표<textarea name="value" maxlength="240" required>${e(goal)}</textarea></label><button class="primary">저장</button></form></details>${ownerAction('삭제', `data-profile-delete-goal="${kind}:${index}"`)}` : ''}</li>`).join('');
  return `<section class="about-section about-goals"><header><h2>${title}</h2></header>${entries ? `<ul>${entries}</ul>` : '<p class="muted">아직 적어둔 목표가 없습니다.</p>'}${owner ? `<details class="about-add-detail">${ownerSummary('목표 추가')}<form data-profile-add-goal="${kind}"><label>목표<input name="value" maxlength="240" required></label><button class="primary">추가</button></form></details>` : ''}</section>`;
}

function career(profile, owner) {
  const rows = profile.career.map(entry => `<li class="about-timeline-row"><time>${e(entry.year)}</time><div><p>${e(entry.title)}</p>${owner ? `<details class="about-edit-detail">${ownerSummary('수정')}<form data-profile-career="${e(entry.id)}"><label>연도<input name="year" value="${e(entry.year)}" maxlength="20" required></label><label>내용<input name="title" value="${e(entry.title)}" maxlength="240" required></label><button class="primary">저장</button></form></details>${ownerAction('삭제', `data-profile-delete-career="${e(entry.id)}"`)}` : ''}</div></li>`).join('');
  return `<section class="about-section about-career"><header><h2>걸어온 길</h2>${owner ? `<details class="about-edit-detail">${ownerSummary('소개 수정')}<form data-profile-career-copy><label>부제목<input name="careerSubtitle" value="${e(profile.careerSubtitle)}" maxlength="300" required></label><label>마무리 문구<input name="careerEnding" value="${e(profile.careerEnding)}" maxlength="300" required></label><button class="primary">저장</button></form></details>` : ''}</header><p class="about-section-note">${e(profile.careerSubtitle)}</p><ol>${rows}</ol><p class="about-ending">${e(profile.careerEnding)}</p>${owner ? `<details class="about-add-detail">${ownerSummary('경력 추가')}<form data-profile-add-career><label>연도<input name="year" maxlength="20" required></label><label>내용<input name="title" maxlength="240" required></label><button class="primary">추가</button></form></details>` : ''}</section>`;
}

function vibes(profile, owner) {
  const groups = new Map();
  profile.vibes.forEach(entry => groups.set(entry.month, [...(groups.get(entry.month) || []), entry]));
  const rows = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([month, entries]) => `<section class="about-vibe-month"><h3>${e(month)}</h3><ol>${entries.map(entry => `<li><div><strong>${e(entry.title)}</strong>${entry.reflection ? `<p>${e(entry.reflection)}</p>` : ''}</div>${owner ? `<details class="about-edit-detail">${ownerSummary('수정')}<form data-profile-vibe="${e(entry.id)}"><label>연월<input name="month" type="month" value="${e(entry.month)}" required></label><label>제목<input name="title" value="${e(entry.title)}" maxlength="240" required></label><label>짧은 소감 (선택)<textarea name="reflection" maxlength="1000">${e(entry.reflection)}</textarea></label><button class="primary">저장</button></form></details>${ownerAction('삭제', `data-profile-delete-vibe="${e(entry.id)}"`)}` : ''}</li>`).join('')}</ol></section>`).join('');
  return `<section class="about-section about-vibes"><header><h2>바이브 코딩</h2></header>${rows}${owner ? `<details class="about-add-detail">${ownerSummary('기록 추가')}<form data-profile-add-vibe><label>연월<input name="month" type="month" required></label><label>제목<input name="title" maxlength="240" required></label><label>짧은 소감 (선택)<textarea name="reflection" maxlength="1000"></textarea></label><button class="primary">추가</button></form></details>` : ''}</section>`;
}

export function about() {
  const profile = profileState(), owner = state.editor && isAdmin();
  content('인사드립니다', `<article class="page about-page"><header class="about-intro"><img class="about-hammer" src="assets/about/hammer.webp" width="180" height="180" alt="망치"><div><p class="eyebrow">ABOUT</p><h1>인사드립니다</h1><p class="about-intro-copy">${e(profile.intro)}</p></div></header>${owner ? `<details class="about-owner-copy">${ownerSummary('소개 · 철학 편집')}<form data-profile-copy><label>소개<textarea name="intro" maxlength="2000" required>${e(profile.intro)}</textarea></label><label>철학 제목<input name="philosophyTitle" value="${e(profile.philosophyTitle)}" maxlength="160" required></label><label>철학 본문<textarea name="philosophy" maxlength="5000" required>${e(profile.philosophy)}</textarea></label><button class="primary">저장</button></form></details>` : ''}<section class="about-section about-philosophy"><h2>${e(profile.philosophyTitle)}</h2><p>${e(profile.philosophy)}</p></section>${goals('short', '단기 목표', profile.shortGoals, owner)}${goals('long', '중장기 목표', profile.longGoals, owner)}${career(profile, owner)}${vibes(profile, owner)}<footer class="about-contact-link"><button class="secondary" data-route='{"view":"contact"}'>연락하기</button></footer></article>`);
  const root = document.querySelector('.about-page');
  root.querySelector('[data-profile-copy]')?.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(event.currentTarget); saveProfile(profile => ['intro', 'philosophyTitle', 'philosophy'].forEach(key => { profile[key] = String(values.get(key) || '').trim(); }));
  });
  root.querySelector('[data-profile-career-copy]')?.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(event.currentTarget); saveProfile(profile => ['careerSubtitle', 'careerEnding'].forEach(key => { profile[key] = String(values.get(key) || '').trim(); }));
  });
  root.querySelectorAll('[data-profile-goal]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); const [kind, index] = form.dataset.profileGoal.split(':'); const value = String(new FormData(form).get('value') || '').trim(); saveProfile(profile => { profile[kind === 'short' ? 'shortGoals' : 'longGoals'][Number(index)] = value; });
  }));
  root.querySelectorAll('[data-profile-add-goal]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); const value = String(new FormData(form).get('value') || '').trim(); saveProfile(profile => { profile[form.dataset.profileAddGoal === 'short' ? 'shortGoals' : 'longGoals'].push(value); });
  }));
  root.querySelectorAll('[data-profile-delete-goal]').forEach(button => button.addEventListener('click', () => {
    const [kind, index] = button.dataset.profileDeleteGoal.split(':'); saveProfile(profile => profile[kind === 'short' ? 'shortGoals' : 'longGoals'].splice(Number(index), 1));
  }));
  root.querySelectorAll('[data-profile-career]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(form); saveProfile(profile => { const entry = profile.career.find(item => item.id === form.dataset.profileCareer); if (entry) { entry.year = String(values.get('year') || '').trim(); entry.title = String(values.get('title') || '').trim(); } });
  }));
  root.querySelector('[data-profile-add-career]')?.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(event.currentTarget); saveProfile(profile => profile.career.push({id: identifier('career'), year: String(values.get('year') || '').trim(), title: String(values.get('title') || '').trim()}));
  });
  root.querySelectorAll('[data-profile-delete-career]').forEach(button => button.addEventListener('click', () => saveProfile(profile => { profile.career = profile.career.filter(item => item.id !== button.dataset.profileDeleteCareer); })));
  root.querySelectorAll('[data-profile-vibe]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(form); saveProfile(profile => { const entry = profile.vibes.find(item => item.id === form.dataset.profileVibe); if (entry) { entry.month = String(values.get('month') || ''); entry.title = String(values.get('title') || '').trim(); entry.reflection = String(values.get('reflection') || '').trim(); } });
  }));
  root.querySelector('[data-profile-add-vibe]')?.addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(event.currentTarget); saveProfile(profile => profile.vibes.push({id: identifier('vibe'), month: String(values.get('month') || ''), title: String(values.get('title') || '').trim(), reflection: String(values.get('reflection') || '').trim()}));
  });
  root.querySelectorAll('[data-profile-delete-vibe]').forEach(button => button.addEventListener('click', () => saveProfile(profile => { profile.vibes = profile.vibes.filter(item => item.id !== button.dataset.profileDeleteVibe); })));
}
