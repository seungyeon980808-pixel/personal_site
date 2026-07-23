# 프로젝트 스펙 — AI 작업 규칙

> 이 사이트를 고칠 때 지켜야 할 것. 상위 규칙은 루트 `CLAUDE.md`, 프로젝트 규칙은 `98_pesnal_site/CLAUDE.md`를 따른다. 여기는 이번 개편에서 **추가로** 지킬 내용이다.

---

## 스택 — 바꾸지 않는다

| 항목 | 내용 |
|---|---|
| 프런트 | 순수 HTML · CSS · JS. `index.html` 단일 파일 유지 |
| 데이터 | Firebase Firestore (`edunote-96bd7`) |
| 배포 | GitHub Pages, `main` 브랜치 |
| 셰이더 | `@paper-design/shaders-react` → `assets/shader/shader-bg.js` 단일 번들 |

**React는 셰이더 번들에만 쓴다.** 페이지 로직을 React로 옮기지 않는다. 번들 소스는 `shader-experiment/`에 있고, 고쳤으면 다시 빌드한다.

```bash
cd shader-experiment && npx vite build --config vite.config.bg.js
```

> ⚠️ 가정 6: 배포는 GitHub Pages `main` 유지

---

## 저장 데이터 — 절대 규칙

### 1. `sanitizeBreaks()` 화이트리스트를 넓히지 말 것

`<br>`과 `<span class="grad" data-c="N">`만 통과한다. 속성은 `class`·`data-c` 둘만 남긴다.

`style` 속성을 열면 저장 데이터를 통해 임의 CSS가 페이지로 들어온다. 편의를 위해서라도 열지 않는다.

### 2. 파생 가능한 값을 저장하지 말 것

프로그램 카드의 소속 태그는 `workflows[]`에서 계산한다. 카드에 직접 저장하면 흐름을 고쳤을 때 한쪽만 바뀐다.

같은 이유로 흐름 안의 프로그램 **이름을 저장하지 않는다.** `programId`만 저장하고 이름은 카드 DOM에서 읽는다.

### 3. 배열은 `fields`에 넣지 말 것

`fields`는 `[data-field]` 한 칸 = 값 하나 구조다. 개수가 변하는 데이터(`thoughts` · `workflows` · `picks`)는 `order`처럼 최상위 키로 뺀다.

### 4. `applyData` 순서

프로그램 이름을 DOM에서 읽는 모듈은 **`fields`를 채운 뒤에** 그려야 한다. 앞에 두면 옛 이름이 남는다.

### 5. 자동으로 넣은 것은 저장하지 말 것

시스템이 채운 값에는 표시를 남기고 저장 단계에서 걷어낸다 (`grad-auto` 방식). 저장해 버리면 "사용자가 정한 것"과 구분이 사라져 되돌릴 수 없다.

---

## CSS 우선순위 함정

`index.html`은 단일 파일이라 **뒤에 오는 규칙이 이긴다.** 새 규칙을 파일 앞쪽에 넣으면 조용히 무시된다.

- 새 규칙은 `</style>` 직전에 넣는다
- 기존 규칙을 덮어야 하면 `body`를 앞에 붙여 특이도를 올린다
- 적용됐는지는 `getComputedStyle`로 **확인한 뒤** 보고한다

이 함정에 이미 두 번 걸렸다. 레이아웃 규칙이 통째로 무시되고 있었다.

---

## 성능 규칙

| 규칙 | 이유 |
|---|---|
| 움직이는 배경 위 `backdrop-filter` 금지 | 매 프레임 블러 재계산. 페이지 전체가 버벅인다 |
| 전체 화면 애니메이션 레이어 최대 2장 | 합성 비용이 장수에 비례 |
| `transform` · `opacity`만 애니메이션 | 레이아웃 재계산 회피 |
| 화면 밖·백그라운드 탭에서 rAF 정지 | |
| 셰이더 픽셀 상한 유지 | 라이브러리 기본은 2배 해상도 |
| `prefers-reduced-motion` 존중 | |

**기준: 일반 노트북에서 스크롤이 끊기지 않을 것.**

---

## 검증 — 보고 전에 확인한다

"고쳤습니다"라고 말하기 전에 실제로 확인한다.

1. 브라우저에서 열고 콘솔 에러 확인
2. 바꾼 값을 `getComputedStyle` 또는 DOM 조회로 측정
3. 저장 왕복 확인 — `_collectData()` → `_applyData()` 후에도 살아남는지
4. 확인 못 한 것은 **못 했다고 말한다**

특히 이 환경에서는 브라우저 패널이 안 떠 있으면 렌더링이 멈춘다. 캔버스 크기가 `0`으로 나오거나 트랜지션이 진행되지 않으면 **버그가 아니라 측정 불가**다. 이 경우 사용자에게 직접 확인을 요청한다.

---

## 기존 기능을 깨지 않는다

이번 개편에서 건드리면 안 되는 것.

- 편집 모드 (`[data-editable]` contenteditable 전환)
- 프로그램 카드 모달 — `.proj-body` 노드를 카드에서 꺼내 모달로 옮긴다. 이 노드를 지우거나 복제하지 않는다
- 카드 순서 변경 (`SiteReorder`)
- 후기 (`comments` 컬렉션)
- 기기 미리보기
- 프로그램 상세 페이지 (`projects/*.html`, `detail-<name>` 문서)

새 모듈은 `window.SiteXxx = { setEnabled, getData, applyData }` 형태로 만들고 기존 3개 지점에 연결한다 — 편집 모드 토글 · `collectData` · `applyData`.

---

## Git

- Conventional Commits (`feat:` `fix:` `style:` `chore:` `docs:`)
- 작업 후 push까지
- **버전은 사용자가 명시적으로 지시할 때만 올린다.** UI 하단 버전 문자열과 `?v=` 캐시버스트 모두 포함
- `shader-experiment/node_modules`는 커밋하지 않는다
