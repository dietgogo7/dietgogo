/* =====================================================
   리딩런 BackOffice Static - 공통 레이아웃 / 유틸
   ===================================================== */

/* ---- 공통 유틸 ---- */
window.BO = {
    numFormat: function (n) {
        if (n == null || n === '') return '0';
        return Number(n).toLocaleString('ko-KR');
    },
    dateFormat: function (str) {
        if (!str) return '-';
        return String(str).replace('T', ' ').substring(0, 16);
    },
    toast: function (msg, type) {
        var colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb' };
        var bg = colors[type || 'info'];
        var el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;padding:10px 18px;border-radius:6px;font-size:13px;color:#fff;background:' + bg + ';box-shadow:0 4px 12px rgba(0,0,0,.15);';
        document.body.appendChild(el);
        setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(function () { el.remove(); }, 400); }, 2200);
    },
    confirm: function (msg, cb) { if (window.confirm(msg)) cb(); }
};

/* ---- 사이드바 HTML ---- */
window.SIDEBAR_HTML = `
<aside style="width:224px;background:#0f172a;color:#fff;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;">
  <div style="padding:20px 16px 16px;border-bottom:1px solid #1e293b;">
    <div style="font-size:11px;color:#94a3b8;font-weight:600;">YES24</div>
    <div style="font-size:14px;font-weight:700;color:#fff;margin-top:2px;">리딩런 BackOffice</div>
  </div>
  <nav style="flex:1;padding:8px;">
    <div class="lnb-section">리딩런</div>
    <a class="lnb-item" href="dashboard.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      누적 통계 (대시보드)
    </a>
    <a class="lnb-item" href="course-status.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      코스별 현황
    </a>
    <a class="lnb-item" href="donation.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
      코스별 기부 현황
    </a>
    <div class="lnb-section" style="margin-top:12px;">회원관리</div>
    <a class="lnb-item" href="member-list.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      리딩런 회원관리
    </a>
    <div class="lnb-section" style="margin-top:12px;">리워드관리</div>
    <a class="lnb-item" href="badge-list.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
      배지 관리
    </a>
    <a class="lnb-item" href="badge-stats.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      배지 획득 통계
    </a>
    <div class="lnb-section" style="margin-top:12px;">도서순위</div>
    <a class="lnb-item" href="book-ranking.html">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
      리딩런 도서순위
    </a>
  </nav>
</aside>`;

