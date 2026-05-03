const SchedulePage = (() => {
  let scheduleData = [];
  let reportData   = [];
  let selectedId   = null;
  let currentPage  = 1;
  const PAGE_SIZE  = 5;

  const SEND_HIST = [
    { date:'2025-05-14 09:01', name:'주간 매출 분석 리포트', report:'매출 분석 대시보드', recv:12, ok:12, fail:0, status:'성공', attach:'Excel, PDF' },
    { date:'2025-05-07 09:00', name:'주간 매출 분석 리포트', report:'매출 분석 대시보드', recv:12, ok:12, fail:0, status:'성공', attach:'Excel, PDF' },
    { date:'2025-04-30 09:00', name:'주간 매출 분석 리포트', report:'매출 운영 대시보드', recv:12, ok:11, fail:1, status:'일부 실패', attach:'Excel, PDF' },
    { date:'2025-04-23 09:00', name:'일간 경영 리포트',       report:'매출 분석 대시보드', recv:12, ok:12, fail:0, status:'성공', attach:'Excel, PDF' },
    { date:'2025-04-16 09:00', name:'일간 경영 리포트',       report:'매출 분석 대시보드', recv:12, ok:12, fail:0, status:'성공', attach:'Excel, PDF' },
  ];

  function init() {
    $.when(AX.loadJSON('schedules.json'), AX.loadJSON('reports.json'))
      .done((scheds, reports) => {
        scheduleData = scheds[0];
        reportData   = reports[0];
        fillReportSelect();
        renderList();
        renderSendHist();
      }).fail(() => AX.toast('데이터를 불러오지 못했습니다.', 'error'));

    bindEvents();
  }

  /* ===== List ===== */
  function filtered() {
    const kw     = $('#scheduleSearch').val().toLowerCase();
    const status = $('#scheduleStatusFilter').val();
    return scheduleData.filter(s => {
      if (kw     && !s.name.toLowerCase().includes(kw)) return false;
      if (status && s.status !== status) return false;
      return true;
    });
  }

  function renderList() {
    const data  = filtered();
    const paged = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    $('#scheduleCountLabel').text('1 - ' + paged.length + ' / ' + data.length);

    if (!paged.length) {
      $('#scheduleTbody').html('<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">등록된 스케줄이 없습니다.</td></tr>');
      $('#schedulePagination').empty();
      return;
    }

    const cycleColor = { '매주':'badge-primary', '매일':'badge-success', '매월':'badge-gray' };
    const rows = paged.map(s => `
      <tr class="schedule-row ${s.id === selectedId ? 'selected' : ''}" data-id="${s.id}">
        <td>
          <div class="schedule-name">${s.name}</div>
          <div class="schedule-report">${s.reportName}</div>
        </td>
        <td><span class="badge ${cycleColor[s.cycle] || 'badge-gray'}">${s.cycle}</span></td>
        <td style="font-size:12.5px">${s.nextSendAt}</td>
        <td class="center">${s.recipientCount}</td>
        <td class="center">${AX.statusBadge(s.status)}</td>
        <td style="font-size:12.5px;color:var(--text-muted)">${s.lastRun}</td>
      </tr>`).join('');
    $('#scheduleTbody').html(rows);

    AX.buildPagination($('#schedulePagination'), data.length, currentPage, PAGE_SIZE, p => {
      currentPage = p; renderList();
    });
  }

  /* ===== Detail ===== */
  function fillDetail(s) {
    selectedId = s.id;
    $('#detailEmpty').hide();
    $('#detailForm').show();

    $('#fSchedName').val(s.name);
    $('#fSchedReport').val(s.reportId);
    $(`input[name="cycle"][value="${s.cycle}"]`).prop('checked', true);
    toggleCycleFields(s.cycle);
    if (s.dayOfWeek) {
      $('.day-btn').removeClass('active');
      $(`.day-btn[data-day="${s.dayOfWeek}"]`).addClass('active');
    }
    $('#fSendTime').val(s.sendTime || '09:00');
    $('#fDateRange').val(s.autoDateRange);
    $('#fEmailSubject').val(s.emailSubject || '');
    $('#fAiSummary').prop('checked', s.includeAISummary);

    // Attach types
    $('.attach-btn').removeClass('active');
    (s.attachType || []).forEach(t => $(`.attach-btn[data-type="${t}"]`).addClass('active'));

    // Recipients
    renderRecipients(s.recipients || []);
    renderList();
  }

  function renderRecipients(emails) {
    const tags = emails.map(e => `
      <span class="recipient-tag">
        ${e} <span class="remove" data-email="${e}">&times;</span>
      </span>`).join('');
    $('#recipientTags').html(tags || '');
  }

  function toggleCycleFields(cycle) {
    $('#dayOfWeekGroup').toggle(cycle === '매주');
  }

  /* ===== Send History ===== */
  function renderSendHist() {
    const statusMap = { '성공': 'hist-status-ok', '일부 실패': 'hist-status-part', '실패': 'hist-status-fail' };
    const rows = SEND_HIST.map(h => `
      <tr>
        <td style="font-size:12.5px">${h.date}</td>
        <td>${h.name}</td>
        <td style="font-size:12.5px;color:var(--text-muted)">${h.report}</td>
        <td class="center">${h.recv}</td>
        <td class="center" style="color:var(--success)">${h.ok}</td>
        <td class="center" style="color:${h.fail ? 'var(--danger)' : 'var(--text-muted)'}">${h.fail}</td>
        <td class="center"><span class="${statusMap[h.status] || ''}">${h.status === '성공' ? '✓ 성공' : h.status === '일부 실패' ? '△ ' + h.status : '✗ ' + h.status}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${h.attach}</td>
      </tr>`).join('');
    $('#sendHistTbody').html(rows);
  }

  function fillReportSelect() {
    const opts = reportData.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    $('#fSchedReport').html(opts);
  }

  /* ===== New Schedule ===== */
  function newSchedule() {
    selectedId = null;
    $('#detailEmpty').hide();
    $('#detailForm').show();
    $('#fSchedName').val('');
    $('#fSchedReport').prop('selectedIndex', 0);
    $('input[name="cycle"][value="매주"]').prop('checked', true);
    toggleCycleFields('매주');
    $('.day-btn').removeClass('active');
    $('#fSendTime').val('09:00');
    $('#fDateRange').prop('selectedIndex', 0);
    $('#fEmailSubject').val('');
    $('#fAiSummary').prop('checked', true);
    $('.attach-btn').removeClass('active');
    $(`.attach-btn[data-type="Excel"], .attach-btn[data-type="PDF"]`).addClass('active');
    renderRecipients([]);
    $('.schedule-row').removeClass('selected');
  }

  /* ===== Events ===== */
  function bindEvents() {
    $('#scheduleSearch, #scheduleStatusFilter').on('input change', () => { currentPage = 1; renderList(); });

    $('#scheduleTbody').on('click', '.schedule-row', function () {
      const id = $(this).data('id');
      const s  = scheduleData.find(x => x.id === id);
      if (s) fillDetail(s);
    });

    $('input[name="cycle"]').on('change', function () { toggleCycleFields($(this).val()); });

    $('.day-btn').on('click', function () { $(this).toggleClass('active'); });
    $('.attach-btn').on('click', function () { $(this).toggleClass('active'); });

    $('#btnAddRecipient').on('click', () => {
      const email = $('#recipientInput').val().trim();
      if (!email) return;
      const existing = $('#recipientTags .recipient-tag').map((_, el) => $(el).text().trim()).get();
      if (!existing.includes(email)) {
        const $tag = $(`<span class="recipient-tag">${email} <span class="remove" data-email="${email}">&times;</span></span>`);
        $('#recipientTags').append($tag);
      }
      $('#recipientInput').val('');
    });

    $('#recipientInput').on('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('#btnAddRecipient').click(); }
    });

    $('#recipientTags').on('click', '.remove', function () { $(this).closest('.recipient-tag').remove(); });

    $('#btnAddSchedule').on('click', newSchedule);
    $('#btnCancelSched').on('click', () => { $('#detailForm').hide(); $('#detailEmpty').show(); selectedId = null; });
    $('#btnSaveSched').on('click', () => AX.toast('스케줄이 저장되었습니다.', 'success'));
  }

  return { init };
})();
