(function () {
  'use strict';

  App.renderLayout({
    title: '스케줄 리포트',
    subtitle: '정기 리포트 자동 실행 및 메일 발송 스케줄을 관리합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '스케줄 리포트' }
    ],
    headerActions: '<button class="btn btn-primary btn-sm" onclick="window.openScheduleModal()">' + Icons.plus + ' 스케줄 등록</button>'
  });

  var scheduleData = null;
  var allReports = [];
  var editingSchedule = null;

  Promise.all([
    App.loadJSON('data/schedules.json'),
    App.loadJSON('data/reports.json')
  ]).then(function (results) {
    if (!results[0]) return;
    scheduleData = results[0];
    allReports = (results[1] && results[1].reports) ? results[1].reports.filter(function (r) { return r.schedulable && r.status === 'active'; }) : [];
    renderPage();
  });

  function renderPage() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '';

    // Schedule list
    html += '<div class="card mb-4">';
    html += '<div class="card-header"><span class="card-title">스케줄 목록</span></div>';
    html += '<div class="card-content"><div id="schedule-table"></div></div>';
    html += '</div>';

    // Send history
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">최근 발송 이력</span></div>';
    html += '<div class="card-content"><div id="history-table"></div></div>';
    html += '</div>';

    // Schedule modal
    html += renderScheduleModal();

    body.innerHTML = html;

    renderScheduleTable();
    renderHistoryTable();
  }

  function renderScheduleTable() {
    var freqMap = { daily: '매일', weekly: '매주', monthly: '매월', quarterly: '분기', yearly: '연간' };

    App.renderDataTable({
      containerId: 'schedule-table',
      columns: [
        { key: 'name', label: '스케줄명', sortable: true, render: function (v) { return '<span class="font-medium">' + v + '</span>'; } },
        { key: 'reportName', label: '대상 리포트', sortable: true },
        { key: 'frequency', label: '발송 주기', sortable: true, width: '90px', render: function (v) { return freqMap[v] || v; } },
        { key: 'time', label: '발송 시간', width: '90px' },
        { key: 'attachmentFormat', label: '첨부 형식', width: '90px', render: function (v) { return App.renderBadge(v, 'outline'); } },
        { key: 'includeAISummary', label: 'AI 요약', width: '80px', render: function (v) { return v ? App.renderBadge('포함', 'default') : App.renderBadge('미포함', 'secondary'); } },
        { key: 'recipients', label: '수신자', width: '80px', render: function (v) { return v ? v.length + '명' : '-'; } },
        { key: 'status', label: '상태', sortable: true, width: '80px', render: function (v) { return App.renderStatusBadge(v); } },
        { key: 'lastSentStatus', label: '최근 발송', width: '80px', render: function (v) { return v ? App.renderStatusBadge(v) : '-'; } },
        { key: 'id', label: '', width: '100px', render: function (v, row, idx) {
          return '<div class="cell-actions">' +
            '<button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-row="' + idx + '" title="수정">' + Icons.edit + '</button>' +
            '<button class="btn btn-ghost btn-icon btn-sm" data-action="delete" data-row="' + idx + '" title="삭제">' + Icons.trash + '</button>' +
          '</div>';
        }}
      ],
      data: scheduleData.schedules,
      pageSize: 10,
      searchable: true,
      onAction: function (action, row) {
        if (action === 'edit') {
          window.openScheduleModal(row);
        } else if (action === 'delete') {
          if (confirm('\'' + row.name + '\' 스케줄을 삭제하시겠습니까?')) {
            App.showToast('스케줄이 삭제되었습니다.', 'success');
          }
        }
      }
    });
  }

  function renderHistoryTable() {
    var scheduleMap = {};
    scheduleData.schedules.forEach(function (s) { scheduleMap[s.id] = s.name; });

    App.renderDataTable({
      containerId: 'history-table',
      columns: [
        { key: 'scheduleId', label: '스케줄명', sortable: true, render: function (v) { return scheduleMap[v] || v; } },
        { key: 'sentAt', label: '발송 시간', sortable: true, render: function (v) { return App.formatDateTime(v); } },
        { key: 'recipientCount', label: '수신자', width: '80px', render: function (v) { return v + '명'; } },
        { key: 'status', label: '결과', sortable: true, width: '80px', render: function (v) { return App.renderStatusBadge(v); } },
        { key: 'attachment', label: '첨부 파일', render: function (v) { return v ? '<span class="text-sm">' + Icons.fileText + ' ' + v + '</span>' : '<span class="text-muted">-</span>'; } },
        { key: 'error', label: '오류', render: function (v) { return v ? '<span class="text-sm" style="color:var(--destructive);">' + v + '</span>' : '-'; } }
      ],
      data: scheduleData.sendHistory,
      pageSize: 5,
      searchable: false
    });
  }

  function renderScheduleModal() {
    var html = '<div class="modal-overlay" id="scheduleModal">';
    html += '<div class="modal" style="max-width:600px;">';
    html += '<div class="modal-header"><h3 id="modalTitle">스케줄 등록</h3><button class="modal-close" onclick="App.closeModal(\'scheduleModal\')">' + Icons.x + '</button></div>';
    html += '<div class="modal-body">';

    html += '<div class="form-group mb-4"><label class="form-label">스케줄명</label><input type="text" class="form-input" id="schName" placeholder="스케줄명을 입력하세요"></div>';

    html += '<div class="form-group mb-4"><label class="form-label">대상 리포트</label>';
    html += '<select class="form-select" id="schReport"><option value="">리포트 선택</option>';
    allReports.forEach(function (r) {
      html += '<option value="' + r.id + '">' + r.name + '</option>';
    });
    html += '</select></div>';

    html += '<div class="form-row mb-4">';
    html += '<div class="form-group"><label class="form-label">발송 주기</label>';
    html += '<select class="form-select" id="schFreq"><option value="daily">매일</option><option value="weekly">매주</option><option value="monthly">매월</option><option value="quarterly">분기</option></select></div>';
    html += '<div class="form-group"><label class="form-label">발송 시간</label><input type="time" class="form-input" id="schTime" value="08:00"></div>';
    html += '</div>';

    html += '<div class="form-row mb-4">';
    html += '<div class="form-group"><label class="form-label">발송 요일 (주간)</label>';
    html += '<select class="form-select" id="schDay"><option value="Monday">월요일</option><option value="Tuesday">화요일</option><option value="Wednesday">수요일</option><option value="Thursday">목요일</option><option value="Friday">금요일</option></select></div>';
    html += '<div class="form-group"><label class="form-label">조회 기간</label>';
    html += '<select class="form-select" id="schPeriod"><option value="last7days">최근 7일</option><option value="lastWeek">전주</option><option value="lastMonth">전월</option><option value="lastQuarter">전분기</option></select></div>';
    html += '</div>';

    html += '<div class="form-row mb-4">';
    html += '<div class="form-group"><label class="form-label">첨부 형식</label>';
    html += '<select class="form-select" id="schFormat"><option value="Excel">Excel</option><option value="PDF">PDF</option><option value="CSV">CSV</option></select></div>';
    html += '<div class="form-group"><label class="form-label">AI 요약 포함</label>';
    html += '<div style="padding-top:0.375rem;"><label class="toggle"><input type="checkbox" id="schAI" checked><span class="toggle-slider"></span></label></div></div>';
    html += '</div>';

    html += '<div class="form-group mb-4"><label class="form-label">메일 제목</label><input type="text" class="form-input" id="schSubject" placeholder="[AX Data] 리포트 제목"></div>';

    html += '<div class="form-group mb-4"><label class="form-label">수신자 (쉼표 구분)</label>';
    html += '<input type="text" class="form-input" id="schRecipients" placeholder="user1@axdata.com, user2@axdata.com"></div>';

    html += '</div>';
    html += '<div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal(\'scheduleModal\')">취소</button><button class="btn btn-primary" id="schSaveBtn" onclick="window.saveSchedule()">등록</button></div>';
    html += '</div></div>';
    return html;
  }

  window.openScheduleModal = function (schedule) {
    editingSchedule = schedule || null;
    var isEdit = !!editingSchedule;

    document.getElementById('modalTitle').textContent = isEdit ? '스케줄 수정' : '스케줄 등록';
    document.getElementById('schSaveBtn').textContent = isEdit ? '저장' : '등록';

    if (isEdit) {
      document.getElementById('schName').value = editingSchedule.name || '';
      document.getElementById('schReport').value = editingSchedule.reportId || '';
      document.getElementById('schFreq').value = editingSchedule.frequency || 'daily';
      document.getElementById('schTime').value = editingSchedule.time || '08:00';
      if (editingSchedule.dayOfWeek) document.getElementById('schDay').value = editingSchedule.dayOfWeek;
      document.getElementById('schPeriod').value = editingSchedule.periodType || 'last7days';
      document.getElementById('schFormat').value = editingSchedule.attachmentFormat || 'Excel';
      document.getElementById('schAI').checked = !!editingSchedule.includeAISummary;
      document.getElementById('schSubject').value = editingSchedule.mailSubject || '';
      document.getElementById('schRecipients').value = (editingSchedule.recipients || []).join(', ');
    } else {
      document.getElementById('schName').value = '';
      document.getElementById('schReport').value = '';
      document.getElementById('schFreq').value = 'daily';
      document.getElementById('schTime').value = '08:00';
      document.getElementById('schPeriod').value = 'last7days';
      document.getElementById('schFormat').value = 'Excel';
      document.getElementById('schAI').checked = true;
      document.getElementById('schSubject').value = '';
      document.getElementById('schRecipients').value = '';
    }

    App.openModal('scheduleModal');
  };

  window.saveSchedule = function () {
    var name = document.getElementById('schName').value.trim();
    if (!name) { App.showToast('스케줄명을 입력해주세요.', 'warning'); return; }
    var report = document.getElementById('schReport').value;
    if (!report) { App.showToast('대상 리포트를 선택해주세요.', 'warning'); return; }
    App.closeModal('scheduleModal');
    App.showToast('\'' + name + '\' 스케줄이 ' + (editingSchedule ? '수정' : '등록') + '되었습니다.', 'success');
    editingSchedule = null;
  };
})();
