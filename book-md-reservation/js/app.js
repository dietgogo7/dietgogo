$(function () {
    // --- STATE ---
    var allMds = [];
    var allSlots = [];
    var currentFlow = 'md-first';
    var selectedMdId = null;
    var selectedDate = null;
    var selectedTime = null;

    // --- DOM ELEMENTS (jQuery Objects) ---
    var $flowMdBtn = $('#select-flow-md');
    var $flowDateBtn = $('#select-flow-date');
    var $flowMdContainer = $('#flow-md-first');
    var $flowDateContainer = $('#flow-date-first');

    // Flow 1
    var $mdListContainer1 = $('#md-list-container-1 .list-wrapper');
    var $dateSelectorContainer1 = $('#date-selector-container-1');
    var $calendarContainer1 = $('#calendar-container-1');
    var $slotsArea1 = $('#slots-area-1');
    var $slotsContainer1 = $('#slots-area-1 .list-wrapper');

    // Flow 2
    var $calendarContainer = $('#calendar-container');
    var $timeSelectorContainer2 = $('#time-selector-container-2');
    var $timeListWrapper2 = $('#time-selector-container-2 .list-wrapper');
    var $mdListContainer2 = $('#md-list-container-2');
    var $mdListWrapper2 = $('#md-list-container-2 .list-wrapper');

    // --- INITIALIZATION ---
    function initialize() {
        if ($flowMdBtn.length) $flowMdBtn.on('click', function () { switchFlow('md-first'); });
        if ($flowDateBtn.length) $flowDateBtn.on('click', function () { switchFlow('date-first'); });

        $.when(
            $.getJSON('data/mds.json'),
            $.getJSON('data/slots.json'),
            $.getJSON('data/notices.json')
        ).done(function (mdsData, slotsData, noticesData) {
            var rawMds = mdsData[0];
            var rawSlots = slotsData[0];
            var rawNotices = noticesData[0];

            allMds = $.map(rawMds, function (item) {
                return {
                    Md_No: item.Md_No || item.Md_Id || item.id,
                    Md_Name: item.Md_Name || item.name,
                    Team_Name: item.Team_Name,
                    Category_Name: item.Category_Name || item.category,
                    Status: item.Status || item.status,
                    Email: item.Email || item.email
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

            var notices = $.map(rawNotices, function (item) {
                return {
                    Notice_Seq: item.Notice_Seq || item.Notice_Id || item.id,
                    Notice_Date: item.Notice_Date || item.date,
                    Title: item.Title || item.title,
                    Content: item.Content || item.content
                };
            });

            switchFlow('md-first', true);
            renderFrontNotices(notices);
        }).fail(function (error) {
            console.error("Initialization failed:", error);
            $('#app').append(
                $('<div></div>')
                    .css({ color: 'red', fontWeight: 'bold', margin: '30px auto', textAlign: 'center' })
                    .text('데이터를 불러오지 못했습니다. 관리자에게 문의하세요.')
            );
        });
    }

    // 공지사항 렌더링
    function renderFrontNotices(notices) {
        var $container = $('#notice-alert-container');
        var $list = $('#front-notice-list');
        if (!notices || notices.length === 0) return;

        notices.sort(function (a, b) {
            return new Date(b.Notice_Date) - new Date(a.Notice_Date);
        });

        var html = $.map(notices, function (n) {
            return '<div style="margin-bottom:15px; border-bottom:1px dashed #edf2f7; padding-bottom:10px;">' +
                '<p style="font-size:14px; font-weight:700; margin-bottom:4px; color:#1e293b;">' + n.Notice_Date + ' ' + n.Title + '</p>' +
                '<p style="padding-left:10px; color:#64748b; font-size:14px;">' + n.Content + '</p>' +
                '</div>';
        }).join('');

        $list.html(html);
        $container.show();
    }

    // --- UTILS ---
    function scrollTo($el) {
        if (!$el || $el.length === 0) return;
        $('html, body').animate({
            scrollTop: $el.offset().top - 40
        }, 500);
    }

    // --- FLOW CONTROL ---
    function switchFlow(flow, skipScroll) {
        currentFlow = flow;
        resetSelections();

        var $bookingStepDiv = $('#booking-step-container');
        if ($bookingStepDiv.length) {
            $bookingStepDiv.hide().empty();
        }
        $('#inline-booking-form-container').hide();

        if (flow === 'md-first') {
            $flowMdContainer.show();
            $flowDateContainer.hide();
            $flowMdBtn.addClass('active');
            $flowDateBtn.removeClass('active');
            initializeMdFirstFlow();
            if (!skipScroll) scrollTo($flowMdContainer);
        } else {
            $flowMdContainer.hide();
            $flowDateContainer.show();
            $flowMdBtn.removeClass('active');
            $flowDateBtn.addClass('active');
            OYCalendar.render($calendarContainer, handleDateSelectInFlow2, null, selectedDate);
            if (!skipScroll) scrollTo($flowDateContainer);
        }
    }

    function resetSelections() {
        selectedMdId = null;
        selectedDate = null;
        selectedTime = null;

        $('.list-wrapper').empty();

        $dateSelectorContainer1.hide();
        $slotsArea1.hide();
        $timeSelectorContainer2.hide();
        $mdListContainer2.hide();

        $('#flow-md-first h3').html('1. MD를 선택해주세요.');
    }

    // --- FLOW 1: MD First ---
    function initializeMdFirstFlow() {
        renderMDs(allMds, $mdListContainer1, handleMdSelectInFlow1);
    }

    function handleMdSelectInFlow1(md) {
        selectedMdId = md.Md_No;
        $('#flow-md-first .md-item').removeClass('selected');
        $('#flow-md-first .md-item[data-md-id="' + md.Md_No + '"]').addClass('selected');

        $dateSelectorContainer1.show();
        $dateSelectorContainer1.find('h3').html('2. 날짜를 선택해주세요.');

        OYCalendar.render($calendarContainer1, function (dateObj, dateString) {
            selectedDate = dateString;
            handleDateSelectInFlow1(dateObj);
        }, null, selectedDate);

        if (selectedDate) {
            $slotsArea1.show();
            renderFilteredSlots();
            scrollTo($slotsArea1);
        } else {
            scrollTo($dateSelectorContainer1);
        }
    }

    function handleDateSelectInFlow1(dateObj) {
        $slotsArea1.show();
        $slotsArea1.find('h3').html('3. 시간을 선택해주세요.');
        if (selectedMdId) renderFilteredSlots();
        scrollTo($slotsArea1);
    }

    function renderFilteredSlots() {
        $slotsContainer1.empty();
        if (!selectedDate || !selectedMdId) return;

        var slotsForDay = $.grep(allSlots, function (s) {
            return s.Start_Datetime.indexOf(selectedDate) === 0 && s.Md_No === selectedMdId;
        });

        var slotLookup = {};
        $.each(slotsForDay, function (i, s) {
            var d = new Date(s.Start_Datetime);
            var h = String(d.getHours()).length < 2 ? '0' + d.getHours() : d.getHours();
            var m = String(d.getMinutes()).length < 2 ? '0' + d.getMinutes() : d.getMinutes();
            slotLookup[h + ':' + m] = s;
        });

        var md = $.grep(allMds, function (m) { return m.Md_No === selectedMdId; })[0];
        var isMdAway = md && (md.Status === 'AWAY' || md.Status === 'ON_LEAVE');

        var times = OYCalendar.generateTimeSlots('14:00', '15:15', 15);
        $.each(times, function (i, timeStr) {
            var slotData = slotLookup[timeStr];
            var $el = $('<div></div>').addClass('slot').text(timeStr);

            if (!slotData) {
                var startIso = selectedDate + 'T' + timeStr + ':00';
                var startDate = new Date(startIso);
                var endDate = new Date(startDate.getTime() + 15 * 60000);
                var pad = function (n) { return String(n).length < 2 ? '0' + n : n; };
                var endIso = endDate.getFullYear() + '-' + pad(endDate.getMonth() + 1) + '-' + pad(endDate.getDate()) + 'T' + pad(endDate.getHours()) + ':' + pad(endDate.getMinutes()) + ':00';

                slotData = {
                    Slot_Seq: 'virtual-' + selectedDate + '-' + timeStr + '-md' + selectedMdId,
                    Md_No: selectedMdId,
                    Start_Datetime: startIso,
                    End_Datetime: endIso,
                    Status: 'OPEN',
                    Capacity: 1
                };
            }

            $el.attr('data-slot-id', slotData.Slot_Seq);

            if (isMdAway) {
                $el.addClass('disabled').append(' (MD 부재중)');
            } else if (slotData.Status === 'OPEN') {
                $el.addClass('OPEN').on('click', function () { openBookingModal(slotData); });
            } else {
                $el.addClass('disabled ' + slotData.Status).append(' (' + slotData.Status + ')');
            }
            $slotsContainer1.append($el);
        });
    }

    // --- FLOW 2: Date -> Time -> MD ---
    function handleDateSelectInFlow2(dateObj, dateString) {
        selectedDate = dateString;
        resetSelectionsForFlow2(false);
        $timeSelectorContainer2.show();
        $timeSelectorContainer2.find('h3').html('2. 시간을 선택해주세요.');
        renderTimeSelectors();
        scrollTo($timeSelectorContainer2);
    }

    function renderTimeSelectors() {
        $timeListWrapper2.empty();
        var times = OYCalendar.generateTimeSlots('14:00', '15:30', 15);
        $.each(times, function (i, timeStr) {
            $('<div></div>')
                .addClass('time-item')
                .text(timeStr)
                .on('click', function () { handleTimeSelect(timeStr); })
                .appendTo($timeListWrapper2);
        });
    }

    function handleTimeSelect(time) {
        selectedTime = time;
        $timeListWrapper2.find('.time-item').removeClass('selected');
        $timeListWrapper2.find('.time-item').filter(function () { return $(this).text() === time; }).addClass('selected');

        $mdListContainer2.show();
        $mdListContainer2.find('h3').html('3. 예약 가능한 MD를 선택해주세요.');

        var availableMds = $.grep(allMds, function (md) {
            if (md.Status === 'AWAY' || md.Status === 'ON_LEAVE') return false;
            var slot = $.grep(allSlots, function (s) {
                return s.Start_Datetime.indexOf(selectedDate) === 0 && s.Start_Datetime.indexOf(time) !== -1 && s.Md_No === md.Md_No;
            })[0];
            if (slot && slot.Status !== 'OPEN') return false;
            return true;
        });
        renderMDs(availableMds, $mdListWrapper2, handleMdSelectInFlow2);
        scrollTo($mdListContainer2);
    }

    function handleMdSelectInFlow2(md) {
        selectedMdId = md.Md_No;
        var slot = $.grep(allSlots, function (s) {
            return s.Start_Datetime.indexOf(selectedDate) === 0 && s.Start_Datetime.indexOf(selectedTime) !== -1 && s.Md_No === selectedMdId;
        })[0];

        if (!slot) {
            var startIso = selectedDate + 'T' + selectedTime + ':00';
            var startDate = new Date(startIso);
            var endDate = new Date(startDate.getTime() + 15 * 60000);
            var pad = function (n) { return String(n).length < 2 ? '0' + n : n; };
            var endIso = endDate.getFullYear() + '-' + pad(endDate.getMonth() + 1) + '-' + pad(endDate.getDate()) + 'T' + pad(endDate.getHours()) + ':' + pad(endDate.getMinutes()) + ':00';

            slot = {
                Slot_Seq: 'virtual-' + selectedDate + '-' + selectedTime + '-md' + selectedMdId,
                Md_No: selectedMdId,
                Start_Datetime: startIso,
                End_Datetime: endIso,
                Status: 'OPEN',
                Capacity: 1
            };
        }

        if (slot.Status === 'OPEN') openBookingModal(slot);
    }

    function resetSelectionsForFlow2(isFullReset) {
        if (typeof isFullReset === 'undefined') isFullReset = true;
        if (isFullReset) selectedDate = null;
        selectedTime = null;
        selectedMdId = null;
        if (isFullReset) $timeSelectorContainer2.hide();
        $mdListContainer2.hide();
        $mdListWrapper2.empty();
        $timeListWrapper2.find('.time-item').removeClass('selected');
    }
    window.resetSelectionsForFlow2 = resetSelectionsForFlow2;

    // --- GENERIC RENDERERS ---
    function renderMDs(mdsToRender, $container, onSelect) {
        $container.empty();
        if (mdsToRender.length === 0) {
            $container.html('<p class="placeholder" style="flex:1;">선택 가능한 MD가 없습니다.</p>');
            return;
        }
        $.each(mdsToRender, function (i, md) {
            var $el = $('<div></div>').addClass('md-item').attr('data-md-id', md.Md_No);

            var statusLabel = '미팅 가능';
            var statusClass = 'available';

            if (md.Status === 'AWAY' || md.Status === 'ON_LEAVE') {
                statusLabel = '부재중';
                statusClass = 'away';
                $el.addClass('disabled');
            }

            $el.html('<strong>' + md.Md_Name + ' MD</strong>' +
                '<span class="md-email">' + (md.Email || '') + '</span>' +
                '<span class="md-cat">' + md.Category_Name + '</span>' +
                '<div class="status-tag ' + statusClass + '">' + statusLabel + '</div>');

            if (md.Md_No === selectedMdId) {
                $el.addClass('selected');
            }

            if (md.Status !== 'AWAY' && md.Status !== 'ON_LEAVE') {
                $el.on('click', function () { onSelect(md); });
            }
            $container.append($el);
        });
    }

    // --- BOOKING MODAL (INLINE) ---
    function openBookingModal(slot) {
        $flowMdContainer.hide();
        $flowDateContainer.hide();
        $('#inline-booking-form-container').hide();

        var md = $.grep(allMds, function (m) { return m.Md_No === slot.Md_No; })[0];
        var $main = $('main');
        var $sectionMaps = $('#section-maps');

        var $bookingStepDiv = $('#booking-step-container');
        if ($bookingStepDiv.length === 0) {
            $bookingStepDiv = $('<div></div>').attr('id', 'booking-step-container');
        }

        // section-maps 상단에 배치
        if ($sectionMaps.length) {
            $bookingStepDiv.insertBefore($sectionMaps);
        } else {
            $main.append($bookingStepDiv);
        }

        // 템플릿 엔진 구현 (문자열 치환 방식)
        var template = $('#booking-template').html();
        var startDate = new Date(slot.Start_Datetime);

        var html = template
            .replace(/{{MD_NAME}}/g, md ? md.Md_Name : 'MD')
            .replace(/{{MD_CATEGORY}}/g, md ? md.Category_Name : '')
            .replace(/{{DATE}}/g, startDate.toLocaleString('ko-KR', { dateStyle: 'full' }))
            .replace(/{{TIME}}/g, startDate.toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }))
            .replace(/{{SLOT_SEQ}}/g, slot.Slot_Seq)
            .replace(/{{START_DATETIME}}/g, slot.Start_Datetime);

        $bookingStepDiv.show().html(html);

        scrollTo($bookingStepDiv);

        $('#inline-booking-form').on('submit', handleBookingSubmitInline);
        $('#cancel-booking').on('click', closeBookingStep);
    }

    function closeBookingStep() {
        $('#booking-step-container').hide().empty();
        if (currentFlow === 'md-first') {
            $flowMdContainer.show();
        } else {
            $flowDateContainer.show();
        }
    }

    function handleBookingSubmitInline(e) {
        e.preventDefault();

        if (!$('#confirmation-layer-style').length) {
            $('<style id="confirmation-layer-style">' +
                '.confirmation-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999; }' +
                '.confirmation-dialog { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); text-align: center; width: 90%; max-width: 400px; }' +
                '</style>').appendTo('head');
        }

        var $submitButton = $('#inline-booking-form button[type="submit"]');
        var bookingData = {
            Slot_Seq: $('#slot-id-input').val(),
            Md_No: selectedMdId,
            Meeting_Datetime: $('#meeting-time-input').val(),
            User_Name: $('#user-name').val(),
            User_Affiliation: $('#user-affiliation').val(),
            User_Email: $('#user-email').val(),
            User_Phone: $('#user-phone').val(),
            Notes: $('#notes').val(),
            Status: 'PENDING',
            Regist_Datetime: new Date().toISOString()
        };

        $submitButton.prop('disabled', true);

        var $layer = $('<div class="confirmation-layer">' +
            '<div class="confirmation-dialog">' +
            '<h3>예약이 완료되었습니다.</h3>' +
            '<p>MD 승인 후 최종 확정되며, 안내 문자가 발송 됩니다.</p>' +
            '<button id="layer-confirm-btn" class="btn-primary">확인</button>' +
            '</div></div>').appendTo('body');

        $('#layer-confirm-btn').on('click', function () {
            $layer.remove();
            closeBookingStep();
            $submitButton.prop('disabled', false);

            var slotInMem = $.grep(allSlots, function (s) { return s.Slot_Seq === bookingData.Slot_Seq; })[0];
            if (slotInMem) {
                slotInMem.Status = 'BOOKED';
            } else {
                allSlots.push({
                    Slot_Seq: bookingData.Slot_Seq,
                    Md_No: selectedMdId,
                    Start_Datetime: bookingData.Meeting_Datetime,
                    Status: 'BOOKED'
                });
            }

            var $bookedSlotEl = $('[data-slot-id="' + bookingData.Slot_Seq + '"]');
            if ($bookedSlotEl.length) {
                $bookedSlotEl.removeClass('OPEN').addClass('disabled BOOKED').append(' (신청완료)').off();
            }

            if (currentFlow === 'date-first' && selectedTime) {
                handleTimeSelect(selectedTime);
            }
        });
    }

    // --- MY BOOKINGS LOOKUP MODAL ---
    function openMyBookingsPopup() {
        var template = $('#my-bookings-template').html();
        var $modal = $(template).appendTo('body');

        // 팝업 닫기 함수
        var closeModal = function () { $modal.remove(); };
        $modal.find('#close-lookup-modal, #cancel-lookup-modal').on('click', closeModal);

        // 조회 버튼 클릭 처리
        $modal.find('#confirm-lookup-btn').on('click', function () {
            var phone = $('#lookup-phone').val().trim();
            if (!phone) {
                alert('휴대폰 번호를 입력해주세요.');
                return;
            }
            if (!/^\d{10,11}$/.test(phone)) {
                alert('올바른 휴대폰 번호 형식이 아닙니다. (10~11자리 숫자)');
                return;
            }
            window.location.href = 'my-bookings.html?phone=' + encodeURIComponent(phone);
        });

        // 엔터키 입력 시 조회 실행
        $modal.find('#lookup-phone').on('keypress', function (e) {
            if (e.which === 13) {
                $('#confirm-lookup-btn').trigger('click');
            }
        });
    }
    window.openMyBookingsPopup = openMyBookingsPopup;

    initialize();

});