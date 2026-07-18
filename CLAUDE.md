# 퍼스널 사이트 — 작업 지침

## 프로젝트
- 메인 허브: `index.html`
- 배포: seungyeon980808-pixel.github.io/personal_site (GitHub Pages, main 브랜치)
- 기획서: `personal-site-plan.md` 참고. 작업 전 반드시 읽고 진행 상태 체크할 것.

---

## ⚠️ 수정 후 로컬 확인 링크 (묻지 않아도 항상)
파일을 고쳤으면 **작업 완료 보고에 반드시 로컬 링크를 함께 준다.** 사용자가 요청하기를 기다리지 않는다.

1. `.claude/launch.json` 의 `personal-site` 설정으로 서버를 띄운다 (포트 **4321**)
   - Claude Code: `preview_start` 도구에 `{name: "personal-site"}`
   - 수동: `npx -y serve -l 4321 .`
2. **서버를 끄지 않고 그대로 둔다.** 사용자가 직접 열어봐야 하므로 `preview_stop` 금지
3. 답변 끝에 링크를 적는다 — 고친 화면을 맨 위에 둔다
   ```
   - 홈 — http://localhost:4321/index.html
   - 상세 — http://localhost:4321/projects/<name>.html
   ```
4. 편집 모드에서만 보이는 기능을 고쳤다면 "관리자 로그인 후 보입니다" 를 덧붙인다

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
