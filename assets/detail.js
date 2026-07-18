// =========================================================================
// detail.js — 프로젝트 상세 페이지 공통 로직 (v2: 동적 기능블록 + 사진 + 댓글)
//   - Firestore doc "detail-<project>" 로 히어로/링크/기능 블록 load·save
//   - 기능 블록: 편집 모드에서 무제한 추가/삭제, 블록마다 영상(YouTube) 또는 사진(URL)
//   - 댓글: collection "comments" 에 익명+이름으로 저장, 실시간 표시, 관리자 삭제
//   - seungyeon980808@gmail.com 로그인 시 편집 모드
//
//   <body data-project="edunote"> 값으로 문서/댓글을 고른다.
// =========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbHRNi10RttJNoLJCuxZQHucwp5Vttn90",
  authDomain: "edunote-96bd7.firebaseapp.com",
  projectId: "edunote-96bd7",
  storageBucket: "edunote-96bd7.firebasestorage.app",
  messagingSenderId: "769455023609",
  appId: "1:769455023609:web:3cdaa733ef3bf47aaa0928",
  measurementId: "G-X5PJX6XHYP",
};

const COLLECTION = "personal-site";
const COMMENTS = "comments";
const ADMIN_EMAIL = "seungyeon980808@gmail.com";
const PROJECT_ID = document.body.dataset.project || "unknown";
const DOC_ID = "detail-" + PROJECT_ID;

// ?preview=1 로 열린 iframe = 기기 미리보기용 사본. 편집 UI 를 켜지 않는다.
const IS_PREVIEW = new URLSearchParams(location.search).has("preview");

let app, auth, db;
// 로그인(권한)과 편집 켜짐(보기 상태)은 다른 것이다.
// 관리자로 로그인한 채 편집만 꺼서 방문자 화면을 그대로 볼 수 있어야 한다.
let isEditMode = false;
let canEdit = false;
const EDIT_PREF = "editModeOn"; // index.html 과 같은 키 — 페이지를 옮겨다녀도 유지된다

const DEFAULT_FEATURES = [
  { title: "대표 기능 1", desc: "이 기능이 무엇을 하는지, 어떻게 쓰는지 설명을 적어주세요.", mediaType: "video", mediaUrl: "" },
  { title: "대표 기능 2", desc: "이 기능이 무엇을 하는지, 어떻게 쓰는지 설명을 적어주세요.", mediaType: "video", mediaUrl: "" },
  { title: "대표 기능 3", desc: "이 기능이 무엇을 하는지, 어떻게 쓰는지 설명을 적어주세요.", mediaType: "video", mediaUrl: "" },
];

// ---- small helpers -------------------------------------------------------
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// ---- media (video / image) ----------------------------------------------
function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/
  );
  return m ? m[1] : null;
}

function renderMedia(mediaEl, type, url) {
  mediaEl.innerHTML = "";
  mediaEl.className = "media";
  delete mediaEl.dataset.ytid;

  if (type === "image") {
    if (url) {
      const img = el("img", "media-img");
      img.loading = "lazy";
      img.alt = "기능 사진";
      img.src = url;
      mediaEl.appendChild(img);
    } else {
      mediaEl.appendChild(
        el("div", "media-empty", isEditMode ? "아래에 사진 URL 붙여넣기" : "이미지 준비중")
      );
    }
    return;
  }

  // video (YouTube facade)
  const id = youtubeId(url);
  if (id) {
    const thumb = el("img", "thumb");
    thumb.loading = "lazy";
    thumb.alt = "영상 미리보기";
    thumb.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    const play = el("div", "playbtn", "▶");
    mediaEl.appendChild(thumb);
    mediaEl.appendChild(play);
    mediaEl.dataset.ytid = id;
  } else {
    mediaEl.appendChild(
      el("div", "media-empty", isEditMode ? "아래에 YouTube 링크 붙여넣기" : "영상 준비중")
    );
  }
}

