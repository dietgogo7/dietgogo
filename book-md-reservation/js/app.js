document.addEventListener('DOMContentLoaded', () => {
    // --- ICONS ---
    const ICONS = {
        md: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-4-1-6-1-4 1-6 1-3 3-3 5a7 7 0 0 0 7 7z"/><path d="M12 12V2l-4 4-4-4"/></svg>',
        calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        slot: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7 7 7-7 7z"/></svg>'
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
    const dateInput1 = document.getElementById('meeting-date-1');
    const slotsArea1 = document.getElementById('slots-area-1');
    const slotsContainer1 = document.querySelector('#slots-area-1 .list-wrapper');

    // Flow 2
    const dateInput2 = document.getElementById('meeting-date-2');
    const timeSelectorContainer2 = document.getElementById('time-selector-container-2');
    const timeListWrapper2 = document.querySelector('#time-selector-container-2 .list-wrapper');
    const mdListContainer2 = document.getElementById('md-list-container-2');
    const mdListWrapper2 = document.querySelector('#md-list-container-2 .list-wrapper');
    
    // 인라인 예약 폼은 동적으로 생성됨

    // --- INITIALIZATION ---
    async function initialize() {
        flowMdBtn.addEventListener('click', () => switchFlow('md-first'));
        flowDateBtn.addEventListener('click', () => switchFlow('date-first'));
        dateInput1.addEventListener('change', handleDateChangeInFlow1);
        dateInput2.addEventListener('change', handleDateChangeInFlow2);
        const today = new Date().toISOString().split('T')[0];
        dateInput1.setAttribute('min', today);
        dateInput2.setAttribute('min', today);

        try {
            const [mdsRes, slotsRes] = await Promise.all([fetch('data/mds.json'), fetch('data/slots.json')]);
            allMds = await mdsRes.json();
            allSlots = await slotsRes.json();
            switchFlow('md-first');
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

    // --- FLOW CONTROL ---
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
    }

    function resetSelections() {
        selectedMdId = null;
        selectedDate = null;
        selectedTime = null;

        document.querySelectorAll('.list-wrapper').forEach(w => w.innerHTML = '');
        document.querySelectorAll('input[type="date"]').forEach(i => i.value = '');
        
        dateSelectorContainer1.style.display = 'none';
        slotsArea1.style.display = 'none';
        timeSelectorContainer2.style.display = 'none';
        mdListContainer2.style.display = 'none';

        document.querySelector('#flow-md-first h3').innerHTML = `${ICONS.md} 1. MD를 선택해주세요.`;
    }

    // --- FLOW 1: MD First ---
    function initializeMdFirstFlow() {
        renderMDs(allMds, mdListContainer1, handleMdSelectInFlow1);
    }

    function handleMdSelectInFlow1(md) {
        selectedMdId = md.id;
        // Robust selection highlighting
        document.querySelectorAll('#flow-md-first .md-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`#flow-md-first .md-item[data-md-id="${md.id}"]`).classList.add('selected');

        dateSelectorContainer1.style.display = 'block';
        dateSelectorContainer1.querySelector('h3').innerHTML = `${ICONS.calendar} 2. 날짜를 선택해주세요.`;
        if (selectedDate) {
            slotsArea1.style.display = 'block';
            renderFilteredSlots();
        }
    }

    function handleDateChangeInFlow1(e) {
        selectedDate = e.target.value;
        slotsArea1.style.display = 'block';
        slotsArea1.querySelector('h3').innerHTML = `${ICONS.slot} 3. 시간을 선택해주세요.`;
        if (selectedMdId) renderFilteredSlots();
    }

    function renderFilteredSlots() {
        slotsContainer1.innerHTML = '';
        if (!selectedDate || !selectedMdId) return;

        const slotsForDay = allSlots.filter(s => s.startTime.startsWith(selectedDate) && s.mdId === selectedMdId);
        const slotLookup = new Map(slotsForDay.map(s => {
            const d = new Date(s.startTime);
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return [`${h}:${m}`, s];
        }));

        // MD 상태 확인
        const md = allMds.find(m => m.id === selectedMdId);
        const isMdAway = md && (md.status === 'AWAY' || md.status === 'ON_LEAVE');

        for (let h = 9; h < 18; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                let slotData = slotLookup.get(timeStr);
                const el = document.createElement('div');
                el.className = 'slot';
                el.textContent = timeStr;

                // 스케쥴이 없으면 OPEN 상태로 가상 슬롯 생성
                if (!slotData) {
                    slotData = {
                        id: `virtual-${selectedDate}-${timeStr}-md${selectedMdId}`,
                        mdId: selectedMdId,
                        startTime: `${selectedDate}T${timeStr}:00`,
                        endTime: `${selectedDate}T${timeStr === '17:00' ? '17:30' : timeStr}:30`,
                        status: 'OPEN',
                        capacity: 1
                    };
                }

                el.dataset.slotId = slotData.id;

                // MD가 부재중이면 모든 슬롯 disabled
                if (isMdAway) {
                    el.classList.add('disabled');
                    el.textContent += ' (MD 부재중)';
                } else if (slotData.status === 'OPEN') {
                    el.classList.add('OPEN');
                    el.addEventListener('click', () => openBookingModal(slotData));
                } else {
                    el.classList.add('disabled', slotData.status);
                    el.textContent += ` (${slotData.status})`;
                }
                slotsContainer1.appendChild(el);
            }
        }
    }

    // --- FLOW 2: Date -> Time -> MD ---
    function handleDateChangeInFlow2(e) {
        selectedDate = e.target.value;
        resetSelectionsForFlow2(false);
        timeSelectorContainer2.style.display = 'block';
        timeSelectorContainer2.querySelector('h3').innerHTML = `${ICONS.clock} 2. 시간을 선택해주세요.`;
        renderTimeSelectors();
    }
    
    function renderTimeSelectors() {
        timeListWrapper2.innerHTML = '';
        const availableTimes = new Set(allSlots
            .filter(s => s.startTime.startsWith(selectedDate) && s.status === 'OPEN')
            .map(s => {
                const d = new Date(s.startTime);
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                return `${h}:${m}`;
            })
        );
        
        for (let h = 9; h < 18; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const el = document.createElement('div');
                el.className = 'time-item';
                el.textContent = timeStr;
                if (availableTimes.has(timeStr)) {
                    el.addEventListener('click', () => handleTimeSelect(timeStr));
                } else {
                    el.classList.add('disabled');
                }
                timeListWrapper2.appendChild(el);
            }
        }
    }

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
        
        const mdsWithSlot = new Set(allSlots.filter(s => s.startTime.startsWith(selectedDate) && s.startTime.includes(time) && s.status === 'OPEN').map(s => s.mdId));
        const availableMds = allMds.filter(md => mdsWithSlot.has(md.id));
        renderMDs(availableMds, mdListWrapper2, handleMdSelectInFlow2);
    }
    
    function handleMdSelectInFlow2(md) {
        selectedMdId = md.id;
        const slot = allSlots.find(s => s.startTime.startsWith(selectedDate) && s.startTime.includes(selectedTime) && s.mdId === selectedMdId && s.status === 'OPEN');
        if (slot) openBookingModal(slot);
    }

    function resetSelectionsForFlow2(isFullReset = true) {
        if(isFullReset) selectedDate = null;
        selectedTime = null;
        selectedMdId = null;
        if(isFullReset) timeSelectorContainer2.style.display = 'none';
        mdListContainer2.style.display = 'none';
        mdListWrapper2.innerHTML = '';
        timeListWrapper2.innerHTML = '';
    }

    // --- GENERIC RENDERERS & MODAL ---
    function renderMDs(mdsToRender, container, onSelect) {
        container.innerHTML = '';
        if (mdsToRender.length === 0) {
            container.innerHTML = '<p class="placeholder">선택 가능한 MD가 없습니다.</p>';
            return;
        }
        mdsToRender.forEach(md => {
            const el = document.createElement('div');
            el.className = 'md-item';
            el.dataset.mdId = md.id;
            let label = '';
            if (md.status === 'AWAY' || md.status === 'ON_LEAVE') {
                label = `<span class="md-away-label">부재중</span>`;
                el.classList.add('disabled');
            }
            el.innerHTML = `<strong>${md.name}</strong><small>${md.category}</small> ${label}`;
            if (md.id === selectedMdId) {
                el.classList.add('selected');
            }
            if (!(md.status === 'AWAY' || md.status === 'ON_LEAVE')) {
                el.addEventListener('click', () => onSelect(md));
            }
            const style = document.createElement('style');
            style.textContent = `.md-item small { display: block; color: inherit; opacity: 0.7; font-size: 0.8rem; margin-top: 4px; }
            .md-away-label { display: inline-block; background: #FFB800; color: #fff; font-size: 0.85rem; font-weight: 600; border-radius: 8px; padding: 2px 10px; margin-left: 8px; }`;
            el.appendChild(style);
            container.appendChild(el);
        });
    }

    function openBookingModal(slot) {
        document.getElementById('flow-md-first').style.display = 'none';
        document.getElementById('inline-booking-form-container').style.display = 'none';
        const main = document.querySelector('main');
        const md = allMds.find(m => m.id === slot.mdId);
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
                    <span class="service-md">${md ? md.name : 'MD'} <span class="service-md-cat">${md ? md.category : ''}</span></span>
                    <span class="service-time">${new Date(slot.startTime).toLocaleString('ko-KR', { dateStyle: 'full', timeStyle: 'short' })}</span>
                </div>
                <form id="inline-booking-form">
                    <input type="hidden" id="slot-id-input" value="${slot.id}">
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
                        <textarea id="notes" rows="7"></textarea>
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

    function closeBookingStep() {
        // 예약신청 화면 닫고, 시간 선택 화면으로 복귀
        const bookingStepDiv = document.getElementById('booking-step-container');
        if (bookingStepDiv) {
            bookingStepDiv.style.display = 'none';
            bookingStepDiv.innerHTML = '';
        }
        document.getElementById('flow-md-first').style.display = 'block';
    }
    

    function closeInlineBookingForm() {
        const container = document.getElementById('inline-booking-form-container');
        container.style.display = 'none';
        container.innerHTML = '';
    }

    function handleBookingSubmitInline(e) {
        e.preventDefault();
        const formMessage = document.getElementById('form-message');
        const submitButton = document.querySelector('#inline-booking-form button[type="submit"]');
        const slotIdInput = document.getElementById('slot-id-input');
        const bookingData = {
            slotId: slotIdInput.value,
            userName: document.getElementById('user-name').value,
            userAffiliation: document.getElementById('user-affiliation').value,
            userEmail: document.getElementById('user-email').value,
            userPhone: document.getElementById('user-phone').value,
            notes: document.getElementById('notes').value,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        formMessage.textContent = '예약 신청이 성공적으로 완료되었습니다. 잠시 후 시간 선택 화면으로 돌아갑니다.';
        formMessage.style.color = 'var(--primary-color)';
        submitButton.disabled = true;
        setTimeout(() => {
            closeBookingStep();
            formMessage.textContent = '';
            submitButton.disabled = false;
            // 슬롯 상태 갱신
            const bookedSlotEl = document.querySelector(`[data-slot-id="${bookingData.slotId}"]`);
            if(bookedSlotEl) {
                bookedSlotEl.classList.remove('OPEN');
                bookedSlotEl.classList.add('disabled', 'BOOKED');
                bookedSlotEl.textContent += ' (신청완료)';
                bookedSlotEl.replaceWith(bookedSlotEl.cloneNode(true));
            }
        }, 2500);
    
    }

    function closeBookingModal() {
        modal.style.display = 'none';
    }

    function handleBookingSubmit(e) {
        e.preventDefault();
        const formMessage = document.getElementById('form-message');
        const submitButton = bookingForm.querySelector('button[type="submit"]');

        const bookingData = {
            slotId: slotIdInput.value,
            userName: document.getElementById('user-name').value,
            userAffiliation: document.getElementById('user-affiliation').value,
            userEmail: document.getElementById('user-email').value,
            userPhone: document.getElementById('user-phone').value,
            notes: document.getElementById('notes').value,
            status: 'PENDING',
            createdAt: new Date().toISOString()
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

            const bookedSlotEl = document.querySelector(`[data-slot-id="${bookingData.slotId}"]`);
            if(bookedSlotEl) {
                bookedSlotEl.classList.remove('OPEN');
                bookedSlotEl.classList.add('disabled', 'BOOKED');
                bookedSlotEl.textContent += ' (신청완료)';
                
                // Clone and replace to remove all event listeners
                bookedSlotEl.replaceWith(bookedSlotEl.cloneNode(true)); 
            }
        }, 2500);
    }

    // --- START ---
    initialize();
});
