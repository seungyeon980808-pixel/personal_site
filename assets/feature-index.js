// =============================================================================
// feature-index.js — 검색형 기능 목록 엔진 (검색 + 카테고리 필터 + 카드 그리드)
// 프로젝트 상세 페이지 어디서든 재사용 가능한 범용 컴포넌트.
// 사용하는 페이지는 #fiSearch #fiChips #fiGrid #fiCount #fiEmpty 를 갖춘 뒤
// initFeatureIndex(items, categories) 를 호출한다.
// items: [{ cat, name, desc, key?, kw? }]
// categories: [{ id, label, emoji }]
// =============================================================================

const EMPTY_MESSAGES = [
  "그런 기능은 아직 없어요. 후기란에 요청해 주시면 다음 버전에 생길지도?",
  "검색 결과 0개 — 오타는 없었는지 한 번만 더 봐주세요.",
  "여기엔 없네요. 필터를 하나 풀어보는 건 어떨까요?",
];

export function initFeatureIndex(items, categories) {
  const searchEl = document.getElementById("fiSearch");
  const chipsEl = document.getElementById("fiChips");
  const gridEl = document.getElementById("fiGrid");
  const countEl = document.getElementById("fiCount");
  const emptyEl = document.getElementById("fiEmpty");
  if (!searchEl || !chipsEl || !gridEl) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const catMeta = {};
  categories.forEach((c) => (catMeta[c.id] = c));

  let activeCat = "all";
  let query = "";

  // ---- 카테고리 칩 ----
  chipsEl.appendChild(makeChip("all", "전체", "✨"));
  categories.forEach((c) => chipsEl.appendChild(makeChip(c.id, c.label, c.emoji)));

  function makeChip(id, label, emoji) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "fi-chip" + (id === "all" ? " active" : "");
    b.dataset.cat = id;
    b.setAttribute("aria-pressed", id === "all" ? "true" : "false");
    b.innerHTML = '<span class="fi-chip-emoji">' + emoji + "</span>" + escapeHtml(label);
    b.addEventListener("click", () => {
      activeCat = id;
      chipsEl.querySelectorAll(".fi-chip").forEach((el) => {
        const on = el.dataset.cat === id;
        el.classList.toggle("active", on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
      render();
    });
    return b;
  }

  // ---- 검색 ----
  searchEl.addEventListener("input", () => {
    query = searchEl.value.trim().toLowerCase();
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/") return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
    e.preventDefault();
    searchEl.focus();
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function highlight(text, q) {
    const safe = escapeHtml(text);
    if (!q) return safe;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return safe;
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + q.length));
    const after = escapeHtml(text.slice(idx + q.length));
    return before + "<mark>" + match + "</mark>" + after;
  }

  function matches(item, q) {
    if (!q) return true;
    const hay = (item.name + " " + item.desc + " " + (item.kw || "") + " " + (item.key || "")).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function render() {
    const filtered = items.filter((it) => (activeCat === "all" || it.cat === activeCat) && matches(it, query));

    gridEl.innerHTML = "";
    filtered.forEach((it, i) => {
      const meta = catMeta[it.cat] || {};
      const card = document.createElement("article");
      card.className = "fi-card";
      card.tabIndex = 0;
      if (!reduce) card.style.animationDelay = Math.min(i * 16, 260) + "ms";
      card.innerHTML =
        '<span class="fi-card-cat">' + (meta.emoji || "") + " " + escapeHtml(meta.label || "") + "</span>" +
        '<h3 class="fi-card-title">' + highlight(it.name, query) + "</h3>" +
        '<p class="fi-card-desc">' + highlight(it.desc, query) + "</p>" +
        (it.key ? '<span class="fi-card-key">' + escapeHtml(it.key) + "</span>" : "");

      const pop = () => {
        card.classList.remove("fi-pop");
        void card.offsetWidth; // reflow, 애니메이션 재시작
        card.classList.add("fi-pop");
      };
      card.addEventListener("click", pop);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pop();
        }
      });

      if (finePointer && !reduce) {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = "translateY(-3px) rotateX(" + (-py * 5).toFixed(2) + "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
        });
        card.addEventListener("pointerleave", () => {
          card.style.transform = "";
        });
      }

      gridEl.appendChild(card);
    });

    if (countEl) {
      countEl.textContent =
        query || activeCat !== "all"
          ? "총 " + items.length + "개 중 " + filtered.length + "개"
          : "총 " + items.length + "개";
    }
    if (emptyEl) {
      const isEmpty = filtered.length === 0;
      emptyEl.hidden = !isEmpty;
      if (isEmpty) emptyEl.textContent = EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)];
    }
  }

  render();
}
