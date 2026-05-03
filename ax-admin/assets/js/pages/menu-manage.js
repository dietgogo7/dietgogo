const MenuManagePage = (() => {
  let menuData = [];
  let selectedNode = null;

  function init() {
    AX.loadJSON('menus.json').done(data => {
      menuData = data;
      renderTree(menuData, $('#menuTree'), 0);
      buildParentSelect();
    }).fail(() => AX.toast('메뉴 데이터를 불러오지 못했습니다.', 'error'));
    bindEvents();
  }

  /* ===== Tree Rendering ===== */
  function renderTree(nodes, $container, depth) {
    $container.empty();
    nodes.forEach(node => {
      const isFolder = node.type === 'folder';
      const hasChildren = isFolder && node.children && node.children.length > 0;
      const indent = depth * 16;

      const $node = $('<div class="tree-node">');
      const $row  = $(`
        <div class="tree-node-row" data-id="${node.id}">
          <span class="tree-indent" style="width:${indent}px"></span>
          <span class="tree-toggle">${hasChildren ? '<i class="bi bi-chevron-right"></i>' : ''}</span>
          <i class="bi ${isFolder ? 'bi-folder-fill tree-icon folder' : 'bi-file-earmark-bar-graph tree-icon report'}"></i>
          <span class="tree-node-name">${node.name}</span>
          <span class="tree-node-use ${node.useYn ? 'on' : 'off'}"></span>
        </div>`);

      $node.append($row);

      if (hasChildren) {
        const $children = $('<div class="tree-children">');
        renderTree(node.children, $children, depth + 1);
        $node.append($children);

        $row.on('click', function (e) {
          e.stopPropagation();
          $node.toggleClass('open');
          const $icon = $row.find('.tree-toggle i');
          $icon.toggleClass('bi-chevron-right bi-chevron-down');
          selectNode(node, $row);
        });
      } else {
        $row.on('click', function (e) {
          e.stopPropagation();
          selectNode(node, $row);
        });
      }

      $container.append($node);
    });
  }

  function selectNode(node, $row) {
    $('.tree-node-row').removeClass('selected');
    $row.addClass('selected');
    selectedNode = node;
    fillForm(node);
    updatePreview(node);
  }

  /* ===== Form ===== */
  function fillForm(node) {
    $('#formEmptyState').hide();
    $('#menuFormContent').show();

    $('#fMenuName').val(node.name);
    $('#fMenuType').val(node.type);
    $('#fOrder').val(node.order);
    $('#fDesc').val(node.description || '');
    $('#fUseYn').prop('checked', node.useYn);
    $('#menuTypeBadge').text(node.type === 'folder' ? '폴더' : '리포트 메뉴');

    if (node.type === 'report') {
      $('#dataConnectionSection').show();
      $(`input[name="dsType"][value="${node.dataSourceType || 'SP'}"]`).prop('checked', true);
      toggleDsType(node.dataSourceType || 'SP');
      $('#fSpName').val(node.spName || '');
      $('#fApiPath').val(node.apiPath || '');
      $('#fUseViz').prop('checked',   node.useVisualization !== false);
      $('#fUseSch').prop('checked',   node.useSchedule !== false);
      $('#fUseExcel').prop('checked', node.useExcel !== false);
    } else {
      $('#dataConnectionSection').hide();
    }
  }

  function toggleDsType(type) {
    if (type === 'SP') {
      $('#spGroup').show(); $('#apiGroup').hide();
    } else {
      $('#spGroup').hide(); $('#apiGroup').show();
    }
  }

  function updatePreview(node) {
    const path = (node.menuPath || node.name).split('>').map(s => s.trim());
    const bcHtml = ['홈', ...path].map((p, i) => {
      const isLast = i === path.length;
      return `<span class="bc-item ${isLast ? 'active' : ''}">${i === 0 ? '<i class="bi bi-house-fill"></i> ' : ''}${p}</span>`;
    }).join('<span class="bc-sep"> › </span>');
    $('#previewBreadcrumb').html(bcHtml);
    $('#previewReportName').text(node.name);
  }

  function buildParentSelect() {
    const flat = AX.flattenMenus(menuData).filter(m => m.type === 'folder');
    const opts = flat.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    $('#fParentMenu').html('<option value="">없음 (최상위)</option>' + opts);
  }

  /* ===== Search ===== */
  function filterTree(kw) {
    if (!kw) {
      renderTree(menuData, $('#menuTree'), 0);
      return;
    }
    const flat = AX.flattenMenus(menuData).filter(m => m.name.includes(kw));
    const $tree = $('#menuTree').empty();
    flat.forEach(node => {
      const $row = $(`
        <div class="tree-node-row" data-id="${node.id}">
          <i class="bi ${node.type === 'folder' ? 'bi-folder-fill tree-icon folder' : 'bi-file-earmark-bar-graph tree-icon report'}"></i>
          <span class="tree-node-name">${node.name}</span>
          <span class="tree-node-use ${node.useYn ? 'on' : 'off'}"></span>
        </div>`);
      $row.on('click', () => { selectNode(node, $row); });
      $tree.append($row);
    });
    if (!flat.length) $tree.html('<div class="text-muted text-sm" style="padding:16px;text-align:center">검색 결과 없음</div>');
  }

  /* ===== Save (in-memory) ===== */
  function saveNode() {
    if (!selectedNode) return;
    selectedNode.name        = $('#fMenuName').val().trim();
    selectedNode.type        = $('#fMenuType').val();
    selectedNode.order       = parseInt($('#fOrder').val()) || 1;
    selectedNode.description = $('#fDesc').val();
    selectedNode.useYn       = $('#fUseYn').is(':checked');

    if (selectedNode.type === 'report') {
      selectedNode.dataSourceType   = $('input[name="dsType"]:checked').val();
      selectedNode.spName           = $('#fSpName').val().trim();
      selectedNode.apiPath          = $('#fApiPath').val().trim();
      selectedNode.useVisualization = $('#fUseViz').is(':checked');
      selectedNode.useSchedule      = $('#fUseSch').is(':checked');
      selectedNode.useExcel         = $('#fUseExcel').is(':checked');
    }
    renderTree(menuData, $('#menuTree'), 0);
    AX.toast('저장되었습니다.', 'success');
  }

  /* ===== Events ===== */
  function bindEvents() {
    $('#treeSearch').on('input', function () { filterTree($(this).val().trim()); });

    $('input[name="dsType"]').on('change', function () { toggleDsType($(this).val()); });

    $('#btnSaveMenu').on('click', saveNode);
    $('#btnCancelMenu').on('click', () => {
      if (selectedNode) fillForm(selectedNode);
    });

    $('#btnAddMenu').on('click', () => {
      const newNode = {
        id: 'new-' + Date.now(), parentId: null, type: 'report',
        name: '새 메뉴', order: 99, useYn: true,
        dataSourceType: 'SP', spName: '', apiPath: '',
        useVisualization: true, useSchedule: true, useExcel: true
      };
      selectedNode = newNode;
      fillForm(newNode);
      updatePreview(newNode);
      AX.toast('신규 메뉴를 입력 후 저장하세요.', 'default');
    });

    $('#fMenuName').on('input', function () {
      if (selectedNode) {
        const name = $(this).val();
        $('#previewReportName').text(name || '리포트명');
      }
    });
  }

  return { init };
})();