// ---- feature blocks (dynamic) -------------------------------------------
function makeFeature(index, feat) {
  const f = feat || { title: "", desc: "", mediaType: "video", mediaUrl: "" };
  const type = f.mediaType === "image" ? "image" : "video";

  const section = el("section", "feature");
  section.dataset.featureIndex = String(index);

  // media column
  const mediaCol = el("div", "feature-media");
  const media = el("div", "media");
  media.dataset.media = "1";
  mediaCol.appendChild(media);

  const controls = el("div", "media-controls");
  const typeWrap = el("div", "media-type");
  const btnVideo = el("button", "type-btn" + (type === "video" ? " active" : ""), "영상");
  btnVideo.type = "button";
  btnVideo.dataset.type = "video";
  const btnImage = el("button", "type-btn" + (type === "image" ? " active" : ""), "사진");
  btnImage.type = "button";
  btnImage.dataset.type = "image";
  typeWrap.appendChild(btnVideo);
  typeWrap.appendChild(btnImage);

  const urlInput = el("input", "media-url");
  urlInput.type = "url";
  urlInput.value = f.mediaUrl || "";
  urlInput.placeholder =
    type === "image" ? "이미지 URL 붙여넣기 (https://...)" : "YouTube 링크 붙여넣기 (https://youtu.be/...)";

  controls.appendChild(typeWrap);
  controls.appendChild(urlInput);
  mediaCol.appendChild(controls);

  // text column
  const textCol = el("div", "feature-text");
  const num = el("div", "feature-num", pad2(index + 1));
  const title = el("h2", "feature-title");
  title.dataset.editable = "1";
  title.innerHTML = sanitizeRich(f.title || "");
  // 슬로건 — 짧고 굵게. 접혀 있을 때 이것만 보인다.
  const lead = el("p", "feature-lead");
  lead.dataset.editable = "1";
  // 예전 글에는 lead 가 없다. 첫 문단을 슬로건으로 올리고 나머지를 본문으로 둔다.
  const split = splitLegacy(f);
  lead.innerHTML = split.lead;

  const desc = el("p", "feature-desc");
  desc.dataset.editable = "1";
  desc.innerHTML = split.desc;

  // 글자 없는 동그란 버튼 하나. 눌러보고 싶게.
  const more = el("button", "feature-more");
  more.type = "button";
  more.setAttribute("aria-label", "자세한 설명 보기");
  more.setAttribute("aria-expanded", "false");
  // 펼칠 내용이 없으면 버튼도 없다 (편집 모드에서는 본문을 채워야 하니 항상 보인다)
  more.hidden = !split.desc.trim();
  more.addEventListener("click", () => {
    const open = section.classList.toggle("desc-open");
    more.setAttribute("aria-expanded", String(open));
    more.setAttribute("aria-label", open ? "설명 접기" : "자세한 설명 보기");
  });

  const remove = el("button", "feature-remove", "이 기능 삭제");
  remove.type = "button";
  textCol.appendChild(num);
  textCol.appendChild(title);
  textCol.appendChild(lead);
  textCol.appendChild(desc);
  textCol.appendChild(more);
  textCol.appendChild(remove);

  section.appendChild(mediaCol);
  section.appendChild(textCol);

  // ---- wiring ----
  function currentType() {
    return section.querySelector(".type-btn.active").dataset.type;
  }
  function rerender() {
    renderMedia(media, currentType(), urlInput.value);
  }
  [btnVideo, btnImage].forEach((btn) => {
    btn.addEventListener("click", () => {
      typeWrap.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      urlInput.placeholder =
        btn.dataset.type === "image"
          ? "이미지 URL 붙여넣기 (https://...)"
          : "YouTube 링크 붙여넣기 (https://youtu.be/...)";
      rerender();
    });
  });
  urlInput.addEventListener("input", rerender);
  urlInput.addEventListener("click", (e) => e.stopPropagation());
  media.addEventListener("click", () => {
    if (isEditMode) return;
    const id = media.dataset.ytid;
    if (!id) return;
    media.innerHTML =
      '<iframe src="https://www.youtube.com/embed/' +
      id +
      '?autoplay=1&rel=0" title="영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  });
  remove.addEventListener("click", () => {
    section.remove();
    renumber();
  });

  // initial media paint
  renderMedia(media, type, f.mediaUrl || "");
  // editable state
  title.contentEditable = isEditMode ? "true" : "false";
  desc.contentEditable = isEditMode ? "true" : "false";
  if (isEditMode) section.classList.add("is-visible");
  return section;
}

/* 슬로건(lead)과 본문(desc)은 별개다.
   예전에 저장된 글에는 lead 가 없으므로, 문단 구분(빈 줄) 기준으로 첫 문단을
   슬로건으로 올리고 나머지를 본문으로 삼는다. 다음 저장 때 두 항목으로 나뉘어
   기록되므로 한 번만 일어나는 이관이다. */
const PARA_SPLIT = /(?:\s*<br\s*\/?>\s*){2,}/i;
function splitLegacy(f) {
  const rawLead = sanitizeRich(f.lead || "");
  const rawDesc = sanitizeRich(f.desc || "");
  if (rawLead) return { lead: rawLead, desc: rawDesc };
  const i = rawDesc.search(PARA_SPLIT);
  if (i < 0) return { lead: rawDesc, desc: "" };
  return { lead: rawDesc.slice(0, i), desc: rawDesc.slice(i).replace(PARA_SPLIT, "") };
}

function renumber() {
  document.querySelectorAll("#featureList .feature").forEach((sec, i) => {
    sec.dataset.featureIndex = String(i);
    const n = sec.querySelector(".feature-num");
    if (n) n.textContent = pad2(i + 1);
  });
}

function renderFeatures(features) {
  const list = document.getElementById("featureList");
  if (!list) return;
  const data = features && features.length ? features : DEFAULT_FEATURES;
  list.innerHTML = "";
  data.forEach((feat, i) => list.appendChild(makeFeature(i, feat)));
}

function collectFeatures() {
  const out = [];
  document.querySelectorAll("#featureList .feature").forEach((sec) => {
    out.push({
      title: sanitizeRich(sec.querySelector(".feature-title").innerHTML),
      lead: sanitizeRich(sec.querySelector(".feature-lead").innerHTML),
      desc: sanitizeRich(sec.querySelector(".feature-desc").innerHTML),
      mediaType: sec.querySelector(".type-btn.active").dataset.type,
      mediaUrl: (sec.querySelector(".media-url").value || "").trim(),
    });
  });
  return out;
}

// 편집칸에서 허용하는 서식만 남기고 나머지 태그는 전부 벗긴다.
//   · <br>  줄바꿈 (엔터)
//   · <u>   밑줄
//   · <span style="color:…">          글자색
//   · <span style="letter-spacing:…"> 자간
// 그 외(폰트/클래스 등)는 내용만 남기고 제거한다.
// 저장·불러오기 양쪽에서 같은 규칙을 써서 새로고침 후에도 서식이 그대로 유지된다.
const COLOR_OK = /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|[a-z]+)$/i;
// 자간은 em 단위만 받는다 (글자 크기가 달라져도 비율이 유지되어 반응형에 안전)
const LS_OK = /^-?\d*\.?\d+em$/i;

function unwrapEl(el, before) {
  const kids = Array.from(el.childNodes);
  el.replaceWith.apply(el, before ? [before].concat(kids) : kids);
}
function sanitizeRich(html) {
  const box = document.createElement("div");
  box.innerHTML = html == null ? "" : String(html);
  // 스크립트/스타일 등은 내용째 버린다(내용만 남기면 코드가 글로 새어 나온다)
  box.querySelectorAll("script, style, iframe, object, embed, template").forEach((n) => n.remove());
  // 문단(div/p)은 줄바꿈으로 평탄화 — contenteditable 이 만드는 래퍼 정리. 안쪽부터.
  Array.from(box.querySelectorAll("div, p")).reverse().forEach((blk) => {
    if (!blk.parentNode) return;
    unwrapEl(blk, document.createElement("br"));
  });
  // 일부 브라우저의 execCommand 는 <font color> 를 만든다 → 색 span 으로 통일
  Array.from(box.querySelectorAll("font")).forEach((f) => {
    const span = document.createElement("span");
    const c = f.getAttribute("color");
    if (c && COLOR_OK.test(c)) span.style.color = c;
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
  Array.from(box.querySelectorAll("*")).reverse().forEach((el) => {
    if (!el.parentNode) return;
    const tag = el.tagName;
    if (tag === "BR") return;
    if (tag === "U") {
      el.removeAttribute("style");
      el.removeAttribute("class");
      return;
    }
    if (tag === "SPAN") {
      const color = el.style.color;
      const spacing = el.style.letterSpacing;
      const underlined = /underline/.test(el.style.textDecoration || el.style.textDecorationLine || "");
      el.removeAttribute("class");
      el.removeAttribute("style");
      if (color && COLOR_OK.test(color)) el.style.color = color;
      if (spacing && LS_OK.test(spacing.trim())) el.style.letterSpacing = spacing.trim();
      if (underlined) el.style.textDecoration = "underline";
      if (!el.getAttribute("style")) unwrapEl(el); // 남길 서식이 없으면 태그째 제거
      return;
    }
    unwrapEl(el);
  });
  return collapseBlankLines(box.innerHTML);
}

// 문단 사이 빈 줄은 최대 하나로 통일한다.
//   저장된 본문은 문단마다 <br><br><br> (빈 줄 2개 = 44.8px) 로 쌓여 있어 간격이 너무 벌어진다.
//   빈 줄 높이는 부모의 line-height(1.6 × 14px = 22.4px)로 고정이라 CSS 로는 못 줄인다
//   — <br> 에 건 display/height/line-height 는 브라우저가 무시한다. 줄 개수로만 조절된다.
//   앞뒤로 붙은 빈 줄은 그대로 제거한다.
function collapseBlankLines(html) {
  return String(html)
    .replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, "<br><br>") // 빈 줄 2개 이상 → 1개
    .replace(/^(?:\s*<br\s*\/?>)+/i, "")
    .replace(/(?:<br\s*\/?>\s*)+$/i, "")
    .trim();
}

// ---- serialization (hero fields + links + features) ----------------------
function collectData() {
  const data = { fields: {}, links: {}, features: collectFeatures(), iconScale };
  document.querySelectorAll("[data-field]").forEach((elm) => {
    if (elm.classList.contains("status")) {
      data.fields[elm.getAttribute("data-field")] = elm.getAttribute("data-status");
    } else {
      data.fields[elm.getAttribute("data-field")] = sanitizeRich(elm.innerHTML); // 줄바꿈 보존
    }
  });
  document.querySelectorAll("a[data-link]").forEach((a) => {
    data.links[a.getAttribute("data-link")] = a.getAttribute("href");
  });
  return data;
}

function applyData(data) {
  data = data || {};
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, val]) => {
      const elm = document.querySelector('[data-field="' + key + '"]');
      if (!elm) return;
      if (elm.classList.contains("status")) {
        const st = normalizeStatus(val); // 예전 한글 값도 영문으로 바꿔 보여준다
        elm.setAttribute("data-status", st);
        elm.textContent = st;
      } else {
        elm.innerHTML = sanitizeRich(val); // 줄바꿈만 살리고 나머지 태그 제거
      }
    });
  }
  if (data.links) {
    Object.entries(data.links).forEach(([key, href]) => {
      const a = document.querySelector('a[data-link="' + key + '"]');
      if (a && href) a.setAttribute("href", href);
    });
  }
  applyIconScale(typeof data.iconScale === "number" ? data.iconScale : ICON_SCALE_DEFAULT);
  syncCtaVisibility();
  syncCtaInputs();
  renderFeatures(data.features);
}

