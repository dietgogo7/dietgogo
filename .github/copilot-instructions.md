# Copilot / Gemini Code Assist Project Instructions

## 0. 기본 목적

본 프로젝트는 **Vibe Coding(빠른 프로토타이핑)** 목적이다.

- 초기 단계에서는 DB를 사용하지 않는다.
- 모든 조회 데이터는 JSON 파일 기반으로 처리한다.
- 등록/수정/삭제는 Ajax POST + console.log 출력까지만 구현한다.
- 최종 단계에서 JSON 구조를 그대로 DB 테이블로 이관할 예정이므로
  데이터 모델 설계는 반드시 정규화 가능 구조로 작성한다.
- 반드시 한글로 대답한다

---

## 1. 기술 스택 고정

### ❌ 사용 금지
- Vue / React / Angular
- TypeScript
- class 기반 프레임워크

### ✅ 사용 허용
- JavaScript ES5 ~ ES6
- jQuery 3.5.x
- Bootstrap (CSS만)

---

## 2. 데이터 처리 규칙

### 조회(Read)

- 반드시 `/data/*.json` 파일을 생성하여 읽는다.
- Ajax GET 방식 사용
- 예:

```js
$.getJSON('/data/users.json', function(data){});
