/* =====================================================
   리딩런 어드민 BackOffice - 공통 유틸리티
   ===================================================== */

var BO = {
  numFormat: function (n) {
    if (n == null || n === '') return '0';
    return Number(n).toLocaleString('ko-KR');
  },
  dateFormat: function (str) {
    if (!str) return '-';
    return String(str).replace('T', ' ').substring(0, 16);
  },
  dateOnly: function (str) {
    if (!str) return '-';
    return String(str).substring(0, 10);
  },
  toast: function (msg, type) {
    var colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb' };
    var bg = colors[type || 'info'];
    var el = $('<div></div>').text(msg).css({
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '10px 18px', borderRadius: '6px', fontSize: '13px',
      color: '#fff', background: bg, boxShadow: '0 4px 12px rgba(0,0,0,.15)'
    });
    $('body').append(el);
    setTimeout(function () {
      el.css({ opacity: 0, transition: 'opacity .4s' });
      setTimeout(function () { el.remove(); }, 400);
    }, 2200);
  },
  confirm: function (msg, cb) {
    if (window.confirm(msg)) cb();
  },
  ynIcon: function (val) {
    return val ? '<span class="yn-yes">✔</span>' : '<span class="yn-no">—</span>';
  },
  courseLabel: function (name) {
    var map = {
      'Starter': '<span class="badge badge-blue">스타터</span>',
      'Half': '<span class="badge badge-green">하프</span>',
      'Marathon': '<span class="badge badge-yellow">마라톤</span>'
    };
    return map[name] || name;
  },
  statusLabel: function (code) {
    var map = {
      'COMPLETE': '<span class="badge badge-green">완주</span>',
      'IN_PROGRESS': '<span class="badge badge-blue">진행중</span>',
      'CANCEL': '<span class="badge badge-red">취소</span>',
      'TIMEOUT': '<span class="badge badge-gray">시간초과</span>'
    };
    return map[code] || code;
  }
};

/* ---- 사이드바 활성 메뉴 표시 ---- */
function activateSidebar(activePage) {
  $('.lnb-item[data-page="' + activePage + '"]').addClass('active');
}

/* ---- 공통 페이지네이션 ---- */
function renderPagination(containerId, totalCount, currentPage, pageSize, callbackName) {
  pageSize = pageSize || 20;
  var totalPages = Math.ceil(totalCount / pageSize) || 1;
  var blockSize = 10;
  var blockStart = Math.floor((currentPage - 1) / blockSize) * blockSize + 1;
  var blockEnd = Math.min(blockStart + blockSize - 1, totalPages);

  var html = '<div class="pag-wrap">' +
    '<div class="pag-info">총 <strong>' + BO.numFormat(totalCount) + '</strong>건 | 페이지 <strong>' + currentPage + ' / ' + totalPages + '</strong></div>';

  if (totalPages > 1) {
    html += '<nav class="pag-nav">';
    if (blockStart > 1) {
      html += '<button class="pag-btn" onclick="' + callbackName + '(1)">&laquo;</button>';
      html += '<button class="pag-btn" onclick="' + callbackName + '(' + (blockStart - 1) + ')">&lt;</button>';
    }
    for (var p = blockStart; p <= blockEnd; p++) {
      html += '<button class="pag-btn' + (p === currentPage ? ' active' : '') + '" onclick="' + callbackName + '(' + p + ')">' + p + '</button>';
    }
    if (blockEnd < totalPages) {
      html += '<button class="pag-btn" onclick="' + callbackName + '(' + (blockEnd + 1) + ')">&gt;</button>';
      html += '<button class="pag-btn" onclick="' + callbackName + '(' + totalPages + ')">&raquo;</button>';
    }
    html += '</nav>';
  }
  html += '</div>';
  $('#' + containerId).html(html);
}
