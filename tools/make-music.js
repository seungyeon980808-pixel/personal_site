/* =========================================================================
   make-music.js — HwpPalette 인트로 배경음악을 합성해 WAV 로 만든다.

   외부 음원·라이브러리 없이 순수 계산으로 만든다. 저작권 걱정이 없고,
   영상 타임라인의 숫자(구간 5.1초, 엔딩 15.3초, 쾅 16.48초)에 정확히
   박자를 맞출 수 있다.

   구성 (press 시안 19.9초 기준)
     · 구간마다: 붓 스윽(노이즈 스웰) + 마림바풍 멜로디 + 저음 한 번
     · 영상이 도는 동안: 잔잔한 아르페지오
     · 엔딩: 상승 스윕 → 정적 한 박 → 쾅(저음 임팩트+화음) → 글자 켜질 때
       반짝임 세 번 → 이름 뜰 때 마무리 화음
   화성은 C → Am → F → (G) → C. 구간 색(파랑·초록·빨강)마다 코드가 다르다.

   사용법
     node tools/make-music.js                       → out/hwp-music.wav (19.9s)
     node tools/make-music.js --dur 19.9 --out out/hwp-music.wav
   ========================================================================= */
const fs = require("fs");
const path = require("path");

const arg = (name, def) => {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const RATE = 44100;
const DURS = Number(arg("dur", 19.9));
const OUT = path.resolve(arg("out", "out/hwp-music.wav"));

const NSAMP = Math.round(DURS * RATE);
const L = new Float64Array(NSAMP);
const R = new Float64Array(NSAMP);

/* ---- 악기 ---------------------------------------------------------- */

/* 마림바풍 — 기음 + 옅은 배음, 빠른 어택, 지수 감쇠 */
function pluck(t, freq, dur, gain, pan) {
  const s0 = Math.round(t * RATE), n = Math.round(dur * RATE);
  const gl = gain * (1 - (pan || 0) * 0.5), gr = gain * (1 + (pan || 0) * 0.5);
  for (let i = 0; i < n && s0 + i < NSAMP; i++) {
    const u = i / RATE;
    const env = Math.exp(-4.2 * u / dur) * (1 - Math.exp(-u * 900));
    const v = (Math.sin(2 * Math.PI * freq * u)
      + 0.34 * Math.sin(2 * Math.PI * freq * 2.004 * u) * Math.exp(-7 * u / dur)
      + 0.10 * Math.sin(2 * Math.PI * freq * 3.99 * u) * Math.exp(-11 * u / dur)) * env;
    L[s0 + i] += v * gl; R[s0 + i] += v * gr;
  }
}

/* 저음 — 부드러운 사인, 살짝 눌러 따뜻하게 */
function bass(t, freq, dur, gain) {
  const s0 = Math.round(t * RATE), n = Math.round(dur * RATE);
  for (let i = 0; i < n && s0 + i < NSAMP; i++) {
    const u = i / RATE;
    const env = Math.exp(-2.4 * u / dur) * (1 - Math.exp(-u * 300));
    const v = Math.tanh(1.5 * Math.sin(2 * Math.PI * freq * u)) * env;
    L[s0 + i] += v * gain; R[s0 + i] += v * gain;
  }
}

/* 붓 스윽 — 대역이 쓸려 올라가는 노이즈 (간단한 공진 대역통과) */
function whoosh(t, dur, gain, f0, f1, pan) {
  const s0 = Math.round(t * RATE), n = Math.round(dur * RATE);
  let lp = 0, bp = 0;
  const gl = gain * (1 - (pan || 0) * 0.5), gr = gain * (1 + (pan || 0) * 0.5);
  let seed = (s0 % 9973) + 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 0; i < n && s0 + i < NSAMP; i++) {
    const u = i / n;
    const f = f0 + (f1 - f0) * u;
    const w = 2 * Math.sin(Math.PI * f / RATE);
    const env = Math.sin(Math.PI * u) ** 1.5;
    lp += w * bp;
    const hpv = rnd() * 2 - lp - bp * 0.6;
    bp += w * hpv;
    const v = bp * env;
    L[s0 + i] += v * gl; R[s0 + i] += v * gr;
  }
}

