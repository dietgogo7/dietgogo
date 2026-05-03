const ReportViewPage = (() => {
  let mockData = [];
  let currentPage = 1;
  const PAGE_SIZE = 10;

  const CATEGORIES = ['의류','의류','잡화','잡화','뷰티','뷰티','식품','식품','전자','전자'];
  const CHANNELS   = ['온라인','오프라인','온라인','오프라인','온라인','오프라인','온라인','오프라인','온라인','오프라인'];
  const STATUSES   = ['정상','정상','정상','정상','정상','정상','정상','정상','경고','경고'];

  function generateMockRows(count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const cat   = CATEGORIES[i % 10];
      const ch    = CHANNELS[i % 10];
      const qty   = Math.floor(Math.random() * 1200) + 100;
      const order = Math.floor(qty * 0.9);
      const sales = qty * (Math.floor(Math.random() * 20000) + 5000);
      const disc  = Math.floor(sales * 0.08);
      const net   = sales - disc;
      const avg   = Math.floor(sales / qty);
      const code  = 'P' + String(Math.floor(i / 2) + 10001).slice(1);
      const names = ['프리미엄 티셔츠','데님 팬츠','후드 스웨트셔츠','백팩','스킨케어 세트','선크림','프로틴 바','그래놀라','무선 이어폰','스마트 워치'];
      rows.push({
        date: '2025-05-' + String(31 - (i % 12)).padStart(2,'0'),
        category: cat, channel: ch,
        code, name: names[i % 10],
        order, qty, sales, disc, net, avg,
        status: STATUSES[i % 10]
      });
    }
    return rows;
  }

  function init() {
    const today = AX.today();
    const from  = AX.daysAgo(30);
    $('#dateFrom').val(from);
    $('#dateTo').val(today);

    AX.loadJSON('executions.json').done(renderExecPanel);

    bindEvents();
    updateSettingsPanel();
  }

  function bindEvents() {
    $('#btnRun').on('click', runQuery);
    $('#btnExcel').on('click', () => AX.toast('엑셀 파일이 다운로드됩니다. (프로토타입)', 'success'));
    $('#btnKimi').on('click', () => AX.openModal('kimiModal'));
    $('#btnSchedule').on('click', () => window.location.href = 'schedule.html');
    $('#btnResetSetting').on('click', resetFilters);
    $('#filterAgg, #filterCategory, #filterChannel, #filterStatus').on('change', updateSettingsPanel);
    $('#dateFrom, #dateTo').on('change', updateSettingsPanel);
  }

  function resetFilters() {
    $('#dateFrom').val(AX.daysAgo(30));
    $('#dateTo').val(AX.today());
    $('#filterAgg').val('일');
    $('#filterCategory, #filterChannel, #filterStatus').val('');
    updateSettingsPanel();
  }

  function updateSettingsPanel() {
    const from = $('#dateFrom').val();
    const to   = $('#dateTo').val();
    $('#settingPeriod').text(from && to ? from + ' ~ ' + to : '-');
    $('#settingAgg').text($('#filterAgg').val() || '-');
    $('#settingCategory').text($('#filterCategory').val() || '전체');
    $('#settingChannel').text($('#filterChannel').val() || '전체');
    $('#settingStatus').text($('#filterStatus').val() || '전체');
  }

  function runQuery() {
    const $btn = $('#btnRun').prop('disabled', true).html('<i class="bi bi-hourglass-split"></i> 조회 중...');
    setTimeout(() => {
      mockData = generateMockRows(127);
      currentPage = 1;

      $('#totalCount').text(AX.comma(mockData.length) + ' 건');
      const totalSales = mockData.reduce((s, r) => s + r.sales, 0);
      const avgPrice   = Math.floor(totalSales / mockData.reduce((s, r) => s + r.qty, 0));
      $('#totalSales').text(AX.comma(totalSales) + ' 원');
      $('#avgPrice').text(AX.comma(avgPrice) + ' 원');
      $('#queryTime').text('2025-06-01 09:30:12');

      renderTable();
      $btn.prop('disabled', false).html('<i class="bi bi-play-fill"></i> 조회 실행');
      AX.toast('조회가 완료되었습니다.', 'success');
    }, 800);
  }

  function renderTable() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const paged = mockData.slice(start, start + PAGE_SIZE);

    const rows = paged.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.category}</td>
        <td>${r.channel}</td>
        <td><code style="font-size:11.5px;background:#f1f5f9;padding:1px 5px;border-radius:3px">${r.code}</code></td>
        <td>${r.name}</td>
        <td class="right">${AX.comma(r.order)}</td>
        <td class="right">${AX.comma(r.qty)}</td>
        <td class="right">${AX.comma(r.sales)}</td>
        <td class="right">${AX.comma(r.disc)}</td>
        <td class="right">${AX.comma(r.net)}</td>
        <td class="right">${AX.comma(r.avg)}</td>
        <td class="center">${AX.statusBadge(r.status)}</td>
      </tr>`).join('');

    $('#reportTbody').html(rows);
    $('#tableFooterCount').text('총 ' + AX.comma(mockData.length) + ' 건');

    AX.buildPagination($('#reportPagination'), mockData.length, currentPage, PAGE_SIZE, p => {
      currentPage = p;
      renderTable();
    });
  }

  function renderExecPanel(execs) {
    const html = execs.slice(0, 5).map(e => {
      const ok = e.status === '성공';
      return `<div class="exec-history-item">
        <span class="exec-dot ${ok ? 'success' : 'fail'}"></span>
        <div style="flex:1">
          <div style="font-size:12px;color:var(--text-primary)">${e.executedAt.slice(5,16)}</div>
          <div class="exec-by">(${e.executedBy})</div>
        </div>
        ${AX.statusBadge(e.status)}
      </div>`;
    }).join('');
    $('#execHistPanel').html(html);
  }

  return { init };
})();
