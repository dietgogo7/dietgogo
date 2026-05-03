const PermissionPage = (() => {
  let menuData = [];
  let permData = {};
  let selectedMenuId = null;

  const DEPTS = ['경영지원본부','마케팅팀','영업1팀','영업2팀','데이터전략팀','재무팀','인사팀'];

  function init() {
    $.when(AX.loadJSON('menus.json'), AX.loadJSON('permissions.json'))
      .done((menus, perms) => {
        menuData = menus[0];
        permData = perms[0];
        renderTree(menuData, $('#permMenuTree'), 0);
      }).fail(() => AX.toast('데이터를 불러오지 못했습니다.', 'error'));

    bindEvents();
  }

  /* ===== Tree ===== */
  function renderTree(nodes, $container, depth) {
    $container.empty();
    nodes.forEach(node => {
      const isFolder  = node.type === 'folder';
      const hasChildren = isFolder && node.children && node.children.length > 0;
      const indent = depth * 14;

      const $node = $('<div class="tree-node">');
      const $row  = $(`
        <div class="tree-node-row" data-id="${node.id}" data-path="${node.menuPath || node.name}" data-name="${node.name}">
          <span class="tree-indent" style="width:${indent}px"></span>
          <span class="tree-toggle">${hasChildren ? '<i class="bi bi-chevron-right"></i>' : '<span style="width:12px;display:inline-block"></span>'}</span>
          <i class="bi ${isFolder ? 'bi-folder-fill tree-icon folder' : 'bi-file-earmark-bar-graph tree-icon report'}"></i>
          <span class="tree-node-name">${node.name}</span>
        </div>`);

      $node.append($row);

      if (hasChildren) {
        const $children = $('<div class="tree-children">');
        renderTree(node.children, $children, depth + 1);
        $node.append($children);
        $row.find('.tree-toggle').on('click', function (e) {
          e.stopPropagation();
          $node.toggleClass('open');
          $(this).find('i').toggleClass('bi-chevron-right bi-chevron-down');
        });
      }

      $row.on('click', function () {
        $('.tree-node-row').removeClass('selected');
        $row.addClass('selected');
        selectedMenuId = node.id;
        renderDeptTable(node);
      });

      $container.append($node);
    });
  }

  /* ===== Dept Permission Table ===== */
  function renderDeptTable(node) {
    const perms  = permData[node.id] || {};
    const path   = node.menuPath || node.name;

    $('#selectedMenuPath').text(path);

    const rows = DEPTS.map(dept => {
      const allowed = perms[dept] !== undefined ? perms[dept] : false;
      return `<tr>
        <td class="dept-name">${dept}</td>
        <td class="center">
          <label class="checkbox-wrap">
            <input type="checkbox" class="dept-check" data-dept="${dept}" ${allowed ? 'checked' : ''}>
            <span>접근 허용</span>
          </label>
        </td>
      </tr>`;
    }).join('');

    $('#deptPermTbody').html(rows);
    updateSummary();
    $('#permSummary').show();

    $('#deptPermTbody').off('change', '.dept-check').on('change', '.dept-check', function () {
      const dept    = $(this).data('dept');
      const checked = $(this).is(':checked');
      if (!permData[node.id]) permData[node.id] = {};
      permData[node.id][dept] = checked;
      updateSummary();
    });
  }

  function updateSummary() {
    if (!selectedMenuId) return;
    const perms   = permData[selectedMenuId] || {};
    const total   = DEPTS.length;
    const allowed = DEPTS.filter(d => perms[d]).length;
    const pct     = Math.round((allowed / total) * 100);

    $('#summaryTotalDept').text(total);
    $('#summaryAllowed').text(allowed);
    $('#summaryPct').text(`(${pct}%)`);
  }

  /* ===== Search ===== */
  function filterTree(kw) {
    if (!kw) { renderTree(menuData, $('#permMenuTree'), 0); return; }
    const flat = AX.flattenMenus(menuData).filter(m => m.name.includes(kw));
    const $tree = $('#permMenuTree').empty();
    flat.forEach(node => {
      const $row = $(`
        <div class="tree-node-row" data-id="${node.id}">
          <i class="bi ${node.type === 'folder' ? 'bi-folder-fill tree-icon folder' : 'bi-file-earmark-bar-graph tree-icon report'}"></i>
          <span class="tree-node-name">${node.name}</span>
        </div>`);
      $row.on('click', () => {
        $('.tree-node-row').removeClass('selected');
        $row.addClass('selected');
        selectedMenuId = node.id;
        renderDeptTable(node);
      });
      $tree.append($row);
    });
    if (!flat.length) $tree.html('<div class="text-muted text-sm" style="padding:16px;text-align:center">검색 결과 없음</div>');
  }

  /* ===== Events ===== */
  function bindEvents() {
    $('#permTreeSearch').on('input', function () { filterTree($(this).val().trim()); });
    $('#btnSavePermission').on('click', () => AX.toast('권한이 저장되었습니다.', 'success'));
  }

  return { init };
})();