// ---- 아이콘 크기 조절 (편집 모드 전용) ------------------------------------
// 저장값은 배율(--icon-scale). clamp 로 잡힌 반응형 크기에 곱해지므로 화면이 좁아져도 안 깨진다.
const ICON_SCALE_MIN = 0.6, ICON_SCALE_MAX = 3, ICON_SCALE_DEFAULT = 1;
let iconScale = ICON_SCALE_DEFAULT;
let iconCtl = null;

function applyIconScale(v) {
  const n = Number(v);
  iconScale = Math.min(ICON_SCALE_MAX, Math.max(ICON_SCALE_MIN, isNaN(n) ? ICON_SCALE_DEFAULT : n));
  const icon = document.querySelector(".detail-icon");
  if (icon) icon.style.setProperty("--icon-scale", String(iconScale));
  if (iconCtl) {
    const range = iconCtl.querySelector("input");
    if (range && Number(range.value) !== iconScale) range.value = String(iconScale);
    const out = iconCtl.querySelector(".icon-size-val");
    if (out) out.textContent = Math.round(iconScale * 100) + "%";
  }
}

function setIconSizeCtl(on) {
  const headline = document.querySelector(".detail-headline");
  if (!headline || !headline.querySelector(".detail-icon")) return;
  if (on) {
    if (iconCtl) { applyIconScale(iconScale); return; }
    iconCtl = document.createElement("label");
    iconCtl.className = "icon-size-ctl";
    iconCtl.innerHTML =
      "<span>아이콘 크기</span>" +
      '<input type="range" min="' + ICON_SCALE_MIN + '" max="' + ICON_SCALE_MAX + '" step="0.05" />' +
      '<span class="icon-size-val"></span>';
    iconCtl.querySelector("input").addEventListener("input", (e) => applyIconScale(e.target.value));
    headline.insertAdjacentElement("afterend", iconCtl);
    applyIconScale(iconScale);
  } else if (iconCtl) {
    iconCtl.remove();
    iconCtl = null;
  }
}

