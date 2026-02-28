/**
 * adminV2/js/notices.js
 * 공지사항 관리 페이지 전용 (notices.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var allNotices = [];
    var allBookings = [];
    var allMds = [];

    // DOM Elements
    var noticesTbody = $('#notices-tbody');
    var noticeDateInput = $('#notice-date');
    var noticeTitleInput = $('#notice-title');
    var noticeContentInput = $('#notice-content');
    var $noticeForm = $('#notice-form');

    // --- 초기화 ---
    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('notices.json'),
            AC.loadJSON('bookings.json'),
            AC.loadJSON('mds.json')
        ).done(function (noticesRes, bookingsRes, mdsRes) {
            allNotices = noticesRes[0];
            allBookings = bookingsRes[0];
            allMds = mdsRes[0];
            renderNotices();
            AC.renderMeetingKing(allBookings);
        }).fail(function (err) {
            console.error('데이터 로드 실패:', err);
        });
    });

    // --- 공지사항 목록 렌더링 ---
    function renderNotices() {
        if (!noticesTbody.length) return;
        noticesTbody.empty();

        var sortedNotices = allNotices.slice().sort(function (a, b) {
            return new Date(b.Notice_Date) - new Date(a.Notice_Date);
        });

        $.each(sortedNotices, function (i, notice) {
            var $row = $('<tr>' +
                '<td style="text-align:center;">' + notice.Notice_Date + '</td>' +
                '<td style="font-weight:bold;">' + notice.Title + '</td>' +
                '<td style="color:#555;">' + notice.Content + '</td>' +
                '<td><button class="btn-xs btn-reject action-delete">삭제</button></td>' +
                '</tr>');

            $row.find('.action-delete').on('click', function () {
                deleteNotice(notice.Notice_Seq);
            });

            noticesTbody.append($row);
        });
    }

    // --- 공지사항 등록 ---
    if ($noticeForm.length) {
        $noticeForm.on('submit', function (e) {
            e.preventDefault();
            var date = noticeDateInput.val();
            var title = noticeTitleInput.val();
            var content = noticeContentInput.val();

            if (!date || !title || !content) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            allNotices.push({ Notice_Seq: Date.now(), Notice_Date: date, Title: title, Content: content });
            console.log('[POST] 공지사항 등록:', { Notice_Date: date, Title: title, Content: content });
            alert('공지사항이 등록되었습니다.');
            noticeDateInput.val('');
            noticeTitleInput.val('');
            noticeContentInput.val('');
            renderNotices();
        });
    }

    // --- 공지사항 삭제 ---
    function deleteNotice(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        allNotices = $.grep(allNotices, function (n) { return n.Notice_Seq !== id; });
        renderNotices();
    }
});
