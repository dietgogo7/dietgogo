var _statsList = [];
var _filtered = [];

$(document).ready(function () {
  loadSidebar('badge-stats');

  $.when(
    $.getJSON('datas/tReadingRunRewardMaster.json'),
    $.getJSON('datas/tReadingRunRewardHistory.json')
  ).done(function (r1, r2) {
    var masters = r1[0];
    var history = r2[0];

    // 배지 코드별 집계
    var statsMap = {};
    masters.forEach(function (m) {
      statsMap[m.Reward_Code] = {
        Reward_Code: m.Reward_Code,
        Reward_Name: m.Reward_Name,
        Reward_Type: m.Reward_Type,
        Use_YN: m.Use_YN,
        count: 0,
        memberSet: {},
        lastDate: null
      };
    });

    history.forEach(function (h) {
      var s = statsMap[h.Reward_Code];
      if (!s) return;
      s.count++;
      s.memberSet[h.Member_No] = true;
      if (!s.lastDate || h.Regist_Datetime > s.lastDate) {
        s.lastDate = h.Regist_Datetime;
      }
    });

    _statsList = [];
    for (var code in statsMap) {
      var s = statsMap[code];
      _statsList.push({
        Reward_Code: s.Reward_Code,
        Reward_Name: s.Reward_Name,
        Reward_Type: s.Reward_Type,
        Use_YN: s.Use_YN,
        count: s.count,
        memberCount: Object.keys(s.memberSet).length,
        lastDate: s.lastDate
      });
    }
    _statsList.sort(function (a, b) { return b.count - a.count; });

    // 요약 카드
    var badgeTypes = masters.filter(function (m) { return m.Reward_Type === 'BADGE' && !m.Delete_YN; });
    var giftTypes = masters.filter(function (m) { return m.Reward_Type === 'GIFT' && !m.Delete_YN; });
    var badgeHist = history.filter(function (h) { return h.Reward_Type === 'BADGE'; });
    var giftHist = history.filter(function (h) { return h.Reward_Type === 'GIFT'; });

    $('#valBadgeType').text(badgeTypes.length);
    $('#valBadgeTotal').text(BO.numFormat(badgeHist.length));
    $('#valGiftType').text(giftTypes.length);
    $('#valGiftTotal').text(BO.numFormat(giftHist.length));

    doFilter();
  });
});

function doFilter() {
  var type = $('#fType').val();
  _filtered = _statsList.filter(function (d) {
    if (type && d.Reward_Type !== type) return false;
    return true;
  });
  renderPage(1);
}

function renderPage(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _filtered.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = _filtered[i];
    var typeLabel = d.Reward_Type === 'BADGE' ? '<span class="badge badge-blue">BADGE</span>' : '<span class="badge badge-yellow">GIFT</span>';
    rows += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td class="code-cell">' + d.Reward_Code + '</td>' +
      '<td class="text-left">' + d.Reward_Name + '</td>' +
      '<td>' + typeLabel + '</td>' +
      '<td class="text-bold">' + BO.numFormat(d.count) + '</td>' +
      '<td>' + BO.numFormat(d.memberCount) + '</td>' +
      '<td>' + BO.dateFormat(d.lastDate) + '</td>' +
      '<td>' + BO.ynIcon(d.Use_YN) + '</td>' +
      '</tr>';
  }

  $('#tableBody').html(rows || '<tr><td colspan="8" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('pagination', _filtered.length, page, pageSize, 'renderPage');
}
