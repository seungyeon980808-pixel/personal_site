/* =========================================================================
   hero-5e.js — 5E 상세 페이지 히어로의 키네틱 타이포
     · 좌표계는 660x372 고정. 바깥 폭에 맞춰 통째로 scale 한다.
     · 화면 밖으로 나가면 멈춘다 (스크롤 중 CPU 낭비 방지).
     · 무음. 소리는 브라우저가 자동재생을 막고, 히어로에선 원치도 않는다.
   시안 검토용 원본은 kinetic-preview.html.
   ========================================================================= */
(function () {
  "use strict";
  const STAGE = document.getElementById("k5stage");
  if (!STAGE) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    STAGE.setAttribute("data-static", "1");   // 모션을 원치 않는 사용자에겐 정지 화면
  }
  const BASE_W = 660, BASE_H = 372;

/* =======================================================================
   레이아웃 (640×400, 원점 = 중앙)
     글자 칼럼 오른쪽 끝  x = -112
     영상 프레임 중심     x = +114  (348×218) → 왼쪽 끝 -60
   → 52px 간격. 겹칠 수 없다.
   ======================================================================= */
// 마지막 동작은 15.85s 에 끝난다. 그 뒤 정지 구간이 3.35초나 되어 답답했다.
// 60% 줄여 1.34초만 머물게 하고 총 길이도 그만큼 짧아졌다 (20 → 17.9).
const SEC = 17.9, DUR = SEC * 1000;
// 640 폭 안에서 영상을 최대로 키운 값.
//   가장 긴 단어 "Educational" 161px 을 왼쪽 여백 20px 에 붙이면 TEXT_R = -139,
//   글자와 영상 사이 32px 을 띄우고 오른쪽 여백 20px 을 남기면 프레임은 407px.
// 실제 영상이 1920×1080(16:9)이라 프레임도 16:9. 16:10 이면 좌우가 잘린다.
const TEXT_R = -176;
const FRAME_X = 79, FRAME_W = 462, FRAME_H = 260;
// 프레임 아래에 캡션·진행바가 붙어 덩어리가 아래로 치우친다.
// 재생 구간 전체를 이만큼 올려 화면 가운데에 맞춘다.
const PLAY_Y = -24;

/* ④ E 다섯 개의 색 — 5E 프로그램의 실제 과목 테마에서 가져왔다.
   출처: 51_5E/5E_hub/css/style.css  :root[data-subject=...] --accent
     물리 = 기본 블루 #2f81f7 / 화학 = 버건디 #b03a4a
     생명 = 틸 #0f8a72        / 지구 = 우디 브라운 #a5794a
   보라(확장판)는 코드에 정의가 없어, 같은 톤(채도 낮은 고급 계열)으로 맞춰 지었다.
   실제 값이 따로 있으면 PURPLE 만 바꾸면 된다. */
const SUBJ = {
  physics: "#2f81f7", chem: "#b03a4a", bio: "#0f8a72", earth: "#a5794a", pro: "#7d5bbe",
};
const EC = [SUBJ.physics, SUBJ.chem, SUBJ.bio, SUBJ.earth, SUBJ.pro];
/* 합쳐진 뒤 세로 글자가 물드는 색 (= 프로그램 기본 블루) */
const BLUE = "#2f81f7", BLUE_LT = "#5ea1f7";

/* 타이밍
   영상마다 길이가 달라서(2.00 ~ 2.70초) 고정 노출을 쓰면 짧은 건 얼어붙고
   긴 건 잘린다. 각 영상의 실제 길이만큼 자리를 준다. */
const N = 5;
const VDUR = [2.00, 2.00, 2.70, 2.00, 2.63];   // 실측값 (브라우저 metadata)
const V0 = 0.20, VX = 0.001;
const VIN_T = [], VOUT_T = [];
(function () {
  let t = V0;
  for (let i = 0; i < N; i++) { VIN_T.push(t); t += VDUR[i]; VOUT_T.push(t); t += VX; }
})();
const VEND = VOUT_T[N - 1];            // ≈ 11.53
const FADE0 = VEND;                     // 영상 페이드아웃 시작

/* E 복귀 — 한 개씩 순차로 부르니 늘어져서, 한 방에 처리하는 쪽으로 바꿨다.
     A. 다섯이 동시에 날아 들어와 중앙 둘레에 선다   (0.38초)
     B. 다 같이 한 바퀴 돈다                          (0.52초)
     C. 안쪽으로 빠르게 하나씩 빨려들며 E→2E→3E→4E→5E (0.40초)
   총 1.30초. 이전 순차 방식(2.4초)의 절반. */
const E_LEAVE_LAST = VOUT_T[N - 1] - 0.34;
const BACK0   = E_LEAVE_LAST + 0.95;   // 마지막 E 가 다 날아간 뒤 시작
const RING_R  = 104;                   // 한 바퀴 도는 반지름
const ARR     = BACK0 + 0.38;          // 둘레에 도착
const ORB_END = ARR + 0.52;            // 한 바퀴 완료
const MSTAG   = 0.075;                 // 하나씩 빨려드는 간격
const MERGE_T = i => ORB_END + i * MSTAG;
const LOCK  = MERGE_T(N - 1) + 0.26;
const SLIDE = LOCK + 0.30;
const TAGT  = LOCK + 0.78;

/* 최종 배치 */
// 최종 배치는 build() 에서 '실제 히어로의 로고·제목 위치'에 맞춰 다시 계산한다.
// 애니메이션이 끝나는 순간의 그림이 페이지 본래 화면과 겹쳐야 인계가 자연스럽다.
let GROUP_Y = -16, LOGO_X = -136, STACK_EX = 6, LINE_H = 40, TAG_DY = 132;
let LOGO_S = 1;   // 실제 아이콘 크기에 맞춘 배율
let TAG_X = null; // 카피의 가로 위치 (실제 것에 맞춰 계산되면 채워진다)
/* 세로 글자가 파랗게 물들기 시작하는 시각 (마지막 줄이 자리잡은 뒤) */
const WASH0 = SLIDE + 0.95;

const anims = [];
function track(el, stops) {
  // 키프레임 시각은 반드시 오름차순이어야 한다. 어긋나면 el.animate 가 예외를 던지고
  // build() 가 그 자리에서 죽어 '이후 요소가 전부 사라지는' 형태로 나타난다.
  // (실제로 그렇게 마무리 전체가 통째로 안 보이는 사고가 있었다)
  // 조용히 죽지 않도록 어느 요소의 몇 번째 스톱이 문제인지 찍어준다.
  for (let i = 1; i < stops.length; i++) {
    if (stops[i][0] < stops[i - 1][0]) {
      console.error("[k5] 키프레임 시각 역전:", el.className || el.id,
        "stop#" + i, stops[i - 1][0].toFixed(3) + "s → " + stops[i][0].toFixed(3) + "s");
    }
  }
  const kf = stops.map(([s, p, e]) => {
    const f = { offset: Math.min(1, Math.max(0, s / SEC)) };
    Object.assign(f, p); if (e) f.easing = e; return f;
  });
  const a = el.animate(kf, { duration: DUR, iterations: 1, fill: "both" });
  anims.push(a); return a;
}
const SNAP = "cubic-bezier(0.16, 1, 0.3, 1)";
const WHIP = "cubic-bezier(0.85, 0, 0.95, 0.25)";
const LIN  = "linear";
function vIn(i)  { return VIN_T[i]; }
function vOut(i) { return VOUT_T[i]; }

(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  // build 가 중간에 죽으면 '이후 요소가 통째로 안 보이는' 형태로 나타난다.
  // 조용히 넘어가지 않도록 반드시 남긴다.
  try { build(); } catch (e) { console.error("[k5] build 실패:", e && e.message, e); }
});

