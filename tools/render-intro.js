/* =========================================================================
   render-intro.js — 5E 키네틱 타이포를 mp4 로 뽑는다.

   원리: 이 애니메이션은 '모든 요소가 시각(time)의 함수'라서, 원하는 시점으로
   정확히 감아놓고 그 순간을 캡처할 수 있다. 화면 녹화와 달리 떨림·프레임
   드랍이 없고, 느린 컴퓨터에서도 결과가 같다.

   흐름
     1) 헤드리스 크롬으로 kinetic-preview.html?clean=1 을 연다
     2) 프레임마다 모든 Animation 의 currentTime 을 고정하고
        영상 5개도 그 시각에 맞춰 seek 한 뒤 스크린샷
     3) ffmpeg 으로 이어붙여 mp4

   사용법 (로컬 서버가 떠 있어야 한다)
     node tools/render-intro.js
     node tools/render-intro.js --fps 60 --width 1920 --out out/5e-intro.mp4
   ========================================================================= */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const puppeteer = require("puppeteer");

const arg = (name, def) => {
  const i = process.argv.indexOf("--" + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const FPS = Number(arg("fps", 60));
// H.264(yuv420p)는 가로·세로가 모두 짝수여야 한다. 홀수면 인코더가 열리지도 않는다.
const even = (n) => Math.round(n / 2) * 2;
const WIDTH = even(Number(arg("width", 1920)));
const HEIGHT = even((WIDTH * 372) / 660); // 무대 좌표계 비율
const URL = arg("url", "http://localhost:4321/kinetic-preview?clean=1");
const OUT = path.resolve(arg("out", "out/5e-intro.mp4"));
// 무대 안에서 트는 영상들이 있는 폴더. 인트로마다 다르다.
const CLIPS = arg("clips", "assets/demo");
// 배경음악 WAV (tools/make-music.js 로 만든다). 없으면 무음.
const AUDIO = arg("audio", null);
const FRAMES = path.resolve("out/_frames");

/* winget 으로 깐 ffmpeg 은 셸을 새로 열어야 PATH 에 잡힌다.
   지금 세션에서도 바로 쓸 수 있도록 실제 실행 파일을 찾아둔다. */
function findFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { shell: true });
  if (probe.status === 0) return "ffmpeg";
  const guesses = [
    path.join(process.env.LOCALAPPDATA || "", "Microsoft/WinGet/Packages"),
    "C:/Program Files/ffmpeg/bin",
  ];
  for (const root of guesses) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      let items = [];
      try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { continue; }
      for (const it of items) {
        const p = path.join(dir, it.name);
        if (it.isDirectory()) stack.push(p);
        else if (it.name.toLowerCase() === "ffmpeg.exe") return p;
      }
    }
  }
  return null;
}

function ensureEmpty(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

/* 원본 데모 영상은 프레임 간 압축(P프레임)이라 임의 시각으로 되감으면 결과가
   미세하게 흔들린다 — 렌더 초반이 버벅여 보이는 원인이었다.
   '모든 프레임이 키프레임'인 사본을 만들어 렌더에만 쓴다. 웹에 올라가는 원본은
   그대로 두므로 사이트 용량에는 영향이 없다. */
function prepareSeekCopies(ffmpeg) {
  const src = path.resolve(CLIPS);
  if (!fs.existsSync(src)) {
    console.log(`[render] ${CLIPS} 가 없습니다 — 영상 없이 렌더합니다`);
    return {};
  }
  const dst = path.resolve("out/_seek");
  fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src).filter((f) => f.endsWith(".mp4")).sort();
  const map = {};
  for (const f of files) {
    const to = path.join(dst, f);
    if (!fs.existsSync(to)) {
      const r = spawnSync(ffmpeg, [
        "-y", "-i", path.join(src, f),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "16",
        "-g", "1", "-keyint_min", "1", "-bf", "0", "-sc_threshold", "0",
        "-pix_fmt", "yuv420p", "-an", to,
      ], { stdio: ["ignore", "ignore", "pipe"] });
      if (r.status !== 0) {
        console.error("  [seek사본 실패]", f, String(r.stderr).split("\n").slice(-4).join("\n"));
        continue;
      }
    }
    map[CLIPS + "/" + f] = "/out/_seek/" + f;
  }
  console.log(`[render] seek 사본 ${Object.keys(map).length}개 준비`);
  return map;
}

