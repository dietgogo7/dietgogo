/**
 * adminV2/js/booking.js
 * 예약 관리 페이지 전용 (index.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var allMds = [];
    var allSlots = [];
    var allBookings = [];
    var currentViewMode = 'all';
    var currentPage = 1;
    var itemsPerPage = 10;
    var sortField = 'meeting';   // 'meeting' | 'regist'
    var sortDir = 'asc';         // 'asc' | 'desc'

    var selectedMdNo = '';  // '' = 전체

    // DOM Elements
    var bookingsTbody = $('#bookings-tbody');
    var paginationContainer = $('#pagination-controls');
    var filterStartDateInput = $('#filter-start-date');
    var filterEndDateInput = $('#filter-end-date');
    var btnSearchDate = $('#btn-search-date');
    var filterApproved = $('#filter-approved-only');

    // --- 초기화 ---
    function init() {
        $.when(
            AC.loadJSON('mds.json'),
            AC.loadJSON('slots.json'),
            AC.loadJSON('bookings.json')
        ).done(function (mdsRes, slotsRes, bookingsRes) {
            allMds = mdsRes[0];
            allSlots = slotsRes[0];
            allBookings = bookingsRes[0];

            // Join: Md_Name 매칭
            $.each(allBookings, function (i, b) {
                b.Md_No = AC.normMd(b.Md_No);
                var slot = null;
                $.each(allSlots, function (j, s) {
                    if (s.Slot_Seq === b.Slot_Seq) { slot = s; return false; }
                });
                if (!b.Md_No && slot) b.Md_No = slot.Md_No;
                if (!b.Meeting_Datetime && slot) b.Meeting_Datetime = slot.Start_Datetime;
                var md = null;
                $.each(allMds, function (j, m) {
                    if (String(m.Md_No) === String(b.Md_No)) { md = m; return false; }
                });
                b.Md_Name = md ? md.Md_Name : 'Unknown';
                if (!b.Meeting_Datetime) b.Meeting_Datetime = b.Regist_Datetime;
            });

            // 날짜 초기값 설정
            var now = new Date();
            var startDate = new Date(now);
            startDate.setDate(now.getDate() - 14);
            var endDate = new Date(now);
            endDate.setDate(now.getDate() + 14);
            if (filterStartDateInput.length) filterStartDateInput.val(AC.formatDate(startDate));
            if (filterEndDateInput.length) filterEndDateInput.val(AC.formatDate(endDate));

            // MD 필터 옵션 생성
            buildMdFilter();

            renderBookings();
            AC.renderMeetingKing(allBookings);
        }).fail(function (err) {
            console.error('데이터 로드 실패:', err);
            if (bookingsTbody.length) {
                bookingsTbody.html('<tr><td colspan="7" style="color: red;">데이터 로드 실패</td></tr>');
            }
        });
    }

    // --- MD 필터 칩 렌더링 ---
    function buildMdFilter() {
        var h = '<span class="md-legend-item' + (selectedMdNo === '' ? ' active' : '') + '" data-md="all">전체</span>';
        $.each(allMds, function (i, md) {
            var isSelected = (selectedMdNo === String(md.Md_No));
            var cls = isSelected ? ' active' : (selectedMdNo !== '' ? ' faded' : '');
            h += '<span class="md-legend-item' + cls + '" data-md="' + md.Md_No + '">' +
                '<span class="md-legend-dot md-dot-' + (i % 8) + '"></span>' + md.Md_Name + '</span>';
        });
        $('#filter-md-legend').html(h);
    }

    // --- MD 칩 필터 클릭 ---
    $(document).on('click', '#filter-md-legend .md-legend-item', function () {
        var val = String($(this).data('md'));
        if (val === 'all' || val === selectedMdNo) {
            selectedMdNo = '';
        } else {
            selectedMdNo = val;
        }
        buildMdFilter();
        currentPage = 1;
        renderBookings();
    });

    // --- 확정만 보기 변경 ---
    filterApproved.on('change', function () { currentPage = 1; renderBookings(); });

    // --- 정렬 헤더 클릭 ---
    $(document).on('click', '.sortable', function () {
        var field = $(this).data('sort');
        if (sortField === field) {
            sortDir = (sortDir === 'asc') ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDir = 'asc';
        }
        updateSortIcons();
        currentPage = 1;
        renderBookings();
    });

    function updateSortIcons() {
        $('.sortable .sort-icon').each(function () {
            var $th = $(this).closest('.sortable');
            var field = $th.data('sort');
            if (field === sortField) {
                $(this).text(sortDir === 'asc' ? ' ▲' : ' ▼');
                $th.addClass('sort-active');
            } else {
                $(this).text('');
                $th.removeClass('sort-active');
            }
        });
    }

    // --- 보기 모드 ---
    window.setViewMode = function (mode) {
        currentViewMode = mode;
        $('.filter-btn').each(function () {
            var $btn = $(this);
            $btn.toggleClass('active', $btn.text().indexOf(mode === 'all' ? '전체' : mode === 'md' ? 'PD' : '날짜') >= 0);
        });
        currentPage = 1;
        renderBookings();
    };

    if (btnSearchDate.length) {
        btnSearchDate.on('click', function () {
            currentPage = 1;
            renderBookings();
        });
    }

    // --- 정렬 함수 ---
    function sortBookings(list) {
        var sorted = list.slice();
        sorted.sort(function (a, b) {
            var va, vb, cmp;
            // Primary sort
            if (sortField === 'meeting') {
                va = a.Meeting_Datetime || '';
                vb = b.Meeting_Datetime || '';
            } else {
                va = a.Regist_Datetime || '';
                vb = b.Regist_Datetime || '';
            }
            cmp = (va > vb) ? 1 : (va < vb) ? -1 : 0;
            if (sortDir === 'desc') cmp = -cmp;
            if (cmp !== 0) return cmp;

            // Secondary sort (tie-breaker)
            if (sortField === 'meeting') {
                // 동일 예약시간이면 신청일시 오름차순
                va = a.Regist_Datetime || '';
                vb = b.Regist_Datetime || '';
            } else {
                // 동일 신청일시이면 예약시간 오름차순
                va = a.Meeting_Datetime || '';
                vb = b.Meeting_Datetime || '';
            }
            return (va > vb) ? 1 : (va < vb) ? -1 : 0;
        });
        return sorted;
    }

    // --- 예약 목록 렌더링 ---
    function renderBookings() {
        if (!bookingsTbody.length) return;
        bookingsTbody.empty();
        updateSortIcons();

        var startDate = filterStartDateInput.val();
        var endDate = filterEndDateInput.val();
        var selectedMd = selectedMdNo;
        var approvedOnly = filterApproved.is(':checked');

        var filteredBookings = $.grep(allBookings, function (b) {
            // 기간 필터
            if (b.Meeting_Datetime) {
                var mDate = b.Meeting_Datetime.split('T')[0];
                if (startDate && mDate < startDate) return false;
                if (endDate && mDate > endDate) return false;
            }
            // MD 필터
            if (selectedMd && String(b.Md_No) !== String(selectedMd)) return false;
            // 예약확정만 보기
            if (approvedOnly && b.Status !== 'APPROVED') return false;
            return true;
        });

        // 정렬 적용
        filteredBookings = sortBookings(filteredBookings);

        if (filteredBookings.length === 0) {
            bookingsTbody.html('<tr><td colspan="7">접수된 예약이 없습니다.</td></tr>');
            paginationContainer.empty();
            return;
        }

        var totalItems = filteredBookings.length;
        var totalPages = Math.ceil(totalItems / itemsPerPage);
        var startIndex = (currentPage - 1) * itemsPerPage;
        var paginatedItems = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

        var groups = {};
        if (currentViewMode === 'md') {
            $.each(paginatedItems, function (i, b) {
                (groups[b.Md_Name] = groups[b.Md_Name] || []).push(b);
            });
        } else if (currentViewMode === 'date') {
            $.each(paginatedItems, function (i, b) {
                var date = b.Meeting_Datetime ? b.Meeting_Datetime.split('T')[0] : 'Unknown';
                (groups[date] = groups[date] || []).push(b);
            });
        } else {
            groups = { 'All': paginatedItems };
        }

        var keys = Object.keys(groups).sort();
        $.each(keys, function (i, key) {
            if (currentViewMode !== 'all') {
                bookingsTbody.append('<tr><td colspan="7" class="group-header">' + key + '</td></tr>');
            }

            $.each(groups[key], function (j, booking) {
                var createdAt = AC.formatWithYear(booking.Regist_Datetime);
                var meetingTime = AC.formatWithYear(booking.Meeting_Datetime);
                var statusLabel = AC.STATUS_LABELS[booking.Status] || booking.Status;

                var actionsHtml = '-';
                if (booking.Status === 'PENDING') {
                    actionsHtml = '<button class="btn-xs btn-approve action-approve">승인</button>' +
                        '<button class="btn-xs btn-reject action-reject">거절</button>' +
                        '<button class="btn-xs btn-reject action-cancel">취소</button>';
                } else if (booking.Status === 'APPROVED') {
                    actionsHtml = '<button class="btn-xs btn-reject action-cancel">취소</button>';
                }

                var $row = $('<tr style="cursor: pointer;">' +
                    '<td>' + createdAt + '</td>' +
                    '<td>' + booking.Md_Name + '</td>' +
                    '<td>' + booking.User_Name + '<br><small style="color:#888">' + booking.User_Affiliation + '</small></td>' +
                    '<td>' + booking.User_Phone + '</td>' +
                    '<td>' + meetingTime + '</td>' +
                    '<td><span class="status-text-' + booking.Status + '">' + statusLabel + '</span></td>' +
                    '<td>' + actionsHtml + '</td>' +
                    '</tr>');

                $row.on('click', function (e) {
                    if ($(e.target).is('button')) return;
                    openDetailModal(booking);
                });

                $row.find('.action-approve').on('click', function (e) { e.stopPropagation(); updateStatus(booking.Booking_Seq, 'APPROVED'); });
                $row.find('.action-reject').on('click', function (e) { e.stopPropagation(); updateStatus(booking.Booking_Seq, 'REJECTED'); });
                $row.find('.action-cancel').on('click', function (e) { e.stopPropagation(); updateStatus(booking.Booking_Seq, 'CANCELLED'); });

                bookingsTbody.append($row);
            });
        });

        renderPagination(totalPages);
    }

    // --- 페이지네이션 ---
    function renderPagination(totalPages) {
        paginationContainer.empty();
        if (totalPages <= 1) return;

        var prevBtn = $('<button>').addClass('page-btn').text('<').prop('disabled', currentPage === 1).on('click', function () {
            if (currentPage > 1) { currentPage--; renderBookings(); }
        });
        paginationContainer.append(prevBtn);

        for (var i = 1; i <= totalPages; i++) {
            (function (page) {
                var btn = $('<button>').addClass('page-btn' + (page === currentPage ? ' active' : '')).text(page).on('click', function () {
                    currentPage = page; renderBookings();
                });
                paginationContainer.append(btn);
            })(i);
        }

        var nextBtn = $('<button>').addClass('page-btn').text('>').prop('disabled', currentPage === totalPages).on('click', function () {
            if (currentPage < totalPages) { currentPage++; renderBookings(); }
        });
        paginationContainer.append(nextBtn);
    }

    // --- 상태 변경 ---
    window.updateStatus = function (bookingSeq, newStatus) {
        var booking = null;
        $.each(allBookings, function (i, b) {
            if (b.Booking_Seq === bookingSeq) { booking = b; return false; }
        });
        if (booking) {
            booking.Status = newStatus;
            alert('예약 상태가 ' + newStatus + '로 변경되었습니다.');
            renderBookings();
        }
    };

    // --- 모달 ---
    window.openDetailModal = function (booking) {
        var modal = $('#admin-detail-modal');
        var body = $('#admin-modal-body');

        var fields = [
            { label: '신청일시', value: AC.formatWithYear(booking.Regist_Datetime) },
            { label: '예약시간', value: AC.formatWithYear(booking.Meeting_Datetime) },
            { label: '담당 PD', value: booking.Md_Name },
            { label: '상태', value: AC.STATUS_LABELS[booking.Status] || booking.Status },
            { label: '신청자', value: booking.User_Name },
            { label: '소속', value: booking.User_Affiliation || '-' },
            { label: '연락처', value: booking.User_Phone },
            { label: '이메일', value: booking.User_Email },
            { label: '미팅 안건', value: booking.Notes || '-', isLong: true }
        ];

        var html = '';
        $.each(fields, function (i, f) {
            html += '<div class="detail-row ' + (f.isLong ? 'full-width' : '') + '">' +
                '<span class="detail-label">' + f.label + '</span>' +
                '<div class="detail-value"' + (f.isLong ? ' style="white-space: pre-wrap;"' : '') + '>' + f.value + '</div>' +
                '</div>';
        });
        body.html(html);
        modal.css('display', 'flex');
    };

    window.closeDetailModal = function () {
        $('#admin-detail-modal').hide();
    };

    // --- 사이드바 로드 후 초기화 ---
    AC.loadSidebar(function () {
        init();
    });
});
