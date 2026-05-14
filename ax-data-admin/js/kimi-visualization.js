(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var reportId = params.get('id') || 'rpt001';

  App.renderLayout({
    title: 'Kimi 2.6 시각화',
    subtitle: '조회 결과 데이터를 기반으로 AI 요약과 차트 시각화를 생성합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '리포트 조회', url: 'report-view.html?id=' + reportId },
      { label: 'Kimi 시각화' }
    ],
    headerActions: '<button class="btn btn-outline btn-sm" onclick="window.downloadVisualization()">' + Icons.download + ' 다운로드</button>' +
      '<button class="btn btn-outline btn-sm" onclick="window.location.href=\'report-view.html?id=' + reportId + '\'">' + Icons.refresh + ' 다시 조회</button>'
  });

  Promise.all([
    App.loadJSON('data/reports.json'),
    App.loadJSON('data/report-result.json')
  ]).then(function (results) {
    var reportsData = results[0];
    var resultData = results[1];
    if (!reportsData || !resultData) return;

    var report = reportsData.reports.find(function (r) { return r.id === reportId; }) || reportsData.reports[0];
    renderVisualization(report, resultData);
  });

  function renderVisualization(report, resultData) {
    var body = document.getElementById('page-body');
    if (!body) return;

    var data = resultData.data;
    var totalSales = 0, totalOrders = 0;
    data.forEach(function (r) { totalSales += r.sales; totalOrders += r.orders; });

    // Aggregates by category
    var catMap = {};
    data.forEach(function (r) {
      if (!catMap[r.category]) catMap[r.category] = { sales: 0, orders: 0 };
      catMap[r.category].sales += r.sales;
      catMap[r.category].orders += r.orders;
    });
    var categories = Object.keys(catMap);

    // Aggregates by channel
    var chMap = {};
    data.forEach(function (r) {
      if (!chMap[r.channel]) chMap[r.channel] = { sales: 0, orders: 0 };
      chMap[r.channel].sales += r.sales;
      chMap[r.channel].orders += r.orders;
    });
    var channels = Object.keys(chMap);

    // Aggregates by date
    var dateMap = {};
    data.forEach(function (r) {
      if (!dateMap[r.date]) dateMap[r.date] = 0;
      dateMap[r.date] += r.sales;
    });
    var dates = Object.keys(dateMap).sort();

    var html = '';

    // Context info
    html += '<div class="card mb-4">';
    html += '<div class="card-content">';
    html += '<div class="flex gap-6 flex-wrap text-sm">';
    html += '<div><span class="text-muted">리포트:</span> <span class="font-medium">' + report.name + '</span></div>';
    html += '<div><span class="text-muted">조회 기간:</span> 2026-05-01 ~ 2026-05-05</div>';
    html += '<div><span class="text-muted">결과 건수:</span> ' + data.length + '건</div>';
    html += '<div><span class="text-muted">마스킹:</span> ' + App.renderBadge('적용됨', 'success') + '</div>';
    html += '<div><span class="text-muted">JSON Schema:</span> ' + App.renderBadge('검증 통과', 'success') + '</div>';
    html += '</div></div></div>';

    // AI Summary
    html += '<div class="card mb-4">';
    html += '<div class="card-header"><span class="card-title">' + Icons.sparkles + ' AI 요약</span></div>';
    html += '<div class="card-content">';
    html += '<div class="alert alert-info mb-4">';
    html += '<span class="alert-icon">' + Icons.sparkles + '</span>';
    html += '<div>';
    html += '<p class="font-medium mb-2">분석 요약</p>';
    html += '<p class="text-sm" style="line-height:1.7;">';
    html += '조회 기간(5/1~5/5) 총 매출은 <strong>' + App.formatNumber(totalSales) + '원</strong>이며, ';
    html += '총 주문 건수는 <strong>' + App.formatNumber(totalOrders) + '건</strong>입니다. ';
    html += '카테고리별로는 ';
    var sortedCats = categories.sort(function (a, b) { return catMap[b].sales - catMap[a].sales; });
    html += '<strong>' + sortedCats[0] + '</strong>이 가장 높은 매출을 기록했으며, ';
    html += '채널별로는 <strong>온라인</strong> 채널이 전체 매출의 과반을 차지합니다. ';
    html += '반품률은 의류 카테고리에서 평균 대비 높은 수준을 보이고 있어 모니터링이 필요합니다.';
    html += '</p></div></div>';
    html += '</div></div>';

    // Insight cards
    html += '<div class="grid grid-cols-4 gap-4 mb-4">';
    html += App.renderStatCard('총 매출', App.formatNumber(totalSales) + '원', 8.3, 'barChart');
    html += App.renderStatCard('총 주문수', App.formatNumber(totalOrders) + '건', 5.1, 'fileText');
    html += App.renderStatCard('평균 객단가', App.formatNumber(Math.round(totalSales / totalOrders)) + '원', -1.2, 'barChart');
    html += App.renderStatCard('평균 반품률', '2.5%', -0.3, 'alertCircle');
    html += '</div>';

    // Charts row
    html += '<div class="grid grid-cols-2 gap-4 mb-4">';

    // Category donut chart (simulated with CSS)
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">카테고리별 매출 비중</span></div>';
    html += '<div class="card-content">';
    html += '<div class="flex gap-6 items-center">';
    html += '<div class="chart-container" style="min-height:180px;flex:0 0 180px;">';
    html += renderDonutChart(categories.map(function (c) { return { label: c, value: catMap[c].sales }; }));
    html += '</div>';
    html += '<div class="flex-1">';
    var chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    categories.forEach(function (cat, i) {
      var pct = ((catMap[cat].sales / totalSales) * 100).toFixed(1);
      html += '<div class="flex items-center gap-2 mb-2">';
      html += '<span style="width:12px;height:12px;border-radius:2px;background:' + chartColors[i % chartColors.length] + ';flex-shrink:0;"></span>';
      html += '<span class="text-sm flex-1">' + cat + '</span>';
      html += '<span class="text-sm font-medium">' + pct + '%</span>';
      html += '</div>';
    });
    html += '</div></div>';
    html += '</div></div>';

    // Daily trend chart (bar chart simulated)
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">일별 매출 추이</span></div>';
    html += '<div class="card-content">';
    html += renderBarChart(dates.map(function (d) { return { label: d.substring(5), value: dateMap[d] }; }));
    html += '</div></div>';

    html += '</div>';

    // Channel breakdown
    html += '<div class="card mb-4">';
    html += '<div class="card-header"><span class="card-title">채널별 실적</span></div>';
    html += '<div class="card-content">';
    html += '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
    html += '<th>채널</th><th>매출액</th><th>주문수</th><th>객단가</th><th>매출 비중</th>';
    html += '</tr></thead><tbody>';
    channels.forEach(function (ch) {
      var pct = ((chMap[ch].sales / totalSales) * 100).toFixed(1);
      html += '<tr>';
      html += '<td class="font-medium">' + ch + '</td>';
      html += '<td>' + App.formatNumber(chMap[ch].sales) + '원</td>';
      html += '<td>' + App.formatNumber(chMap[ch].orders) + '</td>';
      html += '<td>' + App.formatNumber(Math.round(chMap[ch].sales / chMap[ch].orders)) + '원</td>';
      html += '<td><div class="flex items-center gap-2"><div class="progress-bar" style="width:100px;"><div class="progress-bar-fill" style="width:' + pct + '%;"></div></div><span class="text-sm">' + pct + '%</span></div></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div></div>';

    // Warnings
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">' + Icons.alertCircle + ' 경고 및 이상징후</span></div>';
    html += '<div class="card-content">';
    html += '<div class="alert alert-warning mb-2"><span class="alert-icon">' + Icons.alertCircle + '</span><div><span class="font-medium">높은 반품률:</span> 의류 카테고리의 반품률이 4.5%로 평균(2.5%) 대비 80% 높습니다.</div></div>';
    html += '<div class="alert alert-info"><span class="alert-icon">' + Icons.alertCircle + '</span><div><span class="font-medium">매출 급증:</span> 5/3 가전 카테고리에서 전일 대비 56% 매출 증가가 감지되었습니다.</div></div>';
    html += '</div></div>';

    body.innerHTML = html;
  }

  function renderDonutChart(items) {
    var total = items.reduce(function (s, i) { return s + i.value; }, 0);
    var colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    var segments = [];
    var cumulative = 0;

    items.forEach(function (item, i) {
      var pct = (item.value / total) * 100;
      segments.push(colors[i % colors.length] + ' ' + cumulative + '% ' + (cumulative + pct) + '%');
      cumulative += pct;
    });

    return '<div style="width:160px;height:160px;border-radius:50%;background:conic-gradient(' + segments.join(', ') + ');position:relative;margin:auto;">' +
      '<div style="position:absolute;inset:35px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;flex-direction:column;">' +
        '<span class="text-xs text-muted">총 매출</span>' +
        '<span class="font-semibold text-sm">' + App.formatNumber(Math.round(total / 100000000)) + '억</span>' +
      '</div></div>';
  }

  function renderBarChart(items) {
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }));

    var html = '<div style="display:flex;align-items:flex-end;gap:8px;height:180px;padding-top:8px;">';
    items.forEach(function (item, i) {
      var pct = (item.value / max) * 100;
      var colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">';
      html += '<span class="text-xs text-muted">' + App.formatNumber(Math.round(item.value / 1000000)) + 'M</span>';
      html += '<div style="flex:1;width:100%;display:flex;align-items:flex-end;">';
      html += '<div style="width:100%;height:' + pct + '%;background:' + colors[i % colors.length] + ';border-radius:4px 4px 0 0;min-height:4px;transition:height 0.3s;"></div>';
      html += '</div>';
      html += '<span class="text-xs text-muted">' + item.label + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  window.downloadVisualization = function () {
    App.showToast('시각화 결과 다운로드를 시작합니다.', 'success');
  };
})();
