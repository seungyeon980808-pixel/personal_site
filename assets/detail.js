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

let app, auth, db;
let isEditMode = false;

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
  title.textContent = f.title || "";
  const desc = el("p", "feature-desc");
  desc.dataset.editable = "1";
  desc.textContent = f.desc || "";
  const remove = el("button", "feature-remove", "이 기능 삭제");
  remove.type = "button";
  textCol.appendChild(num);
  textCol.appendChild(title);
  textCol.appendChild(desc);
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
      title: (sec.querySelector(".feature-title").textContent || "").trim(),
      desc: (sec.querySelector(".feature-desc").textContent || "").trim(),
      mediaType: sec.querySelector(".type-btn.active").dataset.type,
      mediaUrl: (sec.querySelector(".media-url").value || "").trim(),
    });
  });
  return out;
}

// ---- serialization (hero fields + links + features) ----------------------
function collectData() {
  const data = { fields: {}, links: {}, features: collectFeatures() };
  document.querySelectorAll("[data-field]").forEach((elm) => {
    if (elm.classList.contains("status")) {
      data.fields[elm.getAttribute("data-field")] = elm.getAttribute("data-status");
    } else {
      data.fields[elm.getAttribute("data-field")] = elm.textContent.trim();
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
        elm.setAttribute("data-status", val);
        elm.textContent = val;
      } else {
        elm.textContent = val;
      }
    });
  }
  if (data.links) {
    Object.entries(data.links).forEach(([key, href]) => {
      const a = document.querySelector('a[data-link="' + key + '"]');
      if (a && href) a.setAttribute("href", href);
    });
  }
  renderFeatures(data.features);
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

function enableEditMode(email) {
  isEditMode = true;
  document.body.classList.add("edit-mode");
  setEditable(true);
  // Reveal everything so the admin can edit blocks below the fold.
  document.querySelectorAll(".reveal, .feature").forEach((elm) => elm.classList.add("is-visible"));
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "로그아웃";
  if (emailEl) emailEl.textContent = email || "";
  renderComments(); // re-render to show delete buttons
}

function disableEditMode() {
  isEditMode = false;
  document.body.classList.remove("edit-mode");
  setEditable(false);
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "관리자 로그인";
  if (emailEl) emailEl.textContent = "";
  renderComments(); // re-render to hide delete buttons
}

const STATUS_CYCLE = ["live", "개발중", "기획중"];

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

  // Status badge cycle (edit mode only).
  document.querySelectorAll(".status").forEach((cell) => {
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

  // Admin login / logout.
  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    adminBtn.addEventListener("click", async () => {
      try {
        if (isEditMode) {
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

  // Auth listener: edit mode ONLY for the admin email.
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) enableEditMode(user.email);
    else disableEditMode();
  });
}

boot();
