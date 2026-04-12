var _donationList = [];
var _members = {};

$(document).ready(function () {
  activateSidebar('donation');

  $.when(
    $.getJSON('/v2/ReadingRun/DailySummary'),
    $.getJSON('/v2/ReadingRun/Results'),
    $.getJSON('/v2/ReadingRun/Members')
  ).done(function (r1, r2, r3) {
    var summary = r1[0];
    var results = r2[0];
    var members = r3[0];

    members.forEach(function (m) { _members[m.Member_No] = m; });

    $('#valUpdateDt').text(summary.updateDt);
    $('#valTotalDonation').text(BO.numFormat(summary.total.donationAmt));
    $('#valStarterDonation').text(BO.numFormat(summary.starter.donation));
    $('#valHalfDonation').text(BO.numFormat(summary.half.donation));
    $('#valMarathonDonation').text(BO.numFormat(summary.marathon.donation));

    _donationList = results.filter(function (d) { return d.Donation_Apply_Yn; });
    _donationList.sort(function (a, b) {
      return (b.Result_Apply_Datetime || '').localeCompare(a.Result_Apply_Datetime || '');
    });

    $('#totalCnt').text(BO.numFormat(_donationList.length));
    renderDonation(1);
  });
});

function renderDonation(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _donationList.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = _donationList[i];
    var m = _members[d.Member_No] || {};
    rows += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (m.Member_Id || d.Member_No) + '</td>' +
      '<td>' + BO.courseLabel(d.Course_Name) + '</td>' +
      '<td>' + BO.dateFormat(d.Complete_Datetime) + '</td>' +
      '<td>' + BO.dateFormat(d.Result_Apply_Datetime) + '</td>' +
      '</tr>';
  }

  $('#donationBody').html(rows || '<tr><td colspan="5" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('donationPag', _donationList.length, page, pageSize, 'renderDonation');
}