// ---- CTA 링크 편집 (라이브 / GitHub) --------------------------------------
// 상세 페이지에는 버튼만 있고 URL 을 넣을 곳이 없었다. 편집 모드에서 .cta-row 아래에
// 입력칸을 붙여 a[data-link] 의 href 를 직접 고친다. 저장은 collectData 가 이미
// a[data-link] 를 훑으므로 별도 처리가 없다.
const CTA_LABELS = { live: "라이브", github: "GitHub" };
let ctaEditBox = null;

// href 가 비었거나 "#" 이면 방문자 화면에서는 버튼을 감춘다.
function syncCtaVisibility() {
  const links = Array.from(document.querySelectorAll("a[data-link]"));
  links.forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    if (!href || href === "#") a.setAttribute("data-link-empty", "1");
    else a.removeAttribute("data-link-empty");
  });
  // 버튼이 하나도 안 남으면 줄 자체를 접는다 — 스택·상태와 한 줄을 쓰므로
  // 빈 채로 두면 gap 만큼 어색한 공백이 생긴다.
  const row = document.querySelector(".cta-row");
  if (row) {
    const anyVisible = isEditMode || links.some((a) => !a.hasAttribute("data-link-empty"));
    row.hidden = !anyVisible;
  }
}

function buildCtaEditor() {
  const row = document.querySelector(".cta-row");
  if (!row || ctaEditBox) return;
  const links = Array.from(document.querySelectorAll("a[data-link]"));
  if (!links.length) return;

  ctaEditBox = document.createElement("div");
  ctaEditBox.className = "cta-link-edit";
  links.forEach((a) => {
    const key = a.getAttribute("data-link");
    const label = document.createElement("label");
    const name = document.createElement("span");
    name.textContent = CTA_LABELS[key] || key;
    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "https://…  (비워두면 버튼이 숨겨집니다)";
    const cur = a.getAttribute("href") || "";
    input.value = cur === "#" ? "" : cur;
    input.addEventListener("input", () => {
      a.setAttribute("href", input.value.trim() || "#");
      syncCtaVisibility();
    });
    label.appendChild(name);
    label.appendChild(input);
    ctaEditBox.appendChild(label);
  });
  row.insertAdjacentElement("afterend", ctaEditBox);
}

// 저장된 href 를 불러온 뒤 입력칸에도 반영한다
function syncCtaInputs() {
  if (!ctaEditBox) return;
  Array.from(document.querySelectorAll("a[data-link]")).forEach((a, i) => {
    const input = ctaEditBox.querySelectorAll("input")[i];
    if (!input) return;
    const cur = a.getAttribute("href") || "";
    input.value = cur === "#" ? "" : cur;
  });
}

// ---- 글자 서식 툴바: 밑줄 · 글자색 · 자간 (편집 모드 전용) ------------------
// 선택 영역에 브라우저 내장 execCommand 로 적용해 코드를 가볍게 유지한다.
// 저장 때 sanitizeRich 가 <u> 와 색 span 만 남기므로 새로고침해도 서식이 유지된다.
const FMT_COLORS = ["#e6edf3", "#4c9dff", "#3fb950", "#d29922", "#ff7b72", "#d2a8ff"];
let fmtBar = null;
let savedRange = null; // 툴바를 누르는 사이 선택이 풀려도 되살리기 위해

function fmtField() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const n = sel.getRangeAt(0).commonAncestorContainer;
  const elm = n.nodeType === 1 ? n : n.parentElement;
  return elm && elm.closest ? elm.closest("[data-editable]") : null;
}
function restoreRange() {
  if (!savedRange) return false;
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedRange);
  return true;
}
function fmtExec(cmd, value, useCSS) {
  const sel = window.getSelection();
  // 색 선택기 등으로 포커스가 옮겨가 선택이 풀렸으면 되살린다
  if (!fmtField() || !sel || sel.isCollapsed) {
    if (!restoreRange()) return;
  }
  try {
    document.execCommand("styleWithCSS", false, !!useCSS);
    document.execCommand(cmd, false, value);
  } catch (e) {
    console.error("[detail] format failed", e);
  }
  fmtSync();
}
// ---- 자간 (letter-spacing) ----------------------------------------------
// execCommand 에는 자간 명령이 없다. 선택 영역을 직접 <span style="letter-spacing">
// 으로 감싸고, 되돌릴 때는 선택 안의 자간 span 을 벗긴다.
// (이 기능이 그동안 동작하지 않았던 이유: 툴바에 버튼만 없었던 게 아니라
//  sanitizeRich 가 자간 span 을 저장 시점에 통째로 벗겨내고 있었다. 둘 다 고쳤다.)
// 조작 방식은 한글(HWP) 과 같다 — [−][값][+] 로 눌러서 조금씩 좁히고 넓힌다.
// 고정 단계가 아니라 누적 증감이라, 줄 끝에서 넘어간 단어 하나를 끌어올릴 때까지
// 필요한 만큼만 좁힐 수 있다.
const LS_STEP = 0.01;   // 한 번 누를 때 0.01em (본문 14px 기준 약 0.14px)
const LS_MIN = -0.2;
const LS_MAX = 0.5;

function stripSpacingIn(root) {
  Array.from(root.querySelectorAll("span")).forEach((s) => {
    if (!s.style.letterSpacing) return;
    s.style.letterSpacing = "";
    if (!s.getAttribute("style")) unwrapEl(s);
  });
}

