# 리딩런 BackOffice - API 엔드포인트 명세

## 공통 규칙
- 모든 GET 요청: `$.getJSON('/api/...')`
- 모든 POST 요청: `$.ajax({ method: 'POST', contentType: 'application/json', data: JSON.stringify(...) })`
- 응답 형식: `{ List: [...], TotalCount: N }` (목록) / 단일 객체 (상세)
- 프로퍼티 명: DB 스키마 컬럼명과 동일

---

## 리딩런 (ReadingRun)

### GET /api/ReadingRun/Dashboard
대시보드 누적 통계 조회
**Response:**
```json
{
  "Campaign_Start_Date": "YYYY-MM-DD",
  "Update_Datetime": "YYYY-MM-DD HH:MM:SS",
  "Total_Participant_Count": 0,
  "Total_Session_Count": 0,
  "Total_Reading_Time": 0,
  "Total_Complete_Times": 0,
  "Total_Donation_Amount": 0,
  "Starter_Join_Times": 0,
  "Starter_Complete_Times": 0,
  "Starter_Remain_Complete_Count": 0,
  "Starter_Donation_Amount": 0,
  "Half_Join_Times": 0,
  "Half_Complete_Times": 0,
  "Half_Remain_Complete_Count": 0,
  "Half_Donation_Amount": 0,
  "Marathon_Join_Times": 0,
  "Marathon_Complete_Times": 0,
  "Marathon_Remain_Complete_Count": 0,
  "Marathon_Donation_Amount": 0
}
```
*Source: tReadingRunDailySummary 최신 레코드 집계*

### GET /api/ReadingRun/DailySummary
일별 통계 목록
**Params:** `page`, `pageSize`
**Response:** `{ List: [tReadingRunDailySummary], TotalCount }`

### GET /api/ReadingRun/CourseStatus
코스별 현황 목록
**Params:** `Course_Name`, `Complete_Yn`, `Start_Date`, `End_Date`, `Member_Id`, `page`, `pageSize`
**Response:** `{ List: [tReadingRunResult + Member_Id], TotalCount }`

### GET /api/ReadingRun/CourseStatus/Excel
코스별 현황 엑셀 다운로드 (위 동일 파라미터 + `excel=1`)

### GET /api/ReadingRun/DonationSummary
코스별 기부 현황 요약
**Response:**
```json
{
  "Update_Datetime": "...",
  "Total_Donation_Amount": 0,
  "Starter_Donation_Amount": 0,
  "Half_Donation_Amount": 0,
  "Marathon_Donation_Amount": 0
}
```
*Source: tReadingRunDailySummary*

### GET /api/ReadingRun/DonationList
기부 이력 목록 (완주 + 기부 적용된 결과)
**Params:** `page`, `pageSize`
**Response:** `{ List: [tReadingRunResult - Donation_Apply_Yn=true], TotalCount }`

### GET /api/ReadingRun/DonationMembers
기부 회차별 참여 회원 목록
**Params:** `Course_Round_No`, `page`, `pageSize`
**Response:** `{ List: [{ Member_No, Member_Id }], TotalCount }`

---

## 회원관리 (Member)

### GET /api/Member/List
회원 목록 조회
**Params:** `Member_Id`, `Member_No`, `Current_Course`, `Start_Date`, `End_Date`, `page`, `pageSize`
**Response:** `{ List: [tReadingRunMember + Member_Id], TotalCount }`

### GET /api/Member/List/Excel
회원 목록 엑셀 다운로드

### GET /api/Member/Detail
회원 상세 정보
**Params:** `Member_No`, `Event_No`
**Response:** `tReadingRunMember + Member_Id + Badge_Count + Gift_Count`

### GET /api/Member/ResultList
회원 챌린지 참여 결과 목록
**Params:** `Member_No`, `Event_No`, `page`, `pageSize`
**Response:** `{ List: [tReadingRunResult + Activity_Date], TotalCount }`

