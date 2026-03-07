# 시스템 구조도 및 플로우차트 (System Architecture & Flowcharts)

## 1. 프론트엔드-백엔드 연동 아키텍처
현재 바이브 코딩으로 제작된 프론트엔드 산출물이 ASP.NET 백엔드와 어떻게 상호작용할 것인지에 대한 전체 흐름도입니다.

```mermaid
graph TD
    %% 프론트엔드 계층
    subgraph Client [Frontend (Browser)]
        UI[UI View (HTML/CSS)]
        JS[Core JS Logic (jQuery/ES5)]
        STATE[Local Config / Data Object]
        
        UI <--> JS
        JS <--> STATE
    end

    %% ASP.NET 백엔드
    subgraph Server [Backend (ASP.NET MVC 5)]
        API[Controller / Action Methods]
        DAL[Data Access Layer (ADO.NET / Dapper) ]
    end

    %% 데이터베이스
    subgraph Database [Database]
        MSSQL[(MSSQL 2019)]
        SP[Stored Procedures]
    end

    %% 연동 라인
    JS -- AJAX Request (JSON) --> API
    API -- Method Call --> DAL
    DAL -- Execute Command --> SP
    SP -- Read/Write --> MSSQL
    
    style Client fill:#f9f9f9,stroke:#333,stroke-width:2px
    style Server fill:#e6f3ff,stroke:#333,stroke-width:2px
    style Database fill:#ffe6e6,stroke:#333,stroke-width:2px
```

## 2. 사용자 예약 진행 플로우차트 (Step-by-Step UX)
사용자가 예약 페이지에 진입하여 'MD 먼저'와 '날짜 먼저'의 두 가지 패스를 어떻게 통과하는지 보여주는 로직 다이어그램입니다.

```mermaid
flowchart TD
    Start([예약 페이지 진입]) --> SelectFlow{플로우 선택}
    
    %% 분기 지점
    SelectFlow -- "MD 먼저 선택 클릭" --> MDStep[1. MD 목록 및 카테고리 렌더링]
    SelectFlow -- "날짜 먼저 선택 클릭" --> DateStep1[1. 달력 렌더링 <br> (공휴일 사전 필터링)]
    
    %% MD First Flow
    MDStep --> SelectMD[특정 MD 클릭]
    SelectMD --> DateStep2[2. 달력 렌더링]
    DateStep2 --> SelectDate2[달력에서 날짜 클릭]
    SelectDate2 --> TimeStep2[3. 해당 일자의 빈 시간대 노출]
    TimeStep2 --> SelectTime2[예약 시간 클릭]
    SelectTime2 --> FormFill
    
    %% Date First Flow
    DateStep1 --> SelectDate1[달력에서 날짜 클릭]
    SelectDate1 --> TimeStep1[2. 빈 시간대 노출]
    TimeStep1 --> SelectTime1[시간대 클릭]
    SelectTime1 --> MDStep2[3. 해당 시간에 스케줄이 빈 MD 노출]
    MDStep2 --> SelectMD2[특정 MD 클릭]
    SelectMD2 --> FormFill
    
    %% 공통 마감/제출
    FormFill[입력 폼 모달 오픈: <br> 사용자 정보 및 주요 안건 작성] --> Validate{필수 유효성 검사}
    Validate -- X (오류) --> FormFill
    Validate -- O (통과) --> Submit[AJAX 예약 제출 API 호출]
    Submit --> Notice([예약 확인 알림표시 및 상태 저장])

    style Start fill:#22c55e,color:#fff
    style Notice fill:#3b82f6,color:#fff
    style FormFill fill:#fbfbfb,stroke:#f59e0b,stroke-width:2px
```
