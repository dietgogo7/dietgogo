document.addEventListener('DOMContentLoaded', () => {
    // --- ICONS ---
    const ICONS = {
        md: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-4-1-6-1-4 1-6 1-3 3-3 5a7 7 0 0 0 7 7z"/><path d="M12 12V2l-4 4-4-4"/></svg>',
        calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        slot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7 7 7-7 7z"/></svg>',
        away: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>'
    };

    // --- STATE ---
    let allMds = [];
    let allSlots = [];
    let currentFlow = 'md-first';
    let selectedMdId = null;
    let selectedDate = null;
    let selectedTime = null;

    // --- DOM ELEMENTS ---
    const flowMdBtn = document.getElementById('select-flow-md');
    const flowDateBtn = document.getElementById('select-flow-date');
    const flowMdContainer = document.getElementById('flow-md-first');
    const flowDateContainer = document.getElementById('flow-date-first');

    // Flow 1
    const mdListContainer1 = document.querySelector('#flow-md-first #md-list-container-1 .list-wrapper');
    const dateSelectorContainer1 = document.getElementById('date-selector-container-1');
    const calendarContainer1 = document.getElementById('calendar-container-1');
    const slotsArea1 = document.getElementById('slots-area-1');
    const slotsContainer1 = document.querySelector('#slots-area-1 .list-wrapper');

    // Flow 2
    const calendarContainer = document.getElementById('calendar-container');
    const timeSelectorContainer2 = document.getElementById('time-selector-container-2');
    const timeListWrapper2 = document.querySelector('#time-selector-container-2 .list-wrapper');
    const mdListContainer2 = document.getElementById('md-list-container-2');
    const mdListWrapper2 = document.querySelector('#md-list-container-2 .list-wrapper');
    
    // 인라인 예약 폼은 동적으로 생성됨

    // --- INITIALIZATION ---
    // 초기화 함수: 데이터 로드 및 초기 화면 설정
    // DB 연동 시 JSON 파일 대신 API 호출로 변경 필요
    async function initialize() {
        if (flowMdBtn) flowMdBtn.addEventListener('click', () => switchFlow('md-first'));
        if (flowDateBtn) flowDateBtn.addEventListener('click', () => switchFlow('date-first'));
        // Flow 2: 달력 컨트롤은 switchFlow('date-first')에서 렌더링
        try {
            const [mdsRes, slotsRes, noticesRes] = await Promise.all([
                fetch('data/mds.json'), 
                fetch('data/slots.json'), 
                fetch('data/notices.json')
            ]);
            const rawMds = await mdsRes.json();
            const rawSlots = await slotsRes.json();
            const rawNotices = await noticesRes.json();

            // --- Data Normalization for backward compatibility ---
            // 이전 버전의 속성 이름(id, name 등)과 새 버전(Md_Id, Md_Name 등)을 모두 지원합니다.
            allMds = rawMds.map(item => ({
                Md_No: item.Md_No || item.Md_Id || item.id,
                Md_Name: item.Md_Name || item.name,
                Team_Name: item.Team_Name,
                Category_Name: item.Category_Name || item.category,
                Status: item.Status || item.status,
                Email: item.Email || item.email
            }));
            allSlots = rawSlots.map(item => ({
                Slot_Seq: item.Slot_Seq || item.Slot_Id || item.id,
                Md_No: item.Md_No || item.Md_Id || item.mdId,
                Start_Datetime: item.Start_Datetime || item.startTime,
                End_Datetime: item.End_Datetime || item.endTime,
                Status: item.Status || item.status
            }));
            const notices = rawNotices.map(item => ({
                Notice_Seq: item.Notice_Seq || item.Notice_Id || item.id,
                Notice_Date: item.Notice_Date || item.date,
                Title: item.Title || item.title,
                Content: item.Content || item.content
            }));

            switchFlow('md-first');
            renderFrontNotices(notices);
        } catch (error) {
            console.error("Initialization failed:", error);
            const app = document.getElementById('app');
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.fontWeight = 'bold';
            errorDiv.style.margin = '30px auto';
            errorDiv.style.textAlign = 'center';
            errorDiv.textContent = '데이터를 불러오지 못했습니다. 관리자에게 문의하세요.';
            app.appendChild(errorDiv);
        }
    }

    // 공지사항을 사용자 화면에 렌더링하는 함수
    function renderFrontNotices(notices) {
        const container = document.getElementById('notice-alert-container');
        const list = document.getElementById('front-notice-list');
        if (!notices || notices.length === 0) return;

        // Sort by date desc
        notices.sort((a, b) => new Date(b.Notice_Date) - new Date(a.Notice_Date));

        list.innerHTML = notices.map(n => `
            <div class="notice-item">
                <span class="notice-date">${n.Notice_Date}</span>
                <strong>${n.Title}</strong>
                <span style="display:block; margin-top:4px; color:#666; font-size:0.9em;">${n.Content}</span>
            </div>
        `).join('');
        container.style.display = 'block';
    }

    // --- FLOW CONTROL ---
    // 예약 프로세스(MD 먼저 vs 날짜 먼저)를 전환하는 함수
    function switchFlow(flow) {
        currentFlow = flow;
        resetSelections();
        // 예약 폼, 안내 메시지, 선택 상태 모두 초기화
        const bookingStepDiv = document.getElementById('booking-step-container');
        if (bookingStepDiv) {
            bookingStepDiv.style.display = 'none';
            bookingStepDiv.innerHTML = '';
        }
        document.getElementById('inline-booking-form-container').style.display = 'none';
        flowMdContainer.style.display = flow === 'md-first' ? 'block' : 'none';
        flowDateContainer.style.display = flow === 'date-first' ? 'block' : 'none';
        flowMdBtn.classList.toggle('active', flow === 'md-first');
        flowDateBtn.classList.toggle('active', flow === 'date-first');
        if (flow === 'md-first') initializeMdFirstFlow();
        if (flow === 'date-first') renderCalendar(calendarContainer, handleDateSelectInFlow2);
    }

    // 선택된 MD, 날짜, 시간 등 상태를 초기화하는 함수
    function resetSelections() {
        selectedMdId = null;
        selectedDate = null;
        selectedTime = null;

        document.querySelectorAll('.list-wrapper').forEach(w => w.innerHTML = '');
        
        dateSelectorContainer1.style.display = 'none';
        slotsArea1.style.display = 'none';
        timeSelectorContainer2.style.display = 'none';
        mdListContainer2.style.display = 'none';

        document.querySelector('#flow-md-first h3').innerHTML = `${ICONS.md} 1. MD를 선택해주세요.`;
    }

    // --- FLOW 1: MD First ---
    // 'MD 먼저 선택' 프로세스를 초기화하는 함수
    function initializeMdFirstFlow() {
        renderMDs(allMds, mdListContainer1, handleMdSelectInFlow1);
    }

    // Flow 1에서 MD 선택 시 처리하는 함수
    function handleMdSelectInFlow1(md) {
        selectedMdId = md.Md_No;
        // Robust selection highlighting
        document.querySelectorAll('#flow-md-first .md-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`#flow-md-first .md-item[data-md-id="${md.Md_No}"]`).classList.add('selected');

        dateSelectorContainer1.style.display = 'block';
        dateSelectorContainer1.querySelector('h3').innerHTML = `${ICONS.calendar} 2. 날짜를 선택해주세요.`;
        renderCalendar(calendarContainer1, handleDateSelectInFlow1);
        if (selectedDate) {
            slotsArea1.style.display = 'block';
            renderFilteredSlots();
        }
    }

    // Flow 1에서 날짜 선택 시 처리하는 함수
    function handleDateSelectInFlow1(dateObj) {
        selectedDate = dateObj.toISOString().split('T')[0];
        slotsArea1.style.display = 'block';
        slotsArea1.querySelector('h3').innerHTML = `${ICONS.slot} 3. 시간을 선택해주세요.`;
        if (selectedMdId) renderFilteredSlots();
    }

    // Flow 1에서 선택된 날짜와 MD에 맞는 슬롯을 렌더링하는 함수
    // 슬롯 상태(OPEN, BOOKED, CLOSED)에 따라 UI 처리
    function renderFilteredSlots() {
        slotsContainer1.innerHTML = '';
        if (!selectedDate || !selectedMdId) return;

        const slotsForDay = allSlots.filter(s => s.Start_Datetime.startsWith(selectedDate) && s.Md_No === selectedMdId);
        const slotLookup = new Map(slotsForDay.map(s => {
            const d = new Date(s.Start_Datetime);
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return [`${h}:${m}`, s];
        }));

        // MD 상태 확인
        const md = allMds.find(m => m.Md_No === selectedMdId);
        const isMdAway = md && (md.Status === 'AWAY' || md.Status === 'ON_LEAVE');

        var times = generateTimeSlots('14:00', '15:15', 15);
        times.forEach(function(timeStr){
            let slotData = slotLookup.get(timeStr);
            const el = document.createElement('div');
            el.className = 'slot';
            el.textContent = timeStr;

            if (!slotData) {
                // Start/End ISO 생성 (종료 = 시작 + 15분)
                const startIso = selectedDate + 'T' + timeStr + ':00';
                const startDate = new Date(startIso);
                const endDate = new Date(startDate.getTime() + 15 * 60000);
                function pad(n){ return String(n).padStart(2,'0'); }
                const endIso = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

                slotData = {
                    Slot_Seq: `virtual-${selectedDate}-${timeStr}-md${selectedMdId}`,
                    Md_No: selectedMdId,
                    Start_Datetime: startIso,
                    End_Datetime: endIso,
                    Status: 'OPEN',
                    Capacity: 1
                };
            }

            el.dataset.slotId = slotData.Slot_Seq;

            if (isMdAway) {
                el.classList.add('disabled');
                el.textContent += ' (MD 부재중)';
            } else if (slotData.Status === 'OPEN') {
                el.classList.add('OPEN');
                el.addEventListener('click', () => openBookingModal(slotData));
            } else {
                el.classList.add('disabled', slotData.Status);
                el.textContent += ` (${slotData.Status})`;
            }
            slotsContainer1.appendChild(el);
        });
    }

    // --- 추가: 시간 슬롯 생성 유틸(시작,종료,간격분) ---
    function generateTimeSlots(start, end, intervalMin) {
        function toMinutes(hm) {
            var parts = hm.split(':');
            return parseInt(parts[0],10)*60 + parseInt(parts[1],10);
        }
        function pad(n){ return (n<10? '0':'') + n; }
        var startMin = toMinutes(start);
        var endMin = toMinutes(end);
        var arr = [];
        for (var t = startMin; t <= endMin; t += intervalMin) {
            var h = Math.floor(t/60);
            var m = t%60;
            arr.push(pad(h) + ':' + pad(m));
        }
        return arr;
    }

    // --- FLOW 2: Date -> Time -> MD ---
    // Flow 2에서 날짜 선택 시 처리하는 함수
    function handleDateSelectInFlow2(dateObj) {
        selectedDate = dateObj.toISOString().split('T')[0];
        resetSelectionsForFlow2(false);
        timeSelectorContainer2.style.display = 'block';
        timeSelectorContainer2.querySelector('h3').innerHTML = `${ICONS.clock} 2. 시간을 선택해주세요.`;
        renderTimeSelectors();
    }
    
    // Flow 2에서 시간 선택 목록을 렌더링하는 함수
    function renderTimeSelectors() {
        timeListWrapper2.innerHTML = '';
        var times = generateTimeSlots('14:00','15:30',15);
        times.forEach(function(timeStr){
            const el = document.createElement('div');
            el.className = 'time-item';
            el.textContent = timeStr;
            el.addEventListener('click', () => handleTimeSelect(timeStr));
            timeListWrapper2.appendChild(el);
        });
    }

    // Flow 2에서 시간 선택 시 처리하는 함수
    function handleTimeSelect(time) {
        selectedTime = time;
        // Robust selection highlighting
        document.querySelectorAll('#time-selector-container-2 .time-item').forEach(item => {
            item.classList.remove('selected');
        });
        const selectedEl = Array.from(document.querySelectorAll('#time-selector-container-2 .time-item')).find(el => el.textContent === time);
        if (selectedEl) selectedEl.classList.add('selected');

        mdListContainer2.style.display = 'block';
        mdListContainer2.querySelector('h3').innerHTML = `${ICONS.md} 3. 예약 가능한 MD를 선택해주세요.`;
        
        const availableMds = allMds.filter(md => {
            if (md.Status === 'AWAY' || md.Status === 'ON_LEAVE') return false;
            const slot = allSlots.find(s => s.Start_Datetime.startsWith(selectedDate) && s.Start_Datetime.includes(time) && s.Md_No === md.Md_No);
            // 슬롯이 존재하는데 OPEN이 아니면 예약 불가 (이미 예약됨 등)
            if (slot && slot.Status !== 'OPEN') return false;
            return true;
        });
        renderMDs(availableMds, mdListWrapper2, handleMdSelectInFlow2);
    }
    
    // Flow 2에서 MD 선택 시 처리하는 함수
    function handleMdSelectInFlow2(md) {
        selectedMdId = md.Md_No;
        let slot = allSlots.find(s => s.Start_Datetime.startsWith(selectedDate) && s.Start_Datetime.includes(selectedTime) && s.Md_No === selectedMdId);
        
        if (!slot) {
            const startIso = `${selectedDate}T${selectedTime}:00`;
            const startDate = new Date(startIso);
            const endDate = new Date(startDate.getTime() + 15 * 60000);
            function pad(n){ return String(n).padStart(2,'0'); }
            const endIso = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;

            slot = {
                Slot_Seq: `virtual-${selectedDate}-${selectedTime}-md${selectedMdId}`,
                Md_No: selectedMdId,
                Start_Datetime: startIso,
                End_Datetime: endIso,
                Status: 'OPEN',
                Capacity: 1
            };
        }
        
        if (slot.Status === 'OPEN') openBookingModal(slot);
    }

    // Flow 2의 선택 상태를 초기화하는 함수
    function resetSelectionsForFlow2(isFullReset = true) {
        if(isFullReset) selectedDate = null;
        selectedTime = null;
        selectedMdId = null;
        if(isFullReset) timeSelectorContainer2.style.display = 'none';
        mdListContainer2.style.display = 'none';
        mdListWrapper2.innerHTML = '';
        timeListWrapper2.innerHTML = '';
    }
    window.resetSelectionsForFlow2 = resetSelectionsForFlow2;

    // --- GENERIC RENDERERS & MODAL ---
    // MD 목록을 렌더링하는 공통 함수
    function renderMDs(mdsToRender, container, onSelect) {
        container.innerHTML = '';
        if (mdsToRender.length === 0) {
            container.innerHTML = '<p class="placeholder">선택 가능한 MD가 없습니다.</p>';
            return;
        }
        mdsToRender.forEach(md => {
            const el = document.createElement('div');
            el.className = 'md-item';
            el.dataset.mdId = md.Md_No;
            let label = '';
            if (md.Status === 'AWAY' || md.Status === 'ON_LEAVE') {
                label = `<span class="md-away-icon" title="부재중">${ICONS.away}</span>`;
                el.classList.add('disabled');
            }
            el.innerHTML = `<strong>${md.Md_Name} MD ${label}</strong><small>${md.Category_Name}</small><small>${md.Email || ''}</small>`;
            if (md.Md_No === selectedMdId) {
                el.classList.add('selected');
            }
            if (!(md.Status === 'AWAY' || md.Status === 'ON_LEAVE')) {
                el.addEventListener('click', () => onSelect(md));
            }
            const style = document.createElement('style');
            style.textContent = `.md-item small { display: block; color: inherit; opacity: 0.7; font-size: 0.8rem; margin-top: 4px; }
            .md-away-icon { display: inline-flex; color: #FFB800; margin-left: 4px; vertical-align: text-bottom; }`;
            el.appendChild(style);
            container.appendChild(el);
        });
    }

    // 예약 신청 폼(모달/인라인)을 여는 함수
    function openBookingModal(slot) {
        if (currentFlow === 'md-first') {
            document.getElementById('flow-md-first').style.display = 'none';
        } else {
            document.getElementById('flow-date-first').style.display = 'none';
        }
        document.getElementById('inline-booking-form-container').style.display = 'none';
        const main = document.querySelector('main');
        const md = allMds.find(m => m.Md_No === slot.Md_No);
        let bookingStepDiv = document.getElementById('booking-step-container');
        if (!bookingStepDiv) {
            bookingStepDiv = document.createElement('div');
            bookingStepDiv.id = 'booking-step-container';
            main.appendChild(bookingStepDiv);
        }
        bookingStepDiv.style.display = 'block';
        bookingStepDiv.innerHTML = `
            <div class="service-card">
                <h2 class="service-title">예약 신청</h2>
                <div class="service-info">
                    <div class="service-md-wrap">
                        <span class="service-md">${md ? md.Md_Name : 'MD'}</span>
                        <span class="service-md-cat">${md ? md.Category_Name : ''}</span>
                    </div>
                    <div class="service-time">${new Date(slot.Start_Datetime).toLocaleString('ko-KR', { dateStyle: 'full', timeStyle: 'short' })}</div>
                </div>
                <form id="inline-booking-form">
                    <input type="hidden" id="slot-id-input" value="${slot.Slot_Seq}">
                    <input type="hidden" id="meeting-time-input" value="${slot.Start_Datetime}">
                    <div class="form-group">
                        <label for="user-name">이름</label>
                        <input type="text" id="user-name" required>
                    </div>
                    <div class="form-group">
                        <label for="user-affiliation">소속</label>
                        <input type="text" id="user-affiliation" required>
                    </div>
                    <div class="form-group">
                        <label for="user-email">이메일</label>
                        <input type="email" id="user-email" required>
                    </div>
                    <div class="form-group">
                        <label for="user-phone">연락처</label>
                        <input type="tel" id="user-phone" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">미팅 안건</label>
                        <textarea id="notes" rows="5"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">신청하기</button>
                        <button type="button" id="cancel-booking" class="btn-secondary">취소</button>
                    </div>
                </form>
                <p id="form-message" class="message-area"></p>
            </div>
        `;
        document.getElementById('inline-booking-form').addEventListener('submit', handleBookingSubmitInline);
        document.getElementById('cancel-booking').addEventListener('click', closeBookingStep);
    }

    // 예약 신청 단계를 닫고 이전 화면으로 돌아가는 함수
    function closeBookingStep() {
        // 예약신청 화면 닫고, 시간 선택 화면으로 복귀
        const bookingStepDiv = document.getElementById('booking-step-container');
        if (bookingStepDiv) {
            bookingStepDiv.style.display = 'none';
            bookingStepDiv.innerHTML = '';
        }
        if (currentFlow === 'md-first') {
            document.getElementById('flow-md-first').style.display = 'block';
        } else {
            document.getElementById('flow-date-first').style.display = 'block';
        }
    }
    

    // 인라인 예약 폼을 닫는 함수
    function closeInlineBookingForm() {
        const container = document.getElementById('inline-booking-form-container');
        container.style.display = 'none';
        container.innerHTML = '';
    }

    // 예약 신청 폼 제출을 처리하는 함수
    // DB 연동 시 실제 예약 데이터를 서버로 전송해야 함
    function handleBookingSubmitInline(e) {
        e.preventDefault();

        // Add styles for confirmation layer if not exists
        if (!document.getElementById('confirmation-layer-style')) {
            const style = document.createElement('style');
            style.id = 'confirmation-layer-style';
            style.textContent = `
                .confirmation-layer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .confirmation-dialog {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    text-align: center;
                    width: 90%;
                    max-width: 400px;
                }
                .confirmation-dialog h3 { margin: 0 0 10px; color: #333; font-size: 1.2rem; }
                .confirmation-dialog p { margin: 0 0 20px; color: #666; line-height: 1.5; }
            `;
            document.head.appendChild(style);
        }

        const formMessage = document.getElementById('form-message');
        const submitButton = document.querySelector('#inline-booking-form button[type="submit"]');
        const slotIdInput = document.getElementById('slot-id-input');
        const meetingTimeInput = document.getElementById('meeting-time-input');
        const bookingData = {
            Slot_Seq: slotIdInput.value,
            Md_No: selectedMdId,
            Meeting_Datetime: meetingTimeInput.value,
            User_Name: document.getElementById('user-name').value,
            User_Affiliation: document.getElementById('user-affiliation').value,
            User_Email: document.getElementById('user-email').value,
            User_Phone: document.getElementById('user-phone').value,
            Notes: document.getElementById('notes').value,
            Status: 'PENDING',
            Regist_Datetime: new Date().toISOString()
        };
        
        console.log(JSON.stringify(bookingData, null, 2));

        submitButton.disabled = true;
        
        const layer = document.createElement('div');
        layer.className = 'confirmation-layer';
        layer.innerHTML = `
            <div class="confirmation-dialog" role="dialog" aria-modal="true">
                <h3>예약이 완료되었습니다.</h3>
                <p>MD 승인 후 최종 확정되며, 안내 문자가 발송 됩니다.</p>
                <div class="confirmation-actions">
                    <button id="layer-confirm-btn" class="btn btn-primary">확인</button>
                </div>
            </div>
        `;
         document.body.appendChild(layer);

        document.getElementById('layer-confirm-btn').addEventListener('click', () => {
            document.body.removeChild(layer);
            closeBookingStep();
            formMessage.textContent = '';
            submitButton.disabled = false;
             
             // 메모리 상의 데이터 업데이트 (시뮬레이션용)
             const slotInMem = allSlots.find(s => s.Slot_Seq === bookingData.Slot_Seq);
             if (slotInMem) {
                 slotInMem.Status = 'BOOKED';
             } else {
                 const start = new Date(bookingData.Meeting_Datetime);
                 const end = new Date(start.getTime() + 15 * 60000); // 15분 더하기
                 const pad = n => String(n).padStart(2, '0');
                 const endTimeStr = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`;

                 allSlots.push({
                     Slot_Seq: bookingData.Slot_Seq,
                     Md_No: selectedMdId,
                     Start_Datetime: bookingData.Meeting_Datetime,
                     End_Datetime: endTimeStr,
                     Status: 'BOOKED',
                     Capacity: 1
                 });
             }
 
             // 슬롯 상태 갱신 (Flow 1)
             const bookedSlotEl = document.querySelector(`[data-slot-id="${bookingData.Slot_Seq}"]`);
             if(bookedSlotEl) {
                 bookedSlotEl.classList.remove('OPEN');
                 bookedSlotEl.classList.add('disabled', 'BOOKED');
                 bookedSlotEl.textContent += ' (신청완료)';
                 bookedSlotEl.replaceWith(bookedSlotEl.cloneNode(true));
             }
 
             // Flow 2 UI 갱신
             if (currentFlow === 'date-first' && selectedTime) {
                 handleTimeSelect(selectedTime);
             }
         });
    
    }

    // 모달을 닫는 함수 (구버전 호환)
    function closeBookingModal() {
        modal.style.display = 'none';
    }

    // 예약 제출 처리 (구버전 호환)
    function handleBookingSubmit(e) {
        e.preventDefault();
        const formMessage = document.getElementById('form-message');
        const submitButton = bookingForm.querySelector('button[type="submit"]');

        const bookingData = {
            Slot_Seq: slotIdInput.value,
            User_Name: document.getElementById('user-name').value,
            User_Affiliation: document.getElementById('user-affiliation').value,
            User_Email: document.getElementById('user-email').value,
            User_Phone: document.getElementById('user-phone').value,
            Notes: document.getElementById('notes').value,
            Status: 'PENDING',
            Regist_Datetime: new Date().toISOString()
        };

        console.log('New Booking Submitted (Simulation):', bookingData);
        
        formMessage.textContent = '예약 신청이 성공적으로 완료되었습니다. 잠시 후 창이 닫힙니다.';
        formMessage.style.color = 'var(--primary-color)';
        submitButton.disabled = true;

        // Since we cannot update the JSON file, we just close the modal after a delay
        // and visually update the slot on the page
        setTimeout(() => {
            closeBookingModal();
            formMessage.textContent = '';
            submitButton.disabled = false;

            const bookedSlotEl = document.querySelector(`[data-slot-id="${bookingData.Slot_Seq}"]`);
            if(bookedSlotEl) {
                bookedSlotEl.classList.remove('OPEN');
                bookedSlotEl.classList.add('disabled', 'BOOKED');
                bookedSlotEl.textContent += ' (신청완료)';
                
                // Clone and replace to remove all event listeners
                bookedSlotEl.replaceWith(bookedSlotEl.cloneNode(true)); 
            }
        }, 2500);
    }

    // 달력을 렌더링하는 함수
    // 공휴일 및 주말 처리 로직 포함
    function renderCalendar(container, onSelect) {
        if (!container) return;
        container.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        // 공휴일 목록 (2024~2026)
        const holidays = new Set([
            '2024-01-01', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-03-01', '2024-04-10', '2024-05-05', '2024-05-06', '2024-05-15', '2024-06-06', '2024-08-15', '2024-09-16', '2024-09-17', '2024-09-18', '2024-10-03', '2024-10-09', '2024-12-25',
            '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01', '2025-03-03', '2025-05-05', '2025-05-06', '2025-06-06', '2025-08-15', '2025-10-03', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-12-25',
            '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-03-02', '2026-05-05', '2026-05-24', '2026-05-25', '2026-06-06', '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-09', '2026-12-25'
        ]);

        // 워킹데이 10일 계산
        let workingDaysCount = 0;
        let cursor = new Date(today);
        while (workingDaysCount < 10) {
             const y = cursor.getFullYear();
             const m = String(cursor.getMonth() + 1).padStart(2, '0');
             const d = String(cursor.getDate()).padStart(2, '0');
             const dateStr = `${y}-${m}-${d}`;
             const dayOfWeek = cursor.getDay();
             const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
             const isHoliday = holidays.has(dateStr);
             
             if (!isWeekend && !isHoliday) {
                 workingDaysCount++;
             }
             
             if (workingDaysCount < 10) {
                 cursor.setDate(cursor.getDate() + 1);
             }
        }
        const maxDate = new Date(cursor);

        // 캘린더 헤더
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `<strong>${year}년 ${month + 1}월</strong>`;
        container.appendChild(header);

        // 요일
        const daysRow = document.createElement('div');
        daysRow.className = 'calendar-days-row';
        ['일','월','화','수','목','금','토'].forEach((d, i) => {
            const day = document.createElement('span');
            day.className = 'calendar-day-label';
            if (i === 0) day.classList.add('sunday');
            if (i === 6) day.classList.add('saturday');
            day.textContent = d;
            daysRow.appendChild(day);
        });
        container.appendChild(daysRow);

        // 날짜
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        for (let i = 0; i < startDay; i++) {
            const empty = document.createElement('span');
            empty.className = 'calendar-date empty';
            grid.appendChild(empty);
        }
        for (let date = 1; date <= daysInMonth; date++) {
            const cellDate = new Date(year, month, date);
            const cell = document.createElement('span');
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            const dayOfWeek = cellDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.has(dateString);

            cell.className = 'calendar-date';
            cell.textContent = date;
            
            if (dayOfWeek === 0) cell.classList.add('sunday');
            if (dayOfWeek === 6) cell.classList.add('saturday');
            if (isHoliday) cell.classList.add('holiday');

            if (cellDate < today || isWeekend || isHoliday || cellDate > maxDate) {
                cell.classList.add('disabled');
            } else {
                cell.classList.add('available');
                cell.addEventListener('click', () => {
                    container.querySelectorAll('.calendar-date').forEach(c => c.classList.remove('selected'));
                    cell.classList.add('selected');
                    onSelect(cellDate);
                });
            }

            if (selectedDate === dateString) {
                cell.classList.add('selected');
            }

            grid.appendChild(cell);
        }
        container.appendChild(grid);
    }

    initialize();
});