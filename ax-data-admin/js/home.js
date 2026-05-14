(function () {
  'use strict';

  App.renderLayout({
    title: '홈',
    subtitle: '핵심 현황과 자주 사용하는 리포트에 빠르게 접근할 수 있습니다.',
    breadcrumbs: [{ label: '홈' }]
  });

  var dashData = null;
  var requestsData = [];
  var editingRequest = null;

  Promise.all([
    App.loadJSON('data/dashboard-summary.json'),
    App.loadJSON('data/requests.json')
  ]).then(function (results) {
    if (!results[0]) return;
    dashData = results[0];
    requestsData = (results[1] && results[1].requests) ? results[1].requests : [];
    renderDashboard();
  });

  function renderDashboard() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var stats = dashData.stats;
    var html = '';

    // Stat cards
    html += '<div class="grid grid-cols-4 gap-4 mb-6">';
    html += App.renderStatCard('접근 가능 리포트', App.formatNumber(stats.totalReports), null, 'fileText');
    html += App.renderStatCard('최근 실행 수', App.formatNumber(stats.recentExecutions), 12.5, 'play');
    html += App.renderStatCard('최근 다운로드', App.formatNumber(stats.recentDownloads), -3.2, 'download');
    html += App.renderStatCard('미처리 요청', String(requestsData.filter(function (r) { return r.status === 'pending'; }).length), null, 'megaphone');
    html += '</div>';

    // Two-column layout
    html += '<div class="grid grid-cols-2 gap-4">';

    // Recent reports
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">최근 사용 리포트</span></div>';
    html += '<div class="card-content">';
    html += '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
    html += '<th>리포트명</th><th>메뉴 경로</th><th>실행 시간</th><th>상태</th><th></th>';
    html += '</tr></thead><tbody>';
    dashData.recentReports.forEach(function (rpt) {
      html += '<tr>';
      html += '<td class="font-medium">' + rpt.name + '</td>';
      html += '<td class="text-muted">' + rpt.menuPath + '</td>';
      html += '<td class="text-muted text-sm">' + App.formatDateTime(rpt.lastRun) + '</td>';
      html += '<td>' + App.renderStatusBadge(rpt.status) + '</td>';
      html += '<td><a href="report-view.html?id=' + rpt.id + '" class="btn btn-ghost btn-sm">' + Icons.play + '</a></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';

    // Request board
    html += '<div class="card">';
    html += '<div class="card-header">';
    html += '<span class="card-title">해줘 게시판</span>';
    html += '<button class="btn btn-primary btn-sm" onclick="window.openRequestModal()">' + Icons.plus + ' 등록</button>';
    html += '</div>';
    html += '<div class="card-content" id="request-list">';
    html += renderRequestList();
    html += '</div></div>';

    html += '</div>';

    // Execution history
    html += '<div class="card mt-4">';
    html += '<div class="card-header"><span class="card-title">최근 실행 이력</span></div>';
    html += '<div class="card-content">';
    html += '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
    html += '<th>리포트명</th><th>실행자</th><th>실행 시간</th><th>소요 시간</th><th>상태</th>';
    html += '</tr></thead><tbody>';
    dashData.executionHistory.forEach(function (log) {
      html += '<tr>';
      html += '<td class="font-medium">' + log.reportName + '</td>';
      html += '<td>' + log.user + '</td>';
      html += '<td class="text-muted text-sm">' + App.formatDateTime(log.executedAt) + '</td>';
      html += '<td class="text-muted">' + log.duration + '</td>';
      html += '<td>' + App.renderStatusBadge(log.status) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';

    // Request modal
    html += renderRequestModal();

    body.innerHTML = html;

    document.getElementById('requestForm').addEventListener('submit', function (e) { e.preventDefault(); window.saveRequest(); });
  }

  function renderRequestList() {
    if (!requestsData.length) return '<div class="empty-state"><p>등록된 요청사항이 없습니다.</p></div>';
    var statusMap = { pending: { label: '대기', variant: 'warning' }, 'in-progress': { label: '처리중', variant: 'default' }, completed: { label: '완료', variant: 'success' } };
    var priorityMap = { high: { label: '높음', variant: 'destructive' }, medium: { label: '중간', variant: 'warning' }, low: { label: '낮음', variant: 'secondary' } };
    return requestsData.map(function (req) {
      var st = statusMap[req.status] || { label: req.status, variant: 'secondary' };
      var pr = priorityMap[req.priority] || { label: req.priority, variant: 'secondary' };
      return '<div class="request-item" data-id="' + req.id + '">' +
        '<div class="request-item-header">' +
        '<span class="request-title text-sm font-medium flex-1">' + req.title + '</span>' +
        '<div class="flex gap-1 flex-shrink-0">' + App.renderBadge(pr.label, pr.variant) + App.renderBadge(st.label, st.variant) + '</div>' +
        '</div>' +
        '<div class="request-item-meta">' +
        '<span class="text-xs text-muted">' + req.requester + ' · ' + req.department + ' · ' + req.createdAt + '</span>' +
        '<div class="flex gap-1">' +
        '<button class="btn btn-ghost btn-icon btn-sm" onclick="window.openRequestModal(\'' + req.id + '\')" title="수정">' + Icons.edit + '</button>' +
        '<button class="btn btn-ghost btn-icon btn-sm" onclick="window.deleteRequest(\'' + req.id + '\')" title="삭제">' + Icons.trash + '</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function renderRequestModal() {
    return '<div class="modal-overlay" id="requestModal">' +
      '<div class="modal" style="max-width:560px;">' +
      '<div class="modal-header"><h3 id="requestModalTitle">요청사항 등록</h3>' +
      '<button class="modal-close" onclick="App.closeModal(\'requestModal\')">' + Icons.x + '</button></div>' +
      '<form id="requestForm"><div class="modal-body">' +
      '<div class="form-group mb-4"><label class="form-label">제목</label>' +
      '<input type="text" class="form-input" id="reqTitle" placeholder="요청 제목을 입력하세요" required></div>' +
      '<div class="form-group mb-4"><label class="form-label">내용</label>' +
      '<textarea class="form-textarea" id="reqContent" rows="4" placeholder="상세 내용을 입력하세요"></textarea></div>' +
      '<div class="form-row mb-4">' +
      '<div class="form-group"><label class="form-label">요청자</label>' +
      '<input type="text" class="form-input" id="reqRequester" placeholder="홍길동"></div>' +
      '<div class="form-group"><label class="form-label">부서</label>' +
      '<input type="text" class="form-input" id="reqDept" placeholder="소속 부서"></div>' +
      '</div>' +
      '<div class="form-row mb-4">' +
      '<div class="form-group"><label class="form-label">우선순위</label>' +
      '<select class="form-select" id="reqPriority"><option value="high">높음</option><option value="medium" selected>중간</option><option value="low">낮음</option></select></div>' +
      '<div class="form-group"><label class="form-label">상태</label>' +
      '<select class="form-select" id="reqStatus"><option value="pending">대기</option><option value="in-progress">처리중</option><option value="completed">완료</option></select></div>' +
      '</div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-outline" onclick="App.closeModal(\'requestModal\')">취소</button>' +
      '<button type="submit" class="btn btn-primary" id="reqSaveBtn">등록</button>' +
      '</div></form>' +
      '</div></div>';
  }

  window.openRequestModal = function (id) {
    editingRequest = id ? requestsData.find(function (r) { return r.id === id; }) : null;
    var isEdit = !!editingRequest;
    document.getElementById('requestModalTitle').textContent = isEdit ? '요청사항 수정' : '요청사항 등록';
    document.getElementById('reqSaveBtn').textContent = isEdit ? '저장' : '등록';
    document.getElementById('reqTitle').value = isEdit ? editingRequest.title : '';
    document.getElementById('reqContent').value = isEdit ? (editingRequest.content || '') : '';
    document.getElementById('reqRequester').value = isEdit ? editingRequest.requester : '';
    document.getElementById('reqDept').value = isEdit ? editingRequest.department : '';
    document.getElementById('reqPriority').value = isEdit ? editingRequest.priority : 'medium';
    document.getElementById('reqStatus').value = isEdit ? editingRequest.status : 'pending';
    App.openModal('requestModal');
  };

  window.saveRequest = function () {
    var title = document.getElementById('reqTitle').value.trim();
    if (!title) { App.showToast('제목을 입력해주세요.', 'warning'); return; }
    var isEdit = !!editingRequest;
    if (isEdit) {
      editingRequest.title = title;
      editingRequest.content = document.getElementById('reqContent').value;
      editingRequest.requester = document.getElementById('reqRequester').value;
      editingRequest.department = document.getElementById('reqDept').value;
      editingRequest.priority = document.getElementById('reqPriority').value;
      editingRequest.status = document.getElementById('reqStatus').value;
      editingRequest.updatedAt = App.formatDate(new Date().toISOString());
    } else {
      requestsData.unshift({
        id: 'req' + Date.now(),
        title: title,
        content: document.getElementById('reqContent').value,
        requester: document.getElementById('reqRequester').value,
        department: document.getElementById('reqDept').value,
        priority: document.getElementById('reqPriority').value,
        status: document.getElementById('reqStatus').value,
        createdAt: App.formatDate(new Date().toISOString()),
        updatedAt: App.formatDate(new Date().toISOString())
      });
    }
    App.closeModal('requestModal');
    document.getElementById('request-list').innerHTML = renderRequestList();
    App.showToast('요청사항이 ' + (isEdit ? '수정' : '등록') + '되었습니다.', 'success');
    editingRequest = null;
  };

  window.deleteRequest = function (id) {
    var req = requestsData.find(function (r) { return r.id === id; });
    if (!req) return;
    if (!confirm('\'' + req.title + '\'\n\n이 요청사항을 삭제하시겠습니까?')) return;
    requestsData = requestsData.filter(function (r) { return r.id !== id; });
    document.getElementById('request-list').innerHTML = renderRequestList();
    App.showToast('요청사항이 삭제되었습니다.', 'success');
  };
})();
