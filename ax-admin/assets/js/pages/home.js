const HomePage = (() => {

  function init() {
    $.when(
      AX.loadJSON('reports.json'),
      AX.loadJSON('executions.json'),
      AX.loadJSON('notices.json')
    ).done((reports, execs, notices) => {
      renderStats(reports[0], execs[0], notices[0]);
      renderRecentReports(reports[0]);
      renderExecHist(execs[0]);
      renderNotices(notices[0]);
    }).fail(() => {
      AX.toast('데이터를 불러오는 데 실패했습니다.', 'error');
    });
  }

  function renderStats(reports, execs, notices) {
    $('#statReports').text(reports.length + ' 개');
    $('#statReportsSub').text('전일 대비 18% ↑').addClass('up');

    const recentExecs = execs.filter(e => e.status === '성공').length;
    $('#statExec').text(recentExecs + ' 건');

    const unread = notices.filter(n => !n.isRead).length;
    $('#statNotice').text(notices.length + ' 건');
    if (unread > 0) $('#statNoticeSub').text('미확인 ' + unread + '건').css('color', 'var(--danger)');
  }

  function renderRecentReports(reports) {
    const dates = [
      '2025-05-14 10:32', '2025-05-14 09:18', '2025-05-13 17:05',
      '2025-05-13 14:22', '2025-05-13 11:03'
    ];
    const rows = reports.slice(0, 5).map((r, i) => `
      <tr>
        <td><a href="report-view.html" style="color:var(--primary);font-weight:500">${r.name}</a></td>
        <td class="date-col">${dates[i] || r.lastModified}</td>
      </tr>`).join('');
    $('#recentReportsTbody').html(rows);
  }

  function renderExecHist(execs) {
    const rows = execs.slice(0, 5).map(e => {
      const isSuccess = e.status === '성공';
      const statusHtml = `<span class="exec-status ${isSuccess ? 'success' : 'fail'}">
        <i class="bi bi-${isSuccess ? 'check-circle-fill' : 'x-circle-fill'}"></i>${e.status}
      </span>`;
      const timeOnly = e.executedAt.slice(5, 16).replace('-', '-');
      return `<tr>
        <td style="font-weight:500">${e.reportName}</td>
        <td class="date-col">${timeOnly}</td>
        <td class="center">${statusHtml}</td>
      </tr>`;
    }).join('');
    $('#execHistTbody').html(rows);
  }

  function renderNotices(notices) {
    const html = notices.map(n => `
      <div class="notice-item">
        <span class="notice-dot ${n.isRead ? 'read' : ''}"></span>
        <div class="flex-1">
          <div class="notice-title">
            ${n.isNew ? '<span class="badge badge-new" style="margin-right:4px;font-size:10px">NEW</span>' : ''}
            ${n.title}
          </div>
        </div>
        <span class="notice-date">${n.date}</span>
      </div>`).join('');
    $('#noticeList').html(html);
  }

  return { init };
})();
