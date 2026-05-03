/**
 * AX Data Admin - Common Utilities
 */
const AX = (() => {

  /* ===== Toast ===== */
  function toast(msg, type = 'default', duration = 3000) {
    const icons = { success: 'check-circle-fill', error: 'x-circle-fill', warning: 'exclamation-triangle-fill', default: 'info-circle-fill' };
    const icon  = icons[type] || icons.default;
    const $t = $(`
      <div class="toast ${type}">
        <i class="bi bi-${icon}"></i>
        <span>${msg}</span>
      </div>`);
    $('#toastContainer').append($t);
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), duration);
  }

  /* ===== Modal helpers ===== */
  function openModal(id)  { $('#' + id).addClass('open'); }
  function closeModal(id) { $('#' + id).removeClass('open'); }

  $(document).on('click', '.modal-overlay', function (e) {
    if ($(e.target).hasClass('modal-overlay')) closeModal($(this).attr('id'));
  });
  $(document).on('click', '.modal-close', function () {
    $(this).closest('.modal-overlay').removeClass('open');
  });

  /* ===== Date helpers ===== */
  function today(sep = '-') {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return [y, m, day].join(sep);
  }

  function formatDate(str) {
    if (!str) return '-';
    return str.replace('T', ' ').slice(0, 16);
  }

  function daysAgo(n, sep = '-') {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return [y, m, day].join(sep);
  }

  /* ===== Number ===== */
  function comma(n) {
    if (n === null || n === undefined) return '-';
    return Number(n).toLocaleString('ko-KR');
  }

  /* ===== Pagination ===== */
  function buildPagination($container, total, page, pageSize, onPageChange) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) { $container.empty(); return; }

    let html = '';
    html += `<button class="page-btn" data-page="1"    ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-bar-left"></i></button>`;
    html += `<button class="page-btn" data-page="${page-1}" ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;

    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (end < totalPages) html += `<button class="page-btn" disabled>…</button>`;

    html += `<button class="page-btn" data-page="${page+1}" ${page === totalPages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;
    html += `<button class="page-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}><i class="bi bi-chevron-bar-right"></i></button>`;

    $container.html(html);
    $container.off('click', '.page-btn').on('click', '.page-btn', function () {
      const p = parseInt($(this).data('page'));
      if (!isNaN(p) && p >= 1 && p <= totalPages) onPageChange(p);
    });
  }

  /* ===== Status badge ===== */
  function statusBadge(status) {
    const map = {
      '성공': 'success', '정상': 'success',
      '실패': 'danger',  '경고': 'warning',
      '비활성': 'gray',  'inactive': 'gray',
      'active': 'success'
    };
    const cls = map[status] || 'gray';
    return `<span class="badge badge-${cls}">${status}</span>`;
  }

  /* ===== Cycle badge ===== */
  function cycleBadge(cycle) {
    return `<span class="badge badge-cycle">${cycle}</span>`;
  }

  /* ===== Confirm dialog ===== */
  function confirm(msg) {
    return window.confirm(msg);
  }

  /* ===== Load JSON ($.getJSON wrapper with path helper) ===== */
  function loadJSON(file) {
    return $.getJSON(dataPath(file));
  }

  /* ===== Flatten menu tree to array ===== */
  function flattenMenus(menus, result = []) {
    menus.forEach(m => {
      result.push(m);
      if (m.children) flattenMenus(m.children, result);
    });
    return result;
  }

  return { toast, openModal, closeModal, today, daysAgo, formatDate, comma, buildPagination, statusBadge, cycleBadge, confirm, loadJSON, flattenMenus };
})();
