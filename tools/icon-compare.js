/* =========================================================================
   icon-compare.js — 아이콘이 자리마다 다르게 보이는 문제를 눈으로 비교한다.
   사용: node tools/icon-compare.js
   ========================================================================= */
const path = require("path");
const puppeteer = require("puppeteer");

const SVG = "http://localhost:4321/assets/logo-5e.svg";
const OUT = path.resolve("out/icon-compare.png");

const cell = (label, inner, note) => `
  <div class="cell">
    <div class="label">${label}</div>
    <div class="box">${inner}</div>
    <div class="note">${note}</div>
  </div>`;

const html = `
<style>
  body { margin:0; background:#0b0d12; color:#e6edf3; font-family:system-ui,sans-serif;
         display:flex; gap:30px; padding:30px; align-items:flex-start; }
  .cell { text-align:center; width:210px; }
  .label { font-size:13px; font-weight:700; margin-bottom:10px; color:#cfd8e6; }
  .note  { font-size:11px; color:#8a93a3; margin-top:10px; line-height:1.6; }
  .box { width:210px; height:210px; display:flex; align-items:center; justify-content:center; }

  /* 현재 · 상세 페이지 (.detail-icon) */
  .detail img { width:190px; height:190px; display:block;
    border-radius:21%; box-shadow:0 10px 26px -10px rgba(0,0,0,0.6); }

  /* 현재 · 홈 아이콘 그리드 */
  .gridwrap { width:190px; height:190px; border-radius:18px;
    border:1px solid #232a33; box-sizing:border-box;
    display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .gridwrap img { width:92%; height:auto; border-radius:21%;
    box-shadow:0 10px 26px -10px rgba(11,17,40,0.55); }

  /* 통일안 A — SVG 자체 모서리만 쓰고 그림자만 얹는다 */
  .fixa img { width:190px; height:190px; display:block;
    box-shadow:0 10px 26px -10px rgba(0,0,0,0.6); }

  /* 통일안 B — 홈에서도 컨테이너 테두리 없이 이미지가 꽉 차게 */
  .fixb { width:190px; height:190px; display:flex; align-items:center; justify-content:center; }
  .fixb img { width:100%; height:100%; display:block;
    box-shadow:0 10px 26px -10px rgba(11,17,40,0.55); }
</style>
${cell("현재 · 상세", `<div class="detail"><img src="${SVG}"></div>`,
       "SVG 를 21% 로 한 번 더 깎음")}
${cell("현재 · 홈 그리드", `<div class="gridwrap"><img src="${SVG}"></div>`,
       "18px 컨테이너 + 92% 이미지 21%<br>모서리 이중 · 테두리 링")}
${cell("통일안 A", `<div class="fixa"><img src="${SVG}"></div>`,
       "SVG 모서리 그대로<br>그림자만 얹음")}
${cell("통일안 B", `<div class="fixb"><img src="${SVG}"></div>`,
       "컨테이너 없이 100%<br>홈·상세 완전 동일")}
`;

(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 1010, height: 300, deviceScaleFactor: 2 });
  await p.setContent(html, { waitUntil: "networkidle0" });
  await p.screenshot({ path: OUT });
  await b.close();
  console.log("→ " + OUT);
})();
