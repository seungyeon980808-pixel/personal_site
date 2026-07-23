/* =========================================================================
   make-og.js — 링크 공유 썸네일(og:image)을 히어로 화면 그대로 뽑는다.

   원리: 카드를 따로 그리지 않고 실제 사이트의 히어로를 찍는다. 슬로건도
   그라데이션 프리셋도 Firestore 에서 오므로, 사이트에서 문구를 고치고 이걸
   다시 돌리면 썸네일이 알아서 따라온다. (따로 그리면 반드시 어긋난다)

   사용법 (로컬 서버가 떠 있어야 한다 — npx -y serve -l 4321 .)
     node tools/make-og.js
     node tools/make-og.js --out assets/og-image.png --scale 2
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const arg = (name, def) => {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const URL = arg("url", "http://localhost:4321/index.html");
const OUT = path.resolve(arg("out", "assets/og-image.png"));
const W = Number(arg("width", 1200));
const H = Number(arg("height", 630));
const SCALE = Number(arg("scale", 1));   // og:image 는 1200×630 으로 선언돼 있다
const WAIT = Number(arg("wait", 3500));  // 셰이더·폰트·Firestore 가 자리잡을 시간

/* 캡처용 손질 — 관리자 바처럼 방문자에게 안 보이는 것과, 히어로 아래 본문을 뺀다.
   히어로는 화면 전체를 차지하게 늘려 1200×630 을 꽉 채운다. */
const CAPTURE_CSS = `
  .admin-bar, .site-footer, .cursor-glow, #gradTool, .dp-btn { display: none !important; }
  .wrap > details, .wrap > section:not(.site-header) { display: none !important; }
  body .wrap { padding: 0 40px !important; }
  .site-header {
    min-height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    justify-content: center !important;
  }
  html, body { overflow: hidden !important; }
  /* 아래쪽 여백이 남아 있으면 가운데 정렬이 그만큼 위로 밀린다 */
  .byline { margin-bottom: 0 !important; }
  /* 등장 애니메이션이 도중에 찍히면 반투명하게 나온다 — 끝난 상태로 고정 */
  .hero-item, .name .kchar, .reveal { opacity: 1 !important; transform: none !important;
    animation: none !important; transition: none !important; }
  .name.kinetic-pending { opacity: 1 !important; }
`;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
           "--hide-scrollbars", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

    // 슬로건은 Firestore 에서 온다. 글이 오기 전에 찍으면 빈 화면이 나온다.
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".intro");
        return el && el.textContent.trim().length > 0;
      },
      { timeout: 30000 },
    ).catch(() => console.warn("! 슬로건을 못 받았다 — 빈 채로 찍힐 수 있다"));

    await page.addStyleTag({ content: CAPTURE_CSS });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await new Promise((r) => setTimeout(r, WAIT));   // 셰이더가 한 화면 그릴 시간

    const shot = await page.evaluate(() => ({
      slogan: (document.querySelector(".intro") || {}).innerText || "",
      name: (document.querySelector(".name") || {}).innerText || "",
      role: (document.querySelector(".role") || {}).innerText || "",
      canvasPainted: [...document.querySelectorAll("canvas")].map((c) => c.width + "x" + c.height),
    }));

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    // 배경이 노이즈 텍스처라 PNG 는 1MB 를 넘는다. .jpg 로 뽑으면 1/8 로 준다.
    const type = OUT.toLowerCase().endsWith(".jpg") ? "jpeg" : "png";
    await page.screenshot(type === "jpeg"
      ? { path: OUT, type: "jpeg", quality: Number(arg("quality", 90)) }
      : { path: OUT, type: "png" });

    const kb = Math.round(fs.statSync(OUT).size / 1024);
    console.log(`저장: ${OUT}  ${W * SCALE}×${H * SCALE}  ${kb} KB`);
    console.log(`슬로건: ${shot.slogan.replace(/\s+/g, " ").trim()}`);
    console.log(`서명  : ${shot.name} · ${shot.role}`);
    console.log(`캔버스: ${shot.canvasPainted.join(", ") || "없음"}`);
  } finally {
    await browser.close();
  }
})();