/* 쾅 — 낮게 떨어지는 사인 + 짧은 노이즈 어택 */
function thump(t, gain) {
  const s0 = Math.round(t * RATE), n = Math.round(0.5 * RATE);
  let ph = 0, seed = 12345;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (let i = 0; i < n && s0 + i < NSAMP; i++) {
    const u = i / RATE;
    const f = 130 * Math.exp(-9 * u) + 46;
    ph += 2 * Math.PI * f / RATE;
    const env = Math.exp(-7 * u);
    const v = (Math.sin(ph) + rnd() * 0.5 * Math.exp(-70 * u)) * env;
    L[s0 + i] += v * gain; R[s0 + i] += v * gain;
  }
}

/* ---- 음계 (C 장조 5음) --------------------------------------------- */
const HZ = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI → Hz
const C4 = 60, D4 = 62, E4 = 64, G4 = 67, A4 = 69;
const C5 = 72, D5 = 74, E5 = 76, G5 = 79, A5 = 81, C6 = 84;
const C3 = 48, A2 = 45, F2 = 41, G2 = 43, C2 = 36;

/* ---- 타임라인 (assets/hero-hwp.js 의 press 시안과 같아야 한다) ------- */
/* ⚠ hero-hwp.js 의 DRAWP / CLIPLEN 과 같은 값이어야 박자가 맞는다 */
const DRAWP = 1.55;
const CLIPLEN = [4.30, 4.90, 3.95, 4.00];
const N = CLIPLEN.length;
const SEGLEN = CLIPLEN.map(c => DRAWP + c);
const T0S = [];
(function () { let t = 0; for (const L of SEGLEN) { T0S.push(t); t += L; } })();
const E0 = T0S[N - 1] + SEGLEN[N - 1];               // 23.35
const LAY   = E0 + 1.20;                              // 종이가 팔레트에 포개진다
const RUB0  = E0 + 1.35;                              // 비비기 시작
const PEEL  = E0 + 2.65;                              // 종이를 뗀다
const FLIP0 = E0 + 3.05;                              // 홱 뒤집는다
const PRINT = FLIP0;                                  // 찍힌 면이 드러난다
const NAME_T = E0 + 4.05;                             // 옆에 깔린다

/* 구간별 코드 — 파랑 C / 초록 Am / 빨강 F */
/* 구간별 코드 — 파랑 C / 초록 Am / 빨강 F / 남색(팔레트) G → 마지막에 C 로 풀린다 */
const CHORDS = [
  { bass: C2, arp: [C4, E4, G4, A4, G4, E4], lead: [E5, G5, C6] },
  { bass: A2, arp: [A4 - 12, C4, E4, A4, E4, C4], lead: [C5, E5, A5] },
  { bass: F2, arp: [F2 + 24, A4, C5, D5, C5, A4], lead: [D5, A5, C6] },
  { bass: G2, arp: [G2 + 24, D5, G5, D5, C5, G4], lead: [G5, D5, G4] },
];

for (let i = 0; i < N; i++) {
  const t0 = T0S[i], SEG = SEGLEN[i], ch = CHORDS[i];
  /* 붓이 긋는 동안 — 스윽 + 멜로디 세 음 */
  whoosh(t0 + 0.10, 0.85, 0.16, 300, 1500, i % 2 ? 0.3 : -0.3);
  bass(t0 + 0.16, HZ(ch.bass), 2.2, 0.30);
  ch.lead.forEach((nt, k) => pluck(t0 + 0.18 + k * 0.30, HZ(nt), 0.9, 0.16, (k - 1) * 0.4));
  /* 영상이 도는 동안 — 잔잔한 아르페지오 (8분음표, 점점 여려진다) */
  for (let b = 0; b < 8; b++) {
    const tt = t0 + 1.6 + b * 0.42;
    if (tt > t0 + SEG - 0.25) break;
    const nt = ch.arp[b % ch.arp.length];
    pluck(tt, HZ(nt), 0.55, 0.085 * (1 - b * 0.06), (b % 2) * 0.6 - 0.3);
  }
  if (i < N - 1) bass(t0 + SEG - 1.0, HZ(ch.bass + 7), 0.9, 0.14);   // 다음 구간 예고
}

