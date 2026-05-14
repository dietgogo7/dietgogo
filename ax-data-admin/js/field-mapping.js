(function () {
  'use strict';

  App.renderLayout({
    title: '필드 매핑 및 마스킹 설정',
    subtitle: 'DB/API 결과 필드를 화면 컬럼으로 매핑하고 개인정보 마스킹 정책을 설정합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '필드 매핑/마스킹' }
    ]
  });

  var allReports = [];
  var mappingsData = [];
  var selectedReport = null;

  Promise.all([
    App.loadJSON('data/reports.json'),
    App.loadJSON('data/field-mappings.json')
  ]).then(function (results) {
    if (!results[0] || !results[1]) return;
    allReports = results[0].reports;
    mappingsData = results[1].mappings;
    renderPage();
  });

  function renderPage() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '';

    // Report selector
    html += '<div class="card mb-4">';
    html += '<div class="card-content">';
    html += '<div class="form-row">';
    html += '<div class="form-group" style="max-width:320px;">';
    html += '<label class="form-label">대상 리포트 선택</label>';
    html += '<select class="form-select" id="reportSelect">';
    html += '<option value="">리포트를 선택하세요</option>';
    allReports.forEach(function (r) {
      var hasMappings = mappingsData.some(function (m) { return m.reportId === r.id; });
      html += '<option value="' + r.id + '">' + r.name + ' (' + r.id + ')' + (hasMappings ? '' : ' *') + '</option>';
    });
    html += '</select></div>';
    html += '<div class="form-group" style="flex:0 0 auto;">';
    html += '<label class="form-label">&nbsp;</label>';
    html += '<button class="btn btn-outline btn-sm" id="btnPreview">' + Icons.eye + ' 미리보기</button>';
    html += '</div>';
    html += '</div>';
    html += '<p class="text-muted text-xs mt-2">* 표시된 리포트는 아직 매핑이 등록되지 않은 항목입니다.</p>';
    html += '</div></div>';

    // Tabs: Mapping / Masking / Preview
    html += '<div id="field-content">';
    html += '<div class="empty-state"><p>리포트를 선택하면 필드 매핑 정보가 표시됩니다.</p></div>';
    html += '</div>';

    body.innerHTML = html;

    document.getElementById('reportSelect').addEventListener('change', function () {
      var id = this.value;
      if (!id) { selectedReport = null; document.getElementById('field-content').innerHTML = '<div class="empty-state"><p>리포트를 선택하면 필드 매핑 정보가 표시됩니다.</p></div>'; return; }
      var report = allReports.find(function (r) { return r.id === id; });
      selectedReport = mappingsData.find(function (m) { return m.reportId === id; }) || null;
      if (selectedReport) {
        renderFieldContent(selectedReport);
      } else {
        renderEmptyMapping(report);
      }
    });

    document.getElementById('btnPreview').addEventListener('click', function () {
      if (!selectedReport) { App.showToast('리포트를 먼저 선택하세요.', 'warning'); return; }
      showPreview();
    });

    // Auto-select first report that has mappings
    var firstMapped = allReports.find(function (r) { return mappingsData.some(function (m) { return m.reportId === r.id; }); });
    if (firstMapped) {
      document.getElementById('reportSelect').value = firstMapped.id;
      selectedReport = mappingsData.find(function (m) { return m.reportId === firstMapped.id; });
      renderFieldContent(selectedReport);
    }
  }

  function renderEmptyMapping(report) {
    var container = document.getElementById('field-content');
    container.innerHTML = '<div class="card"><div class="card-header"><span class="card-title">' + report.name + ' - 필드 설정</span>' +
      '<button class="btn btn-primary btn-sm" onclick="window.saveFields()">' + Icons.save + ' 저장</button></div>' +
      '<div class="card-content"><div class="empty-state"><p>이 리포트에는 아직 필드 매핑이 등록되지 않았습니다.</p>' +
      '<p class="text-muted text-sm mt-2">필드를 추가하려면 저장 버튼을 눌러 기본 템플릿을 생성하세요.</p></div></div></div>';
  }

  function renderFieldContent(report) {
    var container = document.getElementById('field-content');

    var html = '';
    html += '<div class="card">';
    html += '<div class="card-header">';
    html += '<span class="card-title">' + report.reportName + ' - 필드 설정</span>';
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-primary btn-sm" onclick="window.saveFields()">' + Icons.save + ' 저장</button>';
    html += '<button class="btn btn-outline btn-sm" onclick="window.testFields()">' + Icons.play + ' 테스트</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="card-content">';

    // Field mapping table
    html += '<div class="data-table-wrapper"><table class="data-table">';
    html += '<thead><tr>';
    html += '<th style="width:40px;">#</th>';
    html += '<th>소스 필드</th>';
    html += '<th>화면 컬럼명</th>';
    html += '<th style="width:100px;">데이터 타입</th>';
    html += '<th style="width:70px;">화면 표시</th>';
    html += '<th style="width:70px;">엑셀 포함</th>';
    html += '<th style="width:70px;">정렬</th>';
    html += '<th style="width:70px;">검색</th>';
    html += '<th style="width:70px;">마스킹</th>';
    html += '<th style="width:110px;">마스킹 유형</th>';
    html += '</tr></thead><tbody>';

    report.fields.forEach(function (field, idx) {
      html += '<tr>';
      html += '<td class="text-muted">' + (idx + 1) + '</td>';
      html += '<td><code style="font-size:0.75rem;background:var(--muted);padding:0.125rem 0.375rem;border-radius:var(--radius-sm);">' + field.sourceField + '</code></td>';
      html += '<td><input type="text" class="form-input" value="' + field.displayName + '" style="padding:0.25rem 0.5rem;" data-field="displayName" data-idx="' + idx + '"></td>';
      html += '<td><select class="form-select" style="padding:0.25rem 0.5rem;" data-field="dataType" data-idx="' + idx + '">';
      ['String', 'Number', 'Date'].forEach(function (t) {
        html += '<option value="' + t + '"' + (field.dataType === t ? ' selected' : '') + '>' + t + '</option>';
      });
      html += '</select></td>';
      html += '<td class="text-center"><input type="checkbox"' + (field.visible ? ' checked' : '') + ' data-field="visible" data-idx="' + idx + '"></td>';
      html += '<td class="text-center"><input type="checkbox"' + (field.excelInclude ? ' checked' : '') + ' data-field="excelInclude" data-idx="' + idx + '"></td>';
      html += '<td class="text-center"><input type="checkbox"' + (field.sortable ? ' checked' : '') + ' data-field="sortable" data-idx="' + idx + '"></td>';
      html += '<td class="text-center"><input type="checkbox"' + (field.searchable ? ' checked' : '') + ' data-field="searchable" data-idx="' + idx + '"></td>';
      html += '<td class="text-center"><input type="checkbox"' + (field.masking ? ' checked' : '') + ' data-field="masking" data-idx="' + idx + '"></td>';
      html += '<td>';
      if (field.masking) {
        html += '<select class="form-select" style="padding:0.25rem 0.5rem;" data-field="maskType" data-idx="' + idx + '">';
        html += '<option value="">선택</option>';
        ['name', 'email', 'phone'].forEach(function (t) {
          var label = { name: '이름', email: '이메일', phone: '연락처' };
          html += '<option value="' + t + '"' + (field.maskType === t ? ' selected' : '') + '>' + label[t] + '</option>';
        });
        html += '</select>';
      } else {
        html += '<span class="text-muted text-xs">-</span>';
      }
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '</div></div>';

    // Preview section
    html += '<div class="card mt-4" id="previewCard" style="display:none;">';
    html += '<div class="card-header"><span class="card-title">' + Icons.eye + ' 미리보기</span></div>';
    html += '<div class="card-content" id="previewContent"></div>';
    html += '</div>';

    container.innerHTML = html;
  }

  function showPreview() {
    if (!selectedReport) return;

    var previewCard = document.getElementById('previewCard');
    var previewContent = document.getElementById('previewContent');
    previewCard.style.display = 'block';

    var sampleData = [
      { sale_date: '2026-05-01', category_name: '전자기기', channel_name: '온라인', total_sales: 45230000, order_count: 523, avg_price: 86480, return_rate: 2.1, order_id: 'ORD-20260501-001', order_date: '2026-05-01 10:30', customer_name: '홍길동', customer_email: 'hong@example.com', customer_phone: '01012345678', product_name: '무선 이어폰', quantity: 2, amount: 128000, status: '완료' },
      { sale_date: '2026-05-02', category_name: '의류', channel_name: '오프라인', total_sales: 32100000, order_count: 412, avg_price: 77910, return_rate: 4.5, order_id: 'ORD-20260502-002', order_date: '2026-05-02 14:20', customer_name: '김영희', customer_email: 'kim@example.com', customer_phone: '01098765432', product_name: '캐시미어 코트', quantity: 1, amount: 350000, status: '배송중' },
      { sale_date: '2026-05-03', category_name: '식품', channel_name: '모바일', total_sales: 18500000, order_count: 890, avg_price: 20786, return_rate: 0.8, order_id: 'ORD-20260503-003', order_date: '2026-05-03 09:15', customer_name: '박민수', customer_email: 'park@example.com', customer_phone: '01055556666', product_name: '유기농 샐러드', quantity: 3, amount: 27000, status: '완료' }
    ];

    var html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr>';
    selectedReport.fields.forEach(function (f) {
      if (f.visible) html += '<th>' + f.displayName + '</th>';
    });
    html += '</tr></thead><tbody>';

    sampleData.forEach(function (row) {
      html += '<tr>';
      selectedReport.fields.forEach(function (f) {
        if (!f.visible) return;
        var val = row[f.sourceField];
        if (val == null) val = '-';

        if (f.masking && f.maskType) {
          if (f.maskType === 'name') val = App.maskName(String(val));
          else if (f.maskType === 'email') val = App.maskEmail(String(val));
          else if (f.maskType === 'phone') val = App.maskPhone(String(val));
        }

        if (f.dataType === 'Number' && typeof row[f.sourceField] === 'number') {
          val = App.formatNumber(row[f.sourceField]);
        }

        html += '<td>' + val + '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<p class="text-muted text-xs mt-2">* 샘플 데이터 3건 기준 미리보기입니다.</p>';

    previewContent.innerHTML = html;
    App.showToast('미리보기가 생성되었습니다.', 'success');
  }

  window.saveFields = function () {
    App.showToast('필드 매핑 설정이 저장되었습니다.', 'success');
  };

  window.testFields = function () {
    App.showToast('테스트 조회가 완료되었습니다.', 'success');
    showPreview();
  };
})();
