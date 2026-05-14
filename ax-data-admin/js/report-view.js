(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var reportId = params.get('id') || 'rpt001';

  App.renderLayout({
    title: '리포트 조회',
    subtitle: '조회 조건을 입력하고 데이터를 확인할 수 있습니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '리포트 카탈로그', url: 'report-catalog.html' },
      { label: '리포트 조회' }
    ],
    headerActions: '<button class="btn btn-outline btn-sm" onclick="window.exportExcel()">' + Icons.download + ' 엑셀 다운로드</button>' +
      '<button class="btn btn-outline btn-sm" onclick="window.openKimi()">' + Icons.sparkles + ' 시각화</button>' +
      '<button class="btn btn-outline btn-sm" onclick="window.location.href=\'schedule-report.html\'">' + Icons.calendar + ' 스케줄</button>'
  });

  Promise.all([
    App.loadJSON('data/reports.json'),
    App.loadJSON('data/report-result.json')
  ]).then(function (results) {
    var reportsData = results[0];
    var resultData = results[1];
    if (!reportsData || !resultData) return;

    var report = reportsData.reports.find(function (r) { return r.id === reportId; });
    if (!report) report = reportsData.reports[0];

    renderReportView(report, resultData);
  });

  function renderReportView(report, resultData) {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '';

    // Report info + query conditions
    html += '<div class="grid grid-cols-4 gap-4 mb-4" style="grid-template-columns: 3fr 1fr;">';

    // Left: Query form
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">' + Icons.search + ' 조회 조건</span></div>';
    html += '<div class="card-content">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label class="form-label">시작일</label><input type="date" class="form-input" id="startDate" value="2026-05-01"></div>';
    html += '<div class="form-group"><label class="form-label">종료일</label><input type="date" class="form-input" id="endDate" value="2026-05-05"></div>';
    html += '<div class="form-group"><label class="form-label">카테고리</label>';
    html += '<select class="form-select" id="qCategory"><option value="">전체</option><option value="소설/시/희곡">소설/시/희곡</option><option value="경제경영">경제경영</option><option value="자기계발">자기계발</option><option value="어린이/청소년">어린이/청소년</option><option value="IT/컴퓨터">IT/컴퓨터</option><option value="만화">만화</option><option value="건강/취미">건강/취미</option></select></div>';
    html += '<div class="form-group"><label class="form-label">채널</label>';
    html += '<select class="form-select" id="qChannel"><option value="">전체</option><option value="PC웹">PC웹</option><option value="모바일앱">모바일앱</option><option value="오프라인">오프라인</option><option value="제휴몰">제휴몰</option></select></div>';
    html += '</div>';
    html += '<div style="margin-top:0.75rem;">';
    html += '<button class="btn btn-primary" id="btnQuery">' + Icons.play + ' 조회</button>';
    html += '<button class="btn btn-outline" style="margin-left:0.5rem;" onclick="window.resetQuery()">' + Icons.refresh + ' 초기화</button>';
    html += '</div>';
    html += '</div></div>';

    // Right: Report meta & current settings
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">리포트 정보</span></div>';
    html += '<div class="card-content" style="font-size:0.8125rem;">';
    html += '<div class="flex justify-between py-2 border-b"><span class="text-muted">리포트명</span><span class="font-medium">' + report.name + '</span></div>';
    html += '<div class="flex justify-between py-2 border-b"><span class="text-muted">데이터소스</span><span>' + App.renderBadge(report.dataSource, report.dataSource === 'SP' ? 'default' : 'secondary') + '</span></div>';
    html += '<div class="flex justify-between py-2 border-b"><span class="text-muted">담당자</span><span>' + report.owner + '</span></div>';
    html += '<div class="flex justify-between py-2 border-b"><span class="text-muted">시각화</span><span>' + (report.visualizable ? Icons.check : Icons.x) + '</span></div>';
    html += '<div class="flex justify-between py-2"><span class="text-muted">스케줄</span><span>' + (report.schedulable ? Icons.check : Icons.x) + '</span></div>';
    html += '</div></div>';

    html += '</div>';

    // Summary stat cards (initially hidden)
    html += '<div id="resultSummary" style="display:none;" class="mb-4"></div>';

    // Result table
    html += '<div class="card" id="resultCard" style="display:none;">';
    html += '<div class="card-header"><span class="card-title">조회 결과</span><span class="text-muted text-sm" id="resultCount"></span></div>';
    html += '<div class="card-content"><div id="result-table"></div></div>';
    html += '</div>';

    // Execution history
    html += '<div class="card mt-4">';
    html += '<div class="card-header"><span class="card-title">최근 실행 이력</span></div>';
    html += '<div class="card-content">';
    html += '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
    html += '<th>조회 조건</th><th>실행 시간</th><th>결과</th>';
    html += '</tr></thead><tbody>';
    html += '<tr><td class="text-sm">2026-05-01 ~ 2026-05-05 / 전체 / 전체</td><td class="text-muted text-sm">2026-05-14 09:30</td><td>' + App.renderStatusBadge('success') + '</td></tr>';
    html += '<tr><td class="text-sm">2026-04-01 ~ 2026-04-30 / 전자기기 / 온라인</td><td class="text-muted text-sm">2026-05-13 14:10</td><td>' + App.renderStatusBadge('success') + '</td></tr>';
    html += '<tr><td class="text-sm">2026-04-15 ~ 2026-04-21 / 전체 / 모바일</td><td class="text-muted text-sm">2026-05-12 11:20</td><td>' + App.renderStatusBadge('failed') + '</td></tr>';
    html += '</tbody></table></div>';
    html += '</div></div>';

    // Kimi visualization overlay
    html += '<div class="kimi-overlay" id="kimiOverlay" onclick="if(event.target===this)window.closeKimi()">';
    html += '<div class="kimi-panel" id="kimiPanel">';
    html += '<div class="kimi-panel-header">';
    html += '<span style="display:flex;align-items:center;gap:0.5rem;">' + Icons.sparkles + ' <strong>Kimi 2.6 AI 시각화</strong></span>';
    html += '<button class="modal-close" onclick="window.closeKimi()">' + Icons.x + '</button>';
    html += '</div>';
    html += '<div class="kimi-panel-body">';
    html += '<div class="card mb-4"><div class="card-content">';
    html += '<p class="text-sm text-muted mb-1">현재 조회된 데이터를 AI가 분석하여 요약, 인사이트, 차트를 자동으로 생성합니다.</p>';
    html += '<button class="btn btn-primary mt-3" id="kimiRunBtn" onclick="window.kimiGenerate()">' + Icons.sparkles + ' AI 분석 시작</button>';
    html += '</div></div>';
    html += '<div id="kimiChartArea"></div>';
    html += '</div></div></div>';

    body.innerHTML = html;

    // Query button
    document.getElementById('btnQuery').addEventListener('click', function () {
      executeQuery(resultData);
    });

    // Auto-execute on load
    executeQuery(resultData);
  }

  function executeQuery(resultData) {
    var category = document.getElementById('qCategory').value;
    var channel = document.getElementById('qChannel').value;

    var filtered = resultData.data.filter(function (row) {
      if (category && row.category !== category) return false;
      if (channel && row.channel !== channel) return false;
      return true;
    });

    // Summary cards
    var totalSales = 0, totalOrders = 0;
    filtered.forEach(function (r) { totalSales += r.sales; totalOrders += r.orders; });
    var avgPrice = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    var summaryEl = document.getElementById('resultSummary');
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = '<div class="grid grid-cols-4 gap-4">' +
      App.renderStatCard('총 매출', App.formatNumber(totalSales) + '원', null, 'barChart') +
      App.renderStatCard('총 주문수', App.formatNumber(totalOrders), null, 'fileText') +
      App.renderStatCard('평균 객단가', App.formatNumber(avgPrice) + '원', null, 'barChart') +
      App.renderStatCard('조회 건수', App.formatNumber(filtered.length), null, 'search') +
    '</div>';

    // Result table
    var resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';
    document.getElementById('resultCount').textContent = filtered.length + '건';

    App.renderDataTable({
      containerId: 'result-table',
      columns: [
        { key: 'date', label: '일자', sortable: true, render: function (v) { return App.formatDate(v); } },
        { key: 'category', label: '카테고리', sortable: true },
        { key: 'channel', label: '채널', sortable: true },
        { key: 'sales', label: '매출액', sortable: true, render: function (v) { return App.formatNumber(v); } },
        { key: 'orders', label: '주문수', sortable: true, render: function (v) { return App.formatNumber(v); } },
        { key: 'qty', label: '판매수량', sortable: true, render: function (v) { return App.formatNumber(v); } },
        { key: 'avgPrice', label: '객단가', sortable: true, render: function (v) { return App.formatNumber(v); } },
        { key: 'returnRate', label: '반품률(%)', sortable: true, render: function (v) { return v + '%'; } }
      ],
      data: filtered,
      pageSize: 10,
      searchable: false
    });

    App.showToast('조회가 완료되었습니다. (' + filtered.length + '건)', 'success');
  }

  window.resetQuery = function () {
    document.getElementById('qCategory').value = '';
    document.getElementById('qChannel').value = '';
    document.getElementById('startDate').value = '2026-05-01';
    document.getElementById('endDate').value = '2026-05-05';
  };

  window.exportExcel = function () {
    App.showToast('엑셀 파일 다운로드를 시작합니다.', 'success');
  };

  window.openKimi = function () {
    var overlay = document.getElementById('kimiOverlay');
    if (overlay) overlay.classList.add('open');
  };

  window.closeKimi = function () {
    var overlay = document.getElementById('kimiOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  window.kimiGenerate = function () {
    var chartArea = document.getElementById('kimiChartArea');
    var btn = document.getElementById('kimiRunBtn');
    if (btn) { btn.disabled = true; btn.textContent = '분석 중…'; }

    // Gather current filtered data for analysis context
    var cat = (document.getElementById('qCategory') || {}).value || '전체';
    var ch = (document.getElementById('qChannel') || {}).value || '전체';

    setTimeout(function () {
      if (btn) { btn.disabled = false; btn.innerHTML = Icons.sparkles + ' AI 재분석'; }

      // ── AI-simulated analysis output ──
      var summaryHtml = '<div class="card mb-4">' +
        '<div class="card-header"><span class="card-title" style="display:flex;align-items:center;gap:0.5rem;">' + Icons.sparkles + ' AI 요약</span></div>' +
        '<div class="card-content">' +
        '<p class="text-sm" style="line-height:1.75;">조회 기간(2026-05-01 ~ 05-05) 동안 <strong>소설/시/희곡</strong> 카테고리가 전체 매출의 약 35%를 차지하며 1위를 기록했습니다. ' +
        '<strong>모바일앱</strong> 채널의 비중이 꾸준히 확대되고 있으며, 5일 평균 대비 5월 5일 매출이 약 8% 상회합니다. ' +
        '반품률은 <strong>어린이/청소년</strong> 카테고리에서 평균 2.8%로 가장 높게 나타나 주의가 필요합니다.</p>' +
        '</div></div>';

      // ── Insights ──
      var insights = [
        { icon: '📈', label: '성장 채널', text: '모바일앱이 전체 주문의 42% 점유 — PC웹 대비 +15%p' },
        { icon: '📚', label: '핵심 카테고리', text: '소설/시/희곡 · 경제경영 2개 카테고리가 매출의 60% 기여' },
        { icon: '⚠️', label: '반품 주의', text: '어린이/청소년 반품률 3.1%(5/4 기준) — 업계 평균 1.5% 대비 2배' },
        { icon: '💡', label: '기회', text: 'IT/컴퓨터 객단가 ₩49,438 — 전체 최고, 수량 확대 여지 있음' }
      ];
      var insightHtml = '<div class="card mb-4">' +
        '<div class="card-header"><span class="card-title">핵심 인사이트</span></div>' +
        '<div class="card-content">' +
        insights.map(function (ins) {
          return '<div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.625rem 0;border-bottom:1px solid var(--border);">' +
            '<span style="font-size:1.25rem;line-height:1;">' + ins.icon + '</span>' +
            '<div><p class="font-medium text-sm">' + ins.label + '</p><p class="text-muted text-sm mt-1">' + ins.text + '</p></div>' +
            '</div>';
        }).join('') +
        '</div></div>';

      // ── Auto chart: category × sales bar ──
      var barData = [
        { label: '소설/시/희곡', val: 88 },
        { label: '경제경영', val: 71 },
        { label: '자기계발', val: 55 },
        { label: '어린이/청소년', val: 48 },
        { label: 'IT/컴퓨터', val: 37 },
        { label: '만화', val: 25 },
        { label: '건강/취미', val: 22 }
      ];
      var colors = ['var(--primary)', 'oklch(0.60 0.18 200)', 'oklch(0.60 0.18 130)', 'oklch(0.60 0.18 60)', 'oklch(0.55 0.18 310)', 'oklch(0.58 0.16 25)', 'oklch(0.62 0.14 160)'];
      var chartHtml = '<div class="card">' +
        '<div class="card-header"><span class="card-title">카테고리별 매출 비중 (자동 추천 차트)</span></div>' +
        '<div class="card-content">' +
        barData.map(function (d, i) {
          return '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.625rem;">' +
            '<span style="width:110px;font-size:0.75rem;text-align:right;white-space:nowrap;">' + d.label + '</span>' +
            '<div style="flex:1;background:var(--muted);border-radius:4px;height:20px;overflow:hidden;">' +
            '<div style="width:' + d.val + '%;background:' + colors[i] + ';height:100%;border-radius:4px;transition:width 0.6s ease;"></div></div>' +
            '<span style="font-size:0.75rem;width:30px;">' + d.val + '%</span>' +
            '</div>';
        }).join('') +
        '<p class="text-muted text-xs mt-3">* Kimi 2.6 AI가 데이터 분포를 분석하여 수평 막대 차트를 자동 선택했습니다.</p>' +
        '</div></div>';

      chartArea.innerHTML = summaryHtml + insightHtml + chartHtml;
      App.showToast('AI 분석이 완료되었습니다.', 'success');
    }, 1200);
  };
})();
