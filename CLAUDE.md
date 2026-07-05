# 퍼스널 사이트 — 작업 지침

## 프로젝트
- 메인 허브: `index.html`
- 배포: seungyeon980808-pixel.github.io/personal_site (GitHub Pages, main 브랜치)
- 기획서: `personal-site-plan.md` 참고. 작업 전 반드시 읽고 진행 상태 체크할 것.

---

## 파일 구조
```
index.html                 메인 허브 (스타일·JS 인라인, 단일 파일 유지)
assets/detail.css          상세 페이지 공통 스타일
assets/detail.js           상세 페이지 공통 로직 (Firebase·편집·YouTube·스크롤)
projects/edunote.html      프로젝트 상세 (별도 HTML, 공통 assets 링크)
projects/physics-draw.html
projects/myfine.html
```
- **index.html은 단일 파일 유지** (기존 규칙 그대로, 인라인 CSS/JS).
- **상세 페이지는 프로젝트별 별도 HTML 파일** + 공통 `assets/` 공유.
  - 새 프로젝트 상세를 추가할 때: `projects/<kebab-name>.html`을 기존 파일 복사해
    만들고 `<body data-project="<name>">` 값만 바꾼다. index.html 카드에 링크 추가.

---

## 기술 스택
- Firebase 프로젝트: edunote-96bd7
- Firestore 컬렉션 `personal-site`
  - 메인 허브 문서: `main`
  - 상세 페이지 문서: `detail-<project>` (예: `detail-edunote`) — 프로젝트별 독립 문서
    - `features`: 배열 `[{title, desc, mediaType:'video'|'image', mediaUrl}]` (편집모드 무제한 추가/삭제)
- Firestore 컬렉션 `comments`: 프로젝트별 후기 `{project, name, text, createdAt}`
  - 익명+이름 작성(공개 쓰기), 실시간(onSnapshot), 관리자만 삭제
  - **보안 규칙은 `firestore.rules` 파일** → Firebase 콘솔에 배포해야 댓글 쓰기 활성화
- Google 로그인: seungyeon980808@gmail.com 계정만 편집 권한

---

## 섹션 구조 (index.html)
```
<!-- ===== HEADER ===== -->
<!-- ===== CHANNELS ===== -->
<!-- ===== PROJECTS ===== -->  프로젝트 카드 → 상세 페이지 링크
<!-- ===== CONTACT ===== -->
<!-- ===== ADMIN ===== -->
<!-- ===== MOTION ===== -->    키네틱 타이포·커서 글로우·카드 틸트·스크롤 리빌
<!-- ===== FIREBASE ===== -->
```

---

## 주의사항
- 편집 모드는 로그인 계정이 seungyeon980808@gmail.com 일 때만 활성화
- index.html 저장/불러오기는 항상 FIREBASE 섹션 함수만 사용
- 상세 페이지 저장/불러오기는 `assets/detail.js`의 load/save 만 사용
- 상세 페이지 편집 저장은 프로젝트별 문서(`detail-<project>`)에만 쓴다 → 서로·메인과 안 섞임
- 데이터 모델: 텍스트=`[data-field]`, 링크=`a[data-link]`, 영상=`[data-video-input]`(YouTube URL)
