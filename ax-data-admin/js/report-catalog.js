(function () {
  'use strict';

  App.renderLayout({
    title: '리포트 카탈로그',
    subtitle: '접근 가능한 리포트를 검색하고 실행할 수 있습니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '리포트 카탈로그' }
    ]
  });

  App.loadJSON('data/reports.json').then(function (data) {
    if (!data) return;
    renderCatalog(data.reports);
  });

  function renderCatalog(reports) {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '';

    // Filter bar
    html += '<div class="card mb-4">';
    html += '<div class="card-content">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="form-label">본부</label>';
    html += '<select class="form-select" id="filterDept"><option value="">전체</option>';
    var depts = [];
    reports.forEach(function (r) { if (depts.indexOf(r.department) === -1) depts.push(r.department); });
    depts.forEach(function (d) { html += '<option value="' + d + '">' + d + '</option>'; });
    html += '</select></div>';
    html += '<div class="form-group"><label class="form-label">데이터소스</label>';
    html += '<select class="form-select" id="filterDS"><option value="">전체</option><option value="SP">SP</option><option value="API">API</option></select></div>';
    html += '<div class="form-group"><label class="form-label">스케줄 가능</label>';
    html += '<select class="form-select" id="filterSchedule"><option value="">전체</option><option value="true">가능</option><option value="false">불가</option></select></div>';
    html += '<div class="form-group" style="flex:0 0 auto;"><label class="form-label">&nbsp;</label>';
    html += '<button class="btn btn-outline btn-sm" onclick="window.resetFilters()">' + Icons.refresh + ' 초기화</button></div>';
    html += '</div></div></div>';

    // Table container
    html += '<div class="card"><div class="card-content"><div id="report-table"></div></div></div>';
    body.innerHTML = html;

    var table = App.renderDataTable({
      containerId: 'report-table',
      columns: [
        { key: 'name', label: '리포트명', sortable: true, render: function (v) { return '<span class="font-medium">' + v + '</span>'; } },
        { key: 'menuPath', label: '메뉴 경로', sortable: true },
        { key: 'dataSource', label: '소스', sortable: true, width: '80px', render: function (v) { return App.renderBadge(v, v === 'SP' ? 'default' : 'secondary'); } },
        { key: 'defaultPeriod', label: '기본 주기', sortable: true, width: '100px', render: function (v) { var m = { daily: '일간', weekly: '주간', monthly: '월간' }; return m[v] || v; } },
        { key: 'owner', label: '담당자', sortable: true, width: '90px' },
        { key: 'lastModified', label: '수정일', sortable: true, width: '110px', render: function (v) { return App.formatDate(v); } },
        { key: 'status', label: '상태', sortable: true, width: '80px', render: function (v) { return App.renderStatusBadge(v); } },
        { key: 'id', label: '', width: '80px', render: function (v, row, idx) {
          return '<a href="report-view.html?id=' + v + '" class="btn btn-primary btn-sm">' + Icons.play + ' 실행</a>';
        }}
      ],
      data: reports,
      pageSize: 10,
      searchable: true
    });

    // Filter bindings
    function applyFilters() {
      var dept = document.getElementById('filterDept').value;
      var ds = document.getElementById('filterDS').value;
      var sch = document.getElementById('filterSchedule').value;

      var filtered = reports.filter(function (r) {
        if (dept && r.department !== dept) return false;
        if (ds && r.dataSource !== ds) return false;
        if (sch !== '' && String(r.schedulable) !== sch) return false;
        return true;
      });
      table.refresh(filtered);
    }

    document.getElementById('filterDept').addEventListener('change', applyFilters);
    document.getElementById('filterDS').addEventListener('change', applyFilters);
    document.getElementById('filterSchedule').addEventListener('change', applyFilters);

    window.resetFilters = function () {
      document.getElementById('filterDept').value = '';
      document.getElementById('filterDS').value = '';
      document.getElementById('filterSchedule').value = '';
      table.refresh(reports);
    };
  }
})();
