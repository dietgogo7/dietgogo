/**
 * adminV2/js/pd-heatmap.js
 * PD 미팅 밀도 — 버블 차트 + PD 요약 카드
 *
 * 메인 시각화: SVG 버블 차트 (4주 × PD)
 * 하단: PD별 현황 요약 카드 (최근 7일 미니 바차트)
 */
$(function () {
    'use strict';

    var AC = window.AdminCommon;

    /* ── 상수 ── */
    var DOW_KO   = ['일', '월', '화', '수', '목', '금', '토'];
    var MONTH_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    var STATUS_LBL = { APPROVED: '승인', PENDING: '대기', REJECTED: '거절', CANCELLED: '취소' };

    var PD_COLORS = [
        '#2563eb','#059669','#d97706','#db2777',
        '#7c3aed','#ea580c','#0891b2','#16a34a',
        '#9333ea','#0f766e','#b45309'
    ];

    /* 버블 열 색상 (0 없음, 1~4) */
    var HC = ['', '#93c5fd', '#3b82f6', '#f59e0b', '#ef4444'];

    /* 번아웃 임계값 */
    var THRESH_DANGER = 6;   /* 일일 6건 이상 → 위험 🔥 */
    var THRESH_WARN   = 4;   /* 일일 4건 이상 → 주의 ⚠️ */
    var STREAK_DAYS   = 3;
    var STREAK_THRESH = 2;

    /* 4주 = 28일 */
    var RANGE_DAYS = 28;

    /* ── 상태 ── */
    var allBookings  = [];
    var allMds       = [];
    var filterMd     = 'all';
    var filterStatus = 'all';
    var today        = new Date();
    today.setHours(0, 0, 0, 0);
    var rangeStart   = getRangeStart(today);

    /* ── 초기화 ── */
    /* 팝업 모드 감지 (?popup=1) */
    var isPopup = (location.search.indexOf('popup=1') >= 0);
    if (isPopup) {
        /* 사이드바 숨김, 팝업 전용 헤더 표시 */
        $('body').addClass('popup-mode');
        $('#sidebar').hide();
        $('#app-layout').addClass('popup-layout');
        $('#main-content').addClass('popup-content');
        $('#popup-topbar').show();
        $('#normal-header').hide();
    }

    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('bookings.json'),
            AC.loadJSON('mds.json')
        ).done(function (bR, mR) {
            allBookings = bR[0];
            allMds      = mR[0];
            buildPdFilter();
            renderAll();
        }).fail(function () {
            $('#hm-grid-wrap').html(
                '<div style="padding:60px;text-align:center;color:#ef4444;">데이터 로드 실패</div>'
            );
        });
    });

    /* ── 유틸 ── */
    function pad2(n) { return String(n).padStart(2, '0'); }
    function dateKey(d) {
        return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    }
    function strKey(s) { return s ? String(s).substring(0, 10) : ''; }
    function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
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
    function getRangeStart(base) {
        var d = addDays(base, -(RANGE_DAYS - 1));
        d.setDate(d.getDate() - d.getDay()); /* 일요일로 정렬 */
        d.setHours(0, 0, 0, 0);
        return d;
    }
    function fmtDateKo(d) {
        return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DOW_KO[d.getDay()] + ')';
    }
    function fmtDk(dk) {
        var p = dk.split('-');
        return parseInt(p[1]) + '/' + parseInt(p[2]);
    }
    function heatClass(cnt) {
        if (!cnt) return 'hl-0';
        return 'hl-' + Math.min(cnt, 4);
    }

    /* ── PD 필터 ── */
    function buildPdFilter() {
        var $sel = $('#hm-pd-filter');
        $sel.find('option:not(:first)').remove();
        $.each(allMds, function (i, md) {
            $sel.append('<option value="' + md.Md_No + '">' + md.Md_Name + '</option>');
        });
    }

    /* ── 이벤트 ── */
    $('#hm-btn-prev').on('click', function () { rangeStart = addDays(rangeStart, -7); renderAll(); });
    $('#hm-btn-next').on('click', function () { rangeStart = addDays(rangeStart, 7);  renderAll(); });
    $('#hm-btn-today').on('click', function () { rangeStart = getRangeStart(today);    renderAll(); });
    $('#hm-pd-filter').on('change', function () { filterMd = String($(this).val()); renderAll(); });
    $('#hm-status-filter').on('change', function () { filterStatus = String($(this).val()); renderAll(); });
    $('#hm-detail-close, #hm-detail-backdrop').on('click', closePanel);
    $(document).on('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

    /* ── 데이터 빌드 ── */
    function buildData() {
        var days = [];
        for (var i = 0; i < RANGE_DAYS; i++) { days.push(addDays(rangeStart, i)); }

        var mdList = filterMd === 'all' ? allMds : $.grep(allMds, function (md) {
            return String(md.Md_No) === filterMd;
        });

        var filtered = $.grep(allBookings, function (b) {
            return filterStatus === 'all' || b.Status === filterStatus;
        });

        var mdData = {};
        $.each(mdList, function (i, md) {
            var n = String(md.Md_No);
            mdData[n] = {};
            $.each(days, function (j, day) { mdData[n][dateKey(day)] = []; });
        });
        $.each(filtered, function (i, b) {
            if (!b.Meeting_Datetime) return;
            var dk = strKey(b.Meeting_Datetime);
            var n  = String(AC.normMd(b.Md_No));
            if (mdData[n] && mdData[n][dk] !== undefined) { mdData[n][dk].push(b); }
        });

        return { days: days, mdList: mdList, mdData: mdData };
    }

    /* ── 번아웃 분석 ── */
    function analyzeBurnout(pdDayData, days) {
        var dangerDays = [], warnDays = [], streakRanges = [], weekTotal = 0;
        var counts = [];

        $.each(days, function (i, day) {
            var dk  = dateKey(day);
            var cnt = (pdDayData[dk] || []).length;
            counts.push({ dk: dk, cnt: cnt, day: day });
            weekTotal += cnt;
            if (cnt >= THRESH_DANGER) dangerDays.push(dk);
            else if (cnt >= THRESH_WARN) warnDays.push(dk);
        });

        var streak = [];
        for (var i = 0; i < counts.length; i++) {
            if (counts[i].cnt >= STREAK_THRESH) {
                streak.push(counts[i].dk);
            } else {
                if (streak.length >= STREAK_DAYS) streakRanges.push(streak.slice());
                streak = [];
            }
        }
        if (streak.length >= STREAK_DAYS) streakRanges.push(streak.slice());

        var level = 'ok';
        if (dangerDays.length > 0 || streakRanges.length > 0) level = 'danger';
        else if (warnDays.length > 0) level = 'warn';

        return { level: level, dangerDays: dangerDays, warnDays: warnDays,
                 streakRanges: streakRanges, weekTotal: weekTotal, counts: counts };
    }

    /* ── 주간 레이블 ── */
    function updateWeekLabel() {
        var ws  = rangeStart;
        var we  = addDays(rangeStart, RANGE_DAYS - 1);
        var lbl = ws.getFullYear() + '년 ' + MONTH_KO[ws.getMonth()] + ' ' + ws.getDate() + '일 ~ ' +
                  MONTH_KO[we.getMonth()] + ' ' + we.getDate() + '일 (4주)';
        $('#hm-week-label').text(lbl);
    }

    /* ── 렌더링 총괄 ── */
    function renderAll() {
        updateWeekLabel();
        var data = buildData();
        renderBubbleChart(data);
        renderSummaryCards(data);
    }

    /* ══════════════════════════════════════════════
       버블 차트 메인 렌더링
    ══════════════════════════════════════════════ */
    function renderBubbleChart(data) {
        var days     = data.days;
        var mdList   = data.mdList;
        var todayKey = dateKey(today);

        /* 레이아웃 상수 */
        var ML = 158;   /* Y축 영역 너비 */
        var MT = 82;    /* X축 영역 높이 */
        var CW = 42;    /* 열 너비(1일당) */
        var RH = 60;    /* 행 높이(1 PD당) */
        var WG = 18;    /* 주차 그룹 간격 */
        var MR = 19;    /* 최대 버블 반지름 */

        /* rangeStart = 일요일 → weekNum = Math.floor(i/7) */
        function xOf(i) { return ML + i * CW + Math.floor(i / 7) * WG + CW / 2; }
        function yOf(mi) { return MT + mi * RH + RH / 2; }

        var svgW = ML + days.length * CW + 3 * WG + 20;
        var svgH = MT + mdList.length * RH + 20;

        /* PD별 번아웃 분석 */
        var burnout = {};
        $.each(mdList, function (mi, md) {
            burnout[String(md.Md_No)] = analyzeBurnout(data.mdData[String(md.Md_No)], days);
        });

        /* ── SVG 빌드 ── */
        var s = '';
        s += '<svg xmlns="http://www.w3.org/2000/svg"';
        s += ' width="' + svgW + '" height="' + svgH + '" class="bbl-svg">';

        /* 필터 정의 */
        s += '<defs>';
        s += '<filter id="f-glow-d" x="-60%" y="-60%" width="220%" height="220%">';
        s += '<feGaussianBlur stdDeviation="4" result="b"/>';
        s += '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

        s += '<filter id="f-glow-w" x="-50%" y="-50%" width="200%" height="200%">';
        s += '<feGaussianBlur stdDeviation="3" result="b"/>';
        s += '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

        /* 주차 스트라이프 그라디언트 */
        s += '<linearGradient id="stripe-even" x1="0" y1="0" x2="0" y2="1">';
        s += '<stop offset="0%" stop-color="#f0f7ff" stop-opacity="0.9"/>';
        s += '<stop offset="100%" stop-color="#e8f0fe" stop-opacity="0.6"/>';
        s += '</linearGradient>';
        s += '</defs>';

        /* ── 배경 ── */
        s += '<rect width="' + svgW + '" height="' + svgH + '" fill="#ffffff" rx="0"/>';

        /* 짝수 주차 배경 스트라이프 */
        for (var wi = 0; wi < 4; wi++) {
            if (wi % 2 === 1) {
                var wx0 = ML + wi * 7 * CW + wi * WG;
                var wx1 = wx0 + 7 * CW;
                s += '<rect x="' + wx0 + '" y="' + (MT - 2) + '"';
                s += ' width="' + (wx1 - wx0) + '" height="' + (mdList.length * RH + 4) + '"';
                s += ' fill="url(#stripe-even)" rx="0"/>';
            }
        }

        /* 주말 열 강조 */
        $.each(days, function (i, day) {
            var dow = day.getDay();
            if (dow === 0 || dow === 6) {
                var cx0 = ML + i * CW + Math.floor(i / 7) * WG;
                s += '<rect x="' + cx0 + '" y="' + MT + '"';
                s += ' width="' + CW + '" height="' + (mdList.length * RH) + '"';
                s += ' fill="rgba(148,163,184,0.06)" rx="0"/>';
            }
        });

        /* 오늘 열 강조 */
        $.each(days, function (i, day) {
            if (dateKey(day) === todayKey) {
                var cx0 = ML + i * CW + Math.floor(i / 7) * WG + 1;
                s += '<rect x="' + cx0 + '" y="' + (MT - 10) + '"';
                s += ' width="' + (CW - 2) + '" height="' + (mdList.length * RH + 12) + '"';
                s += ' fill="#eff6ff" rx="4" opacity="0.75"/>';
                s += '<line x1="' + xOf(i) + '" y1="' + (MT - 10) + '"';
                s += ' x2="' + xOf(i) + '" y2="' + (MT + mdList.length * RH) + '"';
                s += ' stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="5,4" opacity="0.35"/>';
            }
        });

        /* 번아웃 행 배경틴트 */
        $.each(mdList, function (mi, md) {
            var ba = burnout[String(md.Md_No)];
            if (!ba || ba.level === 'ok') return;
            var y0   = MT + mi * RH + 2;
            var fill = ba.level === 'danger' ? 'rgba(254,226,226,0.45)' : 'rgba(254,243,199,0.4)';
            s += '<rect x="' + ML + '" y="' + y0 + '"';
            s += ' width="' + (svgW - ML - 8) + '" height="' + (RH - 4) + '"';
            s += ' fill="' + fill + '" rx="6"/>';
        });

        /* 행 구분선 */
        $.each(mdList, function (mi, md) {
            if (mi > 0) {
                var y = MT + mi * RH;
                s += '<line x1="0" y1="' + y + '" x2="' + svgW + '" y2="' + y + '"';
                s += ' stroke="#f1f5f9" stroke-width="1"/>';
            }
        });

        /* 주차 경계 점선 */
        for (var ww = 1; ww <= 3; ww++) {
            var sepX = ML + ww * 7 * CW + (ww - 1) * WG + WG / 2;
            s += '<line x1="' + sepX + '" y1="' + (MT - 18) + '"';
            s += ' x2="' + sepX + '" y2="' + (svgH - 6) + '"';
            s += ' stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="5,4" opacity="0.7"/>';
        }

        /* ── X축 — 주차 레이블 ── */
        for (var wi2 = 0; wi2 < 4; wi2++) {
            var wsi  = wi2 * 7;
            var wei  = Math.min(wi2 * 7 + 6, days.length - 1);
            if (wsi >= days.length) break;
            var wsd  = days[wsi];
            var wed  = days[wei];
            var wmx  = (xOf(wsi) + xOf(wei)) / 2;
            var wlbl = 'W' + (wi2 + 1) + '  ' +
                       (wsd.getMonth() + 1) + '/' + wsd.getDate() +
                       ' – ' + (wed.getMonth() + 1) + '/' + wed.getDate();
            s += '<text x="' + wmx + '" y="15" class="bc-week-lbl" text-anchor="middle">' + wlbl + '</text>';
        }

        /* X축 — 요일 + 날짜 */
        $.each(days, function (i, day) {
            var x    = xOf(i);
            var dow  = day.getDay();
            var isT  = dateKey(day) === todayKey;
            var dowC = dow === 0 ? '#ef4444' : (dow === 6 ? '#3b82f6' : '#94a3b8');
            var datC = dow === 0 ? '#ef4444' : (dow === 6 ? '#3b82f6' : '#64748b');

            s += '<text x="' + x + '" y="34" class="bc-dow" fill="' + dowC + '" text-anchor="middle">';
            s += DOW_KO[dow] + '</text>';

            if (isT) {
                s += '<circle cx="' + x + '" cy="56" r="12" fill="#2563eb"/>';
                s += '<text x="' + x + '" y="61" class="bc-date-today" text-anchor="middle">' + day.getDate() + '</text>';
            } else {
                s += '<text x="' + x + '" y="61" class="bc-date" fill="' + datC + '" text-anchor="middle">' + day.getDate() + '</text>';
            }
        });

        /* ── Y축 — PD 레이블 ── */
        $.each(mdList, function (mi, md) {
            var mdNo  = String(md.Md_No);
            var idx   = getMdIdx(mdNo);
            var color = PD_COLORS[idx % PD_COLORS.length];
            var init  = md.Md_Name ? md.Md_Name.charAt(0) : '?';
            var cy    = yOf(mi);
            var ba    = burnout[mdNo];

            /* 아바타 */
            s += '<circle cx="20" cy="' + cy + '" r="16" fill="' + color + '"/>';
            s += '<text x="20" y="' + (cy + 5) + '" class="bc-avatar-char" text-anchor="middle">' + init + '</text>';

            /* 이름/팀 */
            s += '<text x="44" y="' + (cy - 5) + '" class="bc-pd-name">' + md.Md_Name + '</text>';
            s += '<text x="44" y="' + (cy + 11) + '" class="bc-pd-team">' + (md.Team_Name || '') + '</text>';

            /* 번아웃 아이콘 */
            if (ba && ba.level !== 'ok') {
                var boTxt = ba.level === 'danger' ? '🔥' : '⚠️';
                s += '<text x="' + (ML - 8) + '" y="' + (cy + 6) + '" class="bc-bo-icon" text-anchor="middle">' + boTxt + '</text>';
            }
        });

        /* ══════════════════════════
           BUBBLES
        ══════════════════════════ */
        $.each(days, function (i, day) {
            var dk = dateKey(day);
            var x  = xOf(i);

            $.each(mdList, function (mi, md) {
                var mdNo = String(md.Md_No);
                var list = data.mdData[mdNo][dk] || [];
                var cnt  = list.length;
                var cy   = yOf(mi);

                /* 빈 셀 작은 점 */
                if (cnt === 0) {
                    s += '<circle cx="' + x + '" cy="' + cy + '" r="2.5"';
                    s += ' fill="#e2e8f0" class="bbl-empty" pointer-events="none"/>';
                    return;
                }

                var lv    = Math.min(cnt, 4);
                /* 비선형 반지름으로 시각 차별화 */
                var radii = [0, MR * 0.36, MR * 0.60, MR * 0.82, MR * 1.0];
                var r     = radii[lv];
                var fc    = HC[lv];
                var ba    = burnout[mdNo];
                var isDng = ba && $.inArray(dk, ba.dangerDays) >= 0;
                var isWrn = ba && $.inArray(dk, ba.warnDays) >= 0;
                var delay = ((i * 0.012) + (mi * 0.020)).toFixed(3);
                var flt   = isDng ? ' filter="url(#f-glow-d)"' : (isWrn ? ' filter="url(#f-glow-w)"' : '');

                /* 외부 글로우 링(위험 버블) */
                if (isDng) {
                    s += '<circle cx="' + x + '" cy="' + cy + '" r="' + (r + 8) + '"';
                    s += ' fill="' + fc + '" opacity="0.18" class="bbl-pulse-ring"';
                    s += ' style="animation-delay:' + delay + 's" pointer-events="none"/>';
                }

                /* 주변 soft halo */
                if (lv >= 3) {
                    s += '<circle cx="' + x + '" cy="' + cy + '" r="' + (r + 3) + '"';
                    s += ' fill="' + fc + '" opacity="0.14" pointer-events="none"/>';
                }

                /* 메인 버블 */
                s += '<circle class="hm-bubble-dot hl-' + lv + '"';
                s += ' cx="' + x + '" cy="' + cy + '" r="' + r + '"';
                s += ' fill="' + fc + '"' + flt;
                s += ' data-md="' + mdNo + '" data-dk="' + dk + '" data-cnt="' + cnt + '"';
                s += ' style="animation-delay:' + delay + 's">';
                s += '</circle>';

                /* 건수 레이블 (3건↑ 버블 안) */
                if (lv >= 3) {
                    s += '<text x="' + x + '" y="' + (cy + 4) + '"';
                    s += ' class="bc-cnt-lbl" style="animation-delay:' + delay + 's" pointer-events="none">';
                    s += cnt + '</text>';
                }
            });
        });

        s += '</svg>';

        /* 통계 스트립 + 범례 */
        var stats  = buildStatsStrip(data, burnout);
        var legend = buildLegendHtml();

        $('#hm-grid-wrap').html(
            '<div class="bbl-container">' +
            stats +
            '<div class="bbl-scroll-area">' + s + '</div>' +
            legend +
            '</div>'
        );
    }

    /* ── 통계 스트립 ── */
    function buildStatsStrip(data, burnout) {
        var total = 0, peakPdName = '-', peakPdCnt = 0;
        var dangerN = 0, warnN = 0;
        var dayCounts = {};

        /* PD별 집계 */
        $.each(data.mdList, function (mi, md) {
            var mdNo = String(md.Md_No);
            var ba   = burnout[mdNo];
            if (ba.level === 'danger') dangerN++;
            else if (ba.level === 'warn') warnN++;
            total += ba.weekTotal;
            if (ba.weekTotal > peakPdCnt) { peakPdCnt = ba.weekTotal; peakPdName = md.Md_Name; }
        });

        /* 날짜별 집계 */
        var peakDayCnt = 0, peakDayFmt = '-';
        $.each(data.days, function (i, day) {
            var dk  = dateKey(day);
            var cnt = 0;
            $.each(data.mdList, function (mi, md) {
                cnt += (data.mdData[String(md.Md_No)][dk] || []).length;
            });
            if (cnt > peakDayCnt) { peakDayCnt = cnt; peakDayFmt = fmtDk(dk) + '  ' + cnt + '건'; }
        });

        var burnoutHtml = '';
        if (dangerN > 0)  burnoutHtml += '<span class="bbl-st-badge danger">🔥 위험 ' + dangerN + '명</span>';
        if (warnN > 0)    burnoutHtml += '<span class="bbl-st-badge warn">⚠️ 주의 ' + warnN + '명</span>';
        if (!dangerN && !warnN) burnoutHtml = '<span class="bbl-st-badge ok">✅ 전원 정상</span>';

        return '<div class="bbl-stats-strip">' +
            '<div class="bbl-stat">' +
                '<div class="bbl-stat-num">' + total + '</div>' +
                '<div class="bbl-stat-lbl">기간 총 미팅</div>' +
            '</div>' +
            '<div class="bbl-stat-divider"></div>' +
            '<div class="bbl-stat">' +
                '<div class="bbl-stat-num" style="font-size:1rem;">' + peakPdName + '</div>' +
                '<div class="bbl-stat-num-2" style="font-size:0.8rem;opacity:.6;">' + peakPdCnt + '건</div>' +
                '<div class="bbl-stat-lbl">최다 미팅 PD</div>' +
            '</div>' +
            '<div class="bbl-stat-divider"></div>' +
            '<div class="bbl-stat">' +
                '<div class="bbl-stat-num" style="font-size:.95rem;">' + peakDayFmt + '</div>' +
                '<div class="bbl-stat-lbl">최고 밀도 날짜</div>' +
            '</div>' +
            '<div class="bbl-stat-divider"></div>' +
            '<div class="bbl-stat bbl-stat-burnout">' +
                burnoutHtml +
                '<div class="bbl-stat-lbl" style="margin-top:6px;">번아웃 현황</div>' +
            '</div>' +
        '</div>';
    }

    /* ── 범례 ── */
    function buildLegendHtml() {
        function circleSvg(r, fill) {
            var sz = (r + 2) * 2;
            return '<svg width="' + sz + '" height="' + sz + '" style="vertical-align:middle;">' +
                   '<circle cx="' + (r + 2) + '" cy="' + (r + 2) + '" r="' + r + '" fill="' + fill + '"/>' +
                   '</svg>';
        }
        return '<div class="bbl-legend">' +
            '<span class="bbl-lgd-label">버블 크기 = 미팅 수</span>' +
            '<span class="bbl-lgd-item">' + circleSvg(7,  '#93c5fd') + ' 1건</span>' +
            '<span class="bbl-lgd-item">' + circleSvg(11, '#3b82f6') + ' 2건</span>' +
            '<span class="bbl-lgd-item">' + circleSvg(15, '#f59e0b') + ' 3건 ⚠️</span>' +
            '<span class="bbl-lgd-item">' + circleSvg(19, '#ef4444') + ' 4건↑ 🔥</span>' +
            '<span class="bbl-lgd-sep">|</span>' +
            '<span class="bbl-lgd-item"><span class="bbl-lgd-today-samp"></span> 오늘</span>' +
        '</div>';
    }

    /* ══════════════════════════════════════════════
       PD별 현황 요약 카드 (유지)
    ══════════════════════════════════════════════ */
    function renderSummaryCards(data) {
        var $wrap = $('#hm-summary-cards');
        var h = '';

        $.each(data.mdList, function (mi, md) {
            var mdNo  = String(md.Md_No);
            var mdIdx = getMdIdx(mdNo);
            var color = PD_COLORS[mdIdx % PD_COLORS.length];
            var init  = md.Md_Name ? md.Md_Name.charAt(0) : '?';
            var ba    = analyzeBurnout(data.mdData[mdNo], data.days);

            /* 최근 7일 미니 바차트 */
            var recentCounts = ba.counts.slice(-7);
            var maxCnt = 1;
            $.each(recentCounts, function (i, c) { if (c.cnt > maxCnt) maxCnt = c.cnt; });

            var barsHtml = '';
            $.each(recentCounts, function (i, c) {
                var pct = maxCnt > 0 ? Math.max(4, Math.round((c.cnt / maxCnt) * 42)) : 4;
                var hl  = heatClass(c.cnt);
                barsHtml += '<div class="hm-sc-bar-wrap">' +
                    '<div class="hm-sc-bar ' + hl + '" style="height:' + pct + 'px;"></div>' +
                    '<div class="hm-sc-bar-lbl">' + DOW_KO[c.day.getDay()] + '</div>' +
                    '</div>';
            });

            /* 번아웃 태그 */
            var tags = '';
            if (ba.dangerDays.length > 0)
                tags += '<span class="hm-sc-tag danger">🔥 4건↑ · ' + ba.dangerDays.length + '일</span>';
            if (ba.warnDays.length > 0)
                tags += '<span class="hm-sc-tag warn">⚠️ 3건 · ' + ba.warnDays.length + '일</span>';
            $.each(ba.streakRanges, function (i, r) {
                tags += '<span class="hm-sc-tag danger">🗓️ 연속 ' + r.length + '일</span>';
            });

            var stCls  = ba.level === 'danger' ? 'danger' : (ba.level === 'warn' ? 'warn' : 'ok');
            var stTxt  = ba.level === 'danger' ? '과부하' : (ba.level === 'warn' ? '주의' : '정상');
            var cardSt = 'hm-sc-status-' + (ba.level === 'ok' ? 'ok' : (ba.level === 'warn' ? 'warn' : 'danger'));

            h += '<div class="hm-sc ' + cardSt + '">' +
                '<div class="hm-sc-header">' +
                    '<div class="hm-sc-avatar" style="background:' + color + ';">' + init + '</div>' +
                    '<div class="hm-sc-info">' +
                        '<div class="hm-sc-name">' + md.Md_Name + '</div>' +
                        '<div class="hm-sc-team">' + (md.Team_Name || '') + '</div>' +
                    '</div>' +
                    '<span class="hm-sc-status ' + stCls + '">' + stTxt + '</span>' +
                '</div>' +
                '<div class="hm-sc-bars">' + barsHtml + '</div>' +
                (tags ? '<div class="hm-sc-tags">' + tags + '</div>' : '') +
                '<div class="hm-sc-stats">' +
                    '<span>4주 합계 <strong>' + ba.weekTotal + '건</strong></span>' +
                '</div>' +
            '</div>';
        });

        if (!h) {
            h = '<div style="grid-column:1/-1;text-align:center;color:var(--gray-300);padding:24px;font-size:var(--text-sm);">데이터 없음</div>';
        }
        $wrap.html(h);
    }

    /* ══════════════════════════════════════════════
       툴팁 (SVG 버블 기반)
    ══════════════════════════════════════════════ */
    $(document).on('mouseenter', '.hm-bubble-dot', function () {
        var $c   = $(this);
        var mdNo = String($c.attr('data-md'));
        var dk   = String($c.attr('data-dk'));
        var cnt  = parseInt($c.attr('data-cnt'), 10) || 0;
        var md   = getMd(mdNo);
        var mdNm = md ? md.Md_Name : mdNo;
        var color = PD_COLORS[getMdIdx(mdNo) % PD_COLORS.length];

        var parts  = dk.split('-');
        var dayObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        var list = [];
        $.each(allBookings, function (i, b) {
            if (AC.normMd(b.Md_No) === AC.normMd(mdNo) && strKey(b.Meeting_Datetime) === dk) {
                if (filterStatus === 'all' || b.Status === filterStatus) list.push(b);
            }
        });
        list.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });

        var boStr = cnt >= THRESH_DANGER ? ' <span style="color:#fbbf24;">🔥 과부하</span>' :
                    cnt >= THRESH_WARN   ? ' <span style="color:#fcd34d;">⚠️ 주의</span>' : '';

        var rows = '';
        $.each(list.slice(0, 5), function (i, b) {
            var t   = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '';
            var stl = STATUS_LBL[b.Status] || b.Status;
            rows += '<div class="hm-tt-row"><span>' + t + ' ' + (b.User_Name || '') + '</span><span>' + stl + '</span></div>';
        });
        if (list.length > 5) rows += '<div style="opacity:.5;font-size:10px;margin-top:2px;">외 ' + (list.length - 5) + '건...</div>';

        $('#hm-tooltip').html(
            '<div class="hm-tt-date">' + fmtDateKo(dayObj) + '</div>' +
            '<div class="hm-tt-pd" style="color:' + color + ';">' + mdNm + ' PD</div>' +
            '<div class="hm-tt-count">' + cnt + '<span style="font-size:.75em;font-weight:600;opacity:.7;">건</span>' + boStr + '</div>' +
            '<div class="hm-tt-list">' + (rows || '<span style="opacity:.4;">예약 없음</span>') + '</div>'
        ).show();
    });

    $(document).on('mouseleave', '.hm-bubble-dot', function () { $('#hm-tooltip').hide(); });

    $(document).on('mousemove', function (e) {
        var $tt = $('#hm-tooltip');
        if (!$tt.is(':visible')) return;
        var ttW = $tt.outerWidth(), ttH = $tt.outerHeight();
        var x = e.clientX + 14, y = e.clientY - ttH / 2;
        if (x + ttW > $(window).width())  x = e.clientX - ttW - 14;
        if (y < 4) y = 4;
        if (y + ttH > $(window).height()) y = $(window).height() - ttH - 4;
        $tt.css({ left: x, top: y });
    });

    /* ── 버블 클릭 → 상세 패널 ── */
    $(document).on('click', '.hm-bubble-dot', function () {
        var $c   = $(this);
        var mdNo = String($c.attr('data-md'));
        var dk   = String($c.attr('data-dk'));
        var md   = getMd(mdNo);
        var mdNm = md ? md.Md_Name : mdNo;
        var color = PD_COLORS[getMdIdx(mdNo) % PD_COLORS.length];

        var parts  = dk.split('-');
        var dayObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        var list = [];
        $.each(allBookings, function (i, b) {
            if (AC.normMd(b.Md_No) === AC.normMd(mdNo) && strKey(b.Meeting_Datetime) === dk) list.push(b);
        });
        list.sort(function (a, b) { return a.Meeting_Datetime > b.Meeting_Datetime ? 1 : -1; });

        $('#hm-detail-title').html('<span style="color:' + color + ';">' + mdNm + '</span> PD');
        $('#hm-detail-sub').text(fmtDateKo(dayObj) + ' · 총 ' + list.length + '건');

        var bodyHtml = '';
        if (list.length === 0) {
            bodyHtml = '<div class="hm-detail-empty">😶 예약이 없는 날입니다.</div>';
        } else {
            $.each(list, function (i, b) {
                var t = b.Meeting_Datetime ? b.Meeting_Datetime.substring(11, 16) : '';
                var stLabel = STATUS_LBL[b.Status] || b.Status;
                bodyHtml += '<div class="hm-detail-item">' +
                    '<div class="hm-di-header">' +
                        '<span class="hm-di-time">' + t + '</span>' +
                        '<span class="hm-di-status ' + b.Status + '">' + stLabel + '</span>' +
                    '</div>' +
                    '<div class="hm-di-user">' + (b.User_Name || '-') + '</div>' +
                    '<div class="hm-di-affil">' + (b.User_Affiliation || '') + '</div>' +
                    (b.Notes ? '<div class="hm-di-notes">' + b.Notes + '</div>' : '') +
                '</div>';
            });
        }
        $('#hm-detail-body').html(bodyHtml);
        $('#hm-tooltip').hide();
        openPanel();
    });

    function openPanel() {
        $('#hm-detail-panel').show();
        $('#hm-detail-backdrop').show();
        $('body').css('overflow', 'hidden');
    }
    function closePanel() {
        $('#hm-detail-panel').hide();
        $('#hm-detail-backdrop').hide();
        $('body').css('overflow', '');
    }
});
