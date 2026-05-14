(function () {
  'use strict';

  App.renderLayout({
    title: '메뉴 관리',
    subtitle: '대메뉴, 서브메뉴, 리포트 메뉴를 구성하고 데이터소스를 연결합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '메뉴 관리' }
    ],
    headerActions: '<button class="btn btn-primary btn-sm" onclick="window.addMenu()">' + Icons.plus + ' 메뉴 추가</button>'
  });

  var menuData = [];
  var selectedMenu = null;

  App.loadJSON('data/menus.json').then(function (data) {
    if (!data) return;
    menuData = data.menus;
    renderPage();
  });

  function renderPage() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var html = '<div class="grid gap-4" style="grid-template-columns:320px 1fr;">';

    // Left: Tree view
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title">' + Icons.menuTree + ' 메뉴 트리</span></div>';
    html += '<div class="card-content" style="padding:0.5rem 0;"><ul class="tree-view" id="menu-tree">';
    html += renderTreeItems(menuData, 0);
    html += '</ul></div></div>';

    // Right: Detail form
    html += '<div class="card">';
    html += '<div class="card-header"><span class="card-title" id="detail-title">메뉴 정보</span></div>';
    html += '<div class="card-content" id="detail-form">';
    html += '<div class="empty-state"><p>좌측 트리에서 메뉴를 선택하세요.</p></div>';
    html += '</div></div>';

    html += '</div>';

    // Add/Edit Modal
    html += '<div class="modal-overlay" id="menuModal">';
    html += '<div class="modal">';
    html += '<div class="modal-header"><h3 id="modalTitle">메뉴 추가</h3><button class="modal-close" onclick="App.closeModal(\'menuModal\')">' + Icons.x + '</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="form-group mb-4"><label class="form-label">메뉴명</label><input type="text" class="form-input" id="modalMenuName" placeholder="메뉴명을 입력하세요"></div>';
    html += '<div class="form-group mb-4"><label class="form-label">메뉴 유형</label>';
    html += '<select class="form-select" id="modalMenuType"><option value="group">대메뉴</option><option value="submenu">서브메뉴</option><option value="report">리포트</option></select></div>';
    html += '<div class="form-group mb-4"><label class="form-label">상위 메뉴</label>';
    html += '<select class="form-select" id="modalParent"><option value="">없음 (최상위)</option></select></div>';
    html += '<div class="form-group mb-4"><label class="form-label">설명</label><textarea class="form-textarea" id="modalDesc" rows="2" placeholder="메뉴 설명"></textarea></div>';
    html += '<div class="form-group mb-4"><label class="form-label">정렬 순서</label><input type="number" class="form-input" id="modalSort" value="1" min="1"></div>';
    html += '<div class="form-check"><input type="checkbox" id="modalActive" checked><label for="modalActive">사용 여부</label></div>';
    html += '</div>';
    html += '<div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal(\'menuModal\')">취소</button><button class="btn btn-primary" onclick="window.saveMenu()">저장</button></div>';
    html += '</div></div>';

    body.innerHTML = html;
  }

  function renderTreeItems(items, depth) {
    var html = '';
    items.forEach(function (item) {
      var hasChildren = item.children && item.children.length > 0;
      var typeIcon = item.type === 'group' ? Icons.folder : (item.type === 'report' ? Icons.fileText : Icons.chevronRight);
      var indent = depth * 8;

      html += '<li class="tree-item' + (hasChildren ? ' open' : '') + '" data-id="' + item.id + '">';
      html += '<div class="tree-item-row" style="padding-left:' + (12 + indent) + 'px;" onclick="window.selectMenu(\'' + item.id + '\')">';
      if (hasChildren) {
        html += '<span class="tree-toggle" onclick="event.stopPropagation();this.closest(\'.tree-item\').classList.toggle(\'open\')">' + Icons.chevronRight + '</span>';
      } else {
        html += '<span class="tree-toggle" style="opacity:0;">' + Icons.chevronRight + '</span>';
      }
      html += '<span style="opacity:0.6;display:flex;">' + typeIcon + '</span>';
      html += '<span class="text-sm flex-1">' + item.name + '</span>';
      if (!item.active) html += App.renderBadge('비활성', 'secondary');
      html += '</div>';

      if (hasChildren) {
        html += '<ul class="tree-children">';
        html += renderTreeItems(item.children, depth + 1);
        html += '</ul>';
      }
      html += '</li>';
    });
    return html;
  }

  function findMenu(items, id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
      if (items[i].children) {
        var found = findMenu(items[i].children, id);
        if (found) return found;
      }
    }
    return null;
  }

  window.selectMenu = function (id) {
    selectedMenu = findMenu(menuData, id);
    if (!selectedMenu) return;

    document.querySelectorAll('.tree-item-row').forEach(function (r) { r.classList.remove('selected'); });
    var row = document.querySelector('.tree-item[data-id="' + id + '"] > .tree-item-row');
    if (row) row.classList.add('selected');

    var detailTitle = document.getElementById('detail-title');
    var detailForm = document.getElementById('detail-form');
    detailTitle.textContent = selectedMenu.name + ' 상세';

    var typeMap = { group: '대메뉴', submenu: '서브메뉴', report: '리포트' };
    var html = '';

    html += '<div class="form-group mb-4"><label class="form-label">메뉴명</label><input type="text" class="form-input" value="' + selectedMenu.name + '" id="editName"></div>';
    html += '<div class="form-row mb-4">';
    html += '<div class="form-group"><label class="form-label">유형</label><input type="text" class="form-input" value="' + (typeMap[selectedMenu.type] || selectedMenu.type) + '" disabled></div>';
    html += '<div class="form-group"><label class="form-label">정렬 순서</label><input type="number" class="form-input" value="' + selectedMenu.sortOrder + '" id="editSort"></div>';
    html += '</div>';

    html += '<div class="form-group mb-4"><label class="form-label">설명</label><textarea class="form-textarea" id="editDesc" rows="2">' + (selectedMenu.description || '') + '</textarea></div>';

    html += '<div class="form-check mb-4"><input type="checkbox" id="editActive"' + (selectedMenu.active ? ' checked' : '') + '><label for="editActive">사용 여부</label></div>';

    // Data source (report type only)
    if (selectedMenu.type === 'report' && selectedMenu.dataSource) {
      html += '<div class="separator mb-4"></div>';
      html += '<h4 class="mb-4" style="font-size:0.875rem;">' + Icons.database + ' 데이터소스 설정</h4>';
      html += '<div class="form-row mb-4">';
      html += '<div class="form-group"><label class="form-label">연결 방식</label>';
      html += '<select class="form-select" id="editDSType"><option value="SP"' + (selectedMenu.dataSource.type === 'SP' ? ' selected' : '') + '>SP</option>';
      html += '<option value="API"' + (selectedMenu.dataSource.type === 'API' ? ' selected' : '') + '>API</option></select></div>';
      html += '<div class="form-group"><label class="form-label">' + (selectedMenu.dataSource.type === 'SP' ? 'SP명' : 'API 경로') + '</label>';
      html += '<input type="text" class="form-input" value="' + selectedMenu.dataSource.name + '" id="editDSName"></div>';
      html += '</div>';

      html += '<h4 class="mb-4" style="font-size:0.875rem;">' + Icons.settings + ' 기능 사용 여부</h4>';
      var features = selectedMenu.features || {};
      html += '<div class="flex gap-6">';
      html += '<div class="form-check"><input type="checkbox" id="featViz"' + (features.visualization ? ' checked' : '') + '><label for="featViz">시각화</label></div>';
      html += '<div class="form-check"><input type="checkbox" id="featSch"' + (features.schedule ? ' checked' : '') + '><label for="featSch">스케줄</label></div>';
      html += '<div class="form-check"><input type="checkbox" id="featExcel"' + (features.excelDownload ? ' checked' : '') + '><label for="featExcel">엑셀 다운로드</label></div>';
      html += '</div>';
    }

    html += '<div class="separator mt-6 mb-4"></div>';
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-primary" onclick="window.saveEditMenu()">' + Icons.save + ' 저장</button>';
    html += '<button class="btn btn-outline" onclick="window.cancelEdit()">취소</button>';
    html += '<button class="btn btn-destructive ml-auto" onclick="window.deleteMenu()">' + Icons.trash + ' 삭제</button>';
    html += '</div>';

    detailForm.innerHTML = html;
  };

  window.addMenu = function () {
    document.getElementById('modalTitle').textContent = '메뉴 추가';
    document.getElementById('modalMenuName').value = '';
    document.getElementById('modalDesc').value = '';
    document.getElementById('modalSort').value = '1';
    document.getElementById('modalActive').checked = true;

    var parentSelect = document.getElementById('modalParent');
    parentSelect.innerHTML = '<option value="">없음 (최상위)</option>';
    menuData.forEach(function (m) {
      parentSelect.innerHTML += '<option value="' + m.id + '">' + m.name + '</option>';
      if (m.children) {
        m.children.forEach(function (c) {
          if (c.type !== 'report') {
            parentSelect.innerHTML += '<option value="' + c.id + '">&nbsp;&nbsp;' + m.name + ' > ' + c.name + '</option>';
          }
        });
      }
    });

    App.openModal('menuModal');
  };

  window.saveMenu = function () {
    var name = document.getElementById('modalMenuName').value.trim();
    if (!name) { App.showToast('메뉴명을 입력해주세요.', 'warning'); return; }
    App.closeModal('menuModal');
    App.showToast('\'' + name + '\' 메뉴가 추가되었습니다.', 'success');
  };

  window.saveEditMenu = function () {
    App.showToast('메뉴 정보가 저장되었습니다.', 'success');
  };

  window.cancelEdit = function () {
    if (selectedMenu) window.selectMenu(selectedMenu.id);
  };

  window.deleteMenu = function () {
    if (selectedMenu && confirm('\'' + selectedMenu.name + '\' 메뉴를 삭제하시겠습니까?')) {
      App.showToast('메뉴가 삭제되었습니다.', 'success');
    }
  };
})();
