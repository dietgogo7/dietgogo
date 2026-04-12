var _allMembers = [];
var _filtered = [];

$(document).ready(function () {
  activateSidebar('member-list');

  $.getJSON('/v2/ReadingRun/Members', function (data) {
    _allMembers = data;
    doSearch();
  });

  $('#fKeyword').on('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });
});

function doSearch() {
  var field = $('#fField').val();
  var keyword = $.trim($('#fKeyword').val()).toLowerCase();
  var course = $('#fCourse').val();
  var start = $('#fStart').val();
  var end = $('#fEnd').val();

  _filtered = _allMembers.filter(function (m) {
    if (keyword) {
      var val = String(m[field] || '').toLowerCase();
      if (val.indexOf(keyword) === -1) return false;
    }
    if (course && m.Current_Course !== course) return false;
    var rd = BO.dateOnly(m.Regist_Datetime);
    if (start && rd < start) return false;
    if (end && rd > end) return false;
    return true;
  });

  $('#totalCnt').text(BO.numFormat(_filtered.length));
  renderPage(1);
}

function doReset() {
  $('#fField').val('Member_Id');
  $('#fKeyword').val('');
  $('#fCourse').val('');
  $('#fStart').val('2026-03-01');
  $('#fEnd').val('2026-04-11');
  doSearch();
}

function renderPage(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _filtered.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var m = _filtered[i];
    rows += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><a href="/ReadingRun/MemberDetail?memberNo=' + m.Member_No + '" class="link-primary">' + m.Member_Id + '</a></td>' +
      '<td>' + BO.courseLabel(m.Current_Course) + '</td>' +
      '<td>' + BO.numFormat(m.Total_Reading_Time) + '</td>' +
      '<td>' + m.Total_Distance + '</td>' +
      '<td>' + m.Complete_Count + '</td>' +
      '<td>' + BO.dateFormat(m.Last_Activity_Datetime) + '</td>' +
      '<td>' + BO.dateFormat(m.Regist_Datetime) + '</td>' +
      '</tr>';
  }

  $('#tableBody').html(rows || '<tr><td colspan="8" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('pagination', _filtered.length, page, pageSize, 'renderPage');
}
