# 데이터 모델

> 기존 Firestore 구조를 확장한다. 새 컬렉션을 만들지 않는다.

---

## 저장 위치

```
Firestore
└── personal-site (컬렉션)
    ├── main (문서)              ← 메인 허브. 여기를 확장한다
    │   ├── fields   {}          기존: [data-field] 텍스트
    │   ├── links    {}          기존: 링크 href
    │   ├── order    []          기존: 프로그램 카드 순서
    │   ├── workflows []         기존 + problem/outcome 추가
    │   ├── picks    []          기존
    │   ├── thoughts []          ★ 신설
    │   └── gradient {}          ★ 신설
    └── detail-<program> (문서)  기존: 프로그램 상세
```

**개수가 변하는 배열은 `fields`에 넣을 수 없다.** `fields`는 `[data-field]` 한 칸에 값 하나를 대응시키는 구조라, 항목이 늘고 주는 데이터는 담기지 못한다. 기존 `order`가 배열로 따로 빠져 있는 것과 같은 이유다.

---

## 관계도

```
main
 ├─ thoughts[]  ──(선택)──> workflows[].id      생각 → 관련 프로젝트
 │
 ├─ workflows[]
 │    └─ steps[].programId ──> 프로그램 카드 [data-project]
 │
 └─ picks[]                                      (독립)

프로그램 카드의 소속 태그는 workflows 에서 파생한다.
카드에 직접 저장하지 않는다 — 흐름을 고칠 때 양쪽이 어긋난다.
```

---

## thoughts[] — 생각 카드 (신설)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | `th-<시각>-<난수>` |
| `title` | string | 한 줄 제목 |
| `body` | string | 2~3줄 본문. `<br>`만 허용 |
| `at` | string | `YYYY-MM-DD`. 표시·정렬용 |
| `pinned` | boolean | 맨 앞 고정 |
| `workflowId` | string \| null | 관련 프로젝트 (선택) |

```json
{
  "id": "th-abc-1",
  "title": "교사가 한가해야 교육이 자란다",
  "at": "2026-07-23",
  "pinned": true,
  "workflowId": "wf-exam",
  "body": "수업 준비에 쓰는 시간의 절반은 도구가 없어서 생기는 낭비다.<br>그 절반을 줄이면 남는 시간은 전부 아이들에게 간다."
}
```

정렬: `pinned` 먼저 → `at` 내림차순.

> ⚠️ 가정 5: 태그 없이 시작한다 — 나중에 필요하면 `tags[]` 추가

---

## workflows[] — 프로젝트 (확장)

기존 구조에 **`problem`과 `outcome` 두 필드를 추가**한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | string | |
| `name` | string | 프로젝트 이름 |
| `tag` | string | 프로그램 카드에 붙는 짧은 태그 |
| `problem` | string | ★ **어떤 게 불편했는가.** 화면에서 가장 크게 |
| `desc` | string | 보조 설명 |
| `outcome` | string | ★ **그래서 어떻게 됐는가.** 한 줄 |
| `steps[]` | array | `{ programId, role }` |

```json
{
  "id": "wf-exam",
  "name": "시험문항 출제 워크플로우",
  "tag": "시험 출제",
  "problem": "시험 문제 하나 내는 데 저녁이 다 간다",
  "desc": "소재를 모으고, 그림을 그리고, 한글로 옮기는 일이 전부 따로 논다.",
  "outcome": "소재 찾기부터 조판까지 한 자리에서 끝난다",
  "steps": [
    { "programId": "7", "role": "명제 수집 · 문항 조립" },
    { "programId": "1", "role": "문항용 그림 제작" },
    { "programId": "3", "role": "한글 문서 조판" }
  ]
}
```

`steps[].programId`는 프로그램 카드의 `data-project` 값이다. 이름은 저장하지 않고 화면에서 읽는다 — 카드 이름을 고쳤을 때 옛 이름을 붙들지 않기 위해서다.

---

## gradient{} — 그라데이션 설정 (신설)

```json
{ "preset": "sunset" }
```

전역 색조합 이름. 지금은 숨은 `[data-field]` 한 칸(`gradPreset`)에 넣고 있는데, 설정이 늘어날 것을 대비해 객체로 옮긴다.

**단어별 색은 본문 HTML 안에 산다** — 별도 배열로 빼지 않는다.

```html
<span class="grad" data-c="0">교사가</span> 한가하면,
<span class="grad" data-c="3">교육이</span> 자란다
```

| 속성 | 값 |
|---|---|
| `class="grad"` | 그라데이션 적용 표시 |
| `data-c` | 팔레트 색 번호 `0`~`4`. 없으면 전역 프리셋 |

### 저장 규칙 — 중요

`sanitizeBreaks()`는 `<br>` 외 모든 태그를 벗긴다. 여기에 **화이트리스트를 정확히 지정**해야 한다.

- 통과: `<span>` 중 `class="grad"`인 것
- 유지 속성: `class`, `data-c` **둘만**
- 나머지 속성은 전부 제거 — `style` 통로를 열면 저장 데이터로 임의 CSS가 흘러든다

---

## picks[] — 소개 (현행 유지)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` `kind` `name` `by` `desc` `url` | string | `kind`: `program` \| `mcp` \| `service` \| `library` |

---

## 저장·불러오기 연결

`SiteReorder`가 `order`를 다루는 방식을 그대로 따른다.

```js
// 수집
if (window.SiteThoughts) data.thoughts = window.SiteThoughts.getData();

// 적용 — 반드시 fields 를 채운 뒤에
// (생각/흐름이 프로그램 이름을 카드 DOM 에서 읽으므로)
if (window.SiteThoughts) window.SiteThoughts.applyData(data.thoughts);
```

> ⚠️ 가정 7: 기존 `personal-site/main` 문서를 확장한다 — 문서를 나누고 싶으면 알려주세요

---

## 하위 호환

| 상황 | 처리 |
|---|---|
| `thoughts` 없음 | 빈 배열. "아직 없습니다" 표시 |
| `workflows[].problem` 없음 | `desc`를 대신 크게 표시 |
| `gradient` 없음 | 기존 `fields.gradPreset` 참조, 없으면 `default` |
| 기존 `<span class="grad">` (data-c 없음) | 전역 프리셋으로 렌더. 마이그레이션 불필요 |

기존 데이터를 지우거나 옮기지 않는다. 새 필드가 없으면 없는 대로 동작한다.