/* ---- 공통 CSS 변수 ---- */
window.COMMON_STYLES = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;font-size:14px;}
  .lnb-section{padding:8px 12px 4px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;}
  .lnb-item{display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:6px;color:#cbd5e1;text-decoration:none;font-size:13px;transition:background .15s;}
  .lnb-item:hover{background:#1e293b;}
  .lnb-item.active{background:#1e3a8a;border-left:3px solid #60a5fa;padding-left:9px;}
  .top-bar{background:#fff;border-bottom:1px solid #e2e8f0;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .breadcrumb{font-size:12px;color:#64748b;}
  .breadcrumb strong{color:#1e293b;}
  .page-title{font-size:18px;font-weight:700;color:#0f172a;}
  .content-wrap{flex:1;overflow-y:auto;padding:24px;}
  .search-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;}
  .form-label{font-size:11px;font-weight:600;color:#475569;display:block;margin-bottom:4px;}
  .form-input,.form-select{border:1px solid #d1d5db;border-radius:6px;padding:7px 10px;font-size:13px;color:#374151;background:#fff;outline:none;}
  .form-input:focus,.form-select:focus{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.15);}
  .btn{padding:7px 16px;border-radius:6px;font-size:13px;font-weight:500;border:none;cursor:pointer;transition:background .15s;}
  .btn-primary{background:#2563eb;color:#fff;} .btn-primary:hover{background:#1d4ed8;}
  .btn-secondary{background:#f1f5f9;color:#374151;border:1px solid #d1d5db;} .btn-secondary:hover{background:#e2e8f0;}
  .btn-success{background:#16a34a;color:#fff;display:inline-flex;align-items:center;gap:4px;} .btn-success:hover{background:#15803d;}
  .btn-danger{background:#dc2626;color:#fff;} .btn-danger:hover{background:#b91c1c;}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;}
  .card-header{padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;}
  .stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;}
  .stat-label{font-size:11px;color:#64748b;margin-bottom:4px;}
  .stat-value{font-size:24px;font-weight:700;}
  .stat-unit{font-size:11px;color:#94a3b8;margin-top:2px;}
  .data-table{width:100%;border-collapse:collapse;font-size:13px;}
  .data-table thead th{background:#f8fafc;color:#374151;font-weight:600;padding:9px 10px;text-align:center;border:1px solid #e2e8f0;white-space:nowrap;}
  .data-table tbody td{padding:8px 10px;text-align:center;border:1px solid #e2e8f0;color:#1e293b;}
  .data-table tbody tr:hover{background:#f0f9ff;}
  .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;}
  .badge-blue{background:#dbeafe;color:#1d4ed8;} .badge-green{background:#dcfce7;color:#15803d;}
  .badge-yellow{background:#fef9c3;color:#92400e;} .badge-gray{background:#f1f5f9;color:#475569;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center;}
  .modal-box{background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.2);width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;}
  .modal-header{padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .modal-body{padding:16px 20px;overflow-y:auto;flex:1;}
  .modal-footer{padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;}
  .modal-title{font-size:15px;font-weight:700;color:#0f172a;}
  .close-btn{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:20px;line-height:1;}
  .close-btn:hover{color:#475569;}
  .pag-wrap{display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px;}
  .pag-info{font-size:12px;color:#64748b;}
  .pag-nav{display:flex;gap:3px;}
  .pag-btn{padding:4px 10px;border:1px solid #d1d5db;border-radius:5px;font-size:12px;color:#374151;cursor:pointer;background:#fff;}
  .pag-btn:hover{background:#f1f5f9;}
  .pag-btn.active{background:#2563eb;color:#fff;border-color:#2563eb;}
  .grid-stat{display:grid;gap:16px;}
  .section-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
  table .text-left{text-align:left!important;}
`;

/* ---- 레이아웃 렌더 헬퍼 ---- */
window.renderLayout = function(opts) {
    // opts: { title, breadcrumb, activePage, content }
    document.title = opts.title + ' - 리딩런 BackOffice';
    document.body.innerHTML = '';
    document.body.style.cssText = 'display:flex;height:100vh;overflow:hidden;';

    // inject styles
    var style = document.createElement('style');
    style.textContent = window.COMMON_STYLES;
    document.head.appendChild(style);

    // wrapper
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;width:100%;height:100%;overflow:hidden;';
    wrapper.innerHTML = window.SIDEBAR_HTML;

    // main area
    var main = document.createElement('div');
    main.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';
    main.innerHTML = `
      <div class="top-bar">
        <div class="breadcrumb">${opts.breadcrumb || ''}</div>
        <div style="font-size:13px;color:#475569;font-weight:500;">관리자</div>
      </div>
      <div class="content-wrap" id="pageContent">${opts.content || ''}</div>
    `;
    wrapper.appendChild(main);
    document.body.appendChild(wrapper);

    // active menu highlight
    var page = opts.activePage;
    if (page) {
        document.querySelectorAll('.lnb-item').forEach(function(a) {
            if (a.getAttribute('href') === page + '.html') a.classList.add('active');
        });
    }
};

/* ---- 공통 페이지네이션 렌더 ---- */
window.renderPagination = function(containerId, totalCount, currentPage, pageSize, callback) {
    pageSize = pageSize || 20;
    var totalPages = Math.ceil(totalCount / pageSize) || 1;
    var blockSize = 10;
    var blockStart = Math.floor((currentPage - 1) / blockSize) * blockSize + 1;
    var blockEnd = Math.min(blockStart + blockSize - 1, totalPages);

    var html = '<div class="pag-wrap">' +
        '<div class="pag-info">총 <strong>' + totalCount.toLocaleString() + '</strong>건 | 현재 페이지 : <strong>' + currentPage + ' / ' + totalPages + '</strong></div>';

    if (totalPages > 1) {
        html += '<nav class="pag-nav">';
        if (blockStart > 1) {
            html += '<button class="pag-btn" onclick="' + callback + '(1)">&laquo;</button>';
            html += '<button class="pag-btn" onclick="' + callback + '(' + (blockStart - 1) + ')">&lt;</button>';
        }
        for (var p = blockStart; p <= blockEnd; p++) {
            html += '<button class="pag-btn' + (p === currentPage ? ' active' : '') + '" onclick="' + callback + '(' + p + ')">' + p + '</button>';
        }
        if (blockEnd < totalPages) {
            html += '<button class="pag-btn" onclick="' + callback + '(' + (blockEnd + 1) + ')">&gt;</button>';
            html += '<button class="pag-btn" onclick="' + callback + '(' + totalPages + ')">&raquo;</button>';
        }
        html += '</nav>';
    }
    html += '</div>';
    document.getElementById(containerId).innerHTML = html;
};