(async () => {
  console.log(`[render] ${WIDTH}x${HEIGHT} @ ${FPS}fps  ← ${URL}`);
  ensureEmpty(FRAMES);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const FFMPEG_PRE = findFfmpeg();
  if (!FFMPEG_PRE) { console.error("[render] ffmpeg 을 찾지 못했습니다."); process.exit(1); }
  const SEEK_MAP = prepareSeekCopies(FFMPEG_PRE);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--autoplay-policy=no-user-gesture-required", "--disable-web-security"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  page.on("console", (m) => { if (m.type() === "error") console.log("  [page]", m.text()); });
  await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });

  // 되감기가 정확한 사본으로 갈아끼운다
  await page.evaluate((map) => {
    document.querySelectorAll(".k5-clip video, .hp-clip video").forEach((v) => {
      const cur = v.getAttribute("src") || "";
      const base = (k) => k.slice(k.lastIndexOf("/") + 1);
      const key = Object.keys(map).find((k) => cur.endsWith(base(k)));
      if (key) { v.src = map[key]; v.load(); }
    });
  }, SEEK_MAP);

  // 폰트·영상 메타데이터가 다 준비될 때까지 기다린다
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
    const vs = [...document.querySelectorAll(".k5-clip video, .hp-clip video")];
    await Promise.all(vs.map(v => v.readyState >= 2 ? Promise.resolve()
      : new Promise(r => { v.addEventListener("loadeddata", r, { once: true }); setTimeout(r, 5000); })));
  });
  await new Promise(r => setTimeout(r, 1200));   // 재구성(rebuild) 이 끝나도록

  // 무대만 남기고 화면에 꽉 채운다.
  // ⚠ 무대 안의 요소들은 660×372 좌표계에 px 로 박혀 있어서, 무대 자체를 크게
  //    늘려도 내용은 그대로다. 반드시 transform: scale 로 통째로 확대해야 한다.
  //    (이걸 빠뜨려 1920 프레임 한가운데 660px 짜리가 작게 박힌 적이 있다)
  await page.evaluate((BASE_W, BASE_H) => {
    document.body.style.cssText =
      "background:#000;margin:0;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center";
    // 무대 id 는 시안 페이지에서 #stage, 상세 페이지에서 #k5stage 다
    const st = document.querySelector("#k5stage, #hpstage, #stage, .k5, .hp");
    if (!st) throw new Error("무대(.k5)를 찾지 못했습니다");
    st.style.width = BASE_W + "px";
    st.style.height = BASE_H + "px";
    st.style.aspectRatio = "auto";
    st.style.flex = "none";
    st.style.border = "0";
    st.style.borderRadius = "0";
    st.style.boxShadow = "none";
    // ⚠ 무대 자체에 scale 을 걸면 안 된다. 락인 순간의 '흔들림'이 무대의 transform 을
    //    애니메이션으로 잡고 있어서, 인라인 transform 이 그때 덮어써져 배율이 날아간다.
    //    감싸는 컨테이너를 따로 만들어 그것을 확대한다.
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "flex:none;transform-origin:center center;transform:scale(" +
      (window.innerWidth / BASE_W) + ")";
    st.parentNode.insertBefore(wrap, st);
    wrap.appendChild(st);
  }, 660, 372);

  const dur = await page.evaluate(() => {
    const a = document.getAnimations().find(x => x.effect && x.effect.getTiming().duration > 1000);
    return a ? a.effect.getTiming().duration : 17900;
  });
  const total = Math.round((dur / 1000) * FPS);
  console.log(`[render] 길이 ${(dur / 1000).toFixed(2)}s → ${total} 프레임`);

  // 모든 애니메이션을 멈춰 세운다 (수동으로 시각을 지정할 것이므로)
  await page.evaluate(() => {
    document.getAnimations().forEach(a => { try { a.pause(); } catch (e) {} });
  });

  for (let f = 0; f < total; f++) {
    const ms = (f / FPS) * 1000;
    await page.evaluate(async (ms, dur) => {
      const t = Math.min(ms, dur - 1);
      document.getAnimations().forEach(a => {
        try { if (a.effect && a.effect.getTiming().duration > 1000) a.currentTime = t; } catch (e) {}
      });
      // 영상도 같은 시각의 프레임으로 정확히 맞춘다
      const seek = window.__k5seek || window.__hpseek;
      if (seek) await seek(t / 1000);
    }, ms, dur);

    await page.screenshot({
      path: path.join(FRAMES, String(f).padStart(5, "0") + ".png"),
      omitBackground: false,
    });
    if (f % Math.max(1, Math.round(FPS)) === 0) {
      process.stdout.write(`\r  ${f}/${total} (${Math.round((f / total) * 100)}%)   `);
    }
  }
  console.log(`\r  ${total}/${total} (100%)      `);
  await browser.close();

  console.log("[render] ffmpeg 으로 합치는 중…");
  const FFMPEG = findFfmpeg();
  if (!FFMPEG) { console.error("[render] ffmpeg 을 찾지 못했습니다."); process.exit(1); }
  const ffArgs = ["-y", "-framerate", String(FPS), "-i", path.join(FRAMES, "%05d.png")];
  const hasAudio = AUDIO && fs.existsSync(path.resolve(AUDIO));
  if (AUDIO && !hasAudio) console.log(`[render] 오디오 ${AUDIO} 가 없습니다 — 무음으로 갑니다`);
  if (hasAudio) ffArgs.push("-i", path.resolve(AUDIO));
  ffArgs.push("-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart");
  // -shortest: 음악이 영상보다 길면 영상 끝에서 자른다
  if (hasAudio) ffArgs.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  ffArgs.push(OUT);
  const r = spawnSync(FFMPEG, ffArgs, { stdio: ["ignore", "ignore", "pipe"], shell: true });

  if (r.status !== 0) {
    console.error("[render] ffmpeg 실패\n" + String(r.stderr).split("\n").slice(-15).join("\n"));
    process.exit(1);
  }
  fs.rmSync(FRAMES, { recursive: true, force: true });
  const mb = (fs.statSync(OUT).size / 1048576).toFixed(1);
  console.log(`[render] 완료 → ${OUT}  (${mb} MB)`);
})();
