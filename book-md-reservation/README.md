# 도서 MD 미팅 예약 시스템 (Vanilla JS 버전)

순수 JavaScript, HTML, CSS로 구현된 도서 MD 미팅 예약 시스템입니다.
백엔드 서버 없이 프론트엔드에서 로컬 JSON 데이터를 읽어오는 방식으로 동작합니다.

## 주요 기능 (현재까지 구현된 범위)

- **사용자 페이지 (`index.html`)**
  - 날짜를 선택하여 예약 가능한 시간을 조회합니다.
  - 'OPEN' 상태의 시간을 클릭하여 예약 신청 폼을 작성하고 제출할 수 있습니다. (실제 데이터 저장은 되지 않고 화면상에서만 신청 완료로 표시됩니다)

- **관리자 페이지 (`admin.html`)**
  - 전체 예약 신청 목록을 최신순으로 조회합니다.
  - 각 예약의 상태(PENDING, APPROVED 등)를 확인할 수 있습니다.

## 실행 방법

이 프로젝트는 웹 브라우저의 보안 정책으로 인해 로컬 파일을 직접 `fetch` 할 수 없으므로, 간단한 로컬 웹 서버를 실행해야 합니다.

**1. Python이 설치되어 있는 경우 (가장 간단한 방법)**

   컴퓨터에 Python이 설치되어 있다면, 터미널(명령 프롬프트 또는 PowerShell)에서 다음 명령어를 실행하는 것만으로 충분합니다.

   a. 먼저, 터미널을 열고 이 프로젝트의 루트 폴더(`book-md-reservation`)로 이동합니다.
      ```sh
      cd d:\Source\book-md-reservation
      ```

   b. 아래 명령어를 실행하여 로컬 서버를 시작합니다.
      ```sh
      python -m http.server 8000
      ```
      > 만약 위 명령이 동작하지 않고 `python3`를 사용해야 한다면 다음을 시도하세요: `python3 -m http.server 8000`

   c. 서버가 실행되면 웹 브라우저를 열고 아래 주소로 접속합니다.

      - **사용자 페이지:** [http://localhost:8000/index.html](http://localhost:8000/index.html)
      - **관리자 페이지:** [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

**2. Node.js가 설치되어 있는 경우**

   `npm`을 사용할 수 있다면, `serve` 패키지를 이용해 서버를 실행할 수 있습니다.

   ```sh
   # serve 패키지 전역 설치 (최초 1회만)
   npm install -g serve

   # 프로젝트 폴더에서 서버 실행
   serve -l 8000
   ```

**3. VS Code를 사용하는 경우**

   VS Code 확장 프로그램인 `Live Server`를 설치하면, `index.html` 또는 `admin.html` 파일 위에서 마우스 오른쪽 버튼을 클릭하고 `Open with Live Server`를 선택하여 쉽게 프로젝트를 실행할 수 있습니다.


---

이제 프로젝트의 기본 구조와 읽기 기능 구현이 완료되었습니다. 다음 작업을 요청해주세요.
