var _allData = [];
var _filtered = [];
var _members = {};

$(document).ready(function () {
  loadSidebar('course-status');

  $.when(
    $.getJSON('/api/readingrun/results'),
    $.getJSON('/api/readingrun/members')
  ).done(function (r1, r2) {
    _allData = r1[0];
    var members = r2[0];
    members.forEach(function (m) { _members[m.Member_No] = m; });
    doSearch();
  });
});

function doSearch() {
  var course = $('#fCourse').val();
  var complete = $('#fComplete').val();
  var start = $('#fStart').val();
  var end = $('#fEnd').val();
  var memberId = $.trim($('#fMember').val()).toLowerCase();

  _filtered = _allData.filter(function (d) {
    if (course && d.Course_Name !== course) return false;
    if (complete === '1' && !d.Complete_Yn) return false;
    if (complete === '0' && d.Complete_Yn) return false;
    var sd = BO.dateOnly(d.Course_Start_Datetime);
    if (start && sd < start) return false;
    if (end && sd > end) return false;
    if (memberId) {
      var m = _members[d.Member_No];
      if (!m || m.Member_Id.toLowerCase().indexOf(memberId) === -1) return false;
    }
    return true;
  });

  $('#totalCnt').text(BO.numFormat(_filtered.length));
  renderPage(1);
}

function doReset() {
  $('#fCourse').val('');
  $('#fComplete').val('');
  $('#fStart').val('2026-03-01');
  $('#fEnd').val('2026-04-11');
  $('#fMember').val('');
  doSearch();
}

function renderPage(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _filtered.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = _filtered[i];
    var m = _members[d.Member_No] || {};
    rows += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (m.Member_Id || d.Member_No) + '</td>' +
      '<td>' + BO.courseLabel(d.Course_Name) + '</td>' +
      '<td>' + d.Course_Round_No + '</td>' +
      '<td>' + BO.statusLabel(d.Result_Status_Code) + '</td>' +
      '<td>' + BO.dateFormat(d.Course_Start_Datetime) + '</td>' +
      '<td>' + BO.ynIcon(d.Complete_Yn) + '</td>' +
      '<td>' + BO.dateFormat(d.Complete_Datetime) + '</td>' +
      '<td>' + BO.ynIcon(d.Badge_Reward_Yn) + '</td>' +
      '<td>' + BO.ynIcon(d.Gift_Reward_Yn) + '</td>' +
      '<td>' + BO.ynIcon(d.Donation_Apply_Yn) + '</td>' +
      '<td>' + BO.dateFormat(d.Regist_Datetime) + '</td>' +
      '</tr>';
  }

  $('#tableBody').html(rows || '<tr><td colspan="12" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('pagination', _filtered.length, page, pageSize, 'renderPage');
}
