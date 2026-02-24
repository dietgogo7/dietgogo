/**
 * app.js - MD 예약 시스템 메인 로직
 *
 * 예약 흐름 2가지를 지원합니다:
 *   - Flow 1 (MD 우선): MD 선택 → 날짜 선택 → 시간(슬롯) 선택
 *   - Flow 2 (날짜 우선): 날짜 선택 → 시간 선택 → MD 선택
 *
 * 데이터는 data/mds.json, data/slots.json, data/notices.json에서 로드합니다.
 */
$(function () {

    // =========================================================================
    // 슬롯 상태 코드 → 한글 레이블 매핑 테이블
    // =========================================================================
    var SLOT_STATUS_LABEL = {
        OPEN:   '예약가능',
        BOOKED: '예약완료',
        CLOSED: '마감'
    };

    /** 슬롯 상태값을 한글 레이블로 반환합니다. 알 수 없는 값은 상태 코드 그대로 반환합니다. */
    function getSlotStatusLabel(status) {
        return SLOT_STATUS_LABEL[status] || status;
    }

    // =========================================================================
    // STATE - 전역 상태 변수
    // =========================================================================
    var allMds = [];           // 전체 MD 목록 (정규화된 객체 배열)
    var allSlots = [];         // 전체 슬롯 목록 (정규화된 객체 배열)
    var currentFlow = 'md-first'; // 현재 활성화된 예약 흐름 ('md-first' | 'date-first')
    var selectedMdId = null;   // 사용자가 선택한 MD의 고유 번호
    var selectedDate = null;   // 사용자가 선택한 날짜 (YYYY-MM-DD 형식 문자열)
    var selectedTime = null;   // 사용자가 선택한 시간 (HH:MM 형식 문자열)

    // =========================================================================
    // DOM ELEMENTS - jQuery 캐싱 (반복 탐색 비용 절감)
    // =========================================================================

    // 흐름 전환 버튼 및 컨테이너
    var $flowMdBtn = $('#select-flow-md');
    var $flowDateBtn = $('#select-flow-date');
    var $flowMdContainer = $('#flow-md-first');
    var $flowDateContainer = $('#flow-date-first');

    // Flow 1 (MD 우선) 관련 DOM
    var $mdListContainer1 = $('#md-list-container-1 .list-wrapper');       // MD 카드 렌더링 영역
    var $dateSelectorContainer1 = $('#date-selector-container-1');          // 날짜 선택 영역
    var $calendarContainer1 = $('#calendar-container-1');                   // 달력 컴포넌트 마운트 지점
    var $slotsArea1 = $('#slots-area-1');                                   // 시간 슬롯 전체 영역
    var $slotsContainer1 = $('#slots-area-1 .list-wrapper');                // 시간 슬롯 카드 렌더링 영역

    // Flow 2 (날짜 우선) 관련 DOM
    var $calendarContainer = $('#calendar-container');                       // Flow2 달력 컴포넌트 마운트 지점
    var $timeSelectorContainer2 = $('#time-selector-container-2');          // 시간 선택 영역
    var $timeListWrapper2 = $('#time-selector-container-2 .list-wrapper');  // 시간 버튼 렌더링 영역
    var $mdListContainer2 = $('#md-list-container-2');                      // MD 선택 영역 (래퍼)
    var $mdListWrapper2 = $('#md-list-container-2 .list-wrapper');          // MD 카드 렌더링 영역

    // =========================================================================
    // INITIALIZATION - 앱 초기화
    // =========================================================================

    /**
     * initialize()
     * 앱 진입점. 다음 작업을 순서대로 수행합니다:
     *   1) 흐름 전환 버튼에 이벤트 바인딩
     *   2) JSON 데이터 병렬 로드 (mds / slots / notices)
     *   3) 로드된 원시 데이터를 내부 포맷으로 정규화
     *   4) 기본 흐름(md-first)으로 UI 초기화 및 공지사항 렌더링
     */
    function initialize() {
        // 흐름 전환 버튼이 HTML에 존재할 때만 이벤트를 바인딩
        if ($flowMdBtn.length) $flowMdBtn.on('click', function () { switchFlow('md-first'); });
        if ($flowDateBtn.length) $flowDateBtn.on('click', function () { switchFlow('date-first'); });

        // 3개의 JSON 파일을 병렬로 요청하고, 모두 완료된 뒤 처리
        $.when(
            $.getJSON('data/mds.json'),
            $.getJSON('data/slots.json'),
            $.getJSON('data/notices.json')
        ).done(function (mdsData, slotsData, noticesData) {
            var rawMds = mdsData[0];
            var rawSlots = slotsData[0];
            var rawNotices = noticesData[0];

            // ------------------------------------------------------------------
            // MD 데이터 정규화: 여러 JSON 키 명칭 변형을 단일 포맷으로 통일
            // (Md_No / Md_Id / id 등 레거시 필드명 호환 처리)
            // ------------------------------------------------------------------
            allMds = $.map(rawMds, function (item) {
                return {
                    Md_No: item.Md_No || item.Md_Id || item.id,
                    Md_Name: item.Md_Name || item.name,
                    Team_Name: item.Team_Name,
                    Category_Name: item.Category_Name || item.category,
                    Email: item.Email || item.email
                };
            });

            // ------------------------------------------------------------------
            // 슬롯 데이터 정규화: 시작/종료 시간 및 상태 필드 통일
            // ------------------------------------------------------------------
            allSlots = $.map(rawSlots, function (item) {
                return {
                    Slot_Seq: item.Slot_Seq || item.Slot_Id || item.id,
                    Md_No: item.Md_No || item.Md_Id || item.mdId,
                    Start_Datetime: item.Start_Datetime || item.startTime,
                    End_Datetime: item.End_Datetime || item.endTime,
                    Status: item.Status || item.status
                };
            });

            // ------------------------------------------------------------------
            // 공지사항 데이터 정규화
            // ------------------------------------------------------------------
            var notices = $.map(rawNotices, function (item) {
                return {
                    Notice_Seq: item.Notice_Seq || item.Notice_Id || item.id,
                    Notice_Date: item.Notice_Date || item.date,
                    Title: item.Title || item.title,
                    Content: item.Content || item.content
                };
            });

            // 초기 흐름 진입 (스크롤 이동 생략)
            switchFlow('md-first', true);
            renderFrontNotices(notices);

        }).fail(function (error) {
            // 데이터 로드 실패 시 사용자에게 오류 메시지 표시
            console.error("Initialization failed:", error);
            $('#app').append(
                $('<div></div>')
                    .css({ color: 'red', fontWeight: 'bold', margin: '30px auto', textAlign: 'center' })
                    .text('데이터를 불러오지 못했습니다. 관리자에게 문의하세요.')
            );
        });
    }

    // =========================================================================
    // NOTICES - 공지사항 렌더링
    // =========================================================================

    /**
     * renderFrontNotices(notices)
     * 공지사항 목록을 날짜 내림차순으로 정렬하여 #front-notice-list에 렌더링합니다.
     * 공지사항이 없으면 컨테이너 자체를 숨김 상태로 유지합니다.
     *
     * @param {Array} notices - 정규화된 공지사항 객체 배열
     */
    function renderFrontNotices(notices) {
        var $container = $('#notice-alert-container');
        var $list = $('#front-notice-list');
        if (!notices || notices.length === 0) return;

        // 최신 공지가 상단에 오도록 날짜 내림차순 정렬
        notices.sort(function (a, b) {
            return new Date(b.Notice_Date) - new Date(a.Notice_Date);
        });

        // 각 공지를 HTML 블록으로 변환 후 삽입
        var html = $.map(notices, function (n) {
            return '<div class="notice-item">' +
                '<div class="notice-item-header">' +
                    '<span class="notice-item-title">' + n.Title + '</span>' +
                    '<span class="notice-item-date">' + n.Notice_Date + '</span>' +
                '</div>' +
                '<p class="notice-item-body">' + n.Content + '</p>' +
                '</div>';
        }).join('');

        $list.html(html);
        $container.show();
    }

    // =========================================================================
    // UTILS - 유틸리티 함수
    // =========================================================================

    /**
     * scrollTo($el)
     * 지정한 jQuery 요소의 상단으로 부드럽게 스크롤합니다.
     * 요소가 존재하지 않으면 아무 동작도 하지 않습니다.
     *
     * @param {jQuery} $el - 스크롤 대상 요소
     */
    function scrollTo($el) {
        if (!$el || $el.length === 0) return;
        $('html, body').animate({
            scrollTop: $el.offset().top - 20  // 상단 여백 20px 확보
        }, 500);
    }

    // =========================================================================
    // STEP NAVIGATION - 단계 전환 (전역 노출)
    // =========================================================================

    /**
     * window.goToStep(stepId, flowContainerId)
     * 특정 흐름 컨테이너 내에서 활성 단계(step)를 전환합니다.
     * 모든 .selection-area를 비활성화하고 대상 stepId만 활성화한 뒤 스크롤합니다.
     *
     * @param {string} stepId          - 활성화할 단계 요소의 ID
     * @param {string} flowContainerId - 해당 단계가 속한 흐름 컨테이너의 ID
     */
    window.goToStep = function (stepId, flowContainerId) {
        var $flowContainer = $('#' + flowContainerId);
        // 해당 흐름 내 모든 단계를 비활성화한 후 대상 단계만 활성화
        $flowContainer.find('.selection-area').removeClass('active');
        $('#' + stepId).addClass('active');

        // 흐름 컨테이너 상단으로 부드럽게 스크롤
        scrollTo($flowContainer);
    };

    /**
     * window.resetAllFlows()
     * 사용자 확인 후 현재 흐름을 초기 상태로 리셋합니다.
     * 확인 취소 시 아무 동작도 하지 않습니다.
     */
    window.resetAllFlows = function () {
        if (!confirm('현재 입력된 정보가 초기화됩니다. 처음으로 가시겠습니까?')) return;
        switchFlow(currentFlow);
    };

    // =========================================================================
    // FLOW CONTROL - 흐름 전환 및 상태 초기화
    // =========================================================================

    /**
     * switchFlow(flow, skipScroll)
     * 예약 흐름을 전환합니다. 전환 시 선택 상태를 초기화하고
     * 관련 UI 컨테이너의 표시/숨김을 전환합니다.
     *
     * @param {string}  flow       - 'md-first' 또는 'date-first'
     * @param {boolean} skipScroll - true이면 스크롤 이동 생략 (초기 진입 시 사용)
     */
    function switchFlow(flow, skipScroll) {
        currentFlow = flow;
        resetSelections();

        // 예약 확인 단계(booking-step-container) 및 인라인 폼 초기화
        var $bookingStepDiv = $('#booking-step-container');
        if ($bookingStepDiv.length) {
            $bookingStepDiv.hide().empty();
        }
        $('#inline-booking-form-container').hide();

        if (flow === 'md-first') {
            // Flow 1: MD 우선 흐름 활성화
            $flowMdContainer.show();
            $flowDateContainer.hide();
            $flowMdBtn.addClass('active');
            $flowDateBtn.removeClass('active');
            initializeMdFirstFlow();
            if (!skipScroll) scrollTo($flowMdContainer);
        } else {
            // Flow 2: 날짜 우선 흐름 활성화 - 달력을 즉시 렌더링
            $flowMdContainer.hide();
            $flowDateContainer.show();
            $flowMdBtn.removeClass('active');
            $flowDateBtn.addClass('active');
            OYCalendar.render($calendarContainer, handleDateSelectInFlow2, null, selectedDate);
            if (!skipScroll) scrollTo($flowDateContainer);
        }
    }

    /**
     * resetSelections()
     * 선택된 MD, 날짜, 시간을 초기화하고
     * 각 흐름의 첫 번째 단계만 활성 상태로 복원합니다.
     */
    function resetSelections() {
        selectedMdId = null;
        selectedDate = null;
        selectedTime = null;

        // 모든 단계를 비활성화한 뒤 각 흐름의 시작 단계만 활성화
        $('.selection-area').removeClass('active');
        $('#md-list-container-1').addClass('active');       // Flow 1 시작 단계
        $('#date-selector-container-2').addClass('active'); // Flow 2 시작 단계

        // 렌더링된 카드 목록 전체 초기화
        $('.list-wrapper').empty();
    }

    // =========================================================================
    // FLOW 1: MD 우선 흐름 (MD → 날짜 → 시간 슬롯)
    // =========================================================================

    /**
     * initializeMdFirstFlow()
     * Flow 1의 첫 단계: 전체 MD 목록을 렌더링하고 선택 핸들러를 바인딩합니다.
     */
    function initializeMdFirstFlow() {
        renderMDs(allMds, $mdListContainer1, handleMdSelectInFlow1);
    }

    /**
     * handleMdSelectInFlow1(md)
     * Flow 1에서 MD 선택 시 호출됩니다.
     * 선택된 MD를 시각적으로 표시하고 날짜 선택 단계(Step 2)로 전환합니다.
     *
     * @param {Object} md - 선택된 MD 객체
     */
    function handleMdSelectInFlow1(md) {
        selectedMdId = md.Md_No;

        // 이전에 선택된 MD 카드의 선택 표시 제거 후 현재 선택 표시
        $('#flow-md-first .md-item').removeClass('selected');
        $('#flow-md-first .md-item[data-md-id="' + md.Md_No + '"]').addClass('selected');

        // Step 2 (날짜 선택)으로 전환
        goToStep('date-selector-container-1', 'flow-md-first');

        // 달력 렌더링 - 날짜 선택 시 handleDateSelectInFlow1 호출
        OYCalendar.render($calendarContainer1, function (dateObj, dateString) {
            selectedDate = dateString;
            handleDateSelectInFlow1(dateObj);
        }, null, selectedDate);
    }

    /**
     * handleDateSelectInFlow1(dateObj)
     * Flow 1에서 날짜 선택 시 호출됩니다.
     * 슬롯 영역(Step 3)으로 전환하고 해당 날짜·MD의 슬롯을 렌더링합니다.
     *
     * @param {Date} dateObj - 선택된 날짜의 Date 객체
     */
    function handleDateSelectInFlow1(dateObj) {
        // Step 3 (시간 슬롯 선택)으로 전환
        goToStep('slots-area-1', 'flow-md-first');
        if (selectedMdId) renderFilteredSlots();
    }

    /**
     * renderFilteredSlots()
     * 선택된 MD와 날짜에 해당하는 시간 슬롯을 렌더링합니다.
     *
     * 슬롯 처리 규칙:
     *   - JSON에 실제 슬롯 데이터가 있으면 해당 Status(OPEN / BOOKED 등)를 사용
     *   - JSON에 데이터가 없는 시간대는 가상(virtual) 슬롯을 OPEN 상태로 생성
     *   - MD가 AWAY/ON_LEAVE 상태이면 모든 슬롯을 비활성화
     */
    function renderFilteredSlots() {
        $slotsContainer1.empty();
        if (!selectedDate || !selectedMdId) return;

        // 선택된 날짜 & MD에 해당하는 슬롯만 필터링
        var slotsForDay = $.grep(allSlots, function (s) {
            return s.Start_Datetime.indexOf(selectedDate) === 0 && s.Md_No === selectedMdId;
        });

        // 빠른 조회를 위해 시간(HH:MM) → 슬롯 객체 맵 생성
        var slotLookup = {};
        $.each(slotsForDay, function (i, s) {
            var d = new Date(s.Start_Datetime);
            var h = String(d.getHours()).length < 2 ? '0' + d.getHours() : d.getHours();
            var m = String(d.getMinutes()).length < 2 ? '0' + d.getMinutes() : d.getMinutes();
            slotLookup[h + ':' + m] = s;
        });

        // 14:00 ~ 15:15 범위를 15분 간격으로 슬롯 생성
        var times = OYCalendar.generateTimeSlots('14:00', '15:15', 15);
        $.each(times, function (i, timeStr) {
            var slotData = slotLookup[timeStr];
            var $el = $('<div></div>').addClass('slot').text(timeStr);

            if (!slotData) {
                // JSON에 해당 시간대 슬롯이 없으면 가상 슬롯을 즉석 생성 (OPEN 처리)
                var startIso = selectedDate + 'T' + timeStr + ':00';
                var startDate = new Date(startIso);
                var endDate = new Date(startDate.getTime() + 15 * 60000); // +15분
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

            if (slotData.Status === 'OPEN') {
                // 예약 가능 슬롯: 클릭 시 예약 모달 오픈
                $el.addClass('OPEN').on('click', function () { openBookingModal(slotData); });
            } else {
                // BOOKED / CLOSED 등 비가용 상태 - 한글 레이블로 표시
                $el.addClass('disabled ' + slotData.Status).append(' (' + getSlotStatusLabel(slotData.Status) + ')');
            }
            $slotsContainer1.append($el);
        });
    }

    // =========================================================================
    // FLOW 2: 날짜 우선 흐름 (날짜 → 시간 → MD)
    // =========================================================================

    /**
     * handleDateSelectInFlow2(dateObj, dateString)
     * Flow 2에서 날짜 선택 시 호출됩니다.
     * 시간 선택 단계(Step 2)로 전환하고 시간 버튼 목록을 렌더링합니다.
     *
     * @param {Date}   dateObj    - 선택된 날짜의 Date 객체
     * @param {string} dateString - 선택된 날짜 문자열 (YYYY-MM-DD)
     */
    function handleDateSelectInFlow2(dateObj, dateString) {
        selectedDate = dateString;

        // Step 2 (시간 선택)으로 전환
        goToStep('time-selector-container-2', 'flow-date-first');
        renderTimeSelectors();
    }

    /**
     * renderTimeSelectors()
     * Flow 2 Step 2: 14:00 ~ 15:30 범위를 15분 간격으로 시간 버튼을 렌더링합니다.
     */
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

    /**
     * handleTimeSelect(time)
     * Flow 2에서 시간 버튼 클릭 시 호출됩니다.
     * 전체 MD를 표시하되, 해당 날짜·시간에 이미 예약된 슬롯이 있는 MD는
     * 비활성화 상태(예약완료 등)로 표시합니다.
     *
     * @param {string} time - 선택된 시간 문자열 (HH:MM)
     */
    function handleTimeSelect(time) {
        selectedTime = time;

        // 선택된 시간 버튼 강조 표시
        $timeListWrapper2.find('.time-item').removeClass('selected');
        $timeListWrapper2.find('.time-item').filter(function () { return $(this).text() === time; }).addClass('selected');

        // Step 3 (MD 선택)으로 전환
        goToStep('md-list-container-2', 'flow-date-first');

        // MD별 슬롯 상태 맵 생성 (Md_No → 슬롯 Status)
        // 슬롯이 없거나 OPEN인 MD는 맵에 포함하지 않음 (정상 표시)
        var mdSlotStatusMap = {};
        $.each(allMds, function (i, md) {
            var slot = $.grep(allSlots, function (s) {
                return s.Start_Datetime.indexOf(selectedDate) === 0 &&
                       s.Start_Datetime.indexOf(time) !== -1 &&
                       s.Md_No === md.Md_No;
            })[0];
            if (slot && slot.Status !== 'OPEN') {
                mdSlotStatusMap[md.Md_No] = slot.Status;
            }
        });

        // 전체 MD를 렌더링 (비가용 MD는 slotStatusMap을 통해 배지 표시)
        renderMDs(allMds, $mdListWrapper2, handleMdSelectInFlow2, mdSlotStatusMap);
    }

    /**
     * handleMdSelectInFlow2(md)
     * Flow 2에서 MD 선택 시 호출됩니다.
     * 선택된 날짜·시간·MD 조합으로 슬롯을 찾고(없으면 가상 생성) 예약 모달을 엽니다.
     *
     * @param {Object} md - 선택된 MD 객체
     */
    function handleMdSelectInFlow2(md) {
        selectedMdId = md.Md_No;

        // 선택 조건에 맞는 실제 슬롯 탐색
        var slot = $.grep(allSlots, function (s) {
            return s.Start_Datetime.indexOf(selectedDate) === 0 &&
                   s.Start_Datetime.indexOf(selectedTime) !== -1 &&
                   s.Md_No === selectedMdId;
        })[0];

        if (!slot) {
            // 슬롯이 없으면 가상 슬롯을 생성하여 예약 진행
            var startIso = selectedDate + 'T' + selectedTime + ':00';
            var startDate = new Date(startIso);
            var endDate = new Date(startDate.getTime() + 15 * 60000); // +15분
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

        // OPEN 상태인 경우에만 예약 모달 진입
        if (slot.Status === 'OPEN') openBookingModal(slot);
    }

    // =========================================================================
    // GENERIC RENDERERS - 공용 렌더러
    // =========================================================================

    /**
     * renderMDs(mdsToRender, $container, onSelect, mdSlotStatusMap)
     * MD 카드 목록을 주어진 컨테이너에 렌더링합니다.
     * MD가 없으면 안내 문구를 표시합니다.
     *
     * @param {Array}    mdsToRender    - 렌더링할 MD 객체 배열
     * @param {jQuery}   $container     - 카드를 삽입할 jQuery 컨테이너
     * @param {Function} onSelect       - MD 카드 클릭 시 호출할 콜백 (md 객체 전달)
     * @param {Object}   [mdSlotStatusMap] - { Md_No: slotStatus } 맵 (선택 사항)
     *                                       OPEN이 아닌 슬롯을 가진 MD를 비활성 표시할 때 사용
     */
    function renderMDs(mdsToRender, $container, onSelect, mdSlotStatusMap) {
        $container.empty();
        if (mdsToRender.length === 0) {
            $container.html('<p class="placeholder" style="flex:1;">선택 가능한 MD가 없습니다.</p>');
            return;
        }
        $.each(mdsToRender, function (i, md) {
            var $el = $('<div></div>').addClass('md-item').attr('data-md-id', md.Md_No);

            var slotStatus = mdSlotStatusMap && mdSlotStatusMap[md.Md_No];

            if (slotStatus) {
                // 해당 시간대 슬롯이 OPEN이 아닌 MD: 비활성화 + 한글 상태 배지 표시
                $el.addClass('disabled');
                $el.html('<strong>' + md.Md_Name + ' MD</strong>' +
                    '<span class="md-email">' + (md.Email || '') + '</span>' +
                    '<span class="md-cat">' + md.Category_Name + '</span>' +
                    '<div class="status-tag booked">' + getSlotStatusLabel(slotStatus) + '</div>');
            } else {
                // 예약 가능 MD: 정상 표시 + 클릭 이벤트 바인딩
                $el.html('<strong>' + md.Md_Name + ' MD</strong>' +
                    '<span class="md-email">' + (md.Email || '') + '</span>' +
                    '<span class="md-cat">' + md.Category_Name + '</span>');
                $el.on('click', function () { onSelect(md); });
            }

            // 현재 선택된 MD이면 selected 클래스 부여
            if (md.Md_No === selectedMdId) {
                $el.addClass('selected');
            }

            $container.append($el);
        });
    }

    // =========================================================================
    // BOOKING MODAL (INLINE) - 인라인 예약 폼
    // =========================================================================

    /**
     * openBookingModal(slot)
     * 선택된 슬롯에 대한 인라인 예약 폼을 표시합니다.
     * 기존 흐름 컨테이너를 숨기고 #section-maps 상단에 예약 폼을 삽입합니다.
     *
     * @param {Object} slot - 예약 대상 슬롯 객체
     */
    function openBookingModal(slot) {
        // 흐름 컨테이너 전체 숨김 처리
        $flowMdContainer.hide();
        $flowDateContainer.hide();
        $('#inline-booking-form-container').hide();

        var md = $.grep(allMds, function (m) { return m.Md_No === slot.Md_No; })[0];
        var $main = $('main');
        var $sectionMaps = $('#section-maps');

        // booking-step-container가 없으면 동적으로 생성
        var $bookingStepDiv = $('#booking-step-container');
        if ($bookingStepDiv.length === 0) {
            $bookingStepDiv = $('<div></div>').attr('id', 'booking-step-container');
        }

        // section-maps가 있으면 그 상단에, 없으면 main 끝에 삽입
        if ($sectionMaps.length) {
            $bookingStepDiv.insertBefore($sectionMaps);
        } else {
            $main.append($bookingStepDiv);
        }

        // #booking-template의 HTML을 가져와 플레이스홀더를 실제 값으로 치환
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

        // 폼 이벤트 바인딩 (제출 / 취소)
        $('#inline-booking-form').on('submit', handleBookingSubmitInline);
        $('#cancel-booking').on('click', closeBookingStep);
    }

    /**
     * closeBookingStep()
     * 인라인 예약 폼을 닫고 현재 흐름의 메인 컨테이너를 다시 표시합니다.
     */
    function closeBookingStep() {
        $('#booking-step-container').hide().empty();
        if (currentFlow === 'md-first') {
            $flowMdContainer.show();
        } else {
            $flowDateContainer.show();
        }
    }

    /**
     * handleBookingSubmitInline(e)
     * 인라인 예약 폼 제출 이벤트 핸들러입니다.
     *
     * 처리 순서:
     *   1) 중복 제출 방지를 위해 제출 버튼 비활성화
     *   2) 예약 완료 확인 레이어(오버레이) 표시
     *   3) 사용자가 '확인' 클릭 시:
     *      a) 메모리의 allSlots에 BOOKED 상태 반영
     *      b) 화면에 렌더링된 슬롯 카드 UI 즉시 업데이트
     *      c) Flow 2의 경우 MD 목록을 갱신하여 예약된 슬롯 제외
     *
     * @param {Event} e - jQuery submit 이벤트
     */
    function handleBookingSubmitInline(e) {
        e.preventDefault();

        // 확인 레이어 스타일이 없으면 동적으로 주입 (중복 삽입 방지)
        if (!$('#confirmation-layer-style').length) {
            $('<style id="confirmation-layer-style">' +
                '.confirmation-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999; }' +
                '.confirmation-dialog { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); text-align: center; width: 90%; max-width: 400px; }' +
                '</style>').appendTo('head');
        }

        var $submitButton = $('#inline-booking-form button[type="submit"]');

        // 폼에서 예약 데이터 수집
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

        // 중복 제출 방지
        $submitButton.prop('disabled', true);

        // 예약 완료 확인 오버레이 레이어 표시
        var $layer = $('<div class="confirmation-layer">' +
            '<div class="confirmation-dialog">' +
            '<h3>예약이 완료되었습니다.</h3>' +
            '<p>MD 승인 후 최종 확정되며, 안내 문자가 발송 됩니다.</p>' +
            '<button id="layer-confirm-btn" class="btn-primary">확인</button>' +
            '</div></div>').appendTo('body');

        // '확인' 버튼 클릭 시 후처리
        $('#layer-confirm-btn').on('click', function () {
            $layer.remove();
            closeBookingStep();
            $submitButton.prop('disabled', false);

            // 메모리 내 슬롯 상태를 BOOKED로 즉시 반영 (서버 연동 전 낙관적 업데이트)
            var slotInMem = $.grep(allSlots, function (s) { return s.Slot_Seq === bookingData.Slot_Seq; })[0];
            if (slotInMem) {
                // 기존 슬롯이면 상태만 변경
                slotInMem.Status = 'BOOKED';
            } else {
                // 가상 슬롯이었으면 allSlots에 추가하여 이후 중복 예약 방지
                allSlots.push({
                    Slot_Seq: bookingData.Slot_Seq,
                    Md_No: selectedMdId,
                    Start_Datetime: bookingData.Meeting_Datetime,
                    Status: 'BOOKED'
                });
            }

            // 화면에 렌더링된 슬롯 카드 UI를 즉시 BOOKED 상태로 업데이트
            var $bookedSlotEl = $('[data-slot-id="' + bookingData.Slot_Seq + '"]');
            if ($bookedSlotEl.length) {
                $bookedSlotEl.removeClass('OPEN').addClass('disabled BOOKED').append(' (신청완료)').off();
            }

            // Flow 2의 경우 선택된 시간의 MD 목록을 다시 렌더링하여 예약된 슬롯 반영
            if (currentFlow === 'date-first' && selectedTime) {
                handleTimeSelect(selectedTime);
            }
        });
    }

    // =========================================================================
    // MY BOOKINGS LOOKUP MODAL - 내 예약 조회 팝업
    // =========================================================================

    /**
     * openMyBookingsPopup()
     * #my-bookings-template을 기반으로 예약 조회 모달을 동적으로 생성합니다.
     * 유효한 휴대폰 번호(10~11자리 숫자) 입력 후 my-bookings.html로 이동합니다.
     * 전역 노출되어 HTML onclick 속성에서 직접 호출할 수 있습니다.
     */
    function openMyBookingsPopup() {
        var template = $('#my-bookings-template').html();
        var $modal = $(template).appendTo('body');

        var closeModal = function () { $modal.remove(); };
        // 닫기 버튼 및 취소 버튼에 동일한 닫기 동작 바인딩
        $modal.find('#close-lookup-modal, #cancel-lookup-modal').on('click', closeModal);

        $modal.find('#confirm-lookup-btn').on('click', function () {
            var phone = $('#lookup-phone').val().trim();
            if (!phone) {
                alert('휴대폰 번호를 입력해주세요.');
                return;
            }
            // 10~11자리 숫자만 허용 (하이픈 없이 입력)
            if (!/^\d{10,11}$/.test(phone)) {
                alert('올바른 휴대폰 번호 형식이 아닙니다. (10~11자리 숫자)');
                return;
            }
            window.location.href = 'my-bookings.html?phone=' + encodeURIComponent(phone);
        });

        // Enter 키 입력 시 조회 버튼 클릭과 동일하게 처리
        $modal.find('#lookup-phone').on('keypress', function (e) {
            if (e.which === 13) {
                $('#confirm-lookup-btn').trigger('click');
            }
        });
    }
    // HTML onclick 속성 등 외부에서 호출 가능하도록 전역 노출
    window.openMyBookingsPopup = openMyBookingsPopup;

    // =========================================================================
    // ENTRY POINT - 앱 시작
    // =========================================================================
    initialize();

});
