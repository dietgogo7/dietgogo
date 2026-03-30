$(document).ready(function() {
    // 1. 초기 로드 애니메이션 클래스 추가
    $('.page-section.active').addClass('fade-in');

    // 2. Hash 기반 간단한 SPA 라우팅 처리
    function handleRouting() {
        var hash = window.location.hash || '#home';
        var sectionId = hash.replace('#', '');
        
        // GNB 활성화 상태 업데이트
        $('.nav-link').removeClass('active');
        $('.nav-link[href="' + hash + '"]').addClass('active');

        var $targetSection = $('#' + sectionId);
        
        if ($targetSection.length) {
            // 현재 활성화된 섹션을 서서히 페이드 아웃 후 새로운 섹션 페이드 인
            $('.page-section:visible').fadeOut(300, function() {
                $targetSection.removeClass('fade-in');
                $targetSection.fadeIn(400).addClass('fade-in');
                
                // 페이지 상단으로 스크롤 부드럽게 이동
                $('html, body').animate({ scrollTop: 0 }, 'fast');
            });
        }
    }

    // Hash 변경 감지 이벤트
    $(window).on('hashchange', handleRouting);

    // 초기 접근 시 Hash 확인 후 라우팅 실행
    if(window.location.hash) {
        handleRouting();
    } else {
        $('.nav-link[href="#home"]').addClass('active');
    }

    // 3. 네비게이션 부드러운 스크롤 처리 방지 (SPA 동작을 위해)
    $('.nav-link').on('click', function(e) {
        // 해시 기반 라우팅이 알아서 처리하도록 함
    });
});
