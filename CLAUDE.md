# 퍼스널 사이트 — 작업 지침

## 프로젝트
- 파일: `personal-site-v1.0.0.html`
- 배포: seungyeon980808-pixel.github.io
- 기획서: `personal-site-plan.md` 참고. 작업 전 반드시 읽고 진행 상태 체크할 것.

---

## 기술 스택
- Firebase 프로젝트: edunote-96bd7
- Firestore 컬렉션: personal-site
- Google 로그인: seungyeon980808@gmail.com 계정만 편집 권한

---

## 섹션 구조
```
<!-- ===== HEADER ===== -->
<!-- ===== CHANNELS ===== -->
<!-- ===== PROJECTS ===== -->
<!-- ===== CONTACT ===== -->
<!-- ===== ADMIN ===== -->
<!-- ===== FIREBASE ===== -->
```

---

## 주의사항
- 편집 모드는 로그인 계정이 seungyeon980808@gmail.com 일 때만 활성화
- 데이터 저장/불러오기는 항상 FIREBASE 섹션 함수만 사용
- 단일 HTML 파일 유지 (모듈화 불필요)
