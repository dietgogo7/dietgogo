/**
 * adminV2/js/blacklist.js
 * 블랙리스트 관리 페이지 전용 (blacklist.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var allBlacklist = [];
    var allBookings = [];
    var allMds = [];

    // DOM Elements
    var blacklistTbody = $('#blacklist-tbody');
    var blacklistPhoneInput = $('#blacklist-phone');
    var blacklistReasonInput = $('#blacklist-reason');
    var $blacklistForm = $('#blacklist-form');

    // --- 초기화 ---
    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('blacklist.json'),
            AC.loadJSON('bookings.json'),
            AC.loadJSON('mds.json')
        ).done(function (blacklistRes, bookingsRes, mdsRes) {
            allBlacklist = blacklistRes[0] || [];
            allBookings = bookingsRes[0] || [];
            allMds = mdsRes[0] || [];
            renderBlacklist();
            AC.renderMeetingKing(allBookings);
        }).fail(function (err) {
            // blacklist.json이 없을 수 있으므로 개별 로드 폴백
            console.warn('일부 데이터 로드 실패, 개별 로드 시도:', err);
            var bl = AC.loadJSON('blacklist.json').then(null, function () { return $.Deferred().resolve([]); });
            var bk = AC.loadJSON('bookings.json').then(null, function () { return $.Deferred().resolve([]); });
            var md = AC.loadJSON('mds.json').then(null, function () { return $.Deferred().resolve([]); });
            $.when(bl, bk, md).done(function (b, bo, m) {
                allBlacklist = $.isArray(b) ? b : [];
                allBookings = $.isArray(bo) ? bo : [];
                allMds = $.isArray(m) ? m : [];
                renderBlacklist();
                AC.renderMeetingKing(allBookings);
            });
        });
    });

    // --- 블랙리스트 목록 렌더링 ---
    function renderBlacklist() {
        if (!blacklistTbody.length) return;
        blacklistTbody.empty();

        var sortedList = allBlacklist.slice().sort(function (a, b) {
            return new Date(b.Regist_Datetime) - new Date(a.Regist_Datetime);
        });

        if (sortedList.length === 0) {
            blacklistTbody.html('<tr><td colspan="4" style="text-align:center; padding:20px;">등록된 블랙리스트가 없습니다.</td></tr>');
            return;
        }

        $.each(sortedList, function (i, item) {
            var $row = $('<tr>' +
                '<td>' + item.Phone_No + '</td>' +
                '<td>' + item.Reason + '</td>' +
                '<td style="text-align:center;">' + AC.formatWithYear(item.Regist_Datetime) + '</td>' +
                '<td><button class="btn-xs btn-reject action-delete">해제</button></td>' +
                '</tr>');

            $row.find('.action-delete').on('click', function () {
                deleteBlacklist(item.Blacklist_Seq);
            });

            blacklistTbody.append($row);
        });
    }

    // --- 블랙리스트 등록 ---
    if ($blacklistForm.length) {
        $blacklistForm.on('submit', function (e) {
            e.preventDefault();
            var phone = blacklistPhoneInput.val().trim();
            var reason = blacklistReasonInput.val().trim();
            if (!phone) { alert('전화번호를 입력해주세요.'); return; }

            allBlacklist.push({
                Blacklist_Seq: Date.now(),
                Phone_No: phone,
                Reason: reason,
                Regist_Datetime: new Date().toISOString()
            });
            console.log('[POST] 블랙리스트 등록:', { Phone_No: phone, Reason: reason });
            alert('블랙리스트에 등록되었습니다.');
            blacklistPhoneInput.val('');
            blacklistReasonInput.val('');
            renderBlacklist();
        });
    }

    // --- 블랙리스트 해제 ---
    function deleteBlacklist(id) {
        if (!confirm('블랙리스트를 해제하시겠습니까?')) return;
        allBlacklist = $.grep(allBlacklist, function (item) { return item.Blacklist_Seq !== id; });
        renderBlacklist();
    }
});
