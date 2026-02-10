document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('my-bookings-container');
    const urlParams = new URLSearchParams(window.location.search);
    const userPhone = urlParams.get('phone');

    if (!userPhone) {
        alert('잘못된 접근입니다.');
        window.location.href = 'index.html';
        return;
    }

    // State variables
    let myBookings = [];
    let allMds = [];
    let allSlots = [];

    // DB 연동 시 API 호출로 변경 필요
    try {
        const [bookingsRes, mdsRes, slotsRes] = await Promise.all([
            fetch('data/bookings.json'),
            fetch('data/mds.json'),
            fetch('data/slots.json')
        ]);
        
        const rawBookings = await bookingsRes.json();
        const rawMds = await mdsRes.json();
        const rawSlots = await slotsRes.json();

        // Data Normalization
        const bookings = rawBookings.map(item => ({
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

        allMds = rawMds.map(item => ({
            Md_No: item.Md_No || item.Md_Id || item.id,
            Md_Name: item.Md_Name || item.name,
            Team_Name: item.Team_Name,
            Category_Name: item.Category_Name || item.category,
            Status: item.Status || item.status
        }));

        allSlots = rawSlots.map(item => ({
            Slot_Seq: item.Slot_Seq || item.Slot_Id || item.id,
            Md_No: item.Md_No || item.Md_Id || item.mdId,
            Start_Datetime: item.Start_Datetime || item.startTime,
            End_Datetime: item.End_Datetime || item.endTime,
            Status: item.Status || item.status,
            Capacity: item.Capacity || item.capacity
        }));

        // Filter by phone
        myBookings = bookings.filter(b => b.User_Phone === userPhone);

        // Sort by date desc (newest first)
        myBookings.sort((a, b) => new Date(b.Regist_Datetime) - new Date(a.Regist_Datetime));

        renderBookings();

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="no-bookings">데이터를 불러오는데 실패했습니다.</p>';
    }

    // Make cancelBooking available globally
    // DB 연동 시 서버로 취소 요청 전송 필요
    window.cancelBooking = function(slotSeq) {
        if (!confirm('정말로 예약을 취소하시겠습니까?')) return;
        
        // Find the booking in local state
        const booking = myBookings.find(b => b.Slot_Seq === slotSeq);
        if (booking) {
            // Update status locally (Simulation)
            booking.Status = 'CANCELLED';
            alert('예약이 취소되었습니다.');
            // Re-render to show updated status
            renderBookings();
        }
    };

    // 예약 목록 렌더링 함수
    function renderBookings() {
        if (myBookings.length === 0) {
            container.innerHTML = '<p class="no-bookings">예약 내역이 없습니다.</p>';
            return;
        }

        const statusLabels = {
            'PENDING': '예약신청',
            'APPROVED': '예약확정',
            'REJECTED': '승인거절',
            'CANCELLED': '예약취소',
            'COMPLETED': '이용완료'
        };

        container.innerHTML = myBookings.map(b => {
            // Data Joining
            const slot = allSlots.find(s => s.Slot_Seq === b.Slot_Seq);
            if (!b.Md_No && slot) b.Md_No = slot.Md_No;
            if (!b.Meeting_Datetime && slot) b.Meeting_Datetime = slot.Start_Datetime;
            if (!b.Meeting_Datetime) b.Meeting_Datetime = b.Regist_Datetime; // fallback

            const md = allMds.find(m => m.Md_No === b.Md_No);
            const mdName = md ? md.Md_Name : '알 수 없음';
            
            // Date formatting: 2026. 2. 12. 오전 11:00
            let dateStr = '-';
            if (b.Meeting_Datetime) {
                const date = new Date(b.Meeting_Datetime);
                dateStr = date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }

            const statusLabel = statusLabels[b.Status] || b.Status;

            // Cancel Button Logic
            let actionBtn = '';
            if (b.Status === 'PENDING') {
                actionBtn = `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; text-align: right;">
                        <button onclick="cancelBooking('${b.Slot_Seq}')" class="btn-secondary" style="padding: 6px 12px; font-size: 0.9rem; background-color: #fff; border: 1px solid #ddd;">예약취소</button>
                    </div>
                `;
            }

            return `
                <div class="booking-card">
                    <div class="booking-header">
                        <span class="booking-date">${dateStr}</span>
                        <span class="status-badge status-${b.Status}">${statusLabel}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">담당 MD</span>
                        <span class="info-value">${mdName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">신청자</span>
                        <span class="info-value">${b.User_Name || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">이메일</span>
                        <span class="info-value">${b.User_Email || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">전화번호</span>
                        <span class="info-value">${b.User_Phone || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">안건</span>
                        <span class="info-value">${b.Notes || '-'}</span>
                    </div>
                    ${actionBtn}
                </div>
            `;
        }).join('');
    }
});