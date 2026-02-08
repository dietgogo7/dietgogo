document.addEventListener('DOMContentLoaded', () => {
    const bookingsTbody = document.getElementById('bookings-tbody');

    async function loadBookings() {
        if (!bookingsTbody) return;

        bookingsTbody.innerHTML = '<tr><td colspan="7">예약 목록을 불러오는 중...</td></tr>';

        try {
            const response = await fetch('data/bookings.json');
            if (!response.ok) {
                throw new Error('예약 데이터를 불러오는데 실패했습니다.');
            }
            const bookings = await response.json();
            
            // Sort by creation date, newest first
            bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            renderBookings(bookings);

        } catch (error) {
            bookingsTbody.innerHTML = `<tr><td colspan="7" style="color: red;">${error.message}</td></tr>`;
        }
    }

    function renderBookings(bookings) {
        if (bookings.length === 0) {
            bookingsTbody.innerHTML = '<tr><td colspan="7">접수된 예약이 없습니다.</td></tr>';
            return;
        }

        bookingsTbody.innerHTML = ''; // Clear table body
        bookings.forEach(booking => {
            const row = document.createElement('tr');

            const createdAt = new Date(booking.createdAt).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });

            row.innerHTML = `
                <td>${createdAt}</td>
                <td>${booking.userName}</td>
                <td>${booking.userEmail}</td>
                <td>${booking.userPhone}</td>
                <td>${booking.slotId}</td>
                <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
                <td>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="alert('상세보기/수정 기능은 현재 구현되지 않았습니다.')">
                        관리
                    </button>
                </td>
            `;
            bookingsTbody.appendChild(row);
        });
    }

    loadBookings();
});
