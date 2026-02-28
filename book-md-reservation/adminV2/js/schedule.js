/**
 * adminV2/js/schedule.js
 * 스케줄 설정 페이지 전용 (schedule.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var CONFIG = AC.SCHEDULE_CONFIG;
    var allMds = [];
    var allSlots = [];
    var allBookings = [];
    var calendarCurrentMonth = new Date();

    // DOM Elements
    var mdSelect = $('#schedule-md-select');
    var dateInput = $('#schedule-date-input');
    var vacationToggle = $('#vacation-toggle');
    var timeSettingsArea = $('#time-settings-area');
    var timeGrid = $('#time-grid');
    var schedulePaginationContainer = $('#schedule-pagination');

    // --- 초기화 ---
    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('mds.json'),
            AC.loadJSON('slots.json'),
            AC.loadJSON('bookings.json')
        ).done(function (mdsRes, slotsRes, bookingsRes) {
            allMds = mdsRes[0];
            allSlots = slotsRes[0];
            allBookings = bookingsRes[0];

            populateMdSelect();
            AC.renderMeetingKing(allBookings);

            // 날짜 초기값 설정
            if (dateInput.length && !dateInput.val()) {
                dateInput.val(AC.formatDate(new Date()));
            }

            if ($('#admin-calendar-view').length) {
                renderAdminCalendar();
            }
        }).fail(function (err) {
            console.error('데이터 로드 실패:', err);
        });
    });

    // --- MD 선택 드롭다운 ---
    function populateMdSelect() {
        if (!mdSelect.length) return;
        mdSelect.html('<option value="">PD를 선택하세요</option>');
        $.each(allMds, function (i, md) {
            mdSelect.append($('<option>').val(md.Md_No).text(md.Md_Name));
        });
    }

    // --- 캘린더 렌더링 ---
    function renderAdminCalendar() {
        var area = $('#admin-calendar-view');
        if (!area.length) return;

        var year = calendarCurrentMonth.getFullYear();
        var month = calendarCurrentMonth.getMonth();
        var firstDay = new Date(year, month, 1).getDay();
        var lastDate = new Date(year, month + 1, 0).getDate();

        var html = '<div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">' +
            '<button type="button" class="calendar-nav-btn" id="admin-cal-prev">&lt;</button>' +
            '<div style="font-weight:700; font-size:16px; color: var(--gray-900);">' + year + '.' + String(month + 1).padStart(2, '0') + '</div>' +
            '<button type="button" class="calendar-nav-btn" id="admin-cal-next">&gt;</button>' +
            '</div>' +
            '<div class="calendar-days-row" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8px;">' +
            '<div class="calendar-day-label" style="color: #e11d48; font-size: 12px; font-weight: 600;">일</div>' +
            '<div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">월</div>' +
            '<div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">화</div>' +
            '<div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">수</div>' +
            '<div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">목</div>' +
            '<div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">금</div>' +
            '<div class="calendar-day-label" style="color: #2563eb; font-size: 12px; font-weight: 600;">토</div>' +
            '</div>' +
            '<div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">';

        for (var i = 0; i < firstDay; i++) {
            html += '<div class="calendar-date empty"></div>';
        }

        var selectedDate = dateInput.val() || '';

        for (var d = 1; d <= lastDate; d++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var dateObj = new Date(year, month, d);
            var dayOfWeek = dateObj.getDay();

            var classes = ['calendar-date'];
            var isConfigDay = CONFIG.selectableDays.indexOf(dayOfWeek) >= 0;
            var holidayName = window.HolidayManager ? window.HolidayManager.getHolidayName(dateStr) : null;
            var isHoliday = !!holidayName;
            var isAllowedDay = isConfigDay && !isHoliday;

            if (isAllowedDay) classes.push('available');
            else classes.push('disabled');

            if (dayOfWeek === 0 || isHoliday) classes.push('sunday');
            if (dayOfWeek === 6 && !isHoliday) classes.push('saturday');
            if (dateStr === selectedDate) classes.push('selected');

            var cursorStyle = isAllowedDay ? '' : 'style="cursor: not-allowed;"';
            var titleAttr = holidayName ? 'title="' + holidayName + '"' : '';

            html += '<div class="' + classes.join(' ') + '" data-date="' + dateStr + '" ' + cursorStyle + ' ' + titleAttr + '>' +
                d +
                (holidayName ? '<div style="font-size:8px; line-height:1; margin-top:-2px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; width:100%;">' + holidayName + '</div>' : '') +
                '</div>';
        }

        html += '</div>';
        area.html(html);

        $('#admin-cal-prev').on('click', function (e) {
            e.stopPropagation();
            calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() - 1);
            renderAdminCalendar();
        });
        $('#admin-cal-next').on('click', function (e) {
            e.stopPropagation();
            calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() + 1);
            renderAdminCalendar();
        });

        area.find('.calendar-date.available').on('click', function () {
            if ($(this).hasClass('disabled')) return;
            if (dateInput.length) {
                dateInput.val($(this).data('date'));
                renderAdminCalendar();
                renderScheduleGrid();
            }
        });
    }

    // --- 스케줄 그리드 ---
    function renderScheduleGrid() {
        if (!mdSelect.length || !dateInput.length || !timeSettingsArea.length || !timeGrid.length) return;
        var mdId = mdSelect.val();
        var date = dateInput.val();

        if (!mdId || !date) {
            timeSettingsArea.hide();
            if (schedulePaginationContainer.length) schedulePaginationContainer.empty();
            return;
        }

        var d = new Date(date + 'T00:00:00');
        var day = d.getDay();
        var isConfigDay = CONFIG.selectableDays.indexOf(day) >= 0;
        var todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        var isPast = d < todayDate;
        var isHoliday = window.HolidayManager ? window.HolidayManager.isHoliday(d) : false;

        timeGrid.empty();

        if (!isConfigDay || isHoliday || isPast) {
            timeSettingsArea.hide();
            if (schedulePaginationContainer.length) schedulePaginationContainer.empty();
            return;
        }

        timeSettingsArea.show();

        var parseTime = function (tStr) {
            var parts = tStr.split(':');
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        };

        var startMin = parseTime(CONFIG.timeSlots.start);
        var endMin = parseTime(CONFIG.timeSlots.end);

        for (var t = startMin; t <= endMin; t += CONFIG.timeSlots.intervalMinutes) {
            var hh = String(Math.floor(t / 60)).padStart(2, '0');
            var mm = String(t % 60).padStart(2, '0');
            var timeLabel = hh + ':' + mm;
            var fullTime = date + 'T' + hh + ':' + mm + ':00';

            var slot = null;
            $.each(allSlots, function (j, s) {
                if (s.Md_No === mdId && s.Start_Datetime === fullTime) { slot = s; return false; }
            });
            var isClosed = slot && slot.Status === 'CLOSED';

            var $btn = $('<div>').addClass('time-slot-btn' + (isClosed ? ' disabled' : '')).text(timeLabel).attr('data-time', fullTime);
            $btn.on('click', function () { if (!$(this).hasClass('disabled')) $(this).toggleClass('selected'); });
            timeGrid.append($btn);
        }

        if (schedulePaginationContainer.length) schedulePaginationContainer.empty();
    }

    // --- 일괄 스케줄 변경 ---
    window.applyBatchSchedule = function (status) {
        if (!mdSelect.length) return;
        var mdId = mdSelect.val();
        var $selectedBtns = $('.time-slot-btn.selected');

        if ($selectedBtns.length === 0) {
            alert('변경할 시간을 선택해주세요.');
            return;
        }

        $selectedBtns.each(function () {
            var fullTime = $(this).attr('data-time');
            var slotIndex = -1;
            $.each(allSlots, function (j, s) {
                if (s.Md_No === mdId && s.Start_Datetime === fullTime) { slotIndex = j; return false; }
            });

            if (status === 'OPEN') {
                if (slotIndex !== -1) allSlots.splice(slotIndex, 1);
            } else {
                if (slotIndex !== -1) {
                    allSlots[slotIndex].Status = status;
                } else {
                    allSlots.push({
                        Slot_Seq: 'new-' + mdId + '-' + fullTime,
                        Md_No: mdId,
                        Start_Datetime: fullTime,
                        End_Datetime: fullTime,
                        Status: status,
                        Capacity: 1
                    });
                }
            }
        });

        alert('스케줄이 변경되었습니다.');
        renderScheduleGrid();
    };

    // --- 이벤트 바인딩 ---
    if (mdSelect.length && dateInput.length) {
        mdSelect.on('change', renderScheduleGrid);
        dateInput.on('change', renderScheduleGrid);
    }

    if (vacationToggle.length && mdSelect.length && dateInput.length) {
        vacationToggle.on('change', function () {
            var mdId = mdSelect.val();
            var date = dateInput.val();
            if (!mdId || !date) return;
            var isVacation = $(this).prop('checked');

            var startMin = 14 * 60;
            var endMin = 15 * 60 + 15;
            for (var t = startMin; t <= endMin; t += 15) {
                var hh = String(Math.floor(t / 60)).padStart(2, '0');
                var mm = String(t % 60).padStart(2, '0');
                var fullTime = date + 'T' + hh + ':' + mm + ':00';
                var slotIndex = -1;
                $.each(allSlots, function (j, s) {
                    if (s.Md_No === mdId && s.Start_Datetime === fullTime) { slotIndex = j; return false; }
                });
                var slotStatus = isVacation ? 'CLOSED' : 'OPEN';

                if (slotStatus === 'OPEN') {
                    if (slotIndex !== -1) allSlots.splice(slotIndex, 1);
                } else {
                    if (slotIndex !== -1) allSlots[slotIndex].Status = slotStatus;
                    else {
                        allSlots.push({
                            Slot_Seq: 'vac-' + mdId + '-' + date + '-' + hh + mm,
                            Md_No: mdId, Start_Datetime: fullTime, End_Datetime: fullTime,
                            Status: slotStatus, Capacity: 1
                        });
                    }
                }
            }
            renderScheduleGrid();
        });
    }
});
