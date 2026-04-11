$(document).ready(function () {
  loadSidebar('dashboard');

  $.getJSON('datas/tReadingRunDailySummary.json', function (data) {
    var D = data;

    function calcRate(c, j) {
      return j ? ((c / j) * 100).toFixed(1) : '0.0';
    }

    $('#valCampaignStart').text(D.campaignStart);
    $('#valUpdateDt').text(D.updateDt);

    $('#valTotalParticipant').text(BO.numFormat(D.total.participant));
    $('#valTotalSession').text(BO.numFormat(D.total.session));
    $('#valTotalReadingTime').text(BO.numFormat(D.total.readingTime));
    $('#valTotalComplete').text(BO.numFormat(D.total.complete));
    $('#valTotalDonation').text(BO.numFormat(D.total.donationAmt));

    $('#valStarterJoin').text(BO.numFormat(D.starter.join));
    $('#valStarterComplete').text(BO.numFormat(D.starter.complete));
    $('#valStarterRate').text(calcRate(D.starter.complete, D.starter.join));
    $('#valStarterRemain').text(BO.numFormat(D.starter.remain));
    $('#valStarterDonation').text(BO.numFormat(D.starter.donation));

    $('#valHalfJoin').text(BO.numFormat(D.half.join));
    $('#valHalfComplete').text(BO.numFormat(D.half.complete));
    $('#valHalfRate').text(calcRate(D.half.complete, D.half.join));
    $('#valHalfRemain').text(BO.numFormat(D.half.remain));
    $('#valHalfDonation').text(BO.numFormat(D.half.donation));

    $('#valMarathonJoin').text(BO.numFormat(D.marathon.join));
    $('#valMarathonComplete').text(BO.numFormat(D.marathon.complete));
    $('#valMarathonRate').text(calcRate(D.marathon.complete, D.marathon.join));
    $('#valMarathonRemain').text(BO.numFormat(D.marathon.remain));
    $('#valMarathonDonation').text(BO.numFormat(D.marathon.donation));

    window._dailyData = D.daily;
    renderDaily(1);
  });
});

function renderDaily(page) {
  var pageSize = 10;
  var data = window._dailyData || [];
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, data.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = data[i];
    rows += '<tr>' +
      '<td>' + d.Standard_Date + '</td>' +
      '<td>' + BO.numFormat(d.Total_Participant_Count) + '</td>' +
      '<td>' + BO.numFormat(d.Total_Donation_Amount) + '</td>' +
      '<td>' + BO.numFormat(d.Total_Complete_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Starter_Join_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Starter_Complete_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Half_Join_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Half_Complete_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Marathon_Join_Times) + '</td>' +
      '<td>' + BO.numFormat(d.Marathon_Complete_Times) + '</td>' +
      '</tr>';
  }

  $('#dailyBody').html(rows || '<tr><td colspan="10" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('dailyPag', data.length, page, pageSize, 'renderDaily');
}