/* ---- 엔딩 ----------------------------------------------------------- */
/* 글자들이 모이는 동안 — 상승 스윕과 오르는 음계, 그리고 반 박자 정적 */
whoosh(E0 + 0.05, 1.0, 0.20, 250, 2400, 0);
[C5, D5, E5, G5, A5].forEach((nt, k) => pluck(E0 + 0.18 + k * 0.15, HZ(nt), 0.5, 0.12, (k % 2) * 0.5 - 0.25));
bass(E0, HZ(G2), 1.0, 0.26);                          // G — 해소를 기다리는 저음

/* 종이가 포개진다 — 무겁지 않게, 종이 한 장 내려앉는 소리 */
thump(LAY, 0.26);
[C3, C4, G4].forEach((nt, k) => pluck(LAY + 0.01, HZ(nt), 1.6, 0.07, (k - 1) * 0.4));

/* 비비기 두 번 — 짧은 마찰음이 좌우로 오간다 */
whoosh(RUB0 + 0.06, 0.20, 0.10, 900, 2600, -0.5);
whoosh(RUB0 + 0.24, 0.20, 0.10, 900, 2600, 0.5);
whoosh(RUB0 + 0.40, 0.16, 0.07, 900, 2400, -0.4);

/* 찍혀 나온다 — C 로 해소되는 화음 */
[C4, E4, G4, C5].forEach((nt, k) => pluck(PRINT + 0.02, HZ(nt), 2.0, 0.10, (k % 2) * 0.5 - 0.25));
bass(PRINT, HZ(C2), 1.8, 0.24);

/* 종이를 뗀다 — 위로 걷히는 소리 + 팔레트에 글자가 남는 반짝임 세 번 */
whoosh(PEEL, 0.30, 0.12, 500, 2000, 0.3);
[0, 0.07, 0.14].forEach((d, k) => pluck(PEEL + 0.10 + d + k * 0.06, HZ([E5, G5, C6][k]), 0.7, 0.11, (k - 1) * 0.4));

/* 홱 뒤집는다 — 종이가 공기를 가르는 짧은 소리 (좌→우로 지나간다) */
whoosh(FLIP0, 0.26, 0.15, 700, 2200, -0.6);
whoosh(FLIP0 + 0.14, 0.20, 0.10, 1400, 600, 0.6);

/* 이름이 뜨는 순간 — 마무리 화음이 길게 남는다 */
[C4, E4, G4, D5, C5].forEach((nt, k) => pluck(NAME_T, HZ(nt), 2.6, 0.09, (k % 2) * 0.6 - 0.3));
bass(NAME_T, HZ(C2), 2.4, 0.26);
pluck(NAME_T + 0.34, HZ(C6), 1.4, 0.07, 0.2);         // 슬로건 위 반짝임 하나

/* ---- 마스터: 정규화 + 페이드아웃 ------------------------------------ */
let peak = 0;
for (let i = 0; i < NSAMP; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = peak > 0 ? 0.86 / peak : 1;
const fadeN = Math.round(0.5 * RATE);
for (let i = 0; i < NSAMP; i++) {
  let g = norm;
  if (i > NSAMP - fadeN) g *= (NSAMP - i) / fadeN;
  L[i] *= g; R[i] *= g;
}

/* ---- WAV 쓰기 (16-bit PCM 스테레오) --------------------------------- */
const data = Buffer.alloc(NSAMP * 4);
for (let i = 0; i < NSAMP; i++) {
  data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), i * 4);
  data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), i * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write("WAVE", 8);
hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20);
hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(RATE, 24); hdr.writeUInt32LE(RATE * 4, 28);
hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34);
hdr.write("data", 36); hdr.writeUInt32LE(data.length, 40);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([hdr, data]));
console.log(`[music] ${DURS}s → ${OUT} (${((44 + data.length) / 1048576).toFixed(1)} MB)`);
