/* =========================================================================
   logo-grid-check.js — 홈 아이콘 그리드에서 로고 6종이 어떻게 잘리는지 비교.
   위: 변경 전(92% + 이미지 자체 21%)   아래: 변경 후(100% + 컨테이너 21%)
   사용: node tools/logo-grid-check.js
   ========================================================================= */
const path = require("path");
const puppeteer = require("puppeteer");
const OUT = path.resolve("out/logo-grid.png");
const BASE = "http://localhost:4321/assets/";
const LOGOS = ["logo-5e.svg", "logo-hwp.svg", "logo-everykey.svg",
               "logo-docfinder.svg", "logo-modipdf.svg", "logo-obsidian-hub.svg"];

const row = (cls, label) => `
  <div class="rowlabel">${label}</div>
  <div class="row">
    ${LOGOS.map(l => `<div class="tile ${cls}"><img src="${BASE}${l}"></div>`).join("")}
  </div>`;

const html = `
<style>
  body { margin:0; background:#0b0d12; color:#e6edf3; font-family:system-ui,sans-serif; padding:24px; }
  .rowlabel { font-size:13px; font-weight:700; margin:14px 0 8px; color:#cfd8e6; }
  .row { display:flex; gap:20px; }
  .tile { width:112px; height:112px; box-sizing:border-box;
          display:flex; align-items:center; justify-content:center; }

  /* 변경 전 */
  .old { border:1px solid #232a33; border-radius:18px; overflow:hidden; }
  .old img { width:92%; height:auto; border-radius:21%;
             box-shadow:0 10px 26px -10px rgba(11,17,40,0.55); }

  /* 변경 후 (지금 배포된 상태) */
  .new { border:1px solid #232a33; border-radius:21%; overflow:hidden; }
  .new img { width:100%; height:auto; }

  /* 제안: 이미지가 자기 모양을 유지하도록 여백을 준다 */
  .fix { border:1px solid #232a33; border-radius:21%; overflow:hidden; }
  .fix img { width:100%; height:100%; object-fit:contain; }
</style>
${row("old", "① 변경 전 — 92% + 이미지 21%")}
${row("new", "② 변경 후 (현재 배포) — 100% 채움")}
${row("fix", "③ 제안 — 100% + object-fit: contain")}
`;

(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 880, height: 520, deviceScaleFactor: 2 });
  await p.setContent(html, { waitUntil: "networkidle0" });
  await p.screenshot({ path: OUT });
  await b.close();
  console.log("→ " + OUT);
})();
