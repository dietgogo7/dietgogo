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
    // Schedule pagination state
    let scheduleCurrentPage = 1;
    const scheduleItemsPerPage = 6; // number of time slots per page

    const formatWithYear = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    // --- CONSTANTS ---
    const statusLabels = {
        'PENDING': '예약신청',
        'APPROVED': '예약확정',
        'REJECTED': '승인거절',
        'CANCELLED': '예약취소',
        'COMPLETED': '이용완료',
        'AWAY': '부재',
        'ON_LEAVE': '휴가',
        'OPEN': '예약가능',
        'CLOSED': '예약불가'
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
    const schedulePaginationContainer = document.getElementById('schedule-pagination');

    // MD Management Elements
    const mdsTbody = document.getElementById('mds-tbody');
    const mdIdInput = document.getElementById('Md_No');
    const mdNameInput = document.getElementById('Md_Name');
    const mdTeamNameInput = document.getElementById('Team_Name');
    const mdCategoryInput = document.getElementById('Category_Name');
    const mdEmailInput = document.getElementById('Email');
    const mdPhoneInput = document.getElementById('Md_Phone_No');
    const btnSaveMd = document.getElementById('btn-save-md');
    const btnResetMd = document.getElementById('btn-reset-md');

    // Notice Elements
    const noticesTbody = document.getElementById('notices-tbody');
    const noticeDateInput = document.getElementById('Notice_Date');
    const noticeTitleInput = document.getElementById('Title');
    const noticeContentInput = document.getElementById('Content');
    const btnAddNotice = document.getElementById('btn-add-notice');

    // Blacklist Elements
    const blacklistTbody = document.getElementById('blacklist-tbody');
    const blacklistPhoneInput = document.getElementById('Blacklist_Phone_No');
    const blacklistReasonInput = document.getElementById('Reason');
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

            const rawMds = await mdsRes.json();
            const rawSlots = await slotsRes.json();
            const rawBookings = await bookingsRes.json();
            const rawNotices = await noticesRes.json();
            const rawBlacklist = await blacklistRes.json();

            // Data Normalization
            allMds = rawMds.map(item => ({
                Md_No: item.Md_No || item.Md_Id || item.id,
                Md_Name: item.Md_Name || item.name,
                Team_Name: item.Team_Name,
                Category_Name: item.Category_Name || item.category,
                Status: item.Status || item.status,
                Email: item.Email || item.email,
                Phone_No: item.Phone_No || item.phone
            }));

            allSlots = rawSlots.map(item => ({
                Slot_Seq: item.Slot_Seq || item.Slot_Id || item.id,
                Md_No: item.Md_No || item.Md_Id || item.mdId,
                Start_Datetime: item.Start_Datetime || item.startTime,
                End_Datetime: item.End_Datetime || item.endTime,
                Status: item.Status || item.status,
                Capacity: item.Capacity || item.capacity
            }));

            allBookings = rawBookings.map(item => ({
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
            }));

            allNotices = rawNotices.map(item => ({
                Notice_Seq: item.Notice_Seq || item.Notice_Id || item.id,
                Notice_Date: item.Notice_Date || item.date,
                Title: item.Title || item.title,
                Content: item.Content || item.content
            }));

            allBlacklist = rawBlacklist.map(item => ({
                Blacklist_Seq: item.Blacklist_Seq || item.Blacklist_Id || item.id,
                Phone_No: item.Phone_No || item.phone,
                Reason: item.Reason || item.reason,
                Regist_Datetime: item.Regist_Datetime || item.createdAt
            }));

            // Join Data
            const now = new Date();

            allBookings.forEach(b => {
                const slot = allSlots.find(s => s.Slot_Seq === b.Slot_Seq);
                
                // bookings.json에 값이 없으면 slot에서 가져오기 (하위 호환)
                if (!b.Md_No && slot) b.Md_No = slot.Md_No;
                if (!b.Meeting_Datetime && slot) b.Meeting_Datetime = slot.Start_Datetime;

                // MD 이름 매핑
                const md = allMds.find(m => m.Md_No === b.Md_No);
                b.Md_Name = md ? md.Md_Name : 'Unknown';

                // fallback for meetingTime if still missing
                if (!b.Meeting_Datetime) b.Meeting_Datetime = b.Regist_Datetime;
            });

            // Sort bookings
            allBookings.sort((a, b) => new Date(b.Regist_Datetime) - new Date(a.Regist_Datetime));

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
            if (document.getElementById('admin-calendar-view')) {
                renderAdminCalendar();
            }
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
            if (!b.Meeting_Datetime) return true;
            const mDate = b.Meeting_Datetime.split('T')[0];
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
                (acc[b.Md_Name] = acc[b.Md_Name] || []).push(b);
                return acc;
            }, {});
        } else if (currentViewMode === 'date') {
            groups = paginatedItems.reduce((acc, b) => {
                const date = b.Meeting_Datetime ? b.Meeting_Datetime.split('T')[0] : 'Unknown';
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
                const createdAt = formatWithYear(booking.Regist_Datetime);
                const meetingTime = formatWithYear(booking.Meeting_Datetime);

                const statusLabel = statusLabels[booking.Status] || booking.Status;

                // Row click event for details
                row.style.cursor = 'pointer';
                row.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    openDetailModal(booking);
                };

                row.innerHTML = `
                    <td>${createdAt}</td>
                    <td>${booking.Md_Name}</td>
                    <td>${booking.User_Name}<br><small style="color:#888">${booking.User_Affiliation}</small></td>
                    <td>${booking.User_Phone}</td>
                    <td>${meetingTime}</td>
                    <td><span class="status-badge status-${booking.Status}">${statusLabel}</span></td>
                        <td>
                            ${booking.Status === 'PENDING' ? `
                                <button class="btn-xs btn-approve" onclick="event.stopPropagation(); updateStatus('${booking.Booking_Seq}', 'APPROVED')">승인</button>
                                <button class="btn-xs btn-reject" onclick="event.stopPropagation(); updateStatus('${booking.Booking_Seq}', 'REJECTED')">거절</button>
                                <button class="btn-xs btn-reject" onclick="event.stopPropagation(); updateStatus('${booking.Booking_Seq}', 'CANCELLED')">취소</button>
                            ` : booking.Status === 'APPROVED' ? `
                                <button class="btn-xs btn-reject" onclick="event.stopPropagation(); updateStatus('${booking.Booking_Seq}', 'CANCELLED')">취소</button>
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
    window.updateStatus = function(bookingSeq, newStatus) {
        const booking = allBookings.find(b => b.Booking_Seq === bookingSeq);
        if (booking) {
            booking.Status = newStatus;
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
            { label: '신청일시', value: formatWithYear(booking.Regist_Datetime) },
            { label: '예약시간', value: formatWithYear(booking.Meeting_Datetime) },
            { label: '담당 MD', value: booking.Md_Name },
            { label: '상태', value: statusLabels[booking.Status] || booking.Status },
            { label: '신청자', value: booking.User_Name },
            { label: '소속', value: booking.User_Affiliation || '-' },
            { label: '연락처', value: booking.User_Phone },
            { label: '이메일', value: booking.User_Email },
            { label: '미팅 안건', value: booking.Notes || '-', isLong: true }
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
        if (!mdSelect) return;
        mdSelect.innerHTML = '<option value="">MD를 선택하세요</option>';
        allMds.forEach(md => {
            const option = document.createElement('option');
            option.value = md.Md_No;
            option.textContent = md.Md_Name;
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
            const status = md.Status || 'AVAILABLE';
            row.innerHTML = `
                <td>${md.Md_Name}</td>
                <td>${md.Team_Name || '-'}</td>
                <td>${md.Category_Name}</td>
                <td>${md.Email || '-'}</td>
                <td>${md.Phone_No || '-'}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td>
                    <button class="btn-xs btn-approve" onclick="editMd('${md.Md_No}')">수정</button>
                    <button class="btn-xs btn-reject" onclick="deleteMd('${md.Md_No}')">삭제</button>
                </td>
            `;
            mdsTbody.appendChild(row);
        });
    }

    // MD 수정 폼에 데이터를 채우는 함수
    window.editMd = function(id) {
        const md = allMds.find(m => m.Md_No === id);
        if (!md) return;
        mdIdInput.value = md.Md_No;
        mdNameInput.value = md.Md_Name;
        mdTeamNameInput.value = md.Team_Name || '';
        mdCategoryInput.value = md.Category_Name;
        mdEmailInput.value = md.Email || '';
        mdPhoneInput.value = md.Phone_No || '';
        window.scrollTo(0, 0);
    };

    // MD를 삭제하는 함수
    window.deleteMd = function(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        allMds = allMds.filter(m => m.Md_No !== id);
        renderMdsTable();
        populateMdSelect(); // Update schedule select as well
    };

    if (btnSaveMd) {
        btnSaveMd.addEventListener('click', () => {
            const id = mdIdInput.value;
            const name = mdNameInput.value.trim();
            const teamName = mdTeamNameInput.value.trim();
            const category = mdCategoryInput.value.trim();
            const email = mdEmailInput.value.trim();
            const phone = mdPhoneInput.value.trim();

            if (!name || !category) {
                alert('이름과 분야는 필수입니다.');
                return;
            }

            if (id) {
                // Update
                const md = allMds.find(m => m.Md_No === id);
                if (md) {
                    md.Md_Name = name;
                    md.Team_Name = teamName;
                    md.Category_Name = category;
                    md.Email = email;
                    md.Phone_No = phone;
                }
            } else {
                // Create
                const newId = 'md-' + Date.now();
                allMds.push({
                    Md_No: newId,
                    Md_Name: name,
                    Team_Name: teamName,
                    Category_Name: category,
                    Email: email,
                    Phone_No: phone,
                    Status: 'AVAILABLE'
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
        mdTeamNameInput.value = '';
        mdCategoryInput.value = '';
        mdEmailInput.value = '';
        mdPhoneInput.value = '';
    }

    // --- CALENDAR LOGIC (Admin) ---
    let calendarCurrentMonth = new Date();
    
    function renderAdminCalendar() {
        const area = document.getElementById('admin-calendar-view');
        if (!area) return;

        const year = calendarCurrentMonth.getFullYear();
        const month = calendarCurrentMonth.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        // Month navigation header
        let html = `
            <div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                <button type="button" class="page-btn" id="admin-cal-prev" style="padding: 2px 8px; font-size: 12px;">&lt;</button>
                <div style="font-weight:700; font-size:16px; color: var(--text);">${year}.${String(month + 1).padStart(2, '0')}</div>
                <button type="button" class="page-btn" id="admin-cal-next" style="padding: 2px 8px; font-size: 12px;">&gt;</button>
            </div>
            <div class="calendar-days-row" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8px;">
                <div class="calendar-day-label sunday" style="color: #e11d48; font-size: 12px; font-weight: 600;">일</div>
                <div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">월</div>
                <div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">화</div>
                <div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">수</div>
                <div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">목</div>
                <div class="calendar-day-label" style="font-size: 12px; font-weight: 600;">금</div>
                <div class="calendar-day-label saturday" style="color: #2563eb; font-size: 12px; font-weight: 600;">토</div>
            </div>
            <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        `;

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-date empty"></div>';
        }

        const selectedDate = dateInput ? dateInput.value : '';

        for (let d = 1; d <= lastDate; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay();
            
            let classes = ['calendar-date'];
            const isAllowedDay = dayOfWeek >= 1 && dayOfWeek <= 4; // Mon(1) ~ Thu(4)
            
            if (isAllowedDay) {
                classes.push('available');
            } else {
                classes.push('disabled');
            }
            
            if (dayOfWeek === 0) classes.push('sunday');
            if (dayOfWeek === 6) classes.push('saturday');
            
            // Highlight selected date
            let extraStyles = '';
            if (dateStr === selectedDate) {
                extraStyles = 'background-color: var(--primary); color: #fff; font-weight: 700;';
            }

            const cursorStyle = isAllowedDay ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.4;';
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}" style="${extraStyles} font-size: 13px; height: 36px; display: flex; align-items: center; justify-content: center; ${cursorStyle} border-radius: 8px;">${d}</div>`;
        }
        
        html += '</div>';
        area.innerHTML = html;

        // Add events
        const prevBtn = document.getElementById('admin-cal-prev');
        const nextBtn = document.getElementById('admin-cal-next');

        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() - 1);
                renderAdminCalendar();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                calendarCurrentMonth.setMonth(calendarCurrentMonth.getMonth() + 1);
                renderAdminCalendar();
            };
        }
        area.querySelectorAll('.calendar-date.available').forEach(el => {
            el.onclick = () => {
                if (dateInput) {
                    dateInput.value = el.dataset.date;
                    renderAdminCalendar();
                    renderScheduleGrid();
                }
            };
        });
    }

    // 스케줄 설정 그리드를 렌더링하는 함수
    function renderScheduleGrid() {
        if (!mdSelect || !dateInput || !timeSettingsArea || !timeGrid) return;
        const mdId = mdSelect.value;
        const date = dateInput.value;

        // reset page when md/date changes
        scheduleCurrentPage = 1;

        if (!mdId || !date) {
            timeSettingsArea.style.display = 'none';
            if (schedulePaginationContainer) schedulePaginationContainer.innerHTML = '';
            return;
        }

        // Only allow Mon(1) - Thu(4)
        const d = new Date(date + 'T00:00:00');
        const day = d.getDay();
        const allowed = [1,2,3,4]; // Mon-Thu
        timeGrid.innerHTML = '';

        if (!allowed.includes(day)) {
            timeSettingsArea.style.display = 'block';
            timeGrid.innerHTML = '<div style="color:#c94b4b; padding:12px;">선택한 날짜는 월~목이 아닙니다. 스케줄은 매주 월요일~목요일 14:00~15:30(15분 단위)만 설정 가능합니다.</div>';
            if (schedulePaginationContainer) schedulePaginationContainer.innerHTML = '';
            return;
        }

        timeSettingsArea.style.display = 'block';

        // Generate 15-minute slots from 14:00 to 15:30 (last start at 15:15)
        const startMin = 14 * 60; // 840
        const endMin = 15 * 60 + 15; // 915 (inclusive start)

        // collect slot descriptors first so we can paginate
        const slotDescriptors = [];
        for (let t = startMin; t <= endMin; t += 15) {
            const hh = String(Math.floor(t / 60)).padStart(2, '0');
            const mm = String(t % 60).padStart(2, '0');
            const timeLabel = `${hh}:${mm}`;
            const fullTime = `${date}T${hh}:${mm}:00`;

            const slot = allSlots.find(s => s.Md_No === mdId && s.Start_Datetime === fullTime);
            const isClosed = slot && slot.Status === 'CLOSED';

            slotDescriptors.push({ timeLabel, fullTime, isClosed });
        }

        const totalItems = slotDescriptors.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / scheduleItemsPerPage));
        if (scheduleCurrentPage > totalPages) scheduleCurrentPage = totalPages;

        const startIndex = (scheduleCurrentPage - 1) * scheduleItemsPerPage;
        const pageSlice = slotDescriptors.slice(startIndex, startIndex + scheduleItemsPerPage);

        pageSlice.forEach(sd => {
            const btn = document.createElement('div');
            btn.className = `time-slot-btn ${sd.isClosed ? 'disabled' : ''}`;
            btn.textContent = sd.timeLabel;
            btn.dataset.time = sd.fullTime;
            btn.onclick = function() { if (!this.classList.contains('disabled')) this.classList.toggle('selected'); };
            timeGrid.appendChild(btn);
        });

        // render pager
        renderSchedulePager(totalPages);
    }

    function renderSchedulePager(totalPages) {
        if (!schedulePaginationContainer) return;
        schedulePaginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        // Prev
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '<';
        prevBtn.disabled = scheduleCurrentPage === 1;
        prevBtn.onclick = () => { if (scheduleCurrentPage > 1) { scheduleCurrentPage--; renderScheduleGrid(); } };
        schedulePaginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === scheduleCurrentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => { scheduleCurrentPage = i; renderScheduleGrid(); };
            schedulePaginationContainer.appendChild(btn);
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '>';
        nextBtn.disabled = scheduleCurrentPage === totalPages;
        nextBtn.onclick = () => { if (scheduleCurrentPage < totalPages) { scheduleCurrentPage++; renderScheduleGrid(); } };
        schedulePaginationContainer.appendChild(nextBtn);
    }

    // 선택된 시간대의 스케줄 상태를 일괄 변경하는 함수
    // DB 연동 시 변경된 스케줄 정보를 서버에 저장해야 함
    window.applyBatchSchedule = function(status) {
        if (!mdSelect) return;
        const mdId = mdSelect.value;
        const selectedBtns = document.querySelectorAll('.time-slot-btn.selected');

        if (selectedBtns.length === 0) {
            alert('변경할 시간을 선택해주세요.');
            return;
        }

        selectedBtns.forEach(btn => {
            const fullTime = btn.dataset.time; // YYYY-MM-DDTHH:MM:00
            let slotIndex = allSlots.findIndex(s => s.Md_No === mdId && s.Start_Datetime === fullTime);

            if (status === 'OPEN') {
                if (slotIndex !== -1) allSlots.splice(slotIndex, 1);
            } else {
                if (slotIndex !== -1) {
                    allSlots[slotIndex].Status = status;
                } else {
                    allSlots.push({
                        Slot_Seq: `new-${mdId}-${fullTime}`,
                        Md_No: mdId,
                        Start_Datetime: fullTime,
                        End_Datetime: fullTime,
                        Status: status,
                        Capacity: 1
                    });
                }
            }
        });

        alert('스케줄이 변경되었습니다.');
        renderScheduleGrid();
    };

    if (mdSelect && dateInput) {
        mdSelect.addEventListener('change', renderScheduleGrid);
        dateInput.addEventListener('change', renderScheduleGrid);
    }
    
    if (vacationToggle && mdSelect && dateInput) {
        vacationToggle.addEventListener('change', (e) => {
            if (!mdSelect.value || !dateInput.value) return;
            const isVacation = e.target.checked;

            // Only apply to Mon-Thu 14:00-15:30 in 15-minute steps
            const startMin = 14 * 60;
            const endMin = 15 * 60 + 15;
            for (let t = startMin; t <= endMin; t += 15) {
                const hh = String(Math.floor(t / 60)).padStart(2, '0');
                const mm = String(t % 60).padStart(2, '0');
                const fullTime = `${dateInput.value}T${hh}:${mm}:00`;
                let slotIndex = allSlots.findIndex(s => s.Md_No === mdSelect.value && s.Start_Datetime === fullTime);
                const status = isVacation ? 'CLOSED' : 'OPEN';

                if (status === 'OPEN') {
                    if (slotIndex !== -1) {
                        allSlots.splice(slotIndex, 1);
                    }
                } else {
                    if (slotIndex !== -1) {
                        allSlots[slotIndex].Status = status;
                    } else {
                        allSlots.push({
                            Slot_Seq: `vac-${mdSelect.value}-${dateInput.value}-${hh}${mm}`,
                            Md_No: mdSelect.value,
                            Start_Datetime: fullTime,
                            End_Datetime: fullTime,
                            Status: status,
                            Capacity: 1
                        });
                    }
                }
            }
            renderScheduleGrid();
        });
    }

    // --- NOTICE MANAGEMENT ---
    // 공지사항 목록을 렌더링하는 함수
    function renderNotices() {
        if (!noticesTbody) return;
        noticesTbody.innerHTML = '';

        // Sort by date desc
        const sortedNotices = [...allNotices].sort((a, b) => new Date(b.Notice_Date) - new Date(a.Notice_Date));

        sortedNotices.forEach(notice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align:center;">${notice.Notice_Date}</td>
                <td style="font-weight:bold;">${notice.Title}</td>
                <td style="color:#555;">${notice.Content}</td>
                <td>
                    <button class="btn-xs btn-reject" onclick="deleteNotice(${notice.Notice_Seq})">삭제</button>
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

            const newNotice = { Notice_Seq: Date.now(), Notice_Date: date, Title: title, Content: content };
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
        allNotices = allNotices.filter(n => n.Notice_Seq !== id);
        renderNotices();
    };

    // --- BLACKLIST MANAGEMENT ---
    // 블랙리스트 목록을 렌더링하는 함수
    function renderBlacklist() {
        if (!blacklistTbody) return;
        blacklistTbody.innerHTML = '';

        // Sort by createdAt desc
        const sortedList = [...allBlacklist].sort((a, b) => new Date(b.Regist_Datetime) - new Date(a.Regist_Datetime));

        if (sortedList.length === 0) {
            blacklistTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">등록된 블랙리스트가 없습니다.</td></tr>';
            return;
        }

        sortedList.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.Phone_No}</td>
                <td>${item.Reason}</td>
                <td style="text-align:center;">${item.Regist_Datetime}</td>
                <td>
                    <button class="btn-xs btn-reject" onclick="deleteBlacklist(${item.Blacklist_Seq})">해제</button>
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
            
            allBlacklist.push({ Blacklist_Seq: Date.now(), Phone_No: phone, Reason: reason, Regist_Datetime: new Date().toISOString().split('T')[0] });
            alert('블랙리스트에 등록되었습니다.');
            blacklistPhoneInput.value = '';
            blacklistReasonInput.value = '';
            renderBlacklist();
        });
    }

    // 블랙리스트를 해제(삭제)하는 함수
    window.deleteBlacklist = function(id) {
        if (!confirm('블랙리스트를 해제하시겠습니까?')) return;
        allBlacklist = allBlacklist.filter(item => item.Blacklist_Seq !== id);
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
            if (b.Status === 'APPROVED' || b.Status === 'COMPLETED') {
                counts[b.Md_No] = (counts[b.Md_No] || 0) + 1;
            }
        });

        // Convert to array and sort
        const ranking = Object.keys(counts).map(mdId => {
            const md = allMds.find(m => m.Md_No === mdId);
            return {
                name: md ? md.Md_Name : 'Unknown',
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
