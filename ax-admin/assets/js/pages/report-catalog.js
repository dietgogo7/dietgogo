const ReportCatalogPage = (() => {
  let allData = [];
  let currentPage = 1;
  let pageSize = 10;

  function init() {
    AX.loadJSON('reports.json').done(data => {
      allData = data;
      bindEvents();
      render();
    }).fail(() => AX.toast('리포트 목록을 불러오지 못했습니다.', 'error'));
  }

  function bindEvents() {
    $('#searchKeyword, #filterDept, #filterDataSource, #filterSchedule').on('input change', () => {
      currentPage = 1;
      render();
    });
    $('#filterReset').on('click', () => {
      $('#searchKeyword').val('');
      $('#filterDept, #filterDataSource, #filterSchedule').val('');
      currentPage = 1;
      render();
    });
    $('#pageSize').on('change', function () {
      pageSize = parseInt($(this).val());
      currentPage = 1;
      render();
    });
  }

  function filter() {
    const kw  = $('#searchKeyword').val().toLowerCase();
    const ds  = $('#filterDataSource').val();
    const sch = $('#filterSchedule').val();

    return allData.filter(r => {
      if (kw  && !r.name.toLowerCase().includes(kw)) return false;
      if (ds  && r.dataSource !== ds) return false;
      if (sch !== '' && String(r.useSchedule) !== sch) return false;
      return true;
    });
  }

  function render() {
    const filtered = filter();
    const total    = filtered.length;
    const start    = (currentPage - 1) * pageSize;
    const paged    = filtered.slice(start, start + pageSize);

    $('#resultCount').text(total);

    if (paged.length === 0) {
      $('#catalogTbody').html('<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="bi bi-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:.35"></i>검색 결과가 없습니다.</td></tr>');
    } else {
      const rows = paged.map(r => `
        <tr>
          <td class="report-name-cell">
            <a href="report-view.html" class="report-name-link">${r.name}</a>
            <div class="menu-path">${r.menuPath}</div>
          </td>
          <td style="font-size:12.5px;color:var(--text-secondary)">${r.menuPath}</td>
          <td><code style="font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:3px">${r.dataSource}</code></td>
          <td>${AX.cycleBadge(r.cycle)}</td>
          <td>${r.owner}</td>
          <td style="font-size:12.5px;color:var(--text-secondary)">${r.lastModified}</td>
          <td class="center">
            <button class="run-btn" data-id="${r.id}">
              <i class="bi bi-play-fill"></i> 실행
            </button>
          </td>
        </tr>`).join('');
      $('#catalogTbody').html(rows);
    }

    AX.buildPagination($('#pagination'), total, currentPage, pageSize, p => {
      currentPage = p;
      render();
    });

    $('#catalogTbody').off('click', '.run-btn').on('click', '.run-btn', function () {
      const id = $(this).data('id');
      const report = allData.find(r => r.id === id);
      if (report) {
        sessionStorage.setItem('selectedReport', JSON.stringify(report));
        window.location.href = 'report-view.html';
      }
    });
  }

  return { init };
})();
