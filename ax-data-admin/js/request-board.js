(function () {
  'use strict';

  App.renderLayout({
    title: '요청사항 게시판',
    subtitle: '해줘 — 시스템 개선 및 기능 요청사항을 등록하고 처리 현황을 확인합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '요청사항 게시판' }
    ],
    headerActions: '<button class="btn btn-primary btn-sm" onclick="window.openRequestModal()">' + Icons.plus + ' 요청 등록</button>'
  });

  var requestsData = [];
  var editingRequest = null;
  var currentFilter = 'all';
  var currentPage = 1;
  var pageSize = 10;

  App.loadJSON('data/requests.json').then(function (data) {
    if (!data) return;
    requestsData = data.requests || [];
    renderPage();
  });

  // ── Status / Priority config ──
  var STATUS = {
    pending:     { label: '대기',   variant: 'warning' },
    'in-progress': { label: '처리중', variant: 'default' },
    completed:   { label: '완료',   variant: 'success' }
  };
  var PRIORITY = {
    high:   { label: '높음', variant: 'destructive' },
    medium: { label: '중간', variant: 'warning' },
    low:    { label: '낮음', variant: 'secondary' }
  };

  function renderPage() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '';

    // ── Summary stat cards ──
    var total    = requestsData.length;
    var pending  = requestsData.filter(function (r) { return r.status === 'pending'; }).length;
    var inProg   = requestsData.filter(function (r) { return r.status === 'in-progress'; }).length;
    var done     = requestsData.filter(function (r) { return r.status === 'completed'; }).length;

    html += '<div class="grid grid-cols-4 gap-4 mb-6">';
    html += App.renderStatCard('전체 요청', String(total), null, 'fileText');
    html += App.renderStatCard('대기', String(pending), null, 'bell');
    html += App.renderStatCard('처리중', String(inProg), null, 'play');
    html += App.renderStatCard('완료', String(done), null, 'check');
    html += '</div>';

    // ── Filter tabs + search ──
    html += '<div class="card mb-4">';
    html += '<div class="card-content" style="padding-bottom:0;">';
    html += '<div class="flex items-center justify-between" style="flex-wrap:wrap;gap:0.75rem;">';

    // Status filter tabs
    html += '<div class="flex gap-1" id="statusTabs">';
    var tabs = [
      { key: 'all',         label: '전체' },
      { key: 'pending',     label: '대기' },
      { key: 'in-progress', label: '처리중' },
      { key: 'completed',   label: '완료' }
    ];
    tabs.forEach(function (t) {
      var active = currentFilter === t.key ? 'btn-primary' : 'btn-ghost';
      html += '<button class="btn btn-sm ' + active + '" data-filter="' + t.key + '">' + t.label + '</button>';
    });
    html += '</div>';

    // Search
    html += '<div style="position:relative;width:260px;">';
    html += '<span style="position:absolute;left:0.625rem;top:50%;transform:translateY(-50%);opacity:0.5;">' + Icons.search + '</span>';
    html += '<input type="text" class="form-input" id="boardSearch" placeholder="제목, 요청자 검색..." style="padding-left:2rem;">';
    html += '</div>';
    html += '</div>';
    html += '</div></div>';

    // ── Board list ──
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">요청 목록</span><span class="text-muted text-sm" id="listCount"></span></div>';
    html += '<div class="card-content" id="board-list"></div>';
    html += '</div>';

    // ── Detail / Edit modal ──
    html += renderModal();

    body.innerHTML = html;

    // Bind tab clicks
    document.getElementById('statusTabs').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      document.querySelectorAll('#statusTabs [data-filter]').forEach(function (b) {
        b.className = 'btn btn-sm ' + (b.dataset.filter === currentFilter ? 'btn-primary' : 'btn-ghost');
      });
      refreshList();
    });

    // Bind search
    var searchTimer;
    document.getElementById('boardSearch').addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { currentPage = 1; refreshList(); }, 200);
    });

    // Bind form submit
    document.getElementById('requestForm').addEventListener('submit', function (e) { e.preventDefault(); window.saveRequest(); });

    refreshList();
  }

  function getFiltered() {
    var q = (document.getElementById('boardSearch') ? document.getElementById('boardSearch').value.toLowerCase() : '');
    return requestsData.filter(function (r) {
      if (currentFilter !== 'all' && r.status !== currentFilter) return false;
      if (q && r.title.toLowerCase().indexOf(q) === -1 && (r.requester || '').toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function refreshList() {
    var filtered = getFiltered();
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    var pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    var countEl = document.getElementById('listCount');
    if (countEl) countEl.textContent = '총 ' + filtered.length + '건';

    var html = '';

    if (!pageItems.length) {
      html += '<div class="empty-state"><p>해당하는 요청사항이 없습니다.</p></div>';
    } else {
      // Table header
      html += '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
      html += '<th style="width:50px;">번호</th>';
      html += '<th>제목</th>';
      html += '<th style="width:80px;">우선순위</th>';
      html += '<th style="width:80px;">상태</th>';
      html += '<th style="width:90px;">요청자</th>';
      html += '<th style="width:110px;">부서</th>';
      html += '<th style="width:95px;">등록일</th>';
      html += '<th style="width:130px;"></th>';
      html += '</tr></thead><tbody>';

      pageItems.forEach(function (req, i) {
        var rowNum = filtered.length - ((currentPage - 1) * pageSize) - i;
        var st = STATUS[req.status] || { label: req.status, variant: 'secondary' };
        var pr = PRIORITY[req.priority] || { label: req.priority, variant: 'secondary' };

        html += '<tr>';
        html += '<td class="text-muted text-sm">' + rowNum + '</td>';
        html += '<td>';
        html += '<span class="font-medium text-sm" style="cursor:pointer;" onclick="window.viewRequest(\'' + req.id + '\')">' + req.title + '</span>';
        if (req.content) html += '<p class="text-muted text-xs mt-1" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px;">' + req.content + '</p>';
        html += '</td>';
        html += '<td>' + App.renderBadge(pr.label, pr.variant) + '</td>';
        html += '<td>' + App.renderBadge(st.label, st.variant) + '</td>';
        html += '<td class="text-sm">' + (req.requester || '-') + '</td>';
        html += '<td class="text-muted text-sm">' + (req.department || '-') + '</td>';
        html += '<td class="text-muted text-sm">' + (req.createdAt || '') + '</td>';
        html += '<td>';
        html += '<div class="cell-actions">';
        // Admin: 처리중 change button (only shown when status is 'pending')
        if (req.status === 'pending') {
          html += '<button class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:0.2rem 0.5rem;" onclick="window.setInProgress(\'' + req.id + '\')" title="처리중으로 변경">' + Icons.play + ' 처리중</button>';
        }
        if (req.status === 'in-progress') {
          html += '<button class="btn btn-ghost btn-sm" style="font-size:0.7rem;padding:0.2rem 0.5rem;" onclick="window.setCompleted(\'' + req.id + '\')" title="완료로 변경">' + Icons.check + ' 완료</button>';
        }
        html += '<button class="btn btn-ghost btn-icon btn-sm" onclick="window.openRequestModal(\'' + req.id + '\')" title="수정">' + Icons.edit + '</button>';
        html += '<button class="btn btn-ghost btn-icon btn-sm" onclick="window.deleteRequest(\'' + req.id + '\')" title="삭제">' + Icons.trash + '</button>';
        html += '</div>';
        html += '</td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';

      // Pagination
      if (totalPages > 1) {
        html += '<div class="pagination">';
        html += '<button class="pagination-btn" ' + (currentPage === 1 ? 'disabled' : 'onclick="window.goPage(' + (currentPage - 1) + ')"') + '>‹ 이전</button>';
        for (var p = 1; p <= totalPages; p++) {
          html += '<button class="pagination-btn' + (p === currentPage ? ' active' : '') + '" onclick="window.goPage(' + p + ')">' + p + '</button>';
        }
        html += '<button class="pagination-btn" ' + (currentPage === totalPages ? 'disabled' : 'onclick="window.goPage(' + (currentPage + 1) + ')"') + '>다음 ›</button>';
        html += '</div>';
      }
    }

    document.getElementById('board-list').innerHTML = html;
  }

  function renderModal() {
    return '<div class="modal-overlay" id="requestModal">' +
      '<div class="modal" style="max-width:580px;">' +
      '<div class="modal-header"><h3 id="requestModalTitle">요청 등록</h3>' +
      '<button class="modal-close" onclick="App.closeModal(\'requestModal\')">' + Icons.x + '</button></div>' +
      '<form id="requestForm"><div class="modal-body">' +

      '<div class="form-group mb-4"><label class="form-label">제목 <span style="color:var(--destructive);">*</span></label>' +
      '<input type="text" class="form-input" id="reqTitle" placeholder="요청 제목을 입력하세요" required></div>' +

      '<div class="form-group mb-4"><label class="form-label">상세 내용</label>' +
      '<textarea class="form-textarea" id="reqContent" rows="5" placeholder="개선이 필요한 내용, 현재 불편한 점, 기대 효과 등을 상세히 작성해 주세요."></textarea></div>' +

      '<div class="form-row mb-4">' +
      '<div class="form-group"><label class="form-label">요청자</label>' +
      '<input type="text" class="form-input" id="reqRequester" placeholder="홍길동"></div>' +
      '<div class="form-group"><label class="form-label">부서</label>' +
      '<input type="text" class="form-input" id="reqDept" placeholder="소속 부서"></div>' +
      '</div>' +

      '<div class="form-row mb-4">' +
      '<div class="form-group"><label class="form-label">우선순위</label>' +
      '<select class="form-select" id="reqPriority">' +
      '<option value="high">높음</option><option value="medium" selected>중간</option><option value="low">낮음</option>' +
      '</select></div>' +
      '<div class="form-group" id="reqStatusGroup"><label class="form-label">상태</label>' +
      '<select class="form-select" id="reqStatus">' +
      '<option value="pending">대기</option><option value="in-progress">처리중</option><option value="completed">완료</option>' +
      '</select></div>' +
      '</div>' +

      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-outline" onclick="App.closeModal(\'requestModal\')">취소</button>' +
      '<button type="submit" class="btn btn-primary" id="reqSaveBtn">등록</button>' +
      '</div></form>' +
      '</div></div>';
  }

  // ── Public actions ──

  window.goPage = function (p) {
    currentPage = p;
    refreshList();
    document.getElementById('board-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.viewRequest = function (id) {
    window.openRequestModal(id);
  };

  window.openRequestModal = function (id) {
    editingRequest = id ? requestsData.find(function (r) { return r.id === id; }) : null;
    var isEdit = !!editingRequest;

    document.getElementById('requestModalTitle').textContent = isEdit ? '요청 수정' : '요청 등록';
    document.getElementById('reqSaveBtn').textContent = isEdit ? '저장' : '등록';
    document.getElementById('reqTitle').value   = isEdit ? editingRequest.title : '';
    document.getElementById('reqContent').value = isEdit ? (editingRequest.content || '') : '';
    document.getElementById('reqRequester').value = isEdit ? (editingRequest.requester || '') : '';
    document.getElementById('reqDept').value      = isEdit ? (editingRequest.department || '') : '';
    document.getElementById('reqPriority').value  = isEdit ? (editingRequest.priority || 'medium') : 'medium';
    document.getElementById('reqStatus').value    = isEdit ? (editingRequest.status || 'pending') : 'pending';

    App.openModal('requestModal');
  };

  window.saveRequest = function () {
    var title = document.getElementById('reqTitle').value.trim();
    if (!title) { App.showToast('제목을 입력해주세요.', 'warning'); return; }
    var isEdit = !!editingRequest;
    var now = App.formatDate(new Date().toISOString().slice(0, 10));

    if (isEdit) {
      editingRequest.title      = title;
      editingRequest.content    = document.getElementById('reqContent').value;
      editingRequest.requester  = document.getElementById('reqRequester').value;
      editingRequest.department = document.getElementById('reqDept').value;
      editingRequest.priority   = document.getElementById('reqPriority').value;
      editingRequest.status     = document.getElementById('reqStatus').value;
      editingRequest.updatedAt  = now;
    } else {
      requestsData.unshift({
        id: 'req' + Date.now(),
        title: title,
        content: document.getElementById('reqContent').value,
        requester: document.getElementById('reqRequester').value,
        department: document.getElementById('reqDept').value,
        priority: document.getElementById('reqPriority').value,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      });
    }

    App.closeModal('requestModal');
    refreshList();
    App.showToast('요청사항이 ' + (isEdit ? '수정' : '등록') + '되었습니다.', 'success');
    editingRequest = null;
  };

  window.setInProgress = function (id) {
    var req = requestsData.find(function (r) { return r.id === id; });
    if (!req) return;
    req.status = 'in-progress';
    req.updatedAt = App.formatDate(new Date().toISOString().slice(0, 10));
    refreshList();
    App.showToast('\'' + req.title.slice(0, 20) + '...\' 상태를 처리중으로 변경했습니다.', 'success');
  };

  window.setCompleted = function (id) {
    var req = requestsData.find(function (r) { return r.id === id; });
    if (!req) return;
    req.status = 'completed';
    req.updatedAt = App.formatDate(new Date().toISOString().slice(0, 10));
    refreshList();
    App.showToast('\'' + req.title.slice(0, 20) + '...\' 상태를 완료로 변경했습니다.', 'success');
  };

  window.deleteRequest = function (id) {
    var req = requestsData.find(function (r) { return r.id === id; });
    if (!req) return;
    if (!confirm('"' + req.title + '"\n\n이 요청사항을 삭제하시겠습니까?')) return;
    requestsData = requestsData.filter(function (r) { return r.id !== id; });
    refreshList();
    App.showToast('요청사항이 삭제되었습니다.', 'success');
  };
})();
