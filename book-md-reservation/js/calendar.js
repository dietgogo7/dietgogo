/**
 * calendar.js
 * 달력 생성 및 시간 슬롯 관리 유틸리티
 * 대한민국 공휴일 (2025~2026) 포함
 */

(function (window, $) {
    var Calendar = {};

    // --- 대한민국 공휴일 정보 (2025~2026) ---
    var HOLIDAYS = [
        // 2025년
        '2025-01-01', // 신정
        '2025-01-28', '2025-01-29', '2025-01-30', // 설날
        '2025-03-01', '2025-03-03', // 삼일절 및 대체공휴일
        '2025-05-05', '2025-05-06', // 어린이날 및 부처님오신날 대체공휴일
        '2025-06-06', // 현충일
        '2025-08-15', // 광복절
        '2025-10-03', // 개천절
        '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', // 추석 및 대체공휴일
        '2025-10-09', // 한글날
        '2025-12-25', // 크리스마스

        // 2026년
        '2026-01-01', // 신정
        '2026-02-16', '2026-02-17', '2026-02-18', // 설날
        '2026-03-01', '2026-03-02', // 삼일절 및 대체공휴일
        '2026-05-05', // 어린이날
        '2026-05-24', '2026-05-25', // 부처님오신날 및 대체공휴일
        '2026-06-06', // 현충일
        '2026-08-15', // 광복절
        '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-28', // 추석 및 대체공휴일
        '2026-10-03', '2026-10-05', // 개천절 및 대체공휴일
        '2026-10-09', // 한글날
        '2026-12-25' // 크리스마스
    ];

    /**
     * 시간 슬롯 생성 유틸리티
     * @param {string} start "HH:MM"
     * @param {string} end "HH:MM"
     * @param {number} intervalMin 간격(분)
     */
    Calendar.generateTimeSlots = function (start, end, intervalMin) {
        function toMinutes(hm) {
            var parts = hm.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function pad(n) { return (n < 10 ? '0' : '') + n; }

        var startMin = toMinutes(start);
        var endMin = toMinutes(end);
        var arr = [];

        for (var t = startMin; t <= endMin; t += intervalMin) {
            var h = Math.floor(t / 60);
            var m = t % 60;
            arr.push(pad(h) + ':' + pad(m));
        }
        return arr;
    };

    /**
     * 달력 렌더링 함수
     * @param {jQuery} $container 달력을 렌더링할 컨테이너
     * @param {function} onSelect 날짜 선택 시 콜백
     * @param {Date} viewDate 표시할 기준 날짜
     * @param {string} selectedDateString 현재 선택된 날짜 ("YYYY-MM-DD")
     */
    Calendar.render = function ($container, onSelect, viewDate, selectedDateString) {
        if (!$container || $container.length === 0) return;
        if (!viewDate) viewDate = new Date();
        $container.empty();

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var year = viewDate.getFullYear();
        var month = viewDate.getMonth();
        var firstDay = new Date(year, month, 1);
        var lastDay = new Date(year, month + 1, 0);
        var daysInMonth = lastDay.getDate();
        var startDay = firstDay.getDay();

        // 10 영업일 계산 (오늘부터 시작)
        var workingDaysCount = 0;
        var cursor = new Date(today);
        while (workingDaysCount < 10) {
            var y = cursor.getFullYear();
            var m = String(cursor.getMonth() + 1).length < 2 ? '0' + (cursor.getMonth() + 1) : (cursor.getMonth() + 1);
            var d = String(cursor.getDate()).length < 2 ? '0' + cursor.getDate() : cursor.getDate();
            var ds = y + '-' + m + '-' + d;

            var dayOfWeek = cursor.getDay();
            // 주말(0:일, 6:토) 및 공휴일 제외
            if (dayOfWeek !== 0 && dayOfWeek !== 6 && $.inArray(ds, HOLIDAYS) === -1) {
                workingDaysCount++;
            }
            if (workingDaysCount < 10) {
                cursor.setDate(cursor.getDate() + 1);
            }
        }
        var maxDate = new Date(cursor);

        // 상단 내비게이션 생성
        var $nav = $('<div class="calendar-nav-container"></div>');

        $('<button class="calendar-nav-btn">‹</button>').on('click', function (e) {
            e.preventDefault();
            Calendar.render($container, onSelect, new Date(year, month - 1, 1), selectedDateString);
        }).appendTo($nav);

        $('<div class="calendar-header"></div>').html('<strong>' + year + '년 ' + (month + 1) + '월</strong>').appendTo($nav);

        $('<button class="calendar-nav-btn">›</button>').on('click', function (e) {
            e.preventDefault();
            Calendar.render($container, onSelect, new Date(year, month + 1, 1), selectedDateString);
        }).appendTo($nav);

        $container.append($nav);

        // 요일 헤더
        var $daysRow = $('<div class="calendar-days-row"></div>');
        $.each(['일', '월', '화', '수', '목', '금', '토'], function (i, d) {
            var $s = $('<span class="calendar-day-label"></span>').text(d);
            if (i === 0) $s.addClass('sunday');
            if (i === 6) $s.addClass('saturday');
            $daysRow.append($s);
        });
        $container.append($daysRow);

        // 날짜 그리드
        var $grid = $('<div class="calendar-grid"></div>');
        // 이전 달 빈 칸
        for (var i = 0; i < startDay; i++) {
            $grid.append('<span class="calendar-date empty"></span>');
        }

        // 현재 달 날짜들
        for (var date = 1; date <= daysInMonth; date++) {
            var cellDate = new Date(year, month, date);
            var dateString = year + '-' + String(month + 1).replace(/^(\d)$/, '0$1') + '-' + String(date).replace(/^(\d)$/, '0$1');
            var dayOfWeek = cellDate.getDay();
            var isHoliday = $.inArray(dateString, HOLIDAYS) !== -1;

            var $cell = $('<span class="calendar-date"></span>').text(date);
            if (dateString === today.getFullYear() + '-' + String(today.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(today.getDate()).replace(/^(\d)$/, '0$1')) {
                $cell.addClass('today');
            }
            if (dayOfWeek === 0) $cell.addClass('sunday');
            if (dayOfWeek === 6) $cell.addClass('saturday');
            if (isHoliday) $cell.addClass('holiday');

            // 예약 가능 여부 판단 (오늘 이전, 주말, 공휴일, 10영업일 초과 제외)
            if (cellDate < today || dayOfWeek === 0 || dayOfWeek === 6 || isHoliday || cellDate > maxDate) {
                $cell.addClass('disabled');
            } else {
                $cell.addClass('available').on('click', (function (dStr, cDate) {
                    return function () {
                        $container.find('.calendar-date').removeClass('selected');
                        $(this).addClass('selected');
                        onSelect(cDate, dStr);
                    };
                })(dateString, cellDate));
            }

            if (selectedDateString === dateString) {
                $cell.addClass('selected');
            }
            $grid.append($cell);
        }
        $container.append($grid);
    };

    window.OYCalendar = Calendar;

})(window, jQuery);