### GET /api/Member/ActivityList
회원 독서 활동(세션) 목록
**Params:** `Member_No`, `Event_No`, `page`, `pageSize`
**Response:** `{ List: [tReadingRunActivity], TotalCount }`

### GET /api/Member/SessionDetail
특정 활동일의 세션 상세
**Params:** `Member_No`, `Event_No`, `Activity_Date`
**Response:** `{ List: [tReadingRunActivity + Book_Name] }`

### GET /api/Member/BadgeList
회원 배지 획득 이력
**Params:** `Member_No`, `Event_No`
**Response:** `{ List: [tReadingRunRewardHistory - Reward_Type='BADGE'] }`

### GET /api/Member/GiftList
회원 상품권 발급 이력
**Params:** `Member_No`, `Event_No`
**Response:** `{ List: [tReadingRunRewardHistory - Reward_Type='GIFT'] }`

---

## 리워드관리 (Reward)

### GET /api/Reward/BadgeList
배지 목록 조회
**Params:** `Event_No`, `page`, `pageSize`
**Response:** `{ List: [tReadingRunRewardMaster - Delete_YN=false], TotalCount }`

### POST /api/Reward/BadgeRegister
배지 등록
**Body:** `tReadingRunRewardMaster` (Seq 제외)

### POST /api/Reward/BadgeUpdate
배지 수정
**Body:** `{ Seq, Reward_Name, Reward_Description, Reward_Message, Reward_Value, Use_YN }`

### POST /api/Reward/BadgeDelete
배지 삭제 (Delete_YN = true)
**Body:** `{ Seqs: [1, 2, 3] }`

### GET /api/Reward/BadgeSummary
배지 획득 통계 요약
**Params:** `Event_No`
**Response:**
```json
{
  "Update_Datetime": "...",
  "Badge_Kind_Count": 0,
  "Badge_Acquire_Count": 0,
  "Gift_Kind_Count": 0,
  "Gift_Acquire_Count": 0
}
```

### GET /api/Reward/BadgeStats
배지별 획득 통계 목록
**Params:** `Event_No`, `Reward_Type`, `page`, `pageSize`
**Response:**
```json
{
  "List": [{
    "Reward_Code": "",
    "Reward_Name": "",
    "Reward_Type": "",
    "Acquire_Count": 0,
    "Acquire_Member_Count": 0,
    "Last_Acquire_Date": "",
    "Use_YN": true
  }],
  "TotalCount": 0
}
```
*Source: tReadingRunRewardMaster JOIN tReadingRunRewardHistory*

### GET /api/Reward/BadgeStats/Excel
배지 획득 통계 엑셀 다운로드

---

## 도서순위 (Record)

### GET /api/Record/BookRanking
도서순위 목록 조회
**Params:** `Event_No`, `Standard_Date`, `Course_Name`, `Keyword`, `page`, `pageSize`
**Response:**
```json
{
  "UpdateDatetime": "...",
  "List": [{
    "Ranking": 1,
    "Goods_No": 0,
    "Book_Name": "",
    "Course_Name": "",
    "Select_Count": 0,
    "Standard_Date": ""
  }],
  "TotalCount": 0
}
```
*Source: tReadingRunMemberBook 집계 + tReadingRunRankingHistory*

### GET /api/Record/BookRanking/Excel
도서순위 엑셀 다운로드

---

## 테이블 매핑 요약

| 테이블 | 용도 |
|--------|------|
| tReadingRunActivity | 회원 세션 활동 기록 |
| tReadingRunDailySummary | 이벤트 일별 통계 요약 |
| tReadingRunMember | 이벤트 참여 회원 집계 정보 |
| tReadingRunMemberBook | 회원이 세션에서 선택한 도서 목록 |
| tReadingRunRankingHistory | 일별 랭킹 이력 |
| tReadingRunResult | 회원 코스 참여/완주/리워드 결과 |
| tReadingRunRewardHistory | 회원 리워드 지급 이력 |
| tReadingRunRewardMaster | 리워드(배지/상품권) 마스터 데이터 |