// 지금 선택 영역에 걸려 있는 자간(em). 없으면 0.
// 선택을 감싸고 있는 가장 가까운 자간 span 을 편집칸 경계까지 거슬러 찾는다.
function currentLetterSpacing() {
  const sel = window.getSelection();
  const r = sel && sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : savedRange;
  if (!r) return 0;
  // 선택이 자간 span 하나를 통째로 감싸고 있는 경우 (−/+ 를 연달아 누를 때의 상태).
  // 이때 commonAncestorContainer 는 span 의 부모라, 그냥 거슬러 올라가면 값을 놓친다.
  if (r.startContainer === r.endContainer && r.endOffset - r.startOffset === 1) {
    const only = r.startContainer.childNodes[r.startOffset];
    if (only && only.nodeType === 1 && only.style && only.style.letterSpacing) {
      return parseFloat(only.style.letterSpacing) || 0;
    }
  }
  const n = r.commonAncestorContainer;
  let elm = n.nodeType === 1 ? n : n.parentElement;
  while (elm && elm.nodeType === 1) {
    if (elm.style && elm.style.letterSpacing) return parseFloat(elm.style.letterSpacing) || 0;
    if (elm.hasAttribute && elm.hasAttribute("data-editable")) break;
    elm = elm.parentElement;
  }
  return 0;
}

// −/+ 한 칸. 현재 값을 읽어 누적으로 더하고 뺀다.
function nudgeLetterSpacing(delta) {
  if (!window.getSelection().rangeCount && !savedRange) return;
  const next = Math.max(LS_MIN, Math.min(LS_MAX,
    Math.round((currentLetterSpacing() + delta) * 100) / 100));
  applyLetterSpacing(next === 0 ? null : next.toFixed(2) + "em");
}

function lsReadout() {
  return fmtBar ? fmtBar.querySelector(".et-ls-val") : null;
}
function syncLsReadout() {
  const out = lsReadout();
  if (!out) return;
  const v = currentLetterSpacing();
  // 부호를 붙여 기본값(0)과 좁힘/넓힘이 한눈에 구분되게
  out.textContent = v === 0 ? "0" : (v > 0 ? "+" : "") + v.toFixed(2);
  out.classList.toggle("is-set", v !== 0);
}

function applyLetterSpacing(value) {
  const sel = window.getSelection();
  if (!fmtField() || !sel || sel.isCollapsed) {
    if (!restoreRange()) return;
  }
  const s = window.getSelection();
  if (!s || !s.rangeCount || s.isCollapsed) return;
  const field = fmtField();
  if (!field) return;

  const range = s.getRangeAt(0);
  let frag;
  try {
    frag = range.extractContents();
  } catch (e) {
    console.error("[detail] letter-spacing failed", e);
    return;
  }
  // 선택 안에 이미 걸려 있던 자간은 먼저 걷어낸다 (중첩 방지)
  const holder = document.createElement("div");
  holder.appendChild(frag);
  stripSpacingIn(holder);

  let inserted;
  if (value == null) {
    // '기본' = 자간 제거. 내용만 그대로 되돌려 넣는다.
    inserted = document.createDocumentFragment();
    const first = holder.firstChild, last = holder.lastChild;
    while (holder.firstChild) inserted.appendChild(holder.firstChild);
    range.insertNode(inserted);
    if (first && last) {
      const r = document.createRange();
      r.setStartBefore(first);
      r.setEndAfter(last);
      s.removeAllRanges();
      s.addRange(r);
      savedRange = r.cloneRange();
    }
  } else {
    const span = document.createElement("span");
    span.style.letterSpacing = value;
    while (holder.firstChild) span.appendChild(holder.firstChild);
    range.insertNode(span);
    // 선택은 span '안쪽'이 아니라 span '바깥쪽'을 감싸도록 잡는다.
    // −/+ 를 연달아 누르면 다음 번 extractContents 가 이 span 을 통째로 꺼내
    // stripSpacingIn 이 벗겨내므로, 껍데기 span 이 겹겹이 쌓이지 않는다.
    const r = document.createRange();
    r.setStartBefore(span);
    r.setEndAfter(span);
    s.removeAllRanges();
    s.addRange(r);
    savedRange = r.cloneRange();
  }
  field.normalize();
  fmtSync();
}

