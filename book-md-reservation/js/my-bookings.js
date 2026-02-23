$(function () {
    var $container = $('#my-bookings-container');
    var urlParams = new URLSearchParams(window.location.search);
    var userPhone = urlParams.get('phone');

    if (!userPhone) {
        alert('잘못된 접근입니다.');
        window.location.href = 'index.html';
        return;
    }

    // State
    var myBookings = [];
    var allMds = [];
    var allSlots = [];

    function initialize() {
        $.when(
            $.getJSON('data/bookings.json'),
            $.getJSON('data/mds.json'),
            $.getJSON('data/slots.json')
        ).done(function (bookingsData, mdsData, slotsData) {
            var rawBookings = bookingsData[0];
            var rawMds = mdsData[0];
            var rawSlots = slotsData[0];

            allMds = $.map(rawMds, function (item) {
                return {
                    Md_No: item.Md_No || item.Md_Id || item.id,
                    Md_Name: item.Md_Name || item.name,
                    Team_Name: item.Team_Name,
                    Category_Name: item.Category_Name || item.category,
                    Status: item.Status || item.status
                };
            });

            allSlots = $.map(rawSlots, function (item) {
                return {
                    Slot_Seq: item.Slot_Seq || item.Slot_Id || item.id,
                    Md_No: item.Md_No || item.Md_Id || item.mdId,
                    Start_Datetime: item.Start_Datetime || item.startTime,
                    End_Datetime: item.End_Datetime || item.endTime,
                    Status: item.Status || item.status
                };
            });

            var bookings = $.map(rawBookings, function (item) {
                return {
                    Booking_Seq: item.Booking_Seq || item.id,
                    Slot_Seq: item.Slot_Seq || item.Slot_Id || item.slotId,
                    Md_No: item.Md_No || item.Md_Id || item.mdId,
                    Meeting_Datetime: item.Meeting_Datetime || item.meetingTime,
                    User_Name: item.User_Name || item.userName,
                    User_Affiliation: item.User_Affiliation || item.userAffiliation,
                    User_Email: item.User_Email || item.userEmail,
                    User_Phone: item.User_Phone || item.userPhone,
                    Notes: item.Notes || item.notes,
                    Status: item.Status || item.status,
                    Regist_Datetime: item.Regist_Datetime || item.createdAt
                };
            });

            myBookings = $.grep(bookings, function (b) {
                return b.User_Phone === userPhone;
            });

            myBookings.sort(function (a, b) {
                return new Date(b.Regist_Datetime) - new Date(a.Regist_Datetime);
            });

            renderBookings();
        }).fail(function () {
            $container.html('<p class="no-bookings">데이터를 불러오는데 실패했습니다.</p>');
        });
    }

    window.cancelBooking = function (slotSeq) {
        if (!confirm('정말로 예약을 취소하시겠습니까?')) return;

        var booking = $.grep(myBookings, function (b) { return b.Slot_Seq === slotSeq; })[0];
        if (booking) {
            booking.Status = 'CANCELLED';
            alert('예약이 취소되었습니다.');
            renderBookings();
        }
    };

    function renderBookings() {
        if (myBookings.length === 0) {
            $container.html('<p class="no-bookings" style="text-align:center; padding:100px 0; color:#94a3b8; font-size:18px;">예약 내역이 없습니다.</p>');
            return;
        }

        var statusLabels = {
            'PENDING': '예약신청',
            'APPROVED': '예약확정',
            'REJECTED': '승인거절',
            'CANCELLED': '예약취소',
            'COMPLETED': '이용완료'
        };

        var template = $('#booking-item-template').html();
        var html = $.map(myBookings, function (b) {
            var slot = $.grep(allSlots, function (s) { return s.Slot_Seq === b.Slot_Seq; })[0];
            if (!b.Md_No && slot) b.Md_No = slot.Md_No;
            if (!b.Meeting_Datetime && slot) b.Meeting_Datetime = slot.Start_Datetime;
            if (!b.Meeting_Datetime) b.Meeting_Datetime = b.Regist_Datetime;

            var md = $.grep(allMds, function (m) { return m.Md_No === b.Md_No; })[0];

            var date = new Date(b.Meeting_Datetime);
            var dateStr = '📅 ' + date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일 ' +
                ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] + ' ' +
                (date.getHours() < 10 ? '0' : '') + date.getHours() + ':' +
                (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

            var actionBtn = '';
            if (b.Status === 'PENDING' || b.Status === 'APPROVED') {
                actionBtn = '<button onclick="cancelBooking(\'' + b.Slot_Seq + '\')" class="btn-cancel-sm">예약취소</button>';
            }

            return template
                .replace(/{{DATE_STR}}/g, dateStr)
                .replace(/{{STATUS_CODE}}/g, b.Status)
                .replace(/{{STATUS_TEXT}}/g, statusLabels[b.Status] || b.Status)
                .replace(/{{MD_NAME}}/g, md ? md.Md_Name : '알 수 없음')
                .replace(/{{MD_CAT}}/g, md ? md.Category_Name : '-')
                .replace(/{{USER_NAME}}/g, b.User_Name || '-')
                .replace(/{{USER_AFFILIATION}}/g, b.User_Affiliation || '-')
                .replace(/{{USER_PHONE}}/g, b.User_Phone || '-')
                .replace(/{{USER_EMAIL}}/g, b.User_Email || '-')
                .replace(/{{NOTES}}/g, b.Notes || '-')
                .replace(/{{CANCEL_BUTTON}}/g, actionBtn);
        }).join('');

        $container.html(html);
    }

    initialize();
});
