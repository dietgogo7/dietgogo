바이브코딩(AI 기반 코드 생성) 시 프롬프트로 활용하기 최적화된 구조로 **`prd.md`** 내용을 재정리해 드립니다. 이 파일 내용을 그대로 복사해서 사용하시면 됩니다.

---

# [PRD] YES24 자체 설문조사 시스템 (YES Form) 구축

## 1. 프로젝트 개요
구글 폼, 네이버 폼 등 외부 도구 의존도를 낮추고, YES24 회원 체계 및 보상 시스템(포인트/쿠폰)과 직접 연동되는 자사 전용 설문조사 시스템을 구축한다. 수집된 데이터를 내부 마케팅 자산으로 활용하고, 사용자 경험(UX)을 일관되게 유지하는 것을 목표로 한다.

## 2. 사용자 및 권한
- **외부 사용자(고객):** 설문에 참여하는 YES24 회원 및 비회원.
- **내부 사용자(관리자):** 설문을 생성, 배포하고 결과를 분석하는 마케팅 및 운영팀.

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1. 관리자 서비스 (Admin Back-office)
AI가 관리자 기능을 생성할 때 참고할 핵심 기능 리스트입니다.

- **설문 폼 빌더:** - 드래그 앤 드롭 또는 클릭 기반의 문항 추가/삭제/순서 변경.
    - **지원 문항 타입:** 단일 선택(Radio), 다중 선택(Checkbox), 단답형(Text), 서술형(Textarea), 드롭다운(Select), 별점/척도형, 날짜 선택.
- **설문 설정:**
    - 설문 제목, 설명, 시작/종료 일시 설정.
    - 대상자 설정 (전체, 특정 등급 회원, 로그인 필수 여부).
    - 응답 제한 (중복 참여 방지, 선착순 마감).
- **결과 대시보드:**
    - 실시간 응답 수 및 문항별 통계 시각화(차트).
    - 전체 응답 내역 리스트 조회 및 엑셀(CSV) 다운로드.
- **보상 연동 설정:**
    - 설문 완료 시 지급할 YES 포인트 또는 쿠폰 코드 연동.

### 3.2. 프론트엔드 서비스 (User Interface)
실제 고객이 사용하는 화면에 대한 요구사항입니다.

- **반응형 렌더링:** PC(`yes24.com`)와 모바일(`m.yes24.com`) 도메인 어디서든 최적화된 UI 제공.
- **동적 문항 노출:** 관리자가 설정한 문항 데이터를 기반으로 실시간 폼 렌더링.
- **유효성 검사:** 필수 항목 미입력 시 안내 메세지 및 정규식 체크(이메일, 전화번호 등).
- **상태 유지:** 설문 진행 중 페이지 이탈 방지를 위한 임시 저장 기능(Local Storage 활용).
- **SEO 최적화:** 공개형 설문의 경우 검색 엔진 노출을 위한 시맨틱 마크업 및 메타 태그 적용.

---

## 4. 기술 스택 및 아키텍처 (Technical Requirements)

바이브코딩 시 환경 설정을 위해 반드시 준수해야 할 스택입니다.

- **Backend:** - **Framework:** .NET 10 (Target Framework)
    - **API:** ASP.NET Core Web API
- **Frontend:**
    - **Language:** JavaScript (ECMAScript 6+)
    - **Library:** jQuery 최신 버전 (기존 레거시 유지 관리 및 생산성 고려)
    - **Style:** 기존 YES24 공통 스타일 가이드 준수 및 반응형 CSS
- **Database:**
    - **DB:** MSSQL 2019
    - **Structure:** - 설문 마스터 테이블 (SurveyMaster)
        - 문항 정보 테이블 (SurveyQuestions - JSON 포맷 활용 권장)
        - 응답 내역 테이블 (SurveyResponses)
- **Performance:**
    - 트래픽 폭주 대비 응답 적재 시 Redis를 통한 비동기 처리 구조 지향.

---

## 5. 데이터 설계 가이드 (Data Schema Reference)

AI가 DB 스키마를 생성할 때 참고할 기본 구조입니다.

| 테이블명 | 주요 컬럼 설명 |
| :--- | :--- |
| **SurveyMaster** | SurveyID(PK), Title, Description, StartDate, EndDate, IsActive, RewardID |
| **SurveyQuestions** | QuestionID(PK), SurveyID(FK), Order, QuestionType, Title, Options(JSON), IsRequired |
| **SurveyResponses** | ResponseID(PK), SurveyID(FK), MemberID(Optional), RawData(JSON), IpAddress, CreatedAt |

---

