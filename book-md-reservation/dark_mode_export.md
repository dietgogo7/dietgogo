# 다크모드 이식 가이드

다른 소스에 다크모드 기능을 적용하기 위해 복사해야 할 내용들을 정리했습니다.

## 1. 다크모드 CSS 파일 복사
현재 프로젝트의 `css/dark-mode.css` 파일을 복사하여 대상 프로젝트의 동일한 위치(또는 원하는 CSS 경로)에 붙여넣기 합니다.

## 2. `<head>` 태그 내 링크 추가
대상 HTML 파일의 `<head>` 태그 안에 아래 코드를 추가합니다. 기존 CSS 밑에 넣는 것이 좋습니다.
```html
<link rel="stylesheet" id="theme-style" href="">
```

## 3. 다크모드 토글 버튼 추가
페이지 내 원하는 곳(예: 헤더 영역)에 다크모드 토글용 버튼을 추가합니다.
```html
<button id="theme-toggle" style="background: transparent; border: none; cursor: pointer; color: inherit; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%;" title="다크모드 토글">
    <!-- 전구 아이콘 SVG -->
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"></path>
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
    </svg>
</button>
```

## 4. 스크립트 추가
페이지 하단의 스크립트 영역(`$(function() { ... })` 내부 등)에 버튼 클릭 이벤트를 추가합니다. jQuery가 필요합니다.
```javascript
// 다크모드 토글 버튼 이벤트
$('#theme-toggle').on('click', function() {
    var themeStyle = $('#theme-style');
    if (themeStyle.attr('href') === 'css/dark-mode.css') { // 경로 주의
        themeStyle.attr('href', '');
    } else {
        themeStyle.attr('href', 'css/dark-mode.css'); // 경로 주의
    }
});
```
*참고: 경로가 다르다면 `css/dark-mode.css` 부분을 실제 경로에 맞게 수정해주세요.*
