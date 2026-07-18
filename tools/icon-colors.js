/* =========================================================================
   icon-colors.js — 5E 마크의 색 후보를 나란히 렌더해 비교한다.
   로고는 브랜드라 임의로 바꾸지 않는다. 고른 뒤 assets/logo-5e.svg 에 반영.
   사용: node tools/icon-colors.js
   ========================================================================= */
const path = require("path");
const puppeteer = require("puppeteer");
const OUT = path.resolve("out/icon-colors.png");

// [이름, 안쪽색, 바깥색, 설명]
const VARIANTS = [
  ["현재",      "#23366b", "#0b1128", "짙은 남색"],
  ["A 밝은 남색", "#2a4a9c", "#0a1430", "같은 계열에서 채도만"],
  ["B 코발트",   "#1f5fc4", "#08142e", "또렷한 파랑"],
  ["C 스카이",   "#2b7fd4", "#0a1c33", "밝고 시원함"],
  ["D 틸블루",   "#1a7fa8", "#07202b", "청록 쪽 · 가장 청량"],
];

const cell = ([name, a, b, note], i) => `
  <div class="cell">
    <div class="label">${name}</div>
    <svg viewBox="0 0 96 96" width="180" height="180">
      <defs>
        <radialGradient id="g${i}" cx="50%" cy="60%" r="72%">
          <stop offset="0%" stop-color="${a}"/>
          <stop offset="66%" stop-color="${b}"/>
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="20" fill="url(#g${i})"/>
      <text x="49" y="49" font-family="Georgia, 'Times New Roman', serif" font-style="italic"
            font-weight="600" font-size="54" fill="#f5f8ff" text-anchor="middle"
            dominant-baseline="central">5E</text>
    </svg>
    <div class="note">${note}<br><code>${a}</code></div>
  </div>`;

const html = `
<style>
  body { margin:0; background:#0b0d12; color:#e6edf3; font-family:system-ui,sans-serif;
         display:flex; gap:26px; padding:28px; align-items:flex-start; }
  .cell { text-align:center; width:190px; }
  .label { font-size:13px; font-weight:700; margin-bottom:10px; color:#cfd8e6; }
  .note { font-size:11px; color:#8a93a3; margin-top:10px; line-height:1.7; }
  code { color:#6f86b5; font-size:10.5px; }
  svg { filter: drop-shadow(0 10px 26px rgba(0,0,0,0.6)); }
</style>
${VARIANTS.map(cell).join("")}
`;

(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1136, height: 290, deviceScaleFactor: 2 });
  await p.setContent(html, { waitUntil: "networkidle0" });
  await p.screenshot({ path: OUT });
  await b.close();
  console.log("→ " + OUT);
})();
