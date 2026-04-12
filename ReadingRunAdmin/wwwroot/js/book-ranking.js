var _bookNames = {
  90001: '데미안', 90002: '어린 왕자', 90003: '1984', 90004: '호밀밭의 파수꾼',
  90005: '위대한 개츠비', 90006: '노인과 바다', 90007: '변신', 90008: '앵무새 죽이기',
  90009: '파리대왕', 90010: '동물농장'
};

var _rankingData = [];
var _filtered = [];

$(document).ready(function () {
  loadSidebar('book-ranking');

  $.when(
    $.getJSON('/api/readingrun/memberbooks'),
    $.getJSON('/api/readingrun/activities')
  ).done(function (r1, r2) {
    var memberBooks = r1[0];
    var activities = r2[0];

    // 상품번호별 선택 횟수 집계
    var goodsMap = {};
    memberBooks.forEach(function (mb) {
      var key = mb.Goods_No;
      if (!goodsMap[key]) {
        goodsMap[key] = { Goods_No: key, count: 0, firstDate: mb.Regist_Datetime, courses: {} };
      }
      goodsMap[key].count++;
      if (mb.Regist_Datetime < goodsMap[key].firstDate) {
        goodsMap[key].firstDate = mb.Regist_Datetime;
      }
    });

    // 활동 데이터에서 코스 매핑
    activities.forEach(function (a) {
      if (goodsMap[a.Goods_No]) {
        goodsMap[a.Goods_No].courses[a.Course_Name] = true;
      }
    });

    _rankingData = [];
    for (var gno in goodsMap) {
      var g = goodsMap[gno];
      _rankingData.push({
        Goods_No: g.Goods_No,
        Book_Name: _bookNames[g.Goods_No] || '도서 #' + g.Goods_No,
        count: g.count,
        firstDate: g.firstDate,
        courses: Object.keys(g.courses).join(', ') || '-'
      });
    }

    _rankingData.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return (a.firstDate || '').localeCompare(b.firstDate || '');
    });

    doSearch();
  });

  $('#fKeyword').on('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });
});

function doSearch() {
  var course = $('#fCourse').val();
  var keyword = $.trim($('#fKeyword').val()).toLowerCase();

  _filtered = _rankingData.filter(function (d) {
    if (course && d.courses.indexOf(course) === -1) return false;
    if (keyword) {
      var nameMatch = d.Book_Name.toLowerCase().indexOf(keyword) !== -1;
      var noMatch = String(d.Goods_No).indexOf(keyword) !== -1;
      if (!nameMatch && !noMatch) return false;
    }
    return true;
  });

  $('#totalCnt').text(BO.numFormat(_filtered.length));
  renderPage(1);
}

function doReset() {
  $('#fDate').val('2026-04-11');
  $('#fCourse').val('');
  $('#fKeyword').val('');
  doSearch();
}

function renderPage(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _filtered.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = _filtered[i];
    var rankClass = '';
    if (i === 0) rankClass = 'rank-1';
    else if (i === 1) rankClass = 'rank-2';
    else if (i === 2) rankClass = 'rank-3';

    rows += '<tr>' +
      '<td class="' + rankClass + '">' + (i + 1) + '</td>' +
      '<td>' + d.Goods_No + '</td>' +
      '<td class="text-left">' + d.Book_Name + '</td>' +
      '<td>' + d.courses + '</td>' +
      '<td class="text-bold">' + BO.numFormat(d.count) + '</td>' +
      '<td>' + BO.dateFormat(d.firstDate) + '</td>' +
      '</tr>';
  }

  $('#tableBody').html(rows || '<tr><td colspan="6" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('pagination', _filtered.length, page, pageSize, 'renderPage');
}
