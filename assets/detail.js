// =========================================================================
// detail.js — 프로젝트 상세 페이지 공통 로직
//   - Firebase(Firestore) 로 프로젝트별 문서 load/save
//   - seungyeon980808@gmail.com 로그인 시 편집 모드
//   - 기능 블록에 YouTube 링크를 붙여넣으면 영상 임베드
//   - 스크롤 시 섹션이 슬라이드/페이드로 등장
//
//   문서: collection "personal-site", doc "detail-<project>"
//   <body data-project="edunote"> 의 값으로 문서를 고른다.
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
const ADMIN_EMAIL = "seungyeon980808@gmail.com";
const PROJECT_ID = document.body.dataset.project || "unknown";
const DOC_ID = "detail-" + PROJECT_ID;

let app, auth, db;
let isEditMode = false;

// ---- YouTube helpers -----------------------------------------------------
function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/
  );
  return m ? m[1] : null;
}

function renderVideo(container, url) {
  const id = youtubeId(url);
  container.innerHTML = "";
  if (id) {
    const thumb = document.createElement("img");
    thumb.className = "thumb";
    thumb.loading = "lazy";
    thumb.alt = "영상 미리보기";
    thumb.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    const play = document.createElement("div");
    play.className = "playbtn";
    play.textContent = "▶";
    container.appendChild(thumb);
    container.appendChild(play);
    container.dataset.ytid = id;
  } else {
    const empty = document.createElement("div");
    empty.className = "video-empty";
    empty.textContent = isEditMode ? "아래에 YouTube 링크를 붙여넣기" : "영상 준비중";
    container.appendChild(empty);
    delete container.dataset.ytid;
  }
}

// Click facade -> load the real iframe (skip while editing).
function wireVideoClicks() {
  document.querySelectorAll(".video[data-video]").forEach((container) => {
    container.addEventListener("click", () => {
      if (isEditMode) return;
      const id = container.dataset.ytid;
      if (!id) return;
      container.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' +
        id +
        '?autoplay=1&rel=0" title="영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    });
  });
}

// ---- Serialization -------------------------------------------------------
function collectData() {
  const data = { fields: {}, links: {}, videos: {} };
  document.querySelectorAll("[data-field]").forEach((el) => {
    if (el.classList.contains("status")) {
      data.fields[el.getAttribute("data-field")] = el.getAttribute("data-status");
    } else {
      data.fields[el.getAttribute("data-field")] = el.textContent.trim();
    }
  });
  document.querySelectorAll("a[data-link]").forEach((a) => {
    data.links[a.getAttribute("data-link")] = a.getAttribute("href");
  });
  document.querySelectorAll("[data-video-input]").forEach((input) => {
    const key = input.getAttribute("data-video-input");
    const val = input.value.trim();
    if (val) data.videos[key] = val;
  });
  return data;
}

function applyData(data) {
  data = data || {};
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, val]) => {
      const el = document.querySelector('[data-field="' + key + '"]');
      if (!el) return;
      if (el.classList.contains("status")) {
        el.setAttribute("data-status", val);
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    });
  }
  if (data.links) {
    Object.entries(data.links).forEach(([key, href]) => {
      const a = document.querySelector('a[data-link="' + key + '"]');
      if (a && href) a.setAttribute("href", href);
    });
  }
  // Videos: fill inputs and render facades.
  document.querySelectorAll(".video[data-video]").forEach((container) => {
    const key = container.getAttribute("data-video");
    const url = (data.videos && data.videos[key]) || "";
    const input = document.querySelector('[data-video-input="' + key + '"]');
    if (input) input.value = url;
    renderVideo(container, url);
  });
}

// ---- Edit mode -----------------------------------------------------------
function setEditable(on) {
  document.querySelectorAll("[data-editable]").forEach((el) => {
    el.contentEditable = on ? "true" : "false";
  });
  // Refresh empty-state copy for video facades.
  document.querySelectorAll(".video[data-video]").forEach((container) => {
    if (!container.dataset.ytid) {
      const key = container.getAttribute("data-video");
      const input = document.querySelector('[data-video-input="' + key + '"]');
      renderVideo(container, input ? input.value : "");
    }
  });
}

function enableEditMode(email) {
  isEditMode = true;
  document.body.classList.add("edit-mode");
  setEditable(true);
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "로그아웃";
  if (emailEl) emailEl.textContent = email || "";
}

function disableEditMode() {
  isEditMode = false;
  document.body.classList.remove("edit-mode");
  setEditable(false);
  const btn = document.getElementById("adminBtn");
  const emailEl = document.getElementById("userEmail");
  if (btn) btn.textContent = "관리자 로그인";
  if (emailEl) emailEl.textContent = "";
}

// ---- Status badge cycle (edit mode) --------------------------------------
const STATUS_CYCLE = ["live", "개발중", "기획중"];

// ---- Firebase load/save --------------------------------------------------
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

// ---- Scroll reveal -------------------------------------------------------
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(".reveal, .feature");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
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
  targets.forEach((el) => io.observe(el));

  // Safety net: reveal whatever is already in the viewport on load, in case
  // the observer is slow to fire (e.g. the page was painted while hidden).
  // Below-the-fold sections still wait for scroll via the observer.
  setTimeout(() => {
    targets.forEach((el) => {
      if (el.classList.contains("is-visible")) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("is-visible");
        io.unobserve(el);
      }
    });
  }, 300);
}

// ---- Boot ----------------------------------------------------------------
function boot() {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  wireVideoClicks();
  initReveal();

  // Video URL inputs -> live re-render of the facade.
  document.querySelectorAll("[data-video-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.getAttribute("data-video-input");
      const container = document.querySelector('.video[data-video="' + key + '"]');
      if (container) renderVideo(container, input.value);
    });
    input.addEventListener("click", (e) => e.stopPropagation());
  });

  // Status badge click cycle (edit mode only).
  document.querySelectorAll(".status").forEach((cell) => {
    cell.addEventListener("click", () => {
      if (!isEditMode) return;
      const cur = cell.getAttribute("data-status");
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      cell.setAttribute("data-status", next);
      cell.textContent = next;
    });
  });

  // Don't navigate external links while editing.
  document.querySelectorAll("a[data-link]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (isEditMode || !href || href === "#") e.preventDefault();
    });
  });

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

  // Auth listener: edit mode ONLY for the admin email.
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) enableEditMode(user.email);
    else disableEditMode();
  });

  // Initial content load (public visitors see saved content).
  loadDoc();
}

boot();
