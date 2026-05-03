const FieldMappingPage = (() => {

  const FIELDS_BY_REPORT = {
    default: [
      { source:'CustomerName', screen:'고객명',   type:'String', showYn:true,  excelYn:true,  sort:'오름차순', searchYn:true,  maskYn:true,  maskType:'이름 마스킹',   preview:'홍*동' },
      { source:'CustomerEmail',screen:'이메일',   type:'String', showYn:true,  excelYn:false, sort:'-',        searchYn:true,  maskYn:true,  maskType:'이메일 마스킹', preview:'te****@ax.com' },
      { source:'PhoneNo',      screen:'연락처',   type:'String', showYn:true,  excelYn:false, sort:'-',        searchYn:true,  maskYn:true,  maskType:'연락처 마스킹', preview:'010-****-5678' },
      { source:'SalesAmount',  screen:'매출액',   type:'Number', showYn:true,  excelYn:true,  sort:'내림차순', searchYn:true,  maskYn:false, maskType:'-',             preview:'25,430,000' },
      { source:'OverdueDays',  screen:'연체일수', type:'Number', showYn:true,  excelYn:true,  sort:'내림차순', searchYn:true,  maskYn:false, maskType:'-',             preview:'45' },
      { source:'RegDate',      screen:'등록일',   type:'Date',   showYn:true,  excelYn:true,  sort:'내림차순', searchYn:false, maskYn:false, maskType:'-',             preview:'2024-05-20' },
    ],
    r007: [
      { source:'SaleDate',     screen:'일자',     type:'Date',   showYn:true,  excelYn:true,  sort:'내림차순', searchYn:false, maskYn:false, maskType:'-',             preview:'2025-05-31' },
      { source:'Category',     screen:'카테고리', type:'String', showYn:true,  excelYn:true,  sort:'오름차순', searchYn:true,  maskYn:false, maskType:'-',             preview:'의류' },
      { source:'SalesAmt',     screen:'매출액',   type:'Number', showYn:true,  excelYn:true,  sort:'내림차순', searchYn:false, maskYn:false, maskType:'-',             preview:'28,450,000' },
      { source:'OrderCount',   screen:'주문건수', type:'Number', showYn:true,  excelYn:true,  sort:'내림차순', searchYn:false, maskYn:false, maskType:'-',             preview:'1,245' },
    ]
  };

  const MASK_TYPES = ['-','이름 마스킹','이메일 마스킹','연락처 마스킹','전체 마스킹'];
  const SORT_OPTS  = ['-','오름차순','내림차순'];

  let fields = [];

  function init() {
    AX.loadJSON('reports.json').done(reports => {
      const opts = reports.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
      $('#reportSelector').html(opts);
      loadFields('default');
    }).fail(() => AX.toast('리포트 목록을 불러오지 못했습니다.', 'error'));

    bindEvents();
  }

  function loadFields(reportId) {
    fields = JSON.parse(JSON.stringify(FIELDS_BY_REPORT[reportId] || FIELDS_BY_REPORT.default));
    $('#fieldCountLabel').text('총 ' + fields.length + '개 필드');
    renderTable();
    renderPreview();
  }

  /* ===== Mapping Table ===== */
  function renderTable() {
    const rows = fields.map((f, i) => {
      const sortOpts  = SORT_OPTS.map(o  => `<option ${f.sort === o ? 'selected' : ''}>${o}</option>`).join('');
      const maskOpts  = MASK_TYPES.map(o => `<option ${f.maskType === o ? 'selected' : ''}>${o}</option>`).join('');

      return `<tr data-idx="${i}">
        <td><span class="source-field">${f.source}</span></td>
        <td><input type="text" class="form-control form-control-sm screen-field-input" data-field="screen" value="${f.screen}"></td>
        <td><span class="badge badge-gray">${f.type}</span></td>
        <td class="center">
          <input type="checkbox" class="field-check" data-field="showYn" ${f.showYn ? 'checked' : ''} style="accent-color:var(--primary);width:15px;height:15px">
        </td>
        <td class="center">
          <input type="checkbox" class="field-check" data-field="excelYn" ${f.excelYn ? 'checked' : ''} style="accent-color:var(--primary);width:15px;height:15px">
        </td>
        <td>
          <select class="form-control form-control-sm sort-select field-select" data-field="sort">${sortOpts}</select>
        </td>
        <td class="center">
          <input type="checkbox" class="field-check" data-field="searchYn" ${f.searchYn ? 'checked' : ''} style="accent-color:var(--primary);width:15px;height:15px">
        </td>
        <td class="center">
          <label class="toggle-switch" style="transform:scale(.85)">
            <input type="checkbox" class="mask-toggle" data-field="maskYn" ${f.maskYn ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td>
          <select class="form-control form-control-sm mask-type-select field-select" data-field="maskType" ${!f.maskYn ? 'disabled' : ''}>${maskOpts}</select>
        </td>
        <td class="preview-value">${f.preview}</td>
      </tr>`;
    }).join('');
    $('#mappingTbody').html(rows);
  }

  /* ===== Preview Table ===== */
  function renderPreview() {
    const visible = fields.filter(f => f.showYn);
    if (!visible.length) { $('#previewThead').empty(); $('#previewTbody').empty(); return; }

    const SAMPLE = [
      ['홍*동','te****@ax.com','010-****-5678','25,430,000','45','2024-05-20'],
      ['김*희','ki****@naver.com','010-****-1234','12,350,000','12','2024-03-15'],
      ['이*수','le****@gmail.com','010-****-9876','8,670,000','81','2023-11-02'],
    ];

    const theadCells = visible.map(f => `<th>${f.screen}</th>`).join('');
    $('#previewThead').html(`<tr>${theadCells}</tr>`);

    const tbodyRows = SAMPLE.map(row => {
      const cells = visible.map((f, i) => `<td>${f.maskYn ? (SAMPLE[0][i] || f.preview) : f.preview}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    $('#previewTbody').html(tbodyRows);
  }

  /* ===== Events ===== */
  function bindEvents() {
    $('#reportSelector').on('change', function () { loadFields($(this).val()); });

    $('#mappingTbody').on('change input', 'input, select', function () {
      const $tr  = $(this).closest('tr');
      const idx  = parseInt($tr.data('idx'));
      const fKey = $(this).data('field');
      if (!fKey || idx === undefined || !fields[idx]) return;

      if ($(this).is(':checkbox')) {
        fields[idx][fKey] = $(this).is(':checked');
        if (fKey === 'maskYn') {
          $tr.find('.mask-type-select').prop('disabled', !fields[idx].maskYn);
          if (!fields[idx].maskYn) { fields[idx].maskType = '-'; $tr.find('.mask-type-select').val('-'); }
        }
        if (fKey === 'showYn') renderPreview();
      } else {
        fields[idx][fKey] = $(this).val();
        if (fKey === 'screen') renderPreview();
      }
    });

    $('#btnSaveMap').on('click',  () => AX.toast('매핑이 저장되었습니다.', 'success'));
    $('#btnSaveTest').on('click', () => {
      AX.toast('저장 후 테스트를 실행합니다...', 'default');
      setTimeout(() => AX.toast('테스트 완료 — JSON Schema 검증 통과', 'success'), 1200);
    });
    $('#btnCancelMap').on('click', () => loadFields($('#reportSelector').val()));
  }

  return { init };
})();
