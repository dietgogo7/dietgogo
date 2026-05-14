(function () {
  'use strict';

  App.renderLayout({
    title: '권한 관리',
    subtitle: '메뉴별로 부서 접근 권한을 설정하고 현황을 확인합니다.',
    breadcrumbs: [
      { label: '홈', url: 'home.html' },
      { label: '권한 관리' }
    ]
  });

  var permData = null;

  App.loadJSON('data/permissions.json').then(function (data) {
    if (!data) return;
    permData = data;
    renderPage();
  });

  function renderPage() {
    var body = document.getElementById('page-body');
    if (!body) return;

    var departments = permData.departments;
    var permissions = permData.permissions;

    // Summary stats
    var totalMenus = permissions.length;
    var totalDepts = departments.length;
    var totalGranted = 0;
    permissions.forEach(function (p) { totalGranted += p.departments.length; });

    var html = '';

    // Summary cards
    html += '<div class="grid grid-cols-3 gap-4 mb-6">';
    html += App.renderStatCard('대상 메뉴 수', totalMenus, null, 'menuTree');
    html += App.renderStatCard('전체 부서 수', totalDepts, null, 'users');
    html += App.renderStatCard('접근 허용 건수', totalGranted, null, 'shield');
    html += '</div>';

    // Menu selector
    html += '<div class="card mb-4">';
    html += '<div class="card-content">';
    html += '<div class="form-row">';
    html += '<div class="form-group" style="max-width:400px;">';
    html += '<label class="form-label">메뉴 선택</label>';
    html += '<select class="form-select" id="menuSelect">';
    permissions.forEach(function (p) {
      html += '<option value="' + p.menuId + '">' + p.menuName + '</option>';
    });
    html += '</select></div>';
    html += '</div></div></div>';

    // Permission matrix
    html += '<div class="card">';
    html += '<div class="card-header">';
    html += '<span class="card-title" id="permTitle">' + Icons.shield + ' 부서별 접근 권한</span>';
    html += '<div class="flex gap-2">';
    html += '<button class="btn btn-primary btn-sm" onclick="window.savePermissions()">' + Icons.save + ' 저장</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="card-content" id="permMatrix"></div>';
    html += '</div>';

    // Current access preview
    html += '<div class="card mt-4">';
    html += '<div class="card-header"><span class="card-title">' + Icons.eye + ' 접근 가능 부서 현황</span></div>';
    html += '<div class="card-content" id="accessPreview"></div>';
    html += '</div>';

    body.innerHTML = html;

    document.getElementById('menuSelect').addEventListener('change', function () {
      renderPermMatrix(this.value);
    });

    renderPermMatrix(permissions[0].menuId);
  }

  function renderPermMatrix(menuId) {
    var perm = permData.permissions.find(function (p) { return p.menuId === menuId; });
    if (!perm) return;

    var container = document.getElementById('permMatrix');
    var preview = document.getElementById('accessPreview');

    var html = '<div class="data-table-wrapper"><table class="data-table">';
    html += '<thead><tr><th style="width:50px;">#</th><th>부서명</th><th style="width:120px;">접근 허용</th></tr></thead>';
    html += '<tbody>';

    permData.departments.forEach(function (dept, idx) {
      var granted = perm.departments.indexOf(dept.id) !== -1;
      html += '<tr>';
      html += '<td class="text-muted">' + (idx + 1) + '</td>';
      html += '<td class="font-medium">' + dept.name + '</td>';
      html += '<td>';
      html += '<label class="toggle"><input type="checkbox"' + (granted ? ' checked' : '') + ' data-dept="' + dept.id + '"><span class="toggle-slider"></span></label>';
      html += '</td>';
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    // Access preview
    var grantedDepts = permData.departments.filter(function (d) {
      return perm.departments.indexOf(d.id) !== -1;
    });

    var previewHTML = '<div class="flex flex-wrap gap-2">';
    if (grantedDepts.length === 0) {
      previewHTML += '<span class="text-muted text-sm">접근 허용된 부서가 없습니다.</span>';
    } else {
      grantedDepts.forEach(function (d) {
        previewHTML += App.renderBadge(d.name, 'success');
      });
    }
    previewHTML += '</div>';
    previewHTML += '<p class="text-muted text-xs mt-2">관리자 계정은 모든 메뉴에 자동 접근 권한이 부여됩니다.</p>';
    preview.innerHTML = previewHTML;
  }

  window.savePermissions = function () {
    App.showToast('권한 설정이 저장되었습니다.', 'success');
  };
})();
