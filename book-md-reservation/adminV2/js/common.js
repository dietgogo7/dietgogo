/**
 * adminV2/js/common.js
 * 공통 모듈 - 사이드바 로드, 미팅왕, 유틸리티, 상수
 */
(function ($) {
    'use strict';

    // --- 공통 상수 ---
    var STATUS_LABELS = {
        'PENDING': '예약신청',
        'APPROVED': '예약확정',
        'REJECTED': '승인거절',
        'CANCELLED': '예약취소',
        'COMPLETED': '이용완료',
        'AWAY': '부재',
        'ON_LEAVE': '휴가',
        'OPEN': '예약가능',
        'CLOSED': '예약불가'
    };

    var SCHEDULE_CONFIG = {
        selectableDays: [1, 2, 3, 4], // Mon-Thu
        timeSlots: {
            start: "14:00",
            end: "15:15",
            intervalMinutes: 15
        }
    };

    // --- 유틸리티 함수 ---
    function formatWithYear(dateStr) {
        if (!dateStr) return '-';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
    }

    function formatDate(d) {
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function normMd(v) {
        if (!v) return '';
        var m = String(v).match(/^md-0*(\d+)$/i);
        return m ? String(parseInt(m[1], 10)) : String(v);
    }

    // --- 데이터 로더 ---
    function loadJSON(filename) {
        return $.getJSON('data/' + filename);
    }

    // --- 사이드바 로드 및 active 설정 ---
    function loadSidebar(callback) {
        var $sidebar = $('nav.admin-sidebar');
        if (!$sidebar.length) {
            if (callback) callback();
            return;
        }

        $sidebar.load('partials/sidebar.html', function () {
            // 현재 페이지 기준으로 active 클래스 자동 설정
            var currentPage = window.location.pathname.split('/').pop() || 'index.html';
            $sidebar.find('.nav-item').each(function () {
                var href = $(this).attr('href');
                if (href === currentPage) {
                    $(this).addClass('active').attr('aria-current', 'page');
                }
            });

            if (callback) callback();
        });
    }

    // --- 이달의 미팅왕 (출판사별 통계) 렌더링 ---
    function renderMeetingKing(allBookings) {
        var $container = $('#meeting-king-list');
        if (!$container.length) return;

        var now = new Date();
        var curYear = now.getFullYear();
        var curMonth = now.getMonth();

        // 이번달 승인 예약만 필터
        var monthBookings = $.grep(allBookings, function (b) {
            if (b.Status !== 'APPROVED' && b.Status !== 'COMPLETED') return false;
            var d = new Date(b.Meeting_Datetime);
            return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });

        // 출판사(User_Affiliation)별 카운트
        var counts = {};
        $.each(monthBookings, function (i, b) {
            var affil = b.User_Affiliation || '기타';
            counts[affil] = (counts[affil] || 0) + 1;
        });

        // 건수 내림차순 정렬
        var sorted = Object.keys(counts).sort(function (a, b) {
            return counts[b] - counts[a];
        });

        var medals = ['🥇', '🥈', '🥉'];
        var h = '';
        $.each(sorted.slice(0, 3), function (i, name) {
            h += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:var(--text-xs);">' +
                '<span>' + medals[i] + '</span>' +
                '<span style="font-weight:600;color:var(--gray-700);">' + name + '</span>' +
                '<span style="color:var(--gray-400);margin-left:auto;">' + counts[name] + '건</span>' +
                '</div>';
        });

        $container.html(h || '<p style="font-size:var(--text-xs);color:var(--gray-400);">데이터 없음</p>');
    }

    // --- window.AdminCommon 전역 노출 ---
    window.AdminCommon = {
        STATUS_LABELS: STATUS_LABELS,
        SCHEDULE_CONFIG: SCHEDULE_CONFIG,
        formatWithYear: formatWithYear,
        formatDate: formatDate,
        normMd: normMd,
        loadJSON: loadJSON,
        loadSidebar: loadSidebar,
        renderMeetingKing: renderMeetingKing
    };

})(jQuery);