/* 실제 히어로의 로고·제목이 화면 어디에 있는지 재서, 무대 좌표계(660x372)로 옮긴다.
   애니메이션 마지막 그림이 페이지 본래 화면과 같은 자리에 놓여야 인계가 매끄럽다. */
function alignToRealHero() {
  const icon = document.querySelector(".detail-icon");
  const title = document.querySelector(".detail-title");
  const sr = STAGE.getBoundingClientRect();
  if (!icon || !title || !sr.width) return;
  const k = sr.width / BASE_W;                       // 현재 화면배율
  const toX = px => (px - (sr.left + sr.width / 2)) / k;
  const toY = py => (py - (sr.top + sr.height / 2)) / k;

  const ir = icon.getBoundingClientRect();
  const tr = title.getBoundingClientRect();

  LOGO_X = toX(ir.left + ir.width / 2);
  LOGO_S = (ir.width / k) / 150;                     // 무대의 5E 마크는 150px 기준
  GROUP_Y = toY(tr.top + tr.height / 2);             // 제목 덩어리의 세로 중심에 맞춘다
  LINE_H  = (tr.height / k) / 5;                     // 다섯 줄이 실제 제목 높이를 채우게

  // 줄간격만 맞추고 글자 크기를 그대로 두면 글자가 줄간격보다 커져 서로 겹친다.
  // 실제 제목의 폰트 크기까지 그대로 가져온다.
  // line-height 도 함께 맞춰야 한다. 글자 크기만 줄이면 기본 행간(1.5)이 남아
  // 요소 높이가 줄간격보다 커져 다섯 줄이 서로 겹친다.
  const tfs = parseFloat(getComputedStyle(title).fontSize) / k;
  document.querySelectorAll(".k5-stackword").forEach((el) => {
    el.style.fontSize = tfs + "px";
    el.style.lineHeight = LINE_H + "px";
  });
  STACK_EX = toX(tr.left) + tfs * 0.33;              // 제목 왼쪽 끝 + E 폭 절반쯤

  // 한 줄 소개도 실제 것과 같은 크기·자리에
  const realTag = document.querySelector(".detail-tagline");
  const tagEl = document.getElementById("tag");
  if (realTag && tagEl) {
    tagEl.style.fontSize = (parseFloat(getComputedStyle(realTag).fontSize) / k) + "px";
    const gr = realTag.getBoundingClientRect();
    TAG_DY = toY(gr.top + gr.height / 2) - GROUP_Y;
    // 무대의 카피는 가운데 정렬이지만 실제 카피는 왼쪽 정렬이라 가로가 어긋난다.
    TAG_X = toX(gr.left + gr.width / 2) - tagEl.offsetWidth / 2;
  } else {
    TAG_DY = (tr.height / k) / 2 + 46;
  }
}

