/* =========================================================================
   hero-hwp.js — HwpPalette 인트로 키네틱 타이포

   구성
     [붓이 글자 하나를 휘갈긴다 1.5s → 기능영상 3.6s] × 3 = 15.3s
     엔딩 — 시안에 따라 3.8 ~ 4.6s. 총 19.1 ~ 19.9초.

   엔딩 시안 4종 (?ending= 으로 고른다. 기본 press)
     press  A. 엎어찍기 — 색 글자들이 hwp 로 합쳐진 뒤 팔레트에 엎어졌다
               떼어지고, 글자가 팔레트에 박힌다 (사용자 제안안)
     wipe   B. 페인트 스윕 — 붓이 삼색 페인트로 화면을 쓸고, 걷히면 아이콘
     drop   C. 물감 방울 — 글자가 물감 방울로 녹아 제 자리에 떨어진다
     orbit  D. 궤도 안착 — 글자들이 팔레트 둘레를 한 바퀴 돌다 하나씩 안착

   글자는 정자체가 아니라 휘갈긴 붓글씨다. 획은 손이 지나간 곡선이고,
   획 끝마다 물감이 튄다. 붓은 획 위를 '진짜로' 지나간다 — getPointAtLength
   로 경로를 미리 찍어 키프레임으로 만든다 (offset-path 는 프레임 단위
   렌더에서 못 믿는다). 붓 속도는 앞이 빠르고 끝이 무겁다 (휘갈김의 리듬).

   원리는 5E 인트로(hero-5e.js)와 같다. 모든 요소가 '시각의 함수'인 하나의
   긴 애니메이션이라, tools/render-intro.js 가 프레임마다 시각을 고정하고
   찍어 mp4 로 만든다. 그래서 setTimeout 을 절대 쓰지 않는다.

   ⚠ 한 요소에는 트랙을 하나만 건다.
   ⚠ 키프레임 오프셋은 반드시 증가해야 한다. 구간 경계를 넘는 퇴장이 다음
     구간의 첫 키프레임보다 뒤가 되면 animate 가 그 자리에서 죽는다.

   좌표계 660×372, 원점은 무대 중앙. SVG 좌표 = 무대 좌표 + (330, 186).
   ========================================================================= */