function fmtSync() {
  if (!fmtBar) return;
  const sel = window.getSelection();
  if (fmtField() && sel && sel.rangeCount && !sel.isCollapsed) {
    savedRange = sel.getRangeAt(0).cloneRange();
  }
  const active = !!savedRange;
  fmtBar.querySelectorAll("button, input").forEach((b) => { b.disabled = !active; });
  const label = fmtBar.querySelector(".et-label");
  if (label) label.textContent = active ? "선택 글자에 적용" : "글자를 드래그하세요";
  syncLsReadout(); // 선택이 바뀌면 자간 표시도 그 자리 값으로 따라간다
}
function setFormatBar(on) {
  if (on) {
    if (fmtBar) { fmtSync(); return; }
    fmtBar = document.createElement("div");
    fmtBar.className = "edit-toolbar";
    fmtBar.innerHTML =
      '<span class="et-label">글자를 드래그하세요</span>' +
      '<button class="et-btn" type="button" data-cmd="underline" title="밑줄 넣기/빼기"><u>밑줄</u></button>' +
      '<span class="et-sep"></span>' +
      FMT_COLORS.map((c) =>
        '<button class="et-swatch" type="button" data-color="' + c +
        '" title="글자색" style="background:' + c + '"></button>'
      ).join("") +
      '<input type="color" class="et-swatch et-color" title="색 직접 고르기" value="#4c9dff" />' +
      '<span class="et-sep"></span>' +
      '<span class="et-group">자간' +
      '<button class="et-btn et-ls" type="button" data-ls-step="-1" title="자간 좁히기 (0.01em 씩)">−</button>' +
      '<button class="et-ls-val" type="button" title="눌러서 기본값(0)으로">0</button>' +
      '<button class="et-btn et-ls" type="button" data-ls-step="1" title="자간 넓히기 (0.01em 씩)">+</button>' +
      "</span>" +
      '<span class="et-sep"></span>' +
      '<button class="et-btn" type="button" data-cmd="removeFormat" title="밑줄·색 지우기">지우기</button>';

    // 버튼을 눌러도 드래그한 선택이 풀리지 않게 (색 선택기는 열려야 하므로 제외)
    fmtBar.querySelectorAll("button").forEach((b) => {
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => {
        if (b.dataset.color) fmtExec("foreColor", b.dataset.color, true);
        else if (b.dataset.lsStep) nudgeLetterSpacing(Number(b.dataset.lsStep) * LS_STEP);
        else if (b.classList.contains("et-ls-val")) applyLetterSpacing(null);
        else if (b.dataset.cmd === "underline") fmtExec("underline", null, false);
        else if (b.dataset.cmd === "removeFormat") {
          fmtExec("removeFormat", null, true);
          applyLetterSpacing(null); // removeFormat 은 자간 span 을 못 지운다
        }
      });
    });
    const colorInput = fmtBar.querySelector(".et-color");
    colorInput.addEventListener("input", () => fmtExec("foreColor", colorInput.value, true));

    const badge = document.querySelector(".topbar .edit-badge");
    if (badge && badge.parentNode) badge.parentNode.insertBefore(fmtBar, badge);
    else document.body.appendChild(fmtBar);
    document.addEventListener("selectionchange", fmtSync);
    fmtSync();
  } else if (fmtBar) {
    document.removeEventListener("selectionchange", fmtSync);
    fmtBar.remove();
    fmtBar = null;
    savedRange = null;
  }
}

// ---- edit mode -----------------------------------------------------------
function setEditable(on) {
  document.querySelectorAll("[data-editable]").forEach((elm) => {
    elm.contentEditable = on ? "true" : "false";
  });
  // Refresh media empty-state copy (영상/사진 준비중 <-> 붙여넣기 안내).
  document.querySelectorAll("#featureList .feature").forEach((sec) => {
    const media = sec.querySelector(".media");
    if (media && !media.dataset.ytid && !media.querySelector(".media-img")) {
      const type = sec.querySelector(".type-btn.active").dataset.type;
      const url = sec.querySelector(".media-url").value;
      renderMedia(media, type, url);
    }
  });
}

function editPrefOn() {
  try { return localStorage.getItem(EDIT_PREF) !== "off"; } catch (e) { return true; }
}
function setEditPref(on) {
  try { localStorage.setItem(EDIT_PREF, on ? "on" : "off"); } catch (e) {}
}
// 배지가 곧 토글 버튼이다 (관리자일 때만 보인다) — index.html 과 동일 규칙
function syncEditBadge() {
  const badge = document.querySelector(".edit-badge");
  if (!badge) return;
  badge.hidden = !canEdit;
  badge.textContent = isEditMode ? "편집 모드 · 끄기" : "미리보기 · 편집 켜기";
  badge.classList.toggle("is-off", !isEditMode);
  badge.setAttribute("aria-pressed", String(isEditMode));
  badge.title = isEditMode
    ? "편집을 끄고 방문자에게 보이는 화면으로 봅니다"
    : "편집을 켭니다 (로그인 상태는 그대로)";
}
function applyEditMode(on) {
  isEditMode = on;
  document.body.classList.toggle("edit-mode", on);
  setEditable(on);
  setFormatBar(on);   // 밑줄·글자색·자간 툴바
  setIconSizeCtl(on); // 아이콘 크기 슬라이더
  if (on) {
    buildCtaEditor(); // 라이브·GitHub URL 입력칸
    syncCtaInputs();
  }
  syncCtaVisibility();
  if (on) {
    // Reveal everything so the admin can edit blocks below the fold.
    document.querySelectorAll(".reveal, .feature").forEach((elm) => elm.classList.add("is-visible"));
  }
  syncEditBadge();
  renderComments(); // 삭제 버튼 표시/숨김
}

function enableEditMode(email) {
  // 미리보기 iframe 안에서는 로그인 세션이 살아 있어도 편집 UI 를 켜지 않는다.
  // 방문자가 보는 화면을 확인하려는 것이므로 편집 흔적이 섞이면 안 된다.
  if (IS_PREVIEW) { disableEditMode(); return; }
  canEdit = true;
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "로그아웃";
  if (emailEl) emailEl.textContent = email || "";
  applyEditMode(editPrefOn()); // 지난번에 꺼뒀으면 꺼진 채로 시작
}

function disableEditMode() {
  canEdit = false;
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "관리자 로그인";
  if (emailEl) emailEl.textContent = "";
  applyEditMode(false);
}

// 상태 표시는 전부 영문 소문자로 통일한다. beta 를 포함해 4단계 순환.
const STATUS_CYCLE = ["planned", "in progress", "beta", "live"];
// 이전에 한글로 저장된 문서를 그대로 읽어도 영문으로 보이게 하는 변환표
const STATUS_ALIAS = { "기획중": "planned", "개발중": "in progress", "베타": "beta", "라이브": "live" };
function normalizeStatus(v) {
  const s = String(v == null ? "" : v).trim();
  if (STATUS_ALIAS[s]) return STATUS_ALIAS[s];
  return STATUS_CYCLE.indexOf(s) >= 0 ? s : "planned";
}

// ---- Firestore: detail content load/save ---------------------------------
async function loadDoc() {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    applyData(snap.exists() ? snap.data() : null);
  } catch (err) {
    console.error("[detail] load failed", err);
    applyData(null);
  }
}

async function saveDoc() {
  await setDoc(doc(db, COLLECTION, DOC_ID), collectData());
}