function build() {
  // 순서가 중요하다. fit() 이 배율(scale)과 히어로 높이를 확정한 '뒤에' 재야
  // 실제 로고·제목의 화면 좌표를 무대 좌표로 옳게 환산할 수 있다.
  // (먼저 재면 배율을 1 로 착각해 최종 배치가 통째로 어긋난다)
  fit();
  alignToRealHero();
  /* 색 입히기 — 단어의 E 와 날아가는 E 가 같은 색 */
  document.querySelectorAll(".k5-word").forEach((w, i) => {
    const b = w.querySelector("b"); if (b) b.style.color = EC[i];
  });
  document.querySelectorAll(".k5-stackword").forEach((w, i) => {
    const b = w.querySelector("b"); if (b) b.style.color = EC[i];
  });
  document.querySelectorAll(".k5-e").forEach((e, i) => {
    e.style.color = EC[i];
    e.style.textShadow = "0 0 26px " + EC[i] + "88";
  });
  document.querySelectorAll(".k5-ring").forEach((r, i) => { r.style.color = EC[i]; });
  document.querySelectorAll(".k5-dot i").forEach((b, i) => { b.style.background = EC[i % 5]; });

  /* 과목 틴트: 해당 영상이 나오는 동안 배경이 그 과목 색으로 물든다 */
  document.querySelectorAll(".k5-tint").forEach((el, i) => {
    el.style.background =
      `radial-gradient(closest-side, ${EC[i]}2e, ${EC[i]}00 70%)`;
    const a = vIn(i), b = vOut(i);
    // 첫 영상은 0.20s 에 시작하므로 a-0.30 이 음수가 된다 → 0 아래로 못 내려가게 막는다
    const fadeIn = Math.max(0.01, a - 0.30);
    track(el, [
      [0,        { opacity: 0 }],
      [fadeIn,   { opacity: 0 }, LIN],
      [a + 0.30, { opacity: 1 }, LIN],
      [b,        { opacity: 1 }, LIN],
      [b + 0.30, { opacity: 0 }],
      [17.90,       { opacity: 0 }],
    ]);
  });

  /* ---- 카메라 ---- */
  track(document.getElementById("cam"), [
    [0,           { transform: "translateZ(-60px)" }, LIN],
    [BACK0,       { transform: "translateZ(0px)" }, WHIP],
    [LOCK - 0.05, { transform: "translateZ(46px)" }, SNAP],
    [LOCK + 0.06, { transform: "translateZ(-110px)" }, SNAP],
    [SLIDE,       { transform: "translateZ(0px)" }, SNAP],
    [17.90,          { transform: "translateZ(12px)" }],
  ]);
  track(document.getElementById("glow"), [
    [0,           { opacity: 0.4, transform: "scale(0.85)" }, LIN],
    [BACK0,       { opacity: 0.55, transform: "scale(1.0)" }, SNAP],
    [LOCK + 0.14, { opacity: 1, transform: "scale(1.45)" }, SNAP],
    [SLIDE,       { opacity: 0.5, transform: "scale(1.05)" }, LIN],
    [17.90,          { opacity: 0.4, transform: "scale(0.85)" }],
  ]);

  /* ---- ⑥ 영상 프레임: 제자리에서 조용히 사라진다 (중앙으로 날아가지 않는다) ---- */
  const FR = `translate(${FRAME_X}px, ${PLAY_Y}px)`;
  track(document.getElementById("frame"), [
    [0,          { opacity: 0, transform: FR + " translateZ(-70px) scale(0.96)" }],
    [V0 - 0.18,  { opacity: 0, transform: FR + " translateZ(-70px) scale(0.96)" }, SNAP],
    [V0 + 0.10,  { opacity: 1, transform: FR + " translateZ(0px) scale(1)" }, LIN],
    [FADE0,      { opacity: 1, transform: FR + " translateZ(0px) scale(1)" }, LIN],
    [FADE0 + 0.60, { opacity: 0, transform: FR + " translateZ(0px) scale(0.99)" }],
    [17.90,         { opacity: 0, transform: FR + " translateZ(0px) scale(0.99)" }],
  ]);

  /* ---- 영상: 한 번에 하나 (하드컷 + 느린 줌) ---- */
  document.querySelectorAll(".k5-clip").forEach((el, i) => {
    const a = vIn(i), b = vOut(i), last = i === N - 1;
    const off = last ? FADE0 + 0.60 : b;
    track(el, [
      [0,        { opacity: 0, transform: "scale(1.07)" }],
      [a - VX,   { opacity: 0, transform: "scale(1.07)" }, LIN],
      [a,        { opacity: 1, transform: "scale(1.07)" }, LIN],
      [off,      { opacity: 1, transform: "scale(1.0)" }, LIN],
      [off + VX, { opacity: 0, transform: "scale(1.0)" }],
      [17.90,       { opacity: 0, transform: "scale(1.0)" }],
    ]);
  });

  /* ---- 캡션 ---- */
  document.querySelectorAll(".k5-cap").forEach((el, i) => {
    const a = vIn(i), b = vOut(i), last = i === N - 1;
    const off = last ? FADE0 + 0.45 : b;
    const X = FRAME_X - el.offsetWidth / 2, Y = FRAME_H / 2 + 18 + PLAY_Y;
    const P = `translate(${X}px, ${Y}px)`;
    track(el, [
      [0,        { opacity: 0, transform: `translate(${X}px, ${Y + 8}px)` }],
      [a - VX,   { opacity: 0, transform: `translate(${X}px, ${Y + 8}px)` }, SNAP],
      [a + 0.22, { opacity: 1, transform: P }, LIN],
      [off,      { opacity: 1, transform: P }, LIN],
      [off + 0.14, { opacity: 0, transform: `translate(${X}px, ${Y - 6}px)` }],
      [17.90,       { opacity: 0, transform: `translate(${X}px, ${Y - 6}px)` }],
    ]);
  });

  /* ---- 진행 표시 ---- */
  const dots = document.getElementById("dots");
  const dW = dots.offsetWidth;
  const DP = `translate(${FRAME_X - dW / 2}px, ${FRAME_H / 2 + 40 + PLAY_Y}px)`;
  track(dots, [
    [0,           { opacity: 0, transform: DP }],
    [V0 + 0.1,    { opacity: 0, transform: DP }, LIN],
    [V0 + 0.5,    { opacity: 1, transform: DP }, LIN],
    [FADE0,       { opacity: 1, transform: DP }, LIN],
    [FADE0 + 0.45,{ opacity: 0, transform: DP }],
    [17.90,          { opacity: 0, transform: DP }],
  ]);
  dots.querySelectorAll("i").forEach((bar, i) => {
    track(bar, [
      [0,          { width: "0%" }],
      [vIn(i),     { width: "0%" }, LIN],
      [vOut(i),    { width: "100%" }, LIN],
      [17.90,         { width: "100%" }],
    ]);
  });

  /* ---- 왼쪽 세로선 ---- */
  const RP = `translate(${TEXT_R + 18}px, ${PLAY_Y}px)`;
  track(document.getElementById("rule"), [
    [0,          { opacity: 0, transform: RP + " scaleY(0.3)" }],
    [V0,         { opacity: 0, transform: RP + " scaleY(0.3)" }, SNAP],
    [V0 + 0.6,   { opacity: 1, transform: RP + " scaleY(1)" }, LIN],
    [FADE0,      { opacity: 1, transform: RP + " scaleY(1)" }, WHIP],
    [FADE0 + 0.4,{ opacity: 0, transform: RP + " scaleY(0.3)" }],
    [17.90,         { opacity: 0, transform: RP + " scaleY(0.3)" }],
  ]);

  /* ---- 인덱스 ---- */
  const idx = document.getElementById("idx");
  const iX = TEXT_R - idx.offsetWidth, iY = -66 + PLAY_Y;
  track(idx, [
    [0,          { opacity: 0, transform: `translate(${iX}px, ${iY + 6}px)` }],
    [V0 + 0.2,   { opacity: 0, transform: `translate(${iX}px, ${iY + 6}px)` }, SNAP],
    [V0 + 0.7,   { opacity: 1, transform: `translate(${iX}px, ${iY}px)` }, WHIP],
    [FADE0,      { opacity: 1, transform: `translate(${iX}px, ${iY}px)` }, WHIP],
    [FADE0 + 0.35, { opacity: 0, transform: `translate(${iX}px, ${iY - 8}px)` }],
    [17.90,         { opacity: 0, transform: `translate(${iX}px, ${iY - 8}px)` }],
  ]);

  /* ---- 단어 5개 ---- */
  const words = [...document.querySelectorAll(".k5-word")];
  const wW = words.map(w => w.offsetWidth), wH = words.map(w => w.offsetHeight);
  const eX = words.map(w => { const b = w.querySelector("b"); return b.offsetLeft + b.offsetWidth / 2; });
  const eY = words.map(w => { const b = w.querySelector("b"); return b.offsetTop + b.offsetHeight / 2; });
  const LEAVE = [];

  words.forEach((el, i) => {
    const a = vIn(i), b = vOut(i);
    const X = TEXT_R - wW[i], Y = -wH[i] / 2 + 4 + PLAY_Y;
    const P = `translate(${X}px, ${Y}px)`;
    LEAVE.push(b - 0.34);
    track(el, [
      [0,        { opacity: 0, transform: `translate(${X + 28}px, ${Y}px)`, filter: "blur(6px)" }],
      [a - VX,   { opacity: 0, transform: `translate(${X + 28}px, ${Y}px)`, filter: "blur(6px)" }, SNAP],
      [a + 0.34, { opacity: 1, transform: P, filter: "blur(0px)" }, LIN],
      [b - 0.34, { opacity: 1, transform: P, filter: "blur(0px)" }, WHIP],
      [b - 0.02, { opacity: 0, transform: `translate(${X - 20}px, ${Y}px)`, filter: "blur(5px)" }],
      [17.90,       { opacity: 0, transform: `translate(${X - 20}px, ${Y}px)`, filter: "blur(5px)" }],
    ]);
  });

  /* ---- ① E: 바람개비로 튀어나갔다가 마지막에 되돌아와 합쳐진다 ----
     각 E 는 (i*72 - 90)° 방향으로 화면 밖까지 날아가고,
     BACK0 시점에 그 방향에서 다시 들어와 중앙에서 만난다. */
  // 목표점을 절대좌표로 잡으면 E 마다 출발 위치가 달라 실제 이동 각도가 틀어진다.
  // (측정해보니 간격이 41~93° 로 들쭉날쭉했다)
  // 반드시 '출발점 + 방향×거리' 로 잡아야 정확히 72° 씩 벌어진 바람개비가 된다.
  // 거리는 다섯 방향 모두 화면(640×400) 밖으로 나가도록 560 으로 잡았다.
  const OUT_R = 560;
  document.querySelectorAll(".k5-e").forEach((el, i) => {
    const t = LEAVE[i];
    const sx = TEXT_R - wW[i] + eX[i];
    const sy = -wH[i] / 2 + 4 + PLAY_Y + eY[i];
    const ang = (i * 72 - 90) * Math.PI / 180;
    const ox = sx + Math.cos(ang) * OUT_R;   // 출발점 기준
    const oy = sy + Math.sin(ang) * OUT_R;
    const spin = 300 + i * 40;
    const bx = ox, by = oy;   // 나갔던 그 자리에서 되돌아온다
    const degA = i * 72 - 90;                 // 이 E 의 둘레 위치(도)
    const ringXY = (deg) => {
      const r = deg * Math.PI / 180;
      return [Math.cos(r) * RING_R, Math.sin(r) * RING_R];
    };
    const mT = MERGE_T(i);

    const stops = [
      [0,        { opacity: 0, transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, filter: "blur(0px)" }],
      [t - 0.02, { opacity: 0, transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, filter: "blur(0px)" }, SNAP],
      [t + 0.10, { opacity: 1, transform: `translate(${sx + (ox - sx) * 0.10}px, ${sy + (oy - sy) * 0.10}px) scale(1.15) rotate(${spin * 0.1}deg)`, filter: "blur(0px)" }, WHIP],
      [t + 0.85, { opacity: 0, transform: `translate(${ox}px, ${oy}px) scale(0.85) rotate(${spin}deg)`, filter: "blur(6px)" }, LIN],
      // A. 다섯이 한꺼번에 날아 들어온다
      [BACK0,    { opacity: 0, transform: `translate(${bx}px, ${by}px) scale(0.9) rotate(${spin}deg)`, filter: "blur(6px)" }, LIN],
      [BACK0 + 0.08, { opacity: 1, transform: `translate(${bx * 0.72}px, ${by * 0.72}px) scale(1.1) rotate(${spin + 30}deg)`, filter: "blur(0px)" }, SNAP],
    ];
    // B. 다 같이 한 바퀴 (부드럽게 보이도록 60° 씩 6등분으로 샘플링)
    const STEPS = 6;
    for (let k = 0; k <= STEPS; k++) {
      const p = k / STEPS;
      const [x, y] = ringXY(degA + 360 * p);
      stops.push([ARR + (ORB_END - ARR) * p, {
        opacity: 1,
        transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(1) rotate(${(spin + 360 * p).toFixed(0)}deg)`,
        filter: "blur(0px)",
      }, LIN]);
    }
    // C. 안쪽으로 빨려든다 (i 번째는 MSTAG 만큼 늦게)
    const [hx, hy] = ringXY(degA + 360);
    stops.push([mT, { opacity: 1, transform: `translate(${hx.toFixed(1)}px, ${hy.toFixed(1)}px) scale(1) rotate(${spin + 360}deg)`, filter: "blur(0px)" }, WHIP]);
    stops.push([mT + 0.16, { opacity: 1, transform: `translate(0px, 0px) scale(0.42) rotate(${spin + 470}deg)`, filter: "blur(0px)" }, LIN]);
    stops.push([mT + 0.21, { opacity: 0, transform: `translate(0px, 0px) scale(0.3) rotate(${spin + 490}deg)`, filter: "blur(0px)" }]);
    stops.push([17.90, { opacity: 0, transform: "translate(0px, 0px) scale(0.3)", filter: "blur(0px)" }]);
    track(el, stops);
  });

  /* ---- 락인: 다섯 색 링이 차례로 퍼진다 ---- */
  document.querySelectorAll(".k5-ring").forEach((el, i) => {
    const t = MERGE_T(i) + 0.14;   // 빨려드는 순간마다 그 색으로 한 번씩
    track(el, [
      [0,        { opacity: 0, transform: "scale(0.55)" }],
      [t,        { opacity: 0, transform: "scale(0.55)" }, SNAP],
      [t + 0.06, { opacity: 0.85, transform: "scale(0.85)" }, SNAP],
      [t + 0.95, { opacity: 0, transform: "scale(3.1)" }],
      [17.90,       { opacity: 0, transform: "scale(3.1)" }],
    ]);
  });

  /* ---- 합체 카운터: E → 2E → 3E → 4E → 5E ---- */
  const cnt = document.getElementById("count");
  const cs = [[0, { opacity: 0, transform: "scale(0.5)" }]];
  for (let i = 0; i < N; i++) {
    const m = MERGE_T(i) + 0.16;           // 그 E 가 중앙에 닿는 순간
    cs.push([m - 0.001, { opacity: i === 0 ? 0 : 1, transform: "scale(1)" }, SNAP]);
    cs.push([m,         { opacity: 1, transform: "scale(1.18)" }, SNAP]);
    cs.push([m + 0.07,  { opacity: 1, transform: "scale(1)" }, LIN]);
  }
  cs.push([LOCK - 0.02, { opacity: 1, transform: "scale(1)" }, WHIP]);
  cs.push([LOCK + 0.01, { opacity: 0, transform: "scale(0.8)" }]);
  cs.push([17.90, { opacity: 0, transform: "scale(0.8)" }]);
  track(cnt, cs);

  /* ---- ② 최종 5E (150px) ---- */
  const LG = `translate(${LOGO_X}px, ${GROUP_Y}px)`;
  track(document.getElementById("final"), [
    [0,           { opacity: 0, transform: "translate(0,0) translateZ(-380px) scale(0.42)", filter: "blur(11px)" }],
    [LOCK - 0.12, { opacity: 0, transform: "translate(0,0) translateZ(-380px) scale(0.42)", filter: "blur(11px)" }, SNAP],
    [LOCK + 0.10, { opacity: 1, transform: "translate(0,0) translateZ(40px) scale(1.14)", filter: "blur(0px)" }, SNAP],
    [SLIDE,       { opacity: 1, transform: "translate(0,0) translateZ(0px) scale(1)", filter: "blur(0px)" }, SNAP],
    [SLIDE + 0.52,{ opacity: 1, transform: LG + ` translateZ(0px) scale(${LOGO_S})`, filter: "blur(0px)" }, LIN],
    [17.19,       { opacity: 1, transform: LG + ` translateZ(0px) scale(${LOGO_S})`, filter: "blur(0px)" }, WHIP],
    [17.90,          { opacity: 0, transform: LG + ` translateZ(40px) scale(${LOGO_S * 0.94})`, filter: "blur(6px)" }],
  ]);
  track(document.getElementById("sweep"), [
    [0,           { transform: "translateX(0%) rotate(18deg)", opacity: 0 }],
    [LOCK + 0.24, { transform: "translateX(0%) rotate(18deg)", opacity: 0 }, LIN],
    [LOCK + 0.32, { transform: "translateX(70%) rotate(18deg)", opacity: 1 }, LIN],
    [LOCK + 0.96, { transform: "translateX(430%) rotate(18deg)", opacity: 1 }, LIN],
    [LOCK + 1.02, { transform: "translateX(440%) rotate(18deg)", opacity: 0 }],
    [17.90,          { transform: "translateX(440%) rotate(18deg)", opacity: 0 }],
  ]);

  track(document.getElementById("flash"), [
    [0,           { opacity: 0 }],
    [LOCK - 0.03, { opacity: 0 }, SNAP],
    [LOCK + 0.03, { opacity: 0.7 }, SNAP],
    [LOCK + 0.48, { opacity: 0 }],
    [17.90,          { opacity: 0 }],
  ]);
  track(STAGE.parentElement, [   // .hero-media 를 흔든다 (STAGE 는 scale 이 걸려 있어 충돌)
    [0,           { transform: "translate(0,0)" }],
    [LOCK - 0.01, { transform: "translate(0,0)" }, LIN],
    [LOCK + 0.05, { transform: "translate(-7px, 5px)" }, LIN],
    [LOCK + 0.11, { transform: "translate(6px, -5px)" }, LIN],
    [LOCK + 0.17, { transform: "translate(-3px, 2px)" }, SNAP],
    [LOCK + 0.36, { transform: "translate(0,0)" }],
    [17.90,          { transform: "translate(0,0)" }],
  ]);

  /* ---- 세로 정렬 ---- */
  [...document.querySelectorAll(".k5-stackword")].forEach((el, i) => {
    const b = el.querySelector("b");
    const X = STACK_EX - (b.offsetLeft + b.offsetWidth / 2);
    const Y = GROUP_Y + (i - 2) * LINE_H - el.offsetHeight / 2;
    const P = `translate(${X}px, ${Y}px)`;
    const t0 = SLIDE + 0.18 + i * 0.07;
    track(el, [
      [0,         { opacity: 0, transform: `translate(${X + 30}px, ${Y}px)`, filter: "blur(7px)" }],
      [t0,        { opacity: 0, transform: `translate(${X + 30}px, ${Y}px)`, filter: "blur(7px)" }, SNAP],
      [t0 + 0.40, { opacity: 1, transform: P, filter: "blur(0px)" }, LIN],
      [17.19,     { opacity: 1, transform: P, filter: "blur(0px)" }, WHIP],
      [17.90,        { opacity: 0, transform: P, filter: "blur(4px)" }],
    ]);

    /* ---- 합체 뒤: 위에서 아래로 흘러내리듯 파랗게 물든다 ----
       줄마다 0.13초씩 늦춰 물이 흘러내리는 것처럼 보이게 한다.
       글자 본체는 흰색 → 블루, E 는 과목색 → 밝은 블루. */
    // 본체는 계속 흰색. E 만 위에서 아래로 순서대로 파랗게 물든다.
    const wash = WASH0 + i * 0.15;
    track(b, [
      [0,          { color: EC[i] }],
      [wash,       { color: EC[i] }, SNAP],
      [wash + 0.40,{ color: BLUE_LT }, LIN],
      [17.90,         { color: BLUE_LT }],
    ]);
  });

  /* ---- ③ 한글 카피 ---- */
  const tagEl = document.getElementById("tag");
  const tX = TAG_X !== null ? TAG_X : -tagEl.offsetWidth / 2;
  const tY = GROUP_Y + TAG_DY;
  const TG = `translate(${tX}px, ${tY}px)`;
  track(tagEl, [
    [0,         { opacity: 0, transform: `translate(${tX}px, ${tY + 16}px)`, filter: "blur(6px)" }],
    [TAGT,      { opacity: 0, transform: `translate(${tX}px, ${tY + 16}px)`, filter: "blur(6px)" }, SNAP],
    [TAGT + 0.38, { opacity: 1, transform: TG, filter: "blur(0px)" }, LIN],
    [17.19,     { opacity: 1, transform: TG, filter: "blur(0px)" }, WHIP],
    [17.90,        { opacity: 0, transform: TG, filter: "blur(4px)" }],
  ]);

  startLoop();
}

function syncCount(ms) {
  const s = ms / 1000, cnt = document.getElementById("count");
  if (!cnt) return;
  let n = 0;
  for (let i = 0; i < N; i++) if (s >= MERGE_T(i) + 0.16) n = i + 1;
  const txt = n <= 1 ? "E" : n + "E";
  if (cnt.textContent !== txt) cnt.textContent = txt;
}

function syncIdx(ms) {
  const s = ms / 1000, el = document.getElementById("idx");
  let n = 1;
  for (let i = 0; i < N; i++) if (s >= vIn(i)) n = i + 1;
  const txt = "0" + n + " / 0" + N;
  if (el.textContent !== txt) el.textContent = txt;
}


/* ---- 재생 루프 ---- */
let playing = true;
function nowMs() { return anims.length ? Number(anims[0].currentTime || 0) % DUR : 0; }

const VIDS = [...document.querySelectorAll(".k5-clip video")];
function syncVideos(ms) {
  const s = ms / 1000;
  VIDS.forEach((v, i) => {
    const a = VIN_T[i], b = VOUT_T[i];
    const active = playing && s >= a && s < b + 0.05;
    if (!active) { if (!v.paused) v.pause(); return; }
    const want = Math.min(Math.max(0, s - a), (v.duration || VDUR[i]) - 0.02);
    if (Math.abs(v.currentTime - want) > 0.25) { try { v.currentTime = want; } catch (e) {} }
    if (v.paused) v.play().catch(() => {});
  });
}

function setPlaying(on) {
  if (on === playing) return;
  playing = on;
  anims.forEach(a => on ? a.play() : a.pause());
  if (!on) VIDS.forEach(v => v.pause());
}

/* 무대를 히어로 폭에 꽉 채운다 (좌표계는 660x372 유지) */
const FIT = STAGE.parentElement;
const HERO = document.querySelector(".detail-hero");
function fit() {
  // 무대를 '지금 보이는 화면' 안에 통째로 넣고 가운데 둔다.
  // 폭에만 맞추면 무대 높이가 화면보다 커져 아래로 밀려나고,
  // 히어로 바닥에 붙은 건너뛰기 버튼까지 화면 밖으로 나간다.
  const topbar = document.querySelector(".topbar");
  const topH = topbar ? Math.round(topbar.getBoundingClientRect().height) : 0;
  const availH = Math.max(280, window.innerHeight - topH);
  const availW = FIT.clientWidth || HERO.clientWidth;
  if (!availW) return;
  const k = Math.min(availW / BASE_W, availH / BASE_H);
  STAGE.style.transform = "scale(" + k + ")";
  // 재생이 끝난 뒤에는 늘리지 않는다. 다시 늘리면 아래에 빈 공간이 남는다.
  if (!ended) HERO.style.minHeight = availH + "px";
}
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(FIT);
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", fit);

/* 화면 밖이거나 탭이 숨겨지면 멈춘다 */
let seen = false;
if ("IntersectionObserver" in window) {
  new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) seen = true; setPlaying(e.isIntersecting && !document.hidden && !ended); });
  }, { threshold: 0.05 }).observe(STAGE);
}
document.addEventListener("visibilitychange", () => setPlaying(!document.hidden && !ended));

/* ---- 재생이 끝나면 본래 히어로에 자리를 넘긴다 ---- */
let ended = false;
/* 재생 중에는 페이지를 붙잡아 둔다.
   아래 기능 섹션과 겹쳐 보이는 것을 막기 위함이다. 다만 20초를 강제로 붙잡으면
   방문자가 갇히므로 '건너뛰기' 를 항상 함께 둔다. */
function lockScroll(on) {
  document.documentElement.style.overflow = on ? "hidden" : "";
  document.body.style.overflow = on ? "hidden" : "";
}

function finish() {
  if (ended) return;
  ended = true;
  playing = false;
  VIDS.forEach(v => v.pause());
  lockScroll(false);
  // 애니메이션용으로 늘려둔 높이를 놓아준다. 안 그러면 아래에 화면 한 판만큼
  // 빈 공간이 그대로 남는다.
  HERO.style.minHeight = "";
  HERO.classList.add("k5-done");
  // 클래스만 믿지 않는다. 인계는 이 애니메이션의 존재 이유라서, 캐스케이드가
  // 어긋나면 '화면이 통째로 비는' 사고가 난다(실제로 났다). 인라인으로 못 박는다.
  handoff(true);
  replay.hidden = false;
  skip.hidden = true;
}

/* on=true : 본래 히어로를 보이고 오버레이를 감춘다 */
function handoff(on) {
  const left = document.querySelector(".hero-left");
  if (left) left.style.opacity = on ? "1" : "0";
  FIT.style.opacity = on ? "0" : "1";
  FIT.style.pointerEvents = on ? "none" : "";
}
function restart() {
  ended = false;
  HERO.classList.remove("k5-done");
  handoff(false);
  fit();               // 무대 높이를 되살린다
  replay.hidden = true;
  skip.hidden = false;
  lockScroll(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
  anims.forEach(a => { a.currentTime = 0; a.play(); });
  if (anims.length) anims[0].onfinish = finish;
  playing = true;
}

/* 건너뛰기 — 재생 중 항상 보인다 */
const skip = document.createElement("button");
skip.type = "button";
skip.className = "k5-skip";
skip.textContent = "건너뛰기 →";
skip.addEventListener("click", () => {
  anims.forEach(a => { try { a.finish(); } catch (e) {} });
  finish();
});

/* 다시보기 버튼 — 오른쪽 가운데 */
const replay = document.createElement("button");
replay.type = "button";
replay.className = "k5-replay";
replay.hidden = true;
replay.innerHTML = '<span class="k5-replay-ico">↻</span><span>다시 보기</span>';
replay.addEventListener("click", restart);
HERO.appendChild(replay);
HERO.appendChild(skip);
lockScroll(true);   // 재생 시작과 함께 잠근다

let looping = false;
/* detail.js 가 Firestore 내용을 채우면 제목 줄 수와 아이콘 크기가 달라진다.
   그 전에 잰 좌표로 만든 최종 배치는 통째로 어긋나므로, 내용이 잠잠해지면
   한 번 다시 만든다. (처음엔 제목이 기본값 "5E" 한 줄이라 줄간격이 10px 로 잡혔다) */
let rebuilds = 0;
function rebuild() {
  if (rebuilds++ > 3 || ended) return;
  anims.forEach(a => { try { a.cancel(); } catch (e) {} });
  anims.length = 0;
  try { build(); } catch (e) { console.error("[k5] rebuild 실패:", e && e.message); }
}
const HERO_LEFT = document.querySelector(".hero-left");
if (HERO_LEFT && "MutationObserver" in window) {
  let t = null;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(rebuild, 400); })
    .observe(HERO_LEFT, { childList: true, subtree: true, characterData: true,
                          attributes: true, attributeFilter: ["style", "src"] });
}

function startLoop() {
  fit();
  // 종료 감지는 rAF 가 아니라 애니메이션 완료 이벤트로 잡는다(백그라운드에서 rAF 정지).
  // ⚠ 이 등록은 looping 가드보다 '앞'에 있어야 한다. rebuild() 로 애니메이션을
  //    새로 만들 때마다 다시 걸어줘야 하는데, 가드 뒤에 두었더니 재구성 이후로는
  //    영영 등록되지 않아 재생이 끝나도 원래 화면으로 돌아가지 못했다.
  if (anims.length) {
    anims[0].onfinish = finish;
    if (anims[0].finished) anims[0].finished.then(finish).catch(() => {});
  }
  if (looping) return;
  looping = true;
  (function frame() {
    if (!ended) { const ms = nowMs(); syncVideos(ms); syncIdx(ms); syncCount(ms); }
    requestAnimationFrame(frame);
  })();
}
})();