(function () {
  "use strict";
  const STAGE = document.getElementById("hpstage");
  if (!STAGE) return;

  const QS = new URLSearchParams(location.search);
  const VARIANT = ["press", "wipe", "drop", "orbit"].includes(QS.get("ending"))
    ? QS.get("ending") : "press";

  /* =====================================================================
     타이밍
     ===================================================================== */
  const DRAWP = 1.55;                // 붓이 글자를 그리는 구간 (급하지 않게)
  /* 영상마다 노출 시간을 따로 준다.
     하나의 값으로 묶으면 가장 긴 영상에 맞춰야 하는데, 그러면 짧은 영상이
     마지막 프레임에서 얼어붙는다. 원본 길이는
     01 4.47 / 02 5.10 / 03 4.10 / 04 4.17 초 (02 의 두 번째 영상은 2.90). */
  const CLIPLEN = [4.30, 4.90, 3.95, 4.00];
  const N       = CLIPLEN.length;
  const SEGLEN  = CLIPLEN.map(c => DRAWP + c);
  const T0S = [];
  (function () { let t = 0; for (const L of SEGLEN) { T0S.push(t); t += L; } })();
  const E0    = T0S[N - 1] + SEGLEN[N - 1];   // 23.35 — 엔딩 시작
  const ENDD  = { press: 6.2, wipe: 3.8, drop: 4.2, orbit: 4.6 }[VARIANT];
  const SEC   = E0 + ENDD;
  const DUR   = SEC * 1000;

  const T0   = i => T0S[i];
  const COUT = i => T0S[i] + SEGLEN[i];
  const PLAY = i => T0S[i] + DRAWP;
  /* 구간 길이가 제각각이라 나눗셈으로는 못 찾는다 */
  const segAt = s => { for (let i = N - 1; i >= 0; i--) if (s >= T0S[i]) return i; return 0; };

  const SNAP  = "cubic-bezier(0.16, 1, 0.3, 1)";
  const WHIP  = "cubic-bezier(0.85, 0, 0.95, 0.25)";
  const FLICK = "cubic-bezier(0.05, 0.7, 0.1, 1)";   // 확 긋고 무겁게 멎는다
  const LIN   = "linear";

  const SX = x => x - 330, SY = y => y - 186;

  /* =====================================================================
     구간 정의 — 글자(휘갈긴 획) / 색 / 배치 / 붓의 드나듦이 전부 다르다
     strokes 는 [d, 굵기] 쌍. splats 는 [x, y, r, 획번호] — 그 획이 끝나는
     순간 튀는 물감 방울.
     ===================================================================== */
  const SEGS = [
    {
      /* ① H — 파랑. 왼쪽. 붓은 왼쪽 위에서 들어와 오른쪽 아래로. */
      color: "#2f6fd0",
      feature: { n: "01", t: "특수기호 팔레트", d: "자주 사용하는 특수기호를 한 곳에" },
      tilt: -7, tc: [155, 170], gs: 0.88, gy: -18,
      strokes: [
        ["M 114 76 C 88 126, 96 202, 110 260", 28],
        ["M 214 62 C 190 122, 192 210, 216 266", 24],
        ["M 60 184 C 130 152, 198 170, 260 132", 16],
      ],
      /* 획 끝의 삐침 — 붓을 떼며 채는 가는 꼬리 */
      tails: [
        ["M 110 260 C 116 272, 126 278, 140 278", 9, 0],
        ["M 260 132 C 272 124, 280 112, 282 98", 7, 2],
      ],
      splats: [[118, 266, 7, 0], [222, 272, 6, 1], [268, 128, 8, 2], [284, 142, 4, 2]],
      /* 4:3 이다. 원본은 16:9 지만 좌우에 검은 여백이 박혀 있어서,
         4:3 으로 가운데를 잘라내야 그 여백이 안 보인다. 건드리지 말 것. */
      frame: { x: 145, y: 2, w: 330, h: 248, rot: 0 },
      from:  { x: -300, y: -130, rot: -5 },
      // 4:3 프레임이 커지면서 왼쪽 칼럼을 바깥으로 밀었다 (프레임과 겹치지 않게)
      cap:   { x: -250, y: 118 },
      in:    { x: -430, y: -250, rot: -34 },
      out:   { x: 430, y: 250, rot: 24 },
    },
    {
      /* ② w — 초록. 이 구간만 영상이 **두 편**이라 가로가 꽉 찬다.
         그래서 w 는 크게 그린 뒤 뒤로 물러나 바탕이 된다(dim).
         두 영상은 시작이 다르고 끝이 같다 — 시험지와 계획서가 나란히 완성된다. */
      color: "#7cb342",
      feature: { n: "02", t: "템플릿 마크다운", d: "복잡한 계획서나 시험지도 한번에" },
      tilt: 5, tc: [505, 160], gs: 1.42, gy: 6, gx: -190,
      dim: 0.12,
      strokes: [
        ["M 414 92 C 440 180, 446 228, 470 230 C 488 230, 490 148, 506 132 C 522 118, 524 208, 548 222 C 572 234, 586 130, 600 74", 23],
      ],
      tails: [
        ["M 600 74 C 606 60, 616 52, 630 48", 8, 0],
      ],
      splats: [[602, 66, 7, 0], [612, 88, 4, 0], [410, 86, 5, 0]],
      /* 칸 모양을 영상 내용에 맞춘다.
         시험지는 세로 문서라 세로 칸(3:4), 계획서는 가로 슬라이드라 16:9.
         가로 칸에 세로 문서를 넣으니 좌우가 검게 비었던 문제를 이렇게 푼다. */
      frame:  { x: -192, y: -6, w: 174, h: 232, rot: -2 },
      from:   { x: -420, y: 60, rot: -8 },
      frame2: { x: 146, y: -18, w: 268, h: 201, rot: 2.5 },   // 계획서는 그대로 4:3
      from2:  { x: 430, y: -80, rot: 9 },
      /* 두 번째 영상(계획서)은 2.90초뿐이다. 구간의 영상 창이 4.90초이므로
         적어도 2.00초는 늦게 시작해야 끝에서 얼어붙지 않는다. */
      clipDelay: 2.05,
      cap:   { x: 12, y: 130 },   // 왼쪽 칸이 세로로 길어져, 오른쪽 칸 아래로 뺐다
      in:    { x: 440, y: 260, rot: 32 },
      out:   { x: -430, y: -250, rot: -28 },
    },
    {
      /* ③ p — 빨강. 왼쪽. 붓은 아래에서 들어와 위로 빠진다. */
      color: "#c0442a",
      feature: { n: "03", t: "템플릿 저장", d: "템플릿 저장은 클릭 몇 번으로" },
      tilt: -6, tc: [160, 190], gs: 0.84, gy: -46,
      strokes: [
        ["M 132 88 C 104 168, 120 240, 98 296", 26],
        ["M 122 122 C 206 76, 252 150, 184 192 C 148 214, 118 192, 110 164", 20],
      ],
      tails: [
        ["M 98 296 C 92 308, 84 316, 72 320", 9, 0],
        ["M 110 164 C 108 152, 112 142, 120 136", 7, 1],
      ],
      splats: [[94, 302, 7, 0], [88, 314, 4, 0], [188, 198, 6, 1], [228, 96, 4, 1]],
      frame: { x: 140, y: -12, w: 326, h: 245, rot: 2.5 },   // 4:3 유지 (검은 여백 잘라냄)
      from:  { x: -30, y: 270, rot: -6 },
      cap:   { x: -246, y: 128 },   // 프레임 왼쪽 끝(-23)과 겹치지 않게
      in:    { x: -70, y: 320, rot: 10 },
      out:   { x: 70, y: -320, rot: -10 },
    },
    {
      /* ④ 팔레트 — 남색. 글자가 셋뿐이라 네 번째는 팔레트 자체를 그린다.
         H·w·p 다음에 팔레트가 오면서 이름(HwpPalette)이 완성되고, 곧바로
         엔딩의 아이콘으로 이어진다. 물감 방울은 아이콘의 다섯 색 그대로. */
      color: "#23366b",
      feature: { n: "04", t: "서식 마크다운", d: "작성부터 마크다운으로 편하게" },
      tilt: 4, tc: [505, 165], gs: 0.92, gy: -14,
      strokes: [
        // 콩팥꼴 바깥선 — 왼쪽 아래가 엄지 쪽으로 파인다
        ["M 424 196 C 396 150, 422 94, 482 78 C 548 60, 606 96, 610 152 C 614 208, 566 244, 508 242 C 478 241, 448 228, 434 210 C 446 200, 458 196, 466 188 C 474 178, 470 168, 458 165 C 442 161, 428 180, 424 196", 15],
      ],
      tails: [],
      // 팔레트 안의 물감 — 아이콘과 같은 다섯 색이 차례로 찍힌다
      splats: [
        [474, 132, 12, 0, "#2f6fd0"], [518, 116, 11, 0, "#7cb342"],
        [562, 140, 10, 0, "#7d5bbe"], [524, 178, 11, 0, "#c0442a"],
        [566, 190, 9, 0, "#f2a81d"],
      ],
      splatStep: 0.09,
      frame: { x: -140, y: -6, w: 326, h: 245, rot: -2.5 },  // 4:3 유지 (검은 여백 잘라냄)
      from:  { x: 400, y: 150, rot: 7 },
      cap:   { x: 100, y: 132 },
      in:    { x: 430, y: -260, rot: 26 },
      out:   { x: -420, y: 260, rot: -24 },
    },
  ];

  /* =====================================================================
     키프레임 헬퍼
     ===================================================================== */
  const anims = [];
  function track(el, stops) {
    if (!el) return null;
    const kf = stops.map(([s, p, e]) => {
      const f = { offset: Math.min(1, Math.max(0, s / SEC)) };
      Object.assign(f, p);
      if (e) f.easing = e;
      return f;
    });
    const a = el.animate(kf, { duration: DUR, iterations: 1, fill: "both" });
    anims.push(a);
    return a;
  }
  const $ = id => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const glyphSvg = $("glyphSvg");

  /* =====================================================================
     ① 획·물감 방울 요소 만들기
     ===================================================================== */
  function mkPath(d, w, color, tf, opacity) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", w);
    p.setAttribute("transform", tf);
    p.style.opacity = "0";
    if (opacity != null) p.dataset.op = opacity;   // 트랙이 쓸 최대 불투명도
    glyphSvg.appendChild(p);
    return p;
  }
  /* 글자에 걸리는 변형 — 기울이고(tilt), 중심 기준으로 줄이고(gs), 위로 올린다(gy).
     4:3 프레임이 세로를 많이 가져가면서 왼쪽 칼럼이 좁아져, 글자가 그대로면
     아래 캡션을 관통한다. */
  function glyphTf(seg) {
    const [cx, cy] = seg.tc;
    const gs = seg.gs === undefined ? 1 : seg.gs;
    return `translate(${seg.gx || 0} ${seg.gy || 0}) rotate(${seg.tilt} ${cx} ${cy}) ` +
           `translate(${cx} ${cy}) scale(${gs}) translate(${-cx} ${-cy})`;
  }

  /* glyphTf 와 똑같은 변형을 손으로 계산한다 (SVG 좌표 → SVG 좌표).
     transform 속성을 쓸 수 없는 요소(=transform 을 애니메이션하는 물감 방울)와,
     경로 위 좌표를 직접 읽어야 하는 붓이 이걸 쓴다. */
  function tfPoint(seg, x, y) {
    const [cx, cy] = seg.tc;
    const gs = seg.gs === undefined ? 1 : seg.gs;
    const dx = (x - cx) * gs, dy = (y - cy) * gs;
    const rad = (seg.tilt || 0) * Math.PI / 180;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad) + (seg.gx || 0),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad) + (seg.gy || 0),
    };
  }

  SEGS.forEach(seg => {
    const tf = glyphTf(seg);
    seg.paths = seg.strokes.map(([d, w]) => mkPath(d, w, seg.color, tf));
    /* 마른 붓 결 — 획 위에 얇은 밝은 줄이 같이 그어진다. 균일한 도형이던
       획에 붓털 자국이 생긴다. */
    seg.streaks = seg.strokes.map(([d, w]) => mkPath(d, Math.max(4, w * 0.34), "#ffffff", tf, 0.28));
    seg.tailPaths = (seg.tails || []).map(([d, w]) => mkPath(d, w, seg.color, tf));
    seg.lens = seg.paths.map(p => (p.getTotalLength ? p.getTotalLength() : 160));
    seg.tailLens = seg.tailPaths.map(p => (p.getTotalLength ? p.getTotalLength() : 30));
    /* ⚠ 방울에는 transform 속성을 걸 수 없다. 이 요소들은 transform 을
       애니메이션(scale)하는데, 애니메이션이 SVG transform 속성을 통째로 덮어써서
       글자에 건 변형이 날아간다 — 방울만 제자리에 남아 캡션 위에 떨어졌다.
       그래서 변형을 좌표에 미리 구워 넣는다. */
    const gs = seg.gs === undefined ? 1 : seg.gs;
    seg.dots = seg.splats.map(([x, y, r, si, color]) => {
      const q = tfPoint(seg, x, y);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", q.x); c.setAttribute("cy", q.y);
      c.setAttribute("r", r * gs);
      c.setAttribute("fill", color || seg.color);   // 팔레트 구간은 방울마다 색이 다르다
      glyphSvg.appendChild(c);
      return c;
    });
  });

  /* 획 위의 점을 무대 좌표로.
     ⚠ getPointAtLength 는 **변형 전** 좌표를 준다. 획에 걸어 둔 변형(glyphTf)을
     여기서 똑같이 손으로 계산해 줘야 붓이 실제로 그려지는 획 위를 지난다.
     안 맞추면 붓만 엉뚱한 데를 훑는다. */
  function pointAt(seg, path, len, ratio) {
    if (!path.getPointAtLength) return { x: 0, y: 0 };
    const pt = path.getPointAtLength(len * Math.min(1, Math.max(0, ratio)));
    const q = tfPoint(seg, pt.x, pt.y);
    return { x: SX(q.x), y: SY(q.y) };
  }
  /* 휘갈김의 리듬 — 획의 앞 70% 를 빠르게, 끝을 무겁게 */
  const flick = u => 1 - Math.pow(1 - u, 2.2);

  /* =====================================================================
     ② 구간 3개의 키프레임
     ===================================================================== */
  const bStops = [], fStops = [], cStops = [];
  const DRAW0 = 0.14, DRAW1 = 0.98, SAMPLES = 8;

  SEGS.forEach((seg, i) => {
    const t = T0(i), cout = COUT(i);
    const bAt = (x, y, rot, sc) => `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc || 1.5})`;

    /* --- 붓 --- */
    bStops.push([t, { opacity: 0, transform: bAt(seg.in.x, seg.in.y, seg.in.rot) }, LIN]);
    bStops.push([t + 0.04, { opacity: 1, transform: bAt(seg.in.x, seg.in.y, seg.in.rot) }, SNAP]);

    const nS = seg.paths.length;
    const span = (DRAW1 - DRAW0) / nS;
    const gap = Math.min(0.10, span * 0.16);

    seg.paths.forEach((p, k) => {
      const s0 = t + DRAW0 + span * k;
      const s1 = s0 + span - (k < nS - 1 ? gap : 0);
      const len = seg.lens[k];

      // 붓이 획을 따라간다 — 시간은 균일, 위치는 flick 곡선 (앞이 빠르다)
      for (let j = 0; j <= SAMPLES; j++) {
        const u = j / SAMPLES;
        const pt = pointAt(seg, p, len, flick(u));
        const rot = seg.in.rot * (1 - u) * 0.12 + (k % 2 ? 6 : -6) * Math.sin(u * Math.PI);
        bStops.push([s0 + (s1 - s0) * u, { opacity: 1, transform: bAt(pt.x, pt.y, rot) }, LIN]);
      }
      if (k < nS - 1) {
        // 다음 획으로 — 붓을 살짝 들어 크게 보인다
        const end = pointAt(seg, p, len, 1);
        const nxt = pointAt(seg, seg.paths[k + 1], seg.lens[k + 1], 0);
        bStops.push([s1 + gap * 0.5, { opacity: 1, transform: bAt((end.x + nxt.x) / 2, (end.y + nxt.y) / 2 - 28, 0, 1.64) }, LIN]);
      }

      /* 획 자체 — flick 이징으로 확 그어진다. 결(streak)도 같은 박자로. */
      /* dim: 다 그린 뒤 물러나 바탕이 되는 정도. 영상이 두 편 들어오는 구간은
         글자가 화면을 다 차지할 수 없어, 크게 그린 뒤 옅게 깔린다. */
      const dim = seg.dim === undefined ? 1 : seg.dim;
      const drawTrack = (el, maxOp) => {
        el.style.strokeDasharray = len;
        const stops = [
          [t,  { strokeDashoffset: len, opacity: 0 }, LIN],
          [s0, { strokeDashoffset: len, opacity: maxOp }, FLICK],
          [s1, { strokeDashoffset: 0,   opacity: maxOp }, LIN],
        ];
        if (dim < 1) {
          stops.push([t + DRAW1 + 0.34, { strokeDashoffset: 0, opacity: maxOp * dim }, LIN]);
        }
        stops.push(
          [cout - 0.16, { strokeDashoffset: 0,   opacity: maxOp * dim }, WHIP],
          [cout - 0.02, { strokeDashoffset: 0,   opacity: 0 }, LIN],
          [cout - 0.01, { strokeDashoffset: len, opacity: 0 }, LIN],
          [SEC,         { strokeDashoffset: len, opacity: 0 }]
        );
        track(el, stops);
      };
      drawTrack(p, 1);
      drawTrack(seg.streaks[k], Number(seg.streaks[k].dataset.op));

      /* 이 획에 붙은 삐침 — 획이 끝나는 순간 채듯 그어진다 */
      (seg.tails || []).forEach(([d, w, si], m) => {
        if (si !== k) return;
        const tp = seg.tailPaths[m], tlen = seg.tailLens[m];
        tp.style.strokeDasharray = tlen;
        track(tp, [
          [s1 - 0.01,   { strokeDashoffset: tlen, opacity: 0 }, LIN],
          [s1,          { strokeDashoffset: tlen, opacity: 1 }, FLICK],
          [s1 + 0.09,   { strokeDashoffset: 0,   opacity: 1 }, LIN],
          [cout - 0.16, { strokeDashoffset: 0,   opacity: 1 }, WHIP],
          [cout - 0.02, { strokeDashoffset: 0,   opacity: 0 }, LIN],
          [cout - 0.01, { strokeDashoffset: tlen, opacity: 0 }, LIN],
          [SEC,         { strokeDashoffset: tlen, opacity: 0 }],
        ]);
      });

      /* 이 획이 끝나는 순간 물감이 튄다 */
      // 방울은 하나씩 차례로 튄다. 팔레트 구간(물감 다섯 개)은 간격을 더 준다.
      const step = seg.splatStep || 0.03;
      seg.splats.forEach(([x, y, r, si], m) => {
        if (si !== k) return;
        const d0 = s1 + step * m;
        const stops = [
          [s1 - 0.02, { opacity: 0, transform: "scale(0)" }, SNAP],
          [d0 + 0.07, { opacity: 0.9, transform: "scale(1.3)" }, SNAP],
          [d0 + 0.18, { opacity: 0.85, transform: "scale(1)" }, LIN],
        ];
        if (dim < 1) {
          stops.push([t + DRAW1 + 0.34, { opacity: 0.85 * dim, transform: "scale(1)" }, LIN]);
        }
        stops.push(
          [cout - 0.16, { opacity: 0.85 * dim, transform: "scale(1)" }, WHIP],
          [cout - 0.02, { opacity: 0, transform: "scale(1)" }, LIN],
          [SEC,         { opacity: 0, transform: "scale(0)" }]
        );
        track(seg.dots[m], stops);
      });
    });

    bStops.push([t + DRAW1 + 0.24, { opacity: 0, transform: bAt(seg.out.x, seg.out.y, seg.out.rot) }, LIN]);
    bStops.push([cout - 0.01, { opacity: 0, transform: bAt(seg.out.x, seg.out.y, seg.out.rot) }, LIN]);

    /* --- 영상 프레임: 붓이 들어온 쪽에서 뒤따라 끌려온다 --- */
    const F = seg.frame, FR = seg.from;
    /* ⚠ 칸 모양은 transform 의 가로·세로 배율로 만들면 안 된다.
       object-fit(cover) 은 **눌리기 전** 상자를 기준으로 계산하므로, 16:9 상자를
       세로로 눌러 만든 세로 칸에서는 잘라내기가 일어나지 않는다 — 영상이 그대로
       세로로 늘어나고 좌우 여백도 그대로 남는다(시험지 칸이 검게 비던 원인).
       그래서 칸의 실제 width/height 를 구간마다 바꾼다. transform 은 위치·기울기와
       들어올 때의 '균일' 확대만 맡는다. */
    const box = { width: F.w + "px", height: F.h + "px",
                  marginTop: -F.h / 2 + "px", marginLeft: -F.w / 2 + "px" };
    const fAt = (x, y, sc, rot) => `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
    fStops.push(
      [t + 0.36, { opacity: 0, ...box, transform: fAt(FR.x, FR.y, 0.52, FR.rot) }, LIN],
      [t + 0.52, { opacity: 1, ...box, transform: fAt(FR.x * 0.72, FR.y * 0.72, 0.62, FR.rot) }, LIN],
      [t + 0.95, { opacity: 1, ...box, transform: fAt(F.x * 0.55 + FR.x * 0.2, F.y * 0.55 + FR.y * 0.2, 0.85, FR.rot * 0.4 + F.rot * 0.6) }, SNAP],
      [t + 1.45, { opacity: 1, ...box, transform: fAt(F.x, F.y, 1, F.rot) }, LIN],
      [cout - 0.16, { opacity: 1, ...box, transform: fAt(F.x, F.y, 1, F.rot) }, WHIP],
      [cout - 0.02, { opacity: 0, ...box, transform: fAt(F.x + (F.x > 0 ? 50 : -50), F.y, 0.97, F.rot) }, LIN],
    );

    /* --- 캡션 --- */
    const C = seg.cap;
    const cAt = dy => `translateY(-50%) translate(${C.x}px, ${C.y + dy}px)`;
    cStops.push(
      [t + 1.50, { opacity: 0, transform: cAt(10) }, SNAP],
      [t + 1.88, { opacity: 1, transform: cAt(0) }, LIN],
      [cout - 0.16, { opacity: 1, transform: cAt(0) }, WHIP],
      [cout - 0.02, { opacity: 0, transform: cAt(-6) }, LIN],
    );
  });

  /* =====================================================================
     ③ 엔딩 준비 — 공통 재료
     ===================================================================== */
  const LT = "translate(-50%,-50%) ";
  const LOGO_X = -117, LOGO_K = 0.48, TXT_X = -49;
  const ST = [
    { el: $("st0"), id: "lg-h", x: -45.8, y: -28.3, c: SEGS[0].color, from: { x: -350, y: -60 } },
    { el: $("st1"), id: "lg-w", x:   2.6, y: -40.1, c: SEGS[1].color, from: { x: 350, y: -30 } },
    { el: $("st2"), id: "lg-p", x: -12.9, y:  20.6, c: SEGS[2].color, from: { x: -20, y: 300 } },
  ];
  ST.forEach(S => { S.el.style.color = S.c; });

  /* wipe 시안의 삼색 스윕은 붓 트랙과 획 요소가 지금(동기) 필요하다 */
  const wipeStrokes = [];
  if (VARIANT === "wipe") {
    const defs = [
      ["M -60 150 C 200 132, 460 144, 720 136", SEGS[0].color],
      ["M 720 190 C 460 176, 200 188, -60 180", SEGS[1].color],
      ["M -60 228 C 200 212, 460 224, 720 216", SEGS[2].color],
    ];
    defs.forEach(([d, color]) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke", color);
      p.setAttribute("stroke-width", 74);
      p.style.opacity = "0";
      glyphSvg.appendChild(p);
      wipeStrokes.push(p);
    });
    // 붓이 세 번 왕복하며 쓸어낸다
    const bAt = (x, y, rot) => `translate(${x}px, ${y}px) rotate(${rot}deg) scale(1.6)`;
    bStops.push(
      [E0, { opacity: 0, transform: bAt(-430, -60, -30) }, LIN],
      [E0 + 0.10, { opacity: 1, transform: bAt(-380, -42, -24) }, LIN],
      [E0 + 0.42, { opacity: 1, transform: bAt(392, -50, 10) }, LIN],
      [E0 + 0.50, { opacity: 1, transform: bAt(392, 2, 14) }, LIN],
      [E0 + 0.80, { opacity: 1, transform: bAt(-392, -4, -14) }, LIN],
      [E0 + 0.88, { opacity: 1, transform: bAt(-392, 38, -10) }, LIN],
      [E0 + 1.16, { opacity: 1, transform: bAt(392, 32, 12) }, LIN],
      [E0 + 1.34, { opacity: 0, transform: bAt(470, 60, 26) }, LIN],
      [SEC, { opacity: 0, transform: bAt(470, 60, 26) }],
    );
    wipeStrokes.forEach((p, k) => {
      const len = p.getTotalLength ? p.getTotalLength() : 800;
      p.style.strokeDasharray = len;
      // 두 번째 스윕은 오른쪽→왼쪽이므로 dash 방향이 자연히 맞는다 (경로를 역으로 정의)
      const s0 = E0 + 0.12 + k * 0.37, s1 = s0 + 0.30;
      track(p, [
        [s0, { strokeDashoffset: len, opacity: 1 }, FLICK],
        [s1, { strokeDashoffset: 0, opacity: 1 }, LIN],
        [E0 + 1.30, { strokeDashoffset: 0, opacity: 1 }, SNAP],
        [E0 + 1.66, { strokeDashoffset: 0, opacity: 0 }, LIN],
        [SEC, { strokeDashoffset: 0, opacity: 0 }],
      ]);
    });
  } else {
    bStops.push([E0, { opacity: 0 }, LIN], [SEC, { opacity: 0 }]);
  }
  fStops.push([E0, { opacity: 0 }, LIN], [SEC, { opacity: 0 }]);
  cStops.push([E0, { opacity: 0 }, LIN], [SEC, { opacity: 0 }]);

  /* 두 번째 프레임 — 영상이 두 편인 구간에만 나온다.
     첫 영상보다 clipDelay 만큼 늦게 들어와, 첫 영상과 **같은 순간에** 끝난다. */
  const TWO_I = SEGS.findIndex(s => s.frame2);
  if (TWO_I >= 0) {
    const s2 = SEGS[TWO_I], t2 = T0(TWO_I), cout2 = COUT(TWO_I);
    const F2 = s2.frame2, FR2 = s2.from2;
    const d2 = DRAWP + (s2.clipDelay || 1.0);      // 두 번째 영상이 도는 시각
    // 이 칸은 한 구간에서만 쓰므로 크기를 한 번만 정해 주면 된다 (위 ⚠ 참고)
    Object.assign($("frame2").style, {
      width: F2.w + "px", height: F2.h + "px",
      marginTop: -F2.h / 2 + "px", marginLeft: -F2.w / 2 + "px",
    });
    const at2 = (x, y, sc, rot) =>
      `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
    track($("frame2"), [
      [0,              { opacity: 0, transform: at2(FR2.x, FR2.y, 0.52, FR2.rot) }],
      [t2 + d2 - 0.42, { opacity: 0, transform: at2(FR2.x, FR2.y, 0.52, FR2.rot) }, LIN],
      [t2 + d2 - 0.26, { opacity: 1, transform: at2(FR2.x * 0.68, FR2.y * 0.68, 0.66, FR2.rot) }, SNAP],
      [t2 + d2,        { opacity: 1, transform: at2(F2.x, F2.y, 1, F2.rot) }, LIN],
      [cout2 - 0.16,   { opacity: 1, transform: at2(F2.x, F2.y, 1, F2.rot) }, WHIP],
      [cout2 - 0.02,   { opacity: 0, transform: at2(F2.x + 50, F2.y, 0.97, F2.rot) }, LIN],
      [SEC,            { opacity: 0, transform: at2(F2.x + 50, F2.y, 0.97, F2.rot) }],
    ]);
  }

  track($("brush"), bStops);
  track($("frame"), fStops);
  track($("cap"), cStops);

  /* 캡션 글자와 붓 털 색 — 시각에 따라 갈아 끼운다 */
  const capN = document.querySelector("#cap .n");
  const capT = document.querySelector("#cap .t");
  const capD = document.querySelector("#cap .d");
  const brushTip = $("brushTip");
  let segIdx = -1;
  function syncSeg(s) {
    let i = segAt(s);
    if (s >= E0) i = N - 1;
    if (i === segIdx) return;
    segIdx = i;
    const seg = SEGS[i], f = seg.feature;
    capN.textContent = f.n; capT.textContent = f.t; capD.textContent = f.d;
    capN.style.color = seg.color;
    if (brushTip) brushTip.setAttribute("fill", VARIANT === "wipe" && s >= E0 ? "#c0442a" : seg.color);
  }
  syncSeg(0);

  /* =====================================================================
     ④ 엔딩 시안들 — 로고 SVG 가 심긴 뒤에 불린다
     ===================================================================== */
  /* 공통: 팔레트 안 글자를 켠다 */
  function lightLetter(k, at, dur) {
    const real = document.getElementById(ST[k].id);
    if (!real) return;
    track(real, [
      [0, { opacity: 0 }, LIN],
      [at, { opacity: 0 }, LIN],
      [at + (dur || 0.12), { opacity: 1 }, LIN],
      [SEC, { opacity: 1 }],
    ]);
  }
  /* 공통: 로고 축소 + 이름 + 슬로건 락업 */
  function lockup(tShrink, logoPre) {
    track($("logo"), [
      ...logoPre,
      [tShrink,        { opacity: 1, transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
      [tShrink + 0.62, { opacity: 1, transform: `translateX(${LOGO_X}px) scale(${LOGO_K})` }, LIN],
      [SEC,            { opacity: 1, transform: `translateX(${LOGO_X}px) scale(${LOGO_K})` }],
    ]);
    const tN = tShrink + 0.40, tS = tShrink + 0.72;
    track($("name"), [
      [tN - 0.001, { opacity: 0, transform: `translateY(-50%) translate(${TXT_X + 16}px, -18px)` }, SNAP],
      [tN + 0.34,  { opacity: 1, transform: `translateY(-50%) translate(${TXT_X}px, -18px)` }, LIN],
      [SEC,        { opacity: 1, transform: `translateY(-50%) translate(${TXT_X}px, -18px)` }],
    ]);
    track($("slogan"), [
      [tS - 0.001, { opacity: 0, transform: `translateY(-50%) translate(${TXT_X + 14}px, 26px)` }, SNAP],
      [tS + 0.32,  { opacity: 1, transform: `translateY(-50%) translate(${TXT_X}px, 26px)` }, LIN],
      [SEC,        { opacity: 1, transform: `translateY(-50%) translate(${TXT_X}px, 26px)` }],
    ]);
  }
  const logoIn = tIn => [
    [tIn - 0.001, { opacity: 0, transform: "translateX(0px) scale(0.72) rotate(-6deg)" }, SNAP],
    [tIn + 0.34,  { opacity: 1, transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
  ];

  const ENDINGS = {
    /* ------------------------------------------------------------------
       A. 도장찍기 (사용자 제안)

       글자가 하나도 없는 빈 팔레트가 놓여 있다 → 옆에서 종이가 미끄러져 들어와
       팔레트에 포개진다 → 한두 번 비빈다 → 떼어 보면 종이에 HwpPalette 가 찍혀
       있고, 팔레트에는 h·w·p 가 물감 자리에 남아 아이콘이 된다.
       종이는 그대로 오른쪽으로 옮겨 앉아 제목이 되고, 종이면만 사라진다.

       ⚠ 이 시안은 색 글자(ST)가 날아와 합쳐지지 않는다. 잉크는 팔레트의 물감이고
         찍히는 대상은 종이다 — 그래서 #name 도 쓰지 않는다(종이에 찍힌 글자가 제목).
       ------------------------------------------------------------------ */
    press() {
      const paper = $("paper"), sheet = $("sheet"), mark = $("paperMark");
      // 급해 보이지 않게 전체를 늘렸다 (엔딩만 6.2초)
      const LAY    = E0 + 1.20;   // 종이가 팔레트에 포개진다
      const RUB0   = E0 + 1.35;   // 비비기 시작
      const RUB1   = E0 + 2.10;   // 비비기 끝 (두 번 왕복)
      const PEEL   = E0 + 2.65;   // 떼기 시작
      const FLIP0  = E0 + 3.05;   // 홱 뒤집기 시작
      const FLIP1  = E0 + 3.50;   // 뒤집기 끝 — 찍힌 면이 보인다
      const PRINT  = FLIP0;       // 돌아가는 동안 잉크가 배어 나온다
      const GROW   = E0 + 4.05;   // 팔레트가 **살짝 커지면서 아래로** 내려앉는다
      const SETTLE = E0 + 4.05;   // 뒤집힌 종이가 팔레트 옆에 깔린다
      const SLOG_T = E0 + 4.95;   // 종이면이 다 걷힌 뒤에 나온다 (겹쳐 보이지 않게)

      /* 최종 배치 — 아이콘 왼쪽, 두 줄 워드마크 오른쪽, 슬로건은 그 아래.
         팔레트는 작아지지 않는다. 찍고 난 뒤 살짝 커지며(1.06) 내려온다. */
      const LOGO_END = "translate(-165px, 6px) scale(1.06)";
      const MARK_X = 107, MARK_Y = -18;  // 찍힌 글자(종이)의 최종 중심
      // 슬로건은 아이콘이 아니라 **영어 글자 아래**, 그 왼쪽선에 맞춘다.
      // 워드마크 블록 폭이 254 이므로 왼쪽 끝 = MARK_X - 127.
      const SLOG_X = MARK_X - 127, SLOG_Y = 88;

      /* 팔레트 — 빈 채로 들어와, 눌리고, 비빌 때 흔들리고,
         마지막에 **살짝 커지면서 아래로** 내려앉는다 (작아지지 않는다). */
      track($("logo"), [
        ...logoIn(E0 + 0.15),
        [LAY,        { opacity: 1, transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
        [LAY + 0.10, { opacity: 1, transform: "translateX(0px) scale(0.97) rotate(0deg)" }, SNAP],
        [LAY + 0.26, { opacity: 1, transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
        // 비비는 손길에 팔레트도 미세하게 딸려 움직인다
        [RUB0 + 0.20, { transform: "translateX(0px) scale(1) rotate(-0.9deg)" }, SNAP],
        [RUB0 + 0.45, { transform: "translateX(0px) scale(1) rotate(0.9deg)" }, SNAP],
        [RUB1,        { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
        [GROW,        { opacity: 1, transform: "translate(0px, 0px) scale(1)" }, SNAP],
        [GROW + 0.80, { opacity: 1, transform: LOGO_END }, LIN],
        [SEC,         { opacity: 1, transform: LOGO_END }],
      ]);

      /* 종이 — 옆에서 들어와 포개지고, 비비고, 떼어 홱 뒤집어 옆에 깐다.
         rotY 가 뒤집기다. 0 = 빈 앞면, 180 = 찍힌 뒷면. */
      const pAt = (x, y, rot, sx, rotY, sy) =>
        `translate(${x}px, ${y}px) rotate(${rot}deg) rotateY(${rotY || 0}deg) ` +
        `scale(${sx}, ${sy === undefined ? sx : sy})`;
      // ⚠ opacity 를 쓰지 않는다 (위 CSS 주석 참고). 무대 밖(520)에서 들어온다.
      track(paper, [
        [0,          { transform: pAt(560, -46, 15, 1) }],
        [E0 + 0.55,  { transform: pAt(560, -46, 15, 1) }, SNAP],
        [E0 + 0.90,  { transform: pAt(210, -30, 11, 1) }, SNAP],   // LAY-0.14 보다 앞이어야 한다
        [LAY - 0.14, { transform: pAt(56, -10, 4, 1) }, LIN],
        [LAY,        { transform: pAt(0, 0, 0, 1, 0, 0.97) }, SNAP],  // 착지 — 살짝 눌린다
        [LAY + 0.12, { transform: pAt(0, 0, 0, 1, 0, 1) }, SNAP],
        // 비비기 두 번 (좌 → 우 → 좌 → 제자리) — 천천히
        [RUB0 + 0.20, { transform: pAt(-16, 1, -1.3, 1) }, SNAP],
        [RUB0 + 0.42, { transform: pAt(15, -1, 1.3, 1) }, SNAP],
        [RUB0 + 0.60, { transform: pAt(-11, 1, -0.9, 1) }, SNAP],
        [RUB1,        { transform: pAt(0, 0, 0, 1) }, SNAP],
        // 떼기 — 한쪽부터 들리듯 기울며 떠오른다 (아직 빈 앞면이 보인다)
        [PEEL,        { transform: pAt(0, 0, 0, 1) }, SNAP],
        [PEEL + 0.20, { transform: pAt(26, -32, -4, 1.05) }, SNAP],
        [FLIP0,       { transform: pAt(52, -42, 2, 1.06, 0) }, WHIP],
        // 홱 — 공중에서 한 바퀴 돌려 찍힌 면을 보인다
        [FLIP0 + 0.24, { transform: pAt(78, -48, 0, 1.06, 90) }, LIN],
        [FLIP1,        { transform: pAt(98, -40, -2, 1.04, 180) }, SNAP],
        // 팔레트 옆에 깐다
        [SETTLE,      { transform: pAt(MARK_X, MARK_Y, 0, 1, 180) }, SNAP],
        [SEC,         { transform: pAt(MARK_X, MARK_Y, 0, 1, 180) }],
      ]);

      /* 뒷면의 종이면 — 옆에 깔린 뒤 이것만 사라진다. 찍힌 글자는 남아 제목이 된다.
         (앞면은 뒤집힌 뒤 backface-visibility 로 알아서 안 보인다) */
      track(sheet, [
        [0,             { opacity: 1 }],
        [SETTLE + 0.30, { opacity: 1 }, SNAP],
        [SETTLE + 0.80, { opacity: 0 }, LIN],
        [SEC,           { opacity: 0 }],
      ]);

      /* 찍힌 글자 — 뒤집히는 동안 잉크가 배어 나온다 */
      track(mark, [
        [0,             { opacity: 0 }],
        [PRINT - 0.001, { opacity: 0 }, SNAP],
        [PRINT + 0.30,  { opacity: 1 }, LIN],
        [SEC,           { opacity: 1 }],
      ]);

      /* 팔레트 안 글자 — 종이를 떼면 물감 자리에 남아 있다 */
      ST.forEach((S, k) => lightLetter(k, PEEL + 0.02 + k * 0.06));

      /* 슬로건 — 아이콘 왼쪽선에 맞춰 아래에 깔린다 */
      const sAt = dx => `translateY(-50%) translate(${SLOG_X + dx}px, ${SLOG_Y}px)`;
      track($("slogan"), [
        [SLOG_T - 0.001, { opacity: 0, transform: sAt(14) }, SNAP],
        [SLOG_T + 0.35,  { opacity: 1, transform: sAt(0) }, LIN],
        [SEC,            { opacity: 1, transform: sAt(0) }],
      ]);

      /* 종이가 닿는 순간 — 아주 옅게 */
      track($("flash"), [
        [0, { opacity: 0 }],
        [LAY - 0.001, { opacity: 0, background: "#0071e3" }, WHIP],
        [LAY + 0.06,  { opacity: 0.09, background: "#0071e3" }, SNAP],
        [LAY + 0.34,  { opacity: 0, background: "#0071e3" }, LIN],
        [SEC, { opacity: 0 }],
      ]);
    },

    /* ------------------------------------------------------------------
       B. 페인트 스윕 — 붓이 삼색으로 화면을 쓸고, 걷히면 아이콘이 서 있다
       (스윕 획과 붓 동작은 위에서 이미 걸었다)
       ------------------------------------------------------------------ */
    wipe() {
      ST.forEach((S, k) => lightLetter(k, E0 + 1.42 + k * 0.08));
      lockup(E0 + 2.05, [
        ...logoIn(E0 + 1.24),
        [E0 + 1.62, { transform: "translateX(0px) scale(1.04) rotate(0deg)" }, SNAP],
        [E0 + 1.85, { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
      ]);
      ST.forEach(S => { S.el.style.opacity = "0"; });   // 이 시안엔 날아오는 글자가 없다
      track($("flash"), [
        [0, { opacity: 0 }],
        [E0 + 1.24, { opacity: 0, background: "#ffffff" }, SNAP],
        [E0 + 1.34, { opacity: 0.22, background: "#ffffff" }, SNAP],
        [E0 + 1.62, { opacity: 0, background: "#ffffff" }, LIN],
        [SEC, { opacity: 0 }],
      ]);
    },

    /* ------------------------------------------------------------------
       C. 물감 방울 — 글자가 물감 방울로 녹아, 포물선을 그리며 제 자리로
       떨어진다. 떨어질 때마다 팔레트가 출렁이고 글자가 켜진다.
       ------------------------------------------------------------------ */
    drop() {
      const dots = ST.map(S => {
        const d = document.createElement("div");
        d.className = "hp-c";
        d.style.cssText = `width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:${S.c};opacity:0;will-change:transform`;
        STAGE.appendChild(d);
        return d;
      });
      const HX = [-150, 0, 150], HY = -128;
      const logoPre = [...logoIn(E0 + 0.10)];

      ST.forEach((S, k) => {
        const melt = E0 + 0.78 + k * 0.34;   // 글자가 방울로 녹는 순간
        const land = melt + 0.34;            // 방울이 팔레트에 닿는 순간
        const at = (x, y, sc, rot) => LT + `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
        track(S.el, [
          [E0 + 0.06 + k * 0.09, { opacity: 0, transform: at(S.from.x, S.from.y, 2.3, -12) }, SNAP],
          [E0 + 0.44 + k * 0.09, { opacity: 1, transform: at(HX[k], HY, 1.8, 0) }, LIN],
          [melt - 0.10, { opacity: 1, transform: at(HX[k], HY, 1.8, 0) }, WHIP],
          // 글자가 아래로 흘러내리며 방울이 된다
          [melt, { opacity: 0, transform: at(HX[k], HY + 26, 0.5, 8) }, LIN],
          [SEC, { opacity: 0, transform: at(HX[k], HY + 26, 0.5, 8) }],
        ]);
        // 방울 — 포물선 (중간 키프레임을 위로 잡는다)
        track(dots[k], [
          [melt - 0.02, { opacity: 0, transform: `translate(${HX[k]}px, ${HY + 20}px) scale(0.6)` }, LIN],
          [melt, { opacity: 1, transform: `translate(${HX[k]}px, ${HY + 24}px) scale(1)` }, LIN],
          [melt + 0.17, { opacity: 1, transform: `translate(${(HX[k] + S.x) / 2}px, ${HY - 26}px) scale(1.1)` }, LIN],
          [land, { opacity: 1, transform: `translate(${S.x}px, ${S.y}px) scale(0.9)` }, SNAP],
          [land + 0.10, { opacity: 0, transform: `translate(${S.x}px, ${S.y}px) scale(1.8)` }, LIN],
          [SEC, { opacity: 0, transform: `translate(${S.x}px, ${S.y}px) scale(1.8)` }],
        ]);
        lightLetter(k, land + 0.02);
        // 팔레트 출렁 — 착지마다
        logoPre.push(
          [land, { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
          [land + 0.09, { transform: `translateX(0px) scale(1.045) rotate(${k % 2 ? -1.4 : 1.4}deg)` }, SNAP],
          [land + 0.26, { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
        );
      });
      lockup(E0 + 2.42, logoPre);
    },

    /* ------------------------------------------------------------------
       D. 궤도 안착 — 글자들이 팔레트 둘레를 한 바퀴 돌다 하나씩 빨려든다
       ------------------------------------------------------------------ */
    orbit() {
      const R = 122, TURN0 = E0 + 0.46, TURN1 = E0 + 1.36, STEPS = 9;
      const PHASE = [-90, 30, 150];
      const logoPre = [...logoIn(E0 + 0.10)];

      ST.forEach((S, k) => {
        const at = (x, y, sc, rot) => LT + `translate(${x}px, ${y}px) scale(${sc}) rotate(${rot}deg)`;
        const stops = [
          [E0 + 0.06 + k * 0.07, { opacity: 0, transform: at(S.from.x, S.from.y, 2.2, -12) }, SNAP],
        ];
        // 궤도 진입점
        const a0 = (PHASE[k] * Math.PI) / 180;
        stops.push([TURN0, { opacity: 1, transform: at(Math.cos(a0) * R, Math.sin(a0) * R * 0.82, 1.5, 0) }, LIN]);
        // 한 바퀴 (타원 궤도 — 무대가 가로로 넓다)
        for (let j = 1; j <= STEPS; j++) {
          const u = j / STEPS;
          const a = a0 + u * Math.PI * 2;
          stops.push([TURN0 + (TURN1 - TURN0) * u,
            { opacity: 1, transform: at(Math.cos(a) * R, Math.sin(a) * R * 0.82, 1.5, u * 360 * 0.2) }, LIN]);
        }
        // 하나씩 제 물감 자리로 빨려든다
        const dock = TURN1 + 0.14 + k * 0.22;
        stops.push([dock - 0.02, { opacity: 1, color: S.c, transform: at(Math.cos(a0) * R, Math.sin(a0) * R * 0.82, 1.5, 72) }, WHIP]);
        // 같은 색 물감 위라 색을 유지하면 안 보인다 — 닿으며 흰색이 된다
        stops.push([dock + 0.14, { opacity: 1, color: "#ffffff", transform: at(S.x, S.y, 0.96, 0) }, SNAP]);
        stops.push([dock + 0.30, { opacity: 0, transform: at(S.x, S.y, 1, 0) }, LIN]);
        stops.push([SEC, { opacity: 0, transform: at(S.x, S.y, 1, 0) }]);
        track(S.el, stops);
        lightLetter(k, dock + 0.16);
        // 펄스는 안착 간격(0.22)보다 짧아야 한다 — 겹치면 오프셋 역전으로 죽는다
        logoPre.push(
          [dock + 0.06, { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
          [dock + 0.13, { transform: `translateX(0px) scale(${1.03 + k * 0.01}) rotate(0deg)` }, SNAP],
          [dock + 0.20, { transform: "translateX(0px) scale(1) rotate(0deg)" }, SNAP],
        );
      });
      lockup(E0 + 2.55, logoPre);
    },
  };

  /* =====================================================================
     ⑤ 영상 클립
     ===================================================================== */
  /* 클립마다 '언제부터 언제까지 도는가'를 명시한다.
     02 구간의 두 번째 영상은 같은 구간 안에서 늦게 시작해 같이 끝나므로,
     색인만으로는 시간 창을 정할 수 없다. */
  const SHOTS = [];
  [...document.querySelectorAll("#frame .hp-clip")].forEach((el, i) => {
    SHOTS.push({ el, v: el.querySelector("video"), a: PLAY(i), b: COUT(i) });
  });
  if (TWO_I >= 0) {
    const dd = DRAWP + (SEGS[TWO_I].clipDelay || 1.0);
    [...document.querySelectorAll("#frame2 .hp-clip")].forEach(el => {
      SHOTS.push({ el, v: el.querySelector("video"), a: T0(TWO_I) + dd, b: COUT(TWO_I) });
    });
  }
  SHOTS.forEach(({ el, a, b }) => {
    track(el, [
      [0, { opacity: 0 }],
      [a - 0.02, { opacity: 0 }, LIN],
      [a, { opacity: 1 }, LIN],
      [b, { opacity: 1 }, LIN],
      [b + 0.02, { opacity: 0 }],
      [SEC, { opacity: 0 }],
    ]);
  });

  const VIDS = SHOTS.map(s => s.v);
  VIDS.forEach(v => {
    v.style.opacity = "0";
    v.addEventListener("loadeddata", () => { v.style.opacity = "1"; }, { once: true });
    v.addEventListener("error", () => { v.style.opacity = "0"; }, { once: true });
    if (v.dataset.src) v.src = v.dataset.src;
  });

  function seekVideos(s) {
    return Promise.all(SHOTS.map(({ v, a, b }) => {
      if (!(v.duration > 0)) return Promise.resolve();
      if (s < a - 0.1 || s > b + 0.1) { if (!v.paused) v.pause(); return Promise.resolve(); }
      const want = Math.min(Math.max(0, s - a), v.duration - 0.03);
      if (Math.abs(v.currentTime - want) < 0.008) return Promise.resolve();
      return new Promise(res => {
        let done = false;
        const ok = () => { if (!done) { done = true; res(); } };
        v.addEventListener("seeked", ok, { once: true });
        v.currentTime = want;
        setTimeout(ok, 400);
      });
    }));
  }
  /* 렌더러가 프레임마다 부른다 — 렌더링 중에는 재생 루프가 돌지 않는다 */
  window.__hpseek = function (s) { syncSeg(s); return seekVideos(s); };

  /* =====================================================================
     ⑥ 재생 루프 + 미리보기 조작
     ===================================================================== */
  const CLEAN = QS.has("clean");
  if (CLEAN) document.body.classList.add("clean");

  // 시안 버튼 — 현재 시안 표시
  const vars = $("vars");
  if (vars) [...vars.querySelectorAll("a")].forEach(a => {
    if (a.getAttribute("href") === "?ending=" + VARIANT) a.classList.add("on");
  });

  const now = () => (anims.length ? Number(anims[0].currentTime || 0) : 0);
  const seekAll = ms => anims.forEach(a => { try { a.currentTime = ms; } catch (e) {} });

  /* 배경음악 (미리보기 전용 — 최종 mp4 에는 렌더러가 --audio 로 입힌다).
     브라우저가 소리 있는 자동재생을 막으므로, 처음엔 조용히 실패하고
     사용자가 재생/스크럽을 만지는 순간부터 들린다. */
  const bgm = CLEAN ? null : new Audio("out/hwp-music.wav");
  if (bgm) { bgm.preload = "auto"; bgm.volume = 0.85; }
  function syncBgm(s, wantPlay) {
    if (!bgm || !bgm.duration) return;
    if (Math.abs(bgm.currentTime - s) > 0.12) bgm.currentTime = Math.min(s, bgm.duration - 0.05);
    if (wantPlay && bgm.paused) bgm.play().catch(() => {});
    if (!wantPlay && !bgm.paused) bgm.pause();
  }

  const btnPlay = $("btnPlay"), btnBack = $("btnBack"), scrub = $("scrub"), tRead = $("tRead");
  let playing = true;

  function tick() {
    const ms = now(), s = ms / 1000;
    syncSeg(s);
    syncBgm(s, playing);
    if (playing) {
      if (ms >= DUR - 16) { seekAll(0); if (bgm) bgm.currentTime = 0; }
      VIDS.forEach((v, i) => {
        const { a, b } = SHOTS[i];
        const live = s >= a && s < b;
        if (live && v.paused && v.duration > 0) { v.currentTime = Math.min(s - a, v.duration - 0.03); v.play().catch(() => {}); }
        if (!live && !v.paused) v.pause();
      });
    }
    if (scrub && document.activeElement !== scrub) scrub.value = String(Math.round((ms / DUR) * 1000));
    if (tRead) tRead.textContent = `${s.toFixed(2)} / ${SEC.toFixed(2)}`;
    requestAnimationFrame(tick);
  }

  if (btnPlay) btnPlay.addEventListener("click", () => {
    playing = !playing;
    btnPlay.textContent = playing ? "일시정지" : "재생";
    anims.forEach(a => { try { playing ? a.play() : a.pause(); } catch (e) {} });
    if (!playing) VIDS.forEach(v => v.pause());
  });
  if (btnBack) btnBack.addEventListener("click", () => seekAll(0));
  if (scrub) scrub.addEventListener("input", () => {
    const ms = (Number(scrub.value) / 1000) * DUR;
    anims.forEach(a => { try { a.pause(); } catch (e) {} });
    playing = false;
    if (btnPlay) btnPlay.textContent = "재생";
    seekAll(ms);
    seekVideos(ms / 1000);
  });

  /* 로고 SVG 를 심은 뒤에야 엔딩 트랙을 걸 수 있다 (안의 글자를 잡아야 하므로) */
  fetch("assets/logo-hwp.svg")
    .then(r => r.text())
    .then(txt => { $("logo").innerHTML = txt; })
    .catch(() => {
      $("logo").innerHTML = '<img src="assets/logo-hwp.svg" alt="" style="width:100%;height:100%">';
    })
    .then(() => { ENDINGS[VARIANT](); if (!CLEAN) requestAnimationFrame(tick); });
})();