// ---- Comments ------------------------------------------------------------
let commentsCache = [];

function timeText(ts) {
  try {
    const d = ts && ts.toDate ? ts.toDate() : null;
    if (!d) return "방금";
    return d.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function renderComments() {
  const list = document.getElementById("commentList");
  const countEl = document.getElementById("commentCount");
  if (!list) return;
  if (countEl) countEl.textContent = String(commentsCache.length);
  if (!commentsCache.length) {
    list.innerHTML = '<p class="comment-empty">아직 후기가 없습니다. 첫 후기를 남겨주세요.</p>';
    return;
  }
  list.innerHTML = "";
  commentsCache.forEach((c) => {
    const item = el("div", "comment");
    const head = el("div", "comment-head");
    head.appendChild(el("span", "comment-name", c.name || "익명"));
    head.appendChild(el("span", "comment-time", timeText(c.createdAt)));
    if (isEditMode) {
      const del = el("button", "comment-del", "삭제");
      del.type = "button";
      del.addEventListener("click", () => removeComment(c.id));
      head.appendChild(del);
    }
    item.appendChild(head);
    const body = el("p", "comment-text");
    body.innerHTML = escapeHtml(c.text || "").replace(/\n/g, "<br>");
    item.appendChild(body);

    // Admin reply (shown to everyone)
    if (c.reply) {
      const reply = el("div", "comment-reply");
      reply.appendChild(el("span", "reply-label", "↳ 박승연"));
      const rt = el("p", "reply-text");
      rt.innerHTML = escapeHtml(c.reply).replace(/\n/g, "<br>");
      reply.appendChild(rt);
      item.appendChild(reply);
    }

    // Admin reply editor (edit mode only)
    if (isEditMode) {
      const box = el("div", "reply-edit");
      const ta = el("textarea", "reply-input");
      ta.placeholder = "답글 작성 (비우고 저장하면 답글 삭제)";
      ta.value = c.reply || "";
      const btn = el("button", "reply-btn", c.reply ? "답글 수정" : "답글 등록");
      btn.type = "button";
      btn.addEventListener("click", () => replyComment(c.id, ta.value));
      box.appendChild(ta);
      box.appendChild(btn);
      item.appendChild(box);
    }

    list.appendChild(item);
  });
}

function initComments() {
  const q = query(collection(db, COMMENTS), where("project", "==", PROJECT_ID));
  onSnapshot(
    q,
    (snap) => {
      commentsCache = [];
      snap.forEach((d) => commentsCache.push({ id: d.id, ...d.data() }));
      // newest first (client-side sort → no composite index needed)
      commentsCache.sort((a, b) => {
        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      renderComments();
    },
    (err) => console.error("[detail] comments listen failed", err)
  );

  const form = document.getElementById("commentForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameEl = document.getElementById("commentName");
      const textEl = document.getElementById("commentText");
      const name = (nameEl.value || "").trim();
      const text = (textEl.value || "").trim();
      if (!name) { alert("이름을 입력해주세요."); return; }
      if (!text) { alert("내용을 입력해주세요."); return; }
      if (name.length > 30) { alert("이름은 30자 이내로 입력해주세요."); return; }
      if (text.length > 500) { alert("내용은 500자 이내로 입력해주세요."); return; }
      const btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      try {
        await addDoc(collection(db, COMMENTS), {
          project: PROJECT_ID,
          name: name.slice(0, 30),
          text: text.slice(0, 500),
          createdAt: serverTimestamp(),
        });
        textEl.value = "";
      } catch (err) {
        console.error("[detail] comment add failed", err);
        alert("후기 등록 중 오류가 발생했습니다. (보안 규칙 배포 여부를 확인하세요)");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }
}

async function removeComment(id) {
  if (!isEditMode) return;
  if (!confirm("이 후기를 삭제할까요?")) return;
  try {
    await deleteDoc(doc(db, COMMENTS, id));
  } catch (err) {
    console.error("[detail] comment delete failed", err);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

async function replyComment(id, text) {
  if (!isEditMode) return;
  try {
    await updateDoc(doc(db, COMMENTS, id), {
      reply: (text || "").trim().slice(0, 500),
      repliedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[detail] reply failed", err);
    alert("답글 저장 중 오류가 발생했습니다. (보안 규칙 배포 여부를 확인하세요)");
  }
}

// ---- 기기 미리보기 --------------------------------------------------------
// 같은 페이지를 ?preview=1 로 iframe 에 띄운다. iframe 은 자기 폭이 곧 뷰포트라
// 미디어 쿼리가 실제 모바일처럼 걸린다. (CSS 로 폭만 좁히면 미디어 쿼리는 그대로다)
// 저장하지 않은 편집 내용도 보이도록 현재 DOM 상태를 postMessage 로 넘겨 덮어씌운다.
function initDevicePreview() {
  const btn = document.getElementById("dpBtn");
  const overlay = document.getElementById("dpOverlay");
  const stage = document.getElementById("dpStage");
  const frame = document.getElementById("dpFrame");
  const iframe = document.getElementById("dpIframe");
  const note = document.getElementById("dpNote");
  const closeBtn = document.getElementById("dpClose");
  if (!btn || !overlay || !iframe) return;

  let size = { w: 375, h: 812 };

  // 기기 폭이 화면보다 크면 통째로 축소해서 보여준다 (레이아웃은 기기 폭 그대로).
  function fit() {
    frame.style.width = size.w + "px";
    frame.style.height = size.h + "px";
    const availW = stage.clientWidth - 8;
    const availH = stage.clientHeight - 8;
    // 오버레이를 막 띄운 직후엔 아직 레이아웃이 안 잡혀 0 이 나온다.
    // 그대로 계산하면 배율이 음수가 되어 화면이 뒤집힌다 — 다음 프레임에 다시 잰다.
    if (availW <= 0 || availH <= 0) { requestAnimationFrame(fit); return; }
    const scale = Math.min(1, availW / size.w, availH / size.h);
    frame.style.transform = "scale(" + scale + ")";
    note.textContent = size.w + "×" + size.h + (scale < 1 ? " · " + Math.round(scale * 100) + "%" : "");
  }

  function pushData() {
    try {
      iframe.contentWindow.postMessage(
        { type: "site-preview-data", data: collectData() },
        location.origin
      );
    } catch (e) { /* 아직 로드 전이면 load 이벤트에서 다시 보낸다 */ }
  }

  function open() {
    overlay.hidden = false;
    void overlay.offsetHeight; // 페이드 시작 상태를 굳힌다
    overlay.classList.add("open");
    iframe.src = location.pathname + "?preview=1";
    fit();
  }
  function close() {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.hidden = true;
      iframe.src = "about:blank"; // 뒤에서 계속 돌지 않게
    }, 200);
  }

  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
  iframe.addEventListener("load", () => {
    // 미리보기 쪽도 자기 Firestore 를 한 번 읽으므로, 그 뒤에 덮어써야 한다.
    pushData();
    setTimeout(pushData, 700);
  });
  window.addEventListener("resize", () => { if (!overlay.hidden) fit(); });

  overlay.querySelectorAll(".dp-size").forEach((b) => {
    b.addEventListener("click", () => {
      overlay.querySelectorAll(".dp-size").forEach((o) => o.classList.remove("active"));
      b.classList.add("active");
      size = { w: Number(b.dataset.w), h: Number(b.dataset.h) };
      fit();
    });
  });
}

// 미리보기 iframe 쪽: 부모가 보낸 현재 편집 내용을 받아 그대로 그린다.
function initPreviewReceiver() {
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    if (!e.data || e.data.type !== "site-preview-data") return;
    applyData(e.data.data);
  });
}

// ---- Scroll reveal -------------------------------------------------------
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(".reveal, .feature");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((elm) => elm.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach((elm) => io.observe(elm));

  function revealInView() {
    targets.forEach((elm) => {
      if (elm.classList.contains("is-visible")) return;
      const r = elm.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        elm.classList.add("is-visible");
        io.unobserve(elm);
      }
    });
  }

  // If the page was painted while hidden, the observer (and rAF/timers) may
  // not fire and there is no layout to measure — reveal everything at once so
  // content never stays blank. Visible pages keep the animated observer reveal.
  if (document.visibilityState !== "visible") {
    targets.forEach((elm) => {
      elm.classList.add("is-visible");
      io.unobserve(elm);
    });
  }
  // Soft net for a visible page whose observer is slow to fire.
  setTimeout(revealInView, 400);
}

// ---- Boot ----------------------------------------------------------------
async function boot() {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Theme toggle.
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur =
        document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // Status badge cycle (edit mode only).
  document.querySelectorAll(".status").forEach((cell) => {
    // HTML 에 남아 있는 한글 기본값도 영문으로 맞춘다
    const init = normalizeStatus(cell.getAttribute("data-status"));
    cell.setAttribute("data-status", init);
    cell.textContent = init;
    cell.addEventListener("click", () => {
      if (!isEditMode) return;
      const cur = cell.getAttribute("data-status");
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      cell.setAttribute("data-status", next);
      cell.textContent = next;
    });
  });

  // External links: don't navigate while editing.
  document.querySelectorAll("a[data-link]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (isEditMode || !href || href === "#") e.preventDefault();
    });
  });

  // "+ 기능 추가"
  const addBtn = document.getElementById("addFeatureBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const list = document.getElementById("featureList");
      const idx = list.querySelectorAll(".feature").length;
      const sec = makeFeature(idx, null);
      list.appendChild(sec);
      sec.classList.add("is-visible");
      sec.querySelector(".feature-title").focus();
    });
  }

  // 편집 모드 토글 — 로그인은 그대로 두고 편집만 켜고 끈다.
  const editBadgeBtn = document.querySelector(".edit-badge");
  if (editBadgeBtn) {
    editBadgeBtn.addEventListener("click", () => {
      if (!canEdit) return;
      const next = !isEditMode;
      setEditPref(next);
      applyEditMode(next);
    });
  }

  // Admin login / logout.
  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    adminBtn.addEventListener("click", async () => {
      try {
        // 편집을 꺼둔 채 로그인 상태일 수 있으므로 isEditMode 가 아니라 canEdit 으로 판단한다.
        if (canEdit) {
          await signOut(auth);
          disableEditMode();
          return;
        }
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        if (res.user && res.user.email === ADMIN_EMAIL) {
          enableEditMode(res.user.email);
        } else {
          alert("편집 권한이 없는 계정입니다.");
          await signOut(auth);
        }
      } catch (err) {
        console.error("[detail] auth failed", err);
        alert("로그인/로그아웃 처리 중 오류가 발생했습니다.");
      }
    });
  }

  // Save.
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (!isEditMode) return;
      saveBtn.disabled = true;
      const original = saveBtn.textContent;
      saveBtn.textContent = "저장 중…";
      try {
        await saveDoc();
        saveBtn.textContent = "저장됨 ✓";
      } catch (err) {
        console.error("[detail] save failed", err);
        alert("저장 중 오류가 발생했습니다.");
        saveBtn.textContent = original;
      } finally {
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = "저장";
        }, 1200);
      }
    });
  }

  // Load content, then set up reveal + comments (features exist by now).
  await loadDoc();
  initReveal();
  initComments();
  if (IS_PREVIEW) initPreviewReceiver();
  else initDevicePreview();

  // Auth listener: edit mode ONLY for the admin email.
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) enableEditMode(user.email);
    else disableEditMode();
  });
}

boot();
