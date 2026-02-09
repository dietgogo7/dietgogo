document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let allMds = [];
    let allSlots = [];
    let allBookings = [];
    let allNotices = [];
    let allBlacklist = [];
    let currentViewMode = 'all'; // 'all', 'md', 'date'
    let currentPage = 1;
    const itemsPerPage = 10;

    // --- CONSTANTS ---
    const statusLabels = {
        'PENDING': '예약신청',
        'APPROVED': '예약확정',
        'REJECTED': '승인거절',
        'CANCELLED': '예약취소',
        'COMPLETED': '이용완료'
    };

    // --- DOM ELEMENTS ---
    const bookingsTbody = document.getElementById('bookings-tbody');
    const paginationContainer = document.getElementById('pagination-controls');
    const filterStartDateInput = document.getElementById('filter-start-date');
    const filterEndDateInput = document.getElementById('filter-end-date');
    const btnSearchDate = document.getElementById('btn-search-date');
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const sectionBookings = document.getElementById('section-bookings');
    const sectionSchedule = document.getElementById('section-schedule');
    const sectionMds = document.getElementById('section-mds');
    const sectionNotices = document.getElementById('section-notices');
    const sectionBlacklist = document.getElementById('section-blacklist');
    
    // Schedule Elements
    const mdSelect = document.getElementById('schedule-md-select');
    const dateInput = document.getElementById('schedule-date-input');
    const vacationToggle = document.getElementById('vacation-toggle');
    const timeSettingsArea = document.getElementById('time-settings-area');
    const timeGrid = document.getElementById('time-grid');

    // MD Management Elements
    const mdsTbody = document.getElementById('mds-tbody');
    const mdIdInput = document.getElementById('md-id');
    const mdNameInput = document.getElementById('md-name');
    const mdCategoryInput = document.getElementById('md-category');
    const mdEmailInput = document.getElementById('md-email');
    const mdPhoneInput = document.getElementById('md-phone');
    const btnSaveMd = document.getElementById('btn-save-md');
    const btnResetMd = document.getElementById('btn-reset-md');

    // Notice Elements
    const noticesTbody = document.getElementById('notices-tbody');
    const noticeDateInput = document.getElementById('notice-date');
    const noticeTitleInput = document.getElementById('notice-title');
    const noticeContentInput = document.getElementById('notice-content');
    const btnAddNotice = document.getElementById('btn-add-notice');

    // Blacklist Elements
    const blacklistTbody = document.getElementById('blacklist-tbody');
    const blacklistPhoneInput = document.getElementById('blacklist-phone');
    const blacklistReasonInput = document.getElementById('blacklist-reason');
    const btnAddBlacklist = document.getElementById('btn-add-blacklist');

    // --- INITIALIZATION ---
    // 관리자 페이지 초기화 함수: 데이터 로드 및 초기 렌더링
    // DB 연동 시 fetch 경로를 API 엔드포인트로 변경 필요
    async function init() {
        try {
            const [mdsRes, slotsRes, bookingsRes, noticesRes, blacklistRes] = await Promise.all([
                fetch('data/mds.json'),
                fetch('data/slots.json'),
                fetch('data/bookings.json'),
                fetch('data/notices.json'),
                fetch('data/blacklist.json').catch(() => ({ json: () => [] })) // Handle missing file
            ]);

            allMds = await mdsRes.json();
            allSlots = await slotsRes.json();
            allBookings = await bookingsRes.json();
            allNotices = await noticesRes.json();
            allBlacklist = await blacklistRes.json();

            // Join Data
            const now = new Date();
            allBookings.forEach(b => {
                const slot = allSlots.find(s => s.id === b.slotId);
                
                // bookings.json에 값이 없으면 slot에서 가져오기 (하위 호환)
                if (!b.mdId && slot) b.mdId = slot.mdId;
                if (!b.meetingTime && slot) b.meetingTime = slot.startTime;

                // MD 이름 매핑
                const md = allMds.find(m => m.id === b.mdId);
                b.mdName = md ? md.name : 'Unknown';

                // fallback for meetingTime if still missing
                if (!b.meetingTime) b.meetingTime = b.createdAt;

                // 날짜가 지난 예약은 자동으로 'COMPLETED' 처리
                if (b.meetingTime && new Date(b.meetingTime) < now) {
                    if (b.status === 'PENDING' || b.status === 'APPROVED') {
                        b.status = 'COMPLETED';
                    }
                }
            });

            // Sort bookings
            allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Set default date range (2 weeks before ~ 2 weeks after)
            const startDate = new Date(now);
            startDate.setDate(now.getDate() - 14);
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + 14);

            const formatDate = (d) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            if (filterStartDateInput) filterStartDateInput.value = formatDate(startDate);
            if (filterEndDateInput) filterEndDateInput.value = formatDate(endDate);

            renderBookings();
            populateMdSelect();
            renderMdsTable();
            renderNotices();
            renderBlacklist();
            renderMeetingKing();
        } catch (error) {
            console.error(error);
            if(bookingsTbody) bookingsTbody.innerHTML = `<tr><td colspan="7" style="color: red;">데이터 로드 실패: ${error.message}</td></tr>`;
        }
    }

    // --- NAVIGATION ---
    // 사이드바 메뉴 탭 전환 처리
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            if (tab === 'bookings') {
                sectionBookings.style.display = 'block';
                sectionSchedule.style.display = 'none';
                sectionNotices.style.display = 'none';
                sectionMds.style.display = 'none';
                sectionBlacklist.style.display = 'none';
            } else if (tab === 'schedule') {
                sectionBookings.style.display = 'none';
                sectionSchedule.style.display = 'block';
                sectionNotices.style.display = 'none';
                sectionMds.style.display = 'none';
                sectionBlacklist.style.display = 'none';
            } else if (tab === 'mds') {
                sectionBookings.style.display = 'none';
                sectionSchedule.style.display = 'none';
                sectionMds.style.display = 'block';
                sectionNotices.style.display = 'none';
                sectionBlacklist.style.display = 'none';
            } else if (tab === 'notices') {
                sectionBookings.style.display = 'none';
                sectionSchedule.style.display = 'none';
                sectionMds.style.display = 'none';
                sectionNotices.style.display = 'block';
                sectionBlacklist.style.display = 'none';
            } else if (tab === 'blacklist') {
                sectionBookings.style.display = 'none';
                sectionSchedule.style.display = 'none';
                sectionMds.style.display = 'none';
                sectionNotices.style.display = 'none';
                sectionBlacklist.style.display = 'block';
            }
        });
    });

    // --- BOOKING MANAGEMENT ---
    // 예약 목록 보기 모드(전체/MD별/날짜별)를 설정하는 함수
    window.setViewMode = function(mode) {
        currentViewMode = mode;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.includes(mode === 'all' ? '전체' : mode === 'md' ? 'MD' : '날짜'));
        });
        currentPage = 1; // Reset page on view change
        renderBookings();
    };

    // Date Search Button
    if (btnSearchDate) {
        btnSearchDate.addEventListener('click', () => {
            currentPage = 1;
            renderBookings();
        });
    }

    // 예약 목록을 필터링하고 렌더링하는 함수
    // 1. 날짜 필터링 -> 2. 페이지네이션 -> 3. 그룹핑 -> 4. 렌더링
    function renderBookings() {
        if (!bookingsTbody) return;
        bookingsTbody.innerHTML = '';

        // 1. Filter by Date Range
        let filteredBookings = allBookings.filter(b => {
            if (!b.meetingTime) return true;
            const mDate = b.meetingTime.split('T')[0];
            const startDate = filterStartDateInput.value;
            const endDate = filterEndDateInput.value;

            if (startDate && mDate < startDate) return false;
            if (endDate && mDate > endDate) return false;
            return true;
        });

        if (filteredBookings.length === 0) {
            bookingsTbody.innerHTML = '<tr><td colspan="7">접수된 예약이 없습니다.</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }

        // 2. Pagination
        const totalItems = filteredBookings.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

        // 3. Grouping (Applied to current page items)
        let groups = {};
        
        if (currentViewMode === 'md') {
            groups = paginatedItems.reduce((acc, b) => {
                (acc[b.mdName] = acc[b.mdName] || []).push(b);
                return acc;
            }, {});
        } else if (currentViewMode === 'date') {
            groups = paginatedItems.reduce((acc, b) => {
                const date = b.meetingTime ? b.meetingTime.split('T')[0] : 'Unknown';
                (acc[date] = acc[date] || []).push(b);
                return acc;
            }, {});
        } else {
            groups = { 'All': paginatedItems };
        }

        Object.keys(groups).sort().forEach(key => {
            if (currentViewMode !== 'all') {
                const headerRow = document.createElement('tr');
                headerRow.innerHTML = `<td colspan="7" class="group-header">${key}</td>`;
                bookingsTbody.appendChild(headerRow);
            }

            groups[key].forEach(booking => {
                const row = document.createElement('tr');
                const createdAt = new Date(booking.createdAt).toLocaleString('ko-KR', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                });
                const meetingTime = booking.meetingTime ? new Date(booking.meetingTime).toLocaleString('ko-KR', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                }) : '-';

                const statusLabel = statusLabels[booking.status] || booking.status;

                // Row click event for details
                row.style.cursor = 'pointer';
                row.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    openDetailModal(booking);
                };

                row.innerHTML = `
                    <td>${createdAt}</td>
                    <td>${booking.mdName}</td>
                    <td>${booking.userName}<br><small style="color:#888">${booking.userAffiliation}</small></td>
                    <td>${booking.userPhone}</td>
                    <td>${meetingTime}</td>
                    <td><span class="status-badge status-${booking.status}">${statusLabel}</span></td>
                    <td>
                        ${booking.status === 'PENDING' ? `
                            <button class="btn-xs btn-approve" onclick="event.stopPropagation(); updateStatus('${booking.slotId}', 'APPROVED')">승인</button>
                            <button class="btn-xs btn-reject" onclick="event.stopPropagation(); updateStatus('${booking.slotId}', 'REJECTED')">거절</button>
                        ` : booking.status === 'APPROVED' ? `
                            <button class="btn-xs btn-reject" onclick="event.stopPropagation(); updateStatus('${booking.slotId}', 'CANCELLED')">취소</button>
                        ` : '-'}
                    </td>
                `;
                bookingsTbody.appendChild(row);
            });
        });

        // 4. Render Pagination Controls
        renderPagination(totalPages);
    }

    // 페이지네이션 컨트롤을 렌더링하는 함수
    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        // Prev
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '<';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderBookings(); } };
        paginationContainer.appendChild(prevBtn);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => { currentPage = i; renderBookings(); };
            paginationContainer.appendChild(btn);
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderBookings(); } };
        paginationContainer.appendChild(nextBtn);
    }

    // 예약 상태를 변경하는 함수
    // DB 연동 시 서버로 상태 변경 요청을 보내야 함
    window.updateStatus = function(slotId, newStatus) {
        const booking = allBookings.find(b => b.slotId === slotId);
        if (booking) {
            booking.status = newStatus;
            // Simulate server update
            alert(`예약 상태가 ${newStatus}로 변경되었습니다.`);
            renderBookings();
        }
    };

    // --- MODAL FUNCTIONS ---
    // 예약 상세 정보 모달을 여는 함수
    window.openDetailModal = function(booking) {
        const modal = document.getElementById('admin-detail-modal');
        const body = document.getElementById('admin-modal-body');
        
        const fields = [
            { label: '신청일시', value: new Date(booking.createdAt).toLocaleString('ko-KR') },
            { label: '예약시간', value: booking.meetingTime ? new Date(booking.meetingTime).toLocaleString('ko-KR') : '-' },
            { label: '담당 MD', value: booking.mdName },
            { label: '상태', value: statusLabels[booking.status] || booking.status },
            { label: '신청자', value: booking.userName },
            { label: '소속', value: booking.userAffiliation || '-' },
            { label: '연락처', value: booking.userPhone },
            { label: '이메일', value: booking.userEmail },
            { label: '미팅 안건', value: booking.notes || '-', isLong: true }
        ];

        body.innerHTML = fields.map(f => `
            <div class="detail-row ${f.isLong ? 'full-width' : ''}">
                <span class="detail-label">${f.label}</span>
                <div class="detail-value" style="${f.isLong ? 'white-space: pre-wrap;' : ''}">${f.value}</div>
            </div>
        `).join('');

        modal.style.display = 'flex';
    };

    // 예약 상세 정보 모달을 닫는 함수
    window.closeDetailModal = function() {
        document.getElementById('admin-detail-modal').style.display = 'none';
    };

    // --- SCHEDULE MANAGEMENT ---
    // 스케줄 설정용 MD 선택 드롭다운을 채우는 함수
    // MD 목록이 변경될 때마다 호출되어야 함
    function populateMdSelect() {
        allMds.forEach(md => {
            const option = document.createElement('option');
            option.value = md.id;
            option.textContent = md.name;
            mdSelect.appendChild(option);
        });
    }

    // --- MD MANAGEMENT ---
    // MD 관리 탭의 MD 목록을 렌더링하는 함수
    function renderMdsTable() {
        if (!mdsTbody) return;
        mdsTbody.innerHTML = '';
        
        allMds.forEach(md => {
            const row = document.createElement('tr');
            const status = md.status || 'AVAILABLE';
            row.innerHTML = `
                <td>${md.name}</td>
                <td>${md.category}</td>
                <td>${md.email || '-'}</td>
                <td>${md.phone || '-'}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="btn-xs btn-approve" onclick="editMd('${md.id}')">수정</button>
                    <button class="btn-xs btn-reject" onclick="deleteMd('${md.id}')">삭제</button>
                </td>
            `;
            mdsTbody.appendChild(row);
        });
    }

    // MD 수정 폼에 데이터를 채우는 함수
    window.editMd = function(id) {
        const md = allMds.find(m => m.id === id);
        if (!md) return;
        mdIdInput.value = md.id;
        mdNameInput.value = md.name;
        mdCategoryInput.value = md.category;
        mdEmailInput.value = md.email || '';
        mdPhoneInput.value = md.phone || '';
        window.scrollTo(0, 0);
    };

    // MD를 삭제하는 함수
    window.deleteMd = function(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        allMds = allMds.filter(m => m.id !== id);
        renderMdsTable();
        populateMdSelect(); // Update schedule select as well
    };

    if (btnSaveMd) {
        btnSaveMd.addEventListener('click', () => {
            const id = mdIdInput.value;
            const name = mdNameInput.value.trim();
            const category = mdCategoryInput.value.trim();
            const email = mdEmailInput.value.trim();
            const phone = mdPhoneInput.value.trim();

            if (!name || !category) {
                alert('이름과 분야는 필수입니다.');
                return;
            }

            if (id) {
                // Update
                const md = allMds.find(m => m.id === id);
                if (md) {
                    md.name = name;
                    md.category = category;
                    md.email = email;
                    md.phone = phone;
                }
            } else {
                // Create
                const newId = 'md-' + Date.now();
                allMds.push({
                    id: newId,
                    name: name,
                    category: category,
                    email: email,
                    phone: phone,
                    status: 'AVAILABLE'
                });
            }

            alert('저장되었습니다.');
            resetMdForm();
            renderMdsTable();
            populateMdSelect();
        });
    }

    if (btnResetMd) {
        btnResetMd.addEventListener('click', resetMdForm);
    }

    // MD 입력 폼을 초기화하는 함수
    function resetMdForm() {
        mdIdInput.value = '';
        mdNameInput.value = '';
        mdCategoryInput.value = '';
        mdEmailInput.value = '';
        mdPhoneInput.value = '';
    }

    // 스케줄 설정 그리드를 렌더링하는 함수
    function renderScheduleGrid() {
        const mdId = mdSelect.value;
        const date = dateInput.value;
        
        if (!mdId || !date) {
            timeSettingsArea.style.display = 'none';
            return;
        }

        timeSettingsArea.style.display = 'block';
        timeGrid.innerHTML = '';

        // Check if MD is on leave for this date (Simulated logic)
        // In a real app, we would check a 'vacations' array.
        // Here we just check if all slots are closed or if MD status is AWAY globally.
        const md = allMds.find(m => m.id === mdId);
        
        // Render 09:00 - 18:00 (1 hour blocks)
        for (let h = 9; h < 18; h++) {
            const hourStr = String(h).padStart(2, '0');
            const timeLabel = `${hourStr}:00 - ${String(h+1).padStart(2, '0')}:00`;
            
            // Check slots for this hour
            const slot1Time = `${date}T${hourStr}:00:00`;
            const slot2Time = `${date}T${hourStr}:30:00`;
            
            const slot1 = allSlots.find(s => s.mdId === mdId && s.startTime === slot1Time);
            const slot2 = allSlots.find(s => s.mdId === mdId && s.startTime === slot2Time);

            // Determine if "Closed" (Unavailable)
            // If both slots are CLOSED or missing, we consider it unavailable.
            const isClosed = (slot1?.status === 'CLOSED' && slot2?.status === 'CLOSED');

            const btn = document.createElement('div');
            btn.className = `time-slot-btn ${isClosed ? 'disabled' : ''}`;
            btn.textContent = timeLabel;
            btn.dataset.hour = h;
            btn.onclick = function() { this.classList.toggle('selected'); };
            
            timeGrid.appendChild(btn);
        }
    }

    // 선택된 시간대의 스케줄 상태를 일괄 변경하는 함수
    // DB 연동 시 변경된 스케줄 정보를 서버에 저장해야 함
    window.applyBatchSchedule = function(status) {
        const mdId = mdSelect.value;
        const date = dateInput.value;
        const selectedBtns = document.querySelectorAll('.time-slot-btn.selected');

        if (selectedBtns.length === 0) {
            alert('변경할 시간을 선택해주세요.');
            return;
        }

        selectedBtns.forEach(btn => {
            const hour = parseInt(btn.dataset.hour);
            const hourStr = String(hour).padStart(2, '0');
            const times = [`${hourStr}:00:00`, `${hourStr}:30:00`];

            times.forEach(t => {
                const fullTime = `${date}T${t}`;
                let slot = allSlots.find(s => s.mdId === mdId && s.startTime === fullTime);
                
                if (slot) {
                    slot.status = status;
                } else {
                    allSlots.push({
                        id: `new-${mdId}-${date}-${t}`,
                        mdId: mdId,
                        startTime: fullTime,
                        endTime: fullTime,
                        status: status,
                        capacity: 1
                    });
                }
            });
        });

        alert('스케줄이 변경되었습니다.');
        renderScheduleGrid();
    };

    mdSelect.addEventListener('change', renderScheduleGrid);
    dateInput.addEventListener('change', renderScheduleGrid);
    
    vacationToggle.addEventListener('change', (e) => {
        if (!mdSelect.value || !dateInput.value) return;
        const isVacation = e.target.checked;
        // Toggle all hours
        for (let h = 9; h < 18; h++) {
            const hourStr = String(h).padStart(2, '0');
            const times = [`${hourStr}:00:00`, `${hourStr}:30:00`];
            times.forEach(t => {
                const fullTime = `${dateInput.value}T${t}`;
                let slot = allSlots.find(s => s.mdId === mdSelect.value && s.startTime === fullTime);
                const status = isVacation ? 'CLOSED' : 'OPEN';
                if (slot) {
                    slot.status = status;
                } else {
                    allSlots.push({
                        id: `vac-${mdSelect.value}-${dateInput.value}-${t}`,
                        mdId: mdSelect.value,
                        startTime: fullTime,
                        endTime: fullTime,
                        status: status,
                        capacity: 1
                    });
                }
            });
        }
        renderScheduleGrid();
    });

    // --- NOTICE MANAGEMENT ---
    // 공지사항 목록을 렌더링하는 함수
    function renderNotices() {
        if (!noticesTbody) return;
        noticesTbody.innerHTML = '';

        // Sort by date desc
        const sortedNotices = [...allNotices].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedNotices.forEach(notice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align:center;">${notice.date}</td>
                <td style="font-weight:bold;">${notice.title}</td>
                <td style="color:#555;">${notice.content}</td>
                <td>
                    <button class="btn-xs btn-reject" onclick="deleteNotice(${notice.id})">삭제</button>
                </td>
            `;
            noticesTbody.appendChild(row);
        });
    }

    if (btnAddNotice) {
        btnAddNotice.addEventListener('click', () => {
            const date = noticeDateInput.value;
            const title = noticeTitleInput.value;
            const content = noticeContentInput.value;

            if (!date || !title || !content) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            const newNotice = { id: Date.now(), date, title, content };
            allNotices.push(newNotice);
            alert('공지사항이 등록되었습니다.');
            noticeTitleInput.value = '';
            noticeContentInput.value = '';
            renderNotices();
        });
    }

    // 공지사항을 삭제하는 함수
    window.deleteNotice = function(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        allNotices = allNotices.filter(n => n.id !== id);
        renderNotices();
    };

    // --- BLACKLIST MANAGEMENT ---
    // 블랙리스트 목록을 렌더링하는 함수
    function renderBlacklist() {
        if (!blacklistTbody) return;
        blacklistTbody.innerHTML = '';

        // Sort by createdAt desc
        const sortedList = [...allBlacklist].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sortedList.length === 0) {
            blacklistTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">등록된 블랙리스트가 없습니다.</td></tr>';
            return;
        }

        sortedList.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.phone}</td>
                <td>${item.reason}</td>
                <td style="text-align:center;">${item.createdAt}</td>
                <td>
                    <button class="btn-xs btn-reject" onclick="deleteBlacklist(${item.id})">해제</button>
                </td>
            `;
            blacklistTbody.appendChild(row);
        });
    }

    if (btnAddBlacklist) {
        btnAddBlacklist.addEventListener('click', () => {
            const phone = blacklistPhoneInput.value.trim();
            const reason = blacklistReasonInput.value.trim();
            if (!phone) { alert('전화번호를 입력해주세요.'); return; }
            
            allBlacklist.push({ id: Date.now(), phone, reason, createdAt: new Date().toISOString().split('T')[0] });
            alert('블랙리스트에 등록되었습니다.');
            blacklistPhoneInput.value = '';
            blacklistReasonInput.value = '';
            renderBlacklist();
        });
    }

    // 블랙리스트를 해제(삭제)하는 함수
    window.deleteBlacklist = function(id) {
        if (!confirm('블랙리스트를 해제하시겠습니까?')) return;
        allBlacklist = allBlacklist.filter(item => item.id !== id);
        renderBlacklist();
    };

    // --- MEETING KING RANKING ---
    // 이달의 미팅왕 랭킹을 렌더링하는 함수
    function renderMeetingKing() {
        const container = document.getElementById('meeting-king-list');
        if (!container) return;

        // Count bookings by MD (APPROVED or COMPLETED)
        const counts = {};
        allBookings.forEach(b => {
            if (b.status === 'APPROVED' || b.status === 'COMPLETED') {
                counts[b.mdId] = (counts[b.mdId] || 0) + 1;
            }
        });

        // Convert to array and sort
        const ranking = Object.keys(counts).map(mdId => {
            const md = allMds.find(m => m.id === mdId);
            return {
                name: md ? md.name : 'Unknown',
                count: counts[mdId]
            };
        }).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5

        if (ranking.length === 0) {
            container.innerHTML = '<p style="color:#999; font-size:0.85rem;">데이터가 없습니다.</p>';
            return;
        }

        container.innerHTML = ranking.map((r, index) => `
            <div class="ranking-item">
                <div style="display:flex; align-items:center;">
                    <span class="ranking-badge rank-${index + 1}">${index + 1}</span>
                    <span>${r.name}</span>
                </div>
                <span style="font-weight:bold; color:var(--primary-color);">${r.count}건</span>
            </div>
        `).join('');
    }

    init();
});
