# 공개 문서함 배포

공유 주소: https://psy.ai.kr/docsbox/

기존 대표 도메인 설정에 따라 https://www.psy.ai.kr/docsbox/ 로 이동한다. 실제 파일과 본문 색인은 이 저장소의 `docsbox/`에 있으며, 외부 문서함을 iframe으로 표시하거나 외부 사이트로 보내는 방식이 아니다.

2026-10-21 기준 공개 승인된 실제 PDF·HWP 13개와 검색 색인을 배치했다. 원본 스냅샷은 `seungyeon980808-pixel/docfinder`의 `gh-pages` 커밋 `396ac28e6b0da4559a0071637023c6d9739424cd`이다. 문서함은 브라우저에서 검색·미리보기를 처리하며 Render 서버를 호출하지 않는다. 출처와 이용조건은 `docsbox/library/sources.html`에 표시한다.

갱신할 때는 승인된 문서만으로 DocFinder 공개 스냅샷을 생성하고, 배포 허용 파일 검증과 원본 SHA-256 검증 후 `docsbox/`를 갱신한다. 개인 문서함·서버 데이터·환경 변수·비공개 파일은 복사하지 않는다. 새 주소의 목록 13개, 본문 검색, PDF·HWP 미리보기를 확인한다. 기본 홈페이지 파일과 CNAME은 문서함 추가를 위해 변경할 필요가 없다.
