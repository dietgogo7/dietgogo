/**
 * adminV2/js/dashboard.js
 * 대시보드 페이지 전용 (dashboard.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var allBookings = [];
    var allMds = [];
    var calView = 'month';
    var today = new Date();
    var curYear = today.getFullYear();
    var curMonth = today.getMonth();
    var curWeekStart = getWeekStart(today);
    var curDay = new Date(today);
    var visibleMds = {};
    var STATUS_LABEL = { APPROVED: '승인', PENDING: '대기', REJECTED: '거절', CANCELLED: '취소' };
    var DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];
    var MONTH_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    var MD_DOTS = ['#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed', '#ea580c', '#0891b2', '#16a34a'];

    // --- 초기화 ---
    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('bookings.json'),
            AC.loadJSON('mds.json')
        ).done(function (bR, mR) {
            allBookings = bR[0];
            allMds = mR[0];
            $.each(allMds, function (i, md) { visibleMds[md.Md_No] = true; });
            renderAll();
        }).fail(function () {
            alert('데이터를 불러오는데 실패했습니다.');
        });
    });

    // --- 유틸 ---
    function pad2(n) { return String(n).padStart(2, '0'); }
    function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function strKey(s) { return s ? String(s).substring(0, 10) : ''; }

    function getMd(mdNo) {
        var n = AC.normMd(mdNo), f = null;
        $.each(allMds, function (i, md) { if (String(md.Md_No) === n) { f = md; return false; } });
        return f;
    }
    function getMdIdx(mdNo) {
        var n = AC.normMd(mdNo), idx = -1;
        $.each(allMds, function (i, md) { if (String(md.Md_No) === n) { idx = i; return false; } });
        return idx < 0 ? 0 : idx;
    }
    function getWeekStart(d) {
        var s = new Date(d);
        s.setDate(d.getDate() - d.getDay());
        s.setHours(0, 0, 0, 0);
        return s;
    }
    function addDays(d, n) {
        var r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    }
    function buildDayMap(list) {
        var m = {};
        $.each(list, function (i, b) {
            var k = strKey(b.Meeting_Datetime);
            if (!m[k]) m[k] = [];
            m[k].push(b);
        });
        return m;
    }
    function getMonthBookings(y, mo) {
        return $.grep(allBookings, function (b) {
            var d = new Date(b.Meeting_Datetime);
            return d.getFullYear() === y && d.getMonth() === mo;
        });
    }
    function getWeekBookings(ws) {
        var we = addDays(ws, 6);
        return $.grep(allBookings, function (b) {
            if (!b.Meeting_Datetime) return false;
            var d = new Date(b.Meeting_Datetime);
            d.setHours(0, 0, 0, 0);
            return d >= ws && d <= we;
        });
    }

    function renderAll() {
        renderKpi();
        renderLegend();
        renderCalendar();
        AC.renderMeetingKing(allBookings);
    }

    /* ── KPI ── */
    function renderKpi() {
        var mb = getMonthBookings(curYear, curMonth);
        var tot = mb.length;
        var app = $.grep(mb, function (b) { return b.Status === 'APPROVED'; }).length;
        var pnd = $.grep(mb, function (b) { return b.Status === 'PENDING'; }).length;
        var rej = $.grep(mb, function (b) { return b.Status === 'REJECTED' || b.Status === 'CANCELLED'; }).length;
        var lbl = (curMonth + 1) + '월';
        $('#kpi-grid').html(
            kpiCard('total', '전체 예약', tot, lbl + ' 총 예약 건수', '📋') +
            kpiCard('approved', '승인 완료', app, '미팅 확정', '✅') +
            kpiCard('pending', '승인 대기', pnd, '검토 필요', '⏳') +
            kpiCard('rejected', '거절/취소', rej, '미팅 불가', '❌')
        );
    }
    function kpiCard(cls, lbl, val, sub, ico) {
        return '<div class="kpi-card ' + cls + '">' +
            '<div class="kpi-label">' + lbl + '</div>' +
            '<div class="kpi-value">' + val + '</div>' +
            '<div class="kpi-sub">' + sub + '</div>' +
            '<div class="kpi-icon">' + ico + '</div>' +
            '</div>';
    }

    /* ── LEGEND ── */
    var selectedMdNo = ''; // '' = 전체

    function renderLegend() {
        var h = '<span class="md-legend-item' + (selectedMdNo === '' ? ' active' : '') + '" data-md="all">전체</span>';
        $.each(allMds, function (i, md) {
            var isSelected = (selectedMdNo === String(md.Md_No));
            var cls = isSelected ? ' active' : (selectedMdNo !== '' ? ' faded' : '');
            h += '<span class="md-legend-item' + cls + '" data-md="' + md.Md_No + '">' +
                '<span class="md-legend-dot md-dot-' + (i % 8) + '"></span>' + md.Md_Name + '</span>';
        });
        $('#md-legend').html(h);
    }

    function applyMdFilter() {
        if (selectedMdNo === '') {
            $.each(allMds, function (i, md) { visibleMds[md.Md_No] = true; });
        } else {
            $.each(allMds, function (i, md) {
                visibleMds[md.Md_No] = (String(md.Md_No) === selectedMdNo);
            });
        }
    }

    $(document).on('click', '.md-legend-item', function () {
        var val = String($(this).data('md'));
        if (val === 'all' || val === selectedMdNo) {
            selectedMdNo = '';
        } else {
            selectedMdNo = val;
        }
        applyMdFilter();
        renderLegend();
        renderCalendar();
    });

    function getDayBookings(d) {
        var dk = dateKey(d);
        return $.grep(allBookings, function (b) {
            return strKey(b.Meeting_Datetime) === dk;
        });
    }

    /* ── CALENDAR DISPATCHER ── */
    function renderCalendar() {
        if (calView === 'month') renderMonthView();
        else if (calView === 'week') renderWeekView();
        else renderDayView();
    }

    /* ── MONTH VIEW ── */
    function renderMonthView() {
        var y = curYear, mo = curMonth;
        $('#cal-period-label').text(y + '년 ' + MONTH_KO[mo]);
        var mb = getMonthBookings(y, mo);
        var dayMap = buildDayMap(mb);
        var todayKey = dateKey(today);
        var firstDOW = new Date(y, mo, 1).getDay();
        var lastDate = new Date(y, mo + 1, 0).getDate();
        var todayBase = new Date(today); todayBase.setHours(0, 0, 0, 0);
        var dowCls = ['sun', '', '', '', '', '', 'sat'];

        var heads = '';
        for (var i = 0; i < 7; i++) {
            heads += '<div class="month-cal-head ' + dowCls[i] + '">' + DOW_KO[i] + '</div>';
        }

        var cells = '';
        for (var e = 0; e < firstDOW; e++) cells += '<div class="month-day empty"></div>';

        for (var d = 1; d <= lastDate; d++) {
            var dk = y + '-' + pad2(mo + 1) + '-' + pad2(d);
            var dow = (firstDOW + d - 1) % 7;
            var isDowCls = dow === 0 ? 'sun' : (dow === 6 ? 'sat' : '');
            var cellDate = new Date(y, mo, d);
            var isToday = (dk === todayKey);
            var isPast = (cellDate < todayBase && !isToday);
            var cls = 'month-day' + (isToday ? ' is-today' : '') + (isPast ? ' is-past' : '');
            var numCls = 'day-num' + (isToday ? ' today-circle' : '') + (isDowCls ? ' ' + isDowCls : '');
            var numHtml = '<span class="' + numCls + '">' + d + '</span>';

            var rawBk = dayMap[dk] || [];
            var visBk = $.grep(rawBk, function (b) { return visibleMds[AC.normMd(b.Md_No)]; });
            visBk.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });

            var evHtml = '<div class="day-events">';
            var shown = 0, max = 4;
            $.each(visBk, function (i2, b) {
                if (shown >= max) return false;
                var idx = getMdIdx(b.Md_No);
                var md = getMd(b.Md_No);
                var nm = md ? md.Md_Name : b.Md_No;
                var t = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '';
                evHtml += '<div class="day-event-pill md-color-' + (idx % 8) + '" data-date="' + dk + '">' +
                    '<span class="pill-time">' + t + '</span>' +
                    '<span class="pill-name">' + nm + '</span></div>';
                shown++;
            });
            if (visBk.length > max) {
                evHtml += '<div class="day-more">+' + (visBk.length - max) + '건 더</div>';
            }
            evHtml += '</div>';

            cells += '<div class="' + cls + '" data-date="' + dk + '">' + numHtml + evHtml + '</div>';
        }

        var total = firstDOW + lastDate;
        var rem = 7 - (total % 7);
        if (rem < 7) { for (var r = 0; r < rem; r++) cells += '<div class="month-day empty"></div>'; }

        $('#cal-container').html(
            '<div class="month-cal-wrap"><div class="month-cal">' + heads + cells + '</div></div>'
        );
        renderSummary(mb);
    }

    /* ── WEEK VIEW ── */
    function renderWeekView() {
        var ws = curWeekStart;
        var we = addDays(ws, 6);
        var wsM = MONTH_KO[ws.getMonth()], weM = MONTH_KO[we.getMonth()];
        var pLbl = (ws.getMonth() === we.getMonth())
            ? ws.getFullYear() + '년 ' + wsM + ' ' + ws.getDate() + '~' + we.getDate() + '일'
            : ws.getFullYear() + '년 ' + wsM + ' ' + ws.getDate() + '일 ~ ' + weM + ' ' + we.getDate() + '일';
        $('#cal-period-label').text(pLbl);

        var wb = getWeekBookings(ws);
        var dayMap = buildDayMap(wb);
        var todayKey = dateKey(today);

        var cols = '';
        for (var i = 0; i < 7; i++) {
            var day = addDays(ws, i);
            var dk = dateKey(day);
            var dow = day.getDay();
            var dowCls = dow === 0 ? ' sun' : (dow === 6 ? ' sat' : '');
            var todCls = (dk === todayKey) ? ' is-today' : '';

            var rawBk = dayMap[dk] || [];
            var visBk = $.grep(rawBk, function (b) { return visibleMds[AC.normMd(b.Md_No)]; });
            visBk.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });

            var head = '<div class="week-col-head' + dowCls + todCls + '">' +
                '<div class="wch-dow">' + DOW_KO[dow] + '</div>' +
                '<div class="wch-date">' + day.getDate() + '</div></div>';

            var body = '<div class="week-col-body">';
            if (visBk.length === 0) {
                body += '<div class="week-empty-msg">예약 없음</div>';
            } else {
                $.each(visBk, function (j, b) {
                    var idx = getMdIdx(b.Md_No);
                    var md = getMd(b.Md_No);
                    var nm = md ? md.Md_Name : b.Md_No;
                    var t = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '';
                    body += '<div class="week-event-card md-bgc-' + (idx % 8) + '" data-date="' + dk + '">' +
                        '<div class="wec-time">' + t + '</div>' +
                        '<div class="wec-md" style="color:' + MD_DOTS[idx % 8] + ';">' + nm + '</div>' +
                        '<div class="wec-user">' + b.User_Name + (b.User_Affiliation ? ' · ' + b.User_Affiliation : '') + '</div>' +
                        '<span class="wec-status ' + b.Status + '">' + (STATUS_LABEL[b.Status] || b.Status) + '</span>' +
                        '</div>';
                });
            }
            body += '</div>';
            cols += '<div class="week-col-wrap">' + head + body + '</div>';
        }
        $('#cal-container').html(
            '<div class="week-cal-wrap"><div class="week-cal">' + cols + '</div></div>'
        );
        renderSummary(wb);
    }

    /* ── DAY VIEW ── */
    function renderDayView() {
        var d = curDay;
        var dk = dateKey(d);
        var dow = d.getDay();
        var dowCls = dow === 0 ? 'sun' : (dow === 6 ? 'sat' : '');
        var pLbl = d.getFullYear() + '년 ' + MONTH_KO[d.getMonth()] + ' ' + d.getDate() + '일 (' + DOW_KO[dow] + ')';
        $('#cal-period-label').text(pLbl);

        var db = getDayBookings(d);
        var visBk = $.grep(db, function (b) { return visibleMds[AC.normMd(b.Md_No)]; });
        visBk.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });

        var todayKey = dateKey(today);
        var isToday = (dk === todayKey);

        // 시간대별 그룹핑
        var timeGroups = {};
        $.each(visBk, function (i, b) {
            var t = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '00:00';
            if (!timeGroups[t]) timeGroups[t] = [];
            timeGroups[t].push(b);
        });
        var timeKeys = Object.keys(timeGroups).sort();

        // 날짜 헤더 (가로 배치)
        var dateHeader = '<div class="day-view-header' + (isToday ? ' is-today' : '') + '">' +
            '<div class="day-view-date' + (isToday ? ' today-circle' : '') + '">' + d.getDate() + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:2px;">' +
            '<div class="day-view-dow ' + dowCls + '">' + DOW_KO[dow] + '</div>' +
            '<div class="day-view-full-date">' + d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + '</div>' +
            '</div>' +
            '<div class="day-view-count">' + visBk.length + '건의 예약</div>' +
            '</div>';

        var body = '';
        if (visBk.length === 0) {
            body = '<div class="day-view-empty">' +
                '<div class="day-view-empty-icon">📅</div>' +
                '<div class="day-view-empty-text">이 날짜에 등록된 예약이 없습니다.</div>' +
                '</div>';
        } else {
            body = '<div class="day-view-timeline">';
            $.each(timeKeys, function (i, tKey) {
                var bks = timeGroups[tKey];
                body += '<div class="day-timeline-row">';
                body += '<div class="day-timeline-time">' + tKey +
                    (bks.length > 1 ? ' <span class="day-time-badge">' + bks.length + '</span>' : '') +
                    '</div>';
                body += '<div class="day-timeline-dot"></div>';
                body += '<div class="day-timeline-cards">';
                $.each(bks, function (j, b) {
                    var idx = getMdIdx(b.Md_No);
                    var md = getMd(b.Md_No);
                    var nm = md ? md.Md_Name : b.Md_No;
                    var stLabel = STATUS_LABEL[b.Status] || b.Status;
                    body += '<div class="day-event-card md-bgc-' + (idx % 8) + '" data-date="' + dk + '">' +
                        '<div class="day-card-header">' +
                        '<span class="day-card-md" style="color:' + MD_DOTS[idx % 8] + ';">' + nm + '</span>' +
                        '<span class="wec-status ' + b.Status + '">' + stLabel + '</span>' +
                        '</div>' +
                        '<div class="day-card-user">' + b.User_Name +
                        (b.User_Affiliation ? ' <span class="day-card-affil">' + b.User_Affiliation + '</span>' : '') +
                        '</div>' +
                        '<div class="day-card-meta">' +
                        (b.User_Phone ? '<span>📞 ' + b.User_Phone + '</span>' : '') +
                        (b.User_Email ? '<span>✉️ ' + b.User_Email + '</span>' : '') +
                        '</div>' +
                        (b.Notes ? '<div class="day-card-notes">' + b.Notes + '</div>' : '') +
                        '</div>';
                });
                body += '</div></div>';
            });
            body += '</div>';
        }

        // MD별 요약 카드
        var mdSummary = '<div class="day-md-summary">';
        var mdCounts = {};
        $.each(visBk, function (i, b) {
            var n = AC.normMd(b.Md_No);
            if (!mdCounts[n]) mdCounts[n] = { total: 0, approved: 0, pending: 0 };
            mdCounts[n].total++;
            if (b.Status === 'APPROVED') mdCounts[n].approved++;
            if (b.Status === 'PENDING') mdCounts[n].pending++;
        });
        $.each(allMds, function (i, md) {
            var c = mdCounts[String(md.Md_No)];
            if (!c) return;
            mdSummary += '<div class="day-md-chip md-bgc-' + (i % 8) + '">' +
                '<span class="day-md-chip-name" style="color:' + MD_DOTS[i % 8] + ';">' + md.Md_Name + '</span>' +
                '<span class="day-md-chip-count">' + c.total + '건</span>' +
                '</div>';
        });
        mdSummary += '</div>';

        $('#cal-container').html(
            '<div class="day-view-wrap">' + dateHeader + (visBk.length > 0 ? mdSummary : '') + body + '</div>'
        );
        renderSummary(db);
    }

    /* ── SUMMARY ── */
    function renderSummary(list) {
        var app = $.grep(list, function (b) { return b.Status === 'APPROVED'; }).length;
        var pnd = $.grep(list, function (b) { return b.Status === 'PENDING'; }).length;
        var rej = $.grep(list, function (b) { return b.Status === 'REJECTED' || b.Status === 'CANCELLED'; }).length;
        function it(c, l, n) {
            return '<div class="cal-summary-item">' +
                '<span class="cal-summary-dot" style="background:' + c + ';"></span>' +
                l + ' <strong style="color:var(--gray-900);">' + n + '건</strong></div>';
        }
        $('#cal-summary').html(
            it('var(--success-text)', '승인', app) +
            it('var(--warning-text)', '대기', pnd) +
            it('var(--danger-text)', '거절/취소', rej)
        );
    }

    /* ── TOOLTIP (월간 보기 전용) ── */
    $(document).on('mouseenter', '.day-event-pill, .month-day:not(.empty)', function () {
        if (calView !== 'month') return;
        var dk = $(this).data('date');
        if (!dk) return;
        var bks = [];
        $.each(allBookings, function (i, b) { if (strKey(b.Meeting_Datetime) === dk) bks.push(b); });
        if (!bks.length) return;
        bks.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });
        var parts = dk.split('-');
        var h = '<div class="cal-tooltip-date">' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일</div>';
        $.each(bks, function (i, b) {
            var md = getMd(b.Md_No);
            var nm = md ? md.Md_Name : b.Md_No;
            var idx = getMdIdx(b.Md_No);
            var t = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '';
            h += '<div class="cal-tooltip-row">' +
                '<span><span class="cal-tooltip-dot" style="background:' + MD_DOTS[idx % 8] + ';"></span>' +
                nm + ' <span style="opacity:.6;">' + t + '</span></span>' +
                '<span style="opacity:.7;">' + (STATUS_LABEL[b.Status] || b.Status) + '</span></div>';
        });
        $('#cal-tooltip').html(h).show();
    });
    $(document).on('mouseleave', '.day-event-pill, .month-day', function () {
        $('#cal-tooltip').hide();
    });
    $(document).on('mousemove', function (e) {
        var $tt = $('#cal-tooltip');
        if (!$tt.is(':visible')) return;
        var ttW = $tt.outerWidth(), ttH = $tt.outerHeight();
        var x = e.clientX + 14, y = e.clientY - ttH / 2;
        if (x + ttW > $(window).width()) x = e.clientX - ttW - 14;
        $tt.css({ left: x, top: y });
    });

    /* ── 월간 날짜 클릭 → 일별 보기 전환 ── */
    $(document).on('click', '.month-day:not(.empty)', function (e) {
        if ($(e.target).is('button')) return;
        var dk = $(this).data('date');
        if (!dk) return;
        var parts = dk.split('-');
        curDay = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        $('#cal-tooltip').hide();
        setCalView('day');
    });

    /* ── NAV BUTTONS ── */
    function setCalView(view) {
        calView = view;
        $('.view-toggle-btn').removeClass('active');
        $('#btn-view-' + view).addClass('active');
        renderCalendar();
    }
    $('#btn-view-month').on('click', function () { setCalView('month'); });
    $('#btn-view-week').on('click', function () { setCalView('week'); });
    $('#btn-view-day').on('click', function () { setCalView('day'); });
    $('#btn-today').on('click', function () {
        curYear = today.getFullYear();
        curMonth = today.getMonth();
        curWeekStart = getWeekStart(today);
        curDay = new Date(today);
        renderKpi();
        renderCalendar();
    });
    $('#btn-prev').on('click', function () {
        if (calView === 'month') {
            curMonth--;
            if (curMonth < 0) { curMonth = 11; curYear--; }
            renderKpi();
        } else if (calView === 'week') {
            curWeekStart = addDays(curWeekStart, -7);
        } else {
            curDay = addDays(curDay, -1);
        }
        renderCalendar();
    });
    $('#btn-next').on('click', function () {
        if (calView === 'month') {
            curMonth++;
            if (curMonth > 11) { curMonth = 0; curYear++; }
            renderKpi();
        } else if (calView === 'week') {
            curWeekStart = addDays(curWeekStart, 7);
        } else {
            curDay = addDays(curDay, 1);
        }
        renderCalendar();
    });
});
