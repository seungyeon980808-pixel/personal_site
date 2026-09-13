const copy = value => structuredClone(value);

const defaults = Object.freeze({
  intro: '저는 게으른 교사입니다.\n세상에는 귀찮은 것들이 너무나 많습니다.\nAI가 저에게 망치를 쥐어 주었습니다.',
  philosophyTitle: '교사가 한가해야, 교육이 성장한다',
  philosophy: '선생님들은 퇴근하고 모여서 사비로 맥주 한잔을 하면서도 “요즘 OO이는 어떠냐, 수업자료 괜찮은 거 없냐”를 물어봅니다. 중간에 누가 끊어주지 않으면 몇 시간이고 학교 얘기밖에 하지 않습니다.\n\n교사는 한가해야 합니다. 시간이 남아야 교육이 성장합니다. 진심으로 그렇게 믿습니다.',
  shortGoals: [],
  longGoals: [],
  careerSubtitle: '한 게 없어서 일단 이런 거라도 적어놓습니다.',
  career: [
    {id: 'career-2022', year: '2022', title: '교원임용시험 합격(충청북도교육청)'},
    {id: 'career-2024', year: '2024', title: '교원임용시험 합격(서울특별시교육청)'},
    {id: 'career-2026-09', year: '2026.09', title: '서울특별시교육청 2호 개발자 선정'},
  ],
  careerEnding: '앞으로 이것저것 많이 할 예정.',
  vibes: [
    {id: 'vibe-2026-03-start', month: '2026-03', title: '바이브코딩 시작 : 클로드 코드 사용', reflection: ''},
    {id: 'vibe-2026-03-notebook', month: '2026-03', title: '교무수첩 프로젝트 시작', reflection: ''},
    {id: 'vibe-2026-05-physics', month: '2026-05', title: '물리시험문제그림 제작기 프로젝트 시작', reflection: ''},
    {id: 'vibe-2026-06-science', month: '2026-06', title: '물리시험문제그림제작기 → 과학시험문제그림제작기(웹)', reflection: ''},
  ],
});

const has = (object, key) => Object.hasOwn(object, key);
const field = (source, key, fallback) => has(source, key) ? source[key] : copy(fallback);

export function normalizeProfile(raw) {
  if (raw !== undefined && (!raw || typeof raw !== 'object' || Array.isArray(raw))) return raw;
  const source = raw || {};
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, field(source, key, fallback)]));
}

const validText = (value, max, required = true) => typeof value === 'string' && value.length <= max && (!required || Boolean(value.trim()));
const validId = value => validText(value, 100) && /^[a-z0-9-]+$/i.test(value);
const uniqueIds = entries => new Set(entries.map(entry => entry.id)).size === entries.length;

export function validateProfile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('소개 데이터 형식이 올바르지 않습니다.');
  const profile = raw;
  if (!validText(profile.intro, 2000) || !validText(profile.philosophyTitle, 160) || !validText(profile.philosophy, 5000) || !validText(profile.careerSubtitle, 300) || !validText(profile.careerEnding, 300)) throw Error('소개 문구를 확인해주세요.');
  for (const goals of [profile.shortGoals, profile.longGoals]) {
    if (!Array.isArray(goals) || goals.length > 30 || !goals.every(goal => validText(goal, 240))) throw Error('목표 내용을 확인해주세요.');
  }
  if (!Array.isArray(profile.career) || profile.career.length > 100 || !profile.career.every(entry => entry && validId(entry.id) && validText(entry.year, 20) && validText(entry.title, 240)) || !uniqueIds(profile.career)) throw Error('경력 내용을 확인해주세요.');
  if (!Array.isArray(profile.vibes) || profile.vibes.length > 200 || !profile.vibes.every(entry => entry && validId(entry.id) && /^\d{4}-(0[1-9]|1[0-2])$/.test(entry.month) && validText(entry.title, 240) && validText(entry.reflection, 1000, false)) || !uniqueIds(profile.vibes)) throw Error('바이브 코딩 기록을 확인해주세요.');
  return copy(profile);
}
