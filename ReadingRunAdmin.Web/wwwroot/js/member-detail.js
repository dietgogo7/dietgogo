$(document).ready(function () {
  activateSidebar('member-list');

  var params = new URLSearchParams(window.location.search);
  var memberNo = parseInt(params.get('memberNo'), 10);
  if (!memberNo) {
    BO.toast('회원 번호가 올바르지 않습니다.', 'error');
    return;
  }

  $.when(
    $.getJSON('/v2/ReadingRun/Members'),
    $.getJSON('/v2/ReadingRun/Results'),
    $.getJSON('/v2/ReadingRun/Activities'),
    $.getJSON('/v2/ReadingRun/RewardHistory')
  ).done(function (r1, r2, r3, r4) {
    var members = r1[0];
    var results = r2[0];
    var activities = r3[0];
    var rewards = r4[0];

    var member = null;
    for (var i = 0; i < members.length; i++) {
      if (members[i].Member_No === memberNo) { member = members[i]; break; }
    }
    if (!member) {
      BO.toast('회원 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    // 기본 정보
    $('#memberInfo').html(
      '<div><div class="info-item-label">회원 번호</div><div class="info-item-val">' + member.Member_No + '</div></div>' +
      '<div><div class="info-item-label">회원 ID</div><div class="info-item-val">' + member.Member_Id + '</div></div>' +
      '<div><div class="info-item-label">현재 코스</div><div>' + BO.courseLabel(member.Current_Course) + '</div></div>' +
      '<div><div class="info-item-label">총 완주 횟수</div><div class="info-item-val-complete">' + member.Complete_Count + '</div></div>' +
      '<div><div class="info-item-label">총 독서 시간(분)</div><div class="info-item-val-primary">' + BO.numFormat(member.Total_Reading_Time) + '</div></div>' +
      '<div><div class="info-item-label">누적 거리(km)</div><div class="info-item-val-dark">' + member.Total_Distance + '</div></div>' +
      '<div><div class="info-item-label">마지막 활동일시</div><div>' + BO.dateFormat(member.Last_Activity_Datetime) + '</div></div>' +
      '<div><div class="info-item-label">이벤트 가입일시</div><div>' + BO.dateFormat(member.Regist_Datetime) + '</div></div>'
    );

    // 리워드 정보
    var memberRewards = rewards.filter(function (r) { return r.Member_No === memberNo; });
    var badges = memberRewards.filter(function (r) { return r.Reward_Type === 'BADGE'; });
    var gifts = memberRewards.filter(function (r) { return r.Reward_Type === 'GIFT'; });
    $('#badgeCnt').text(badges.length);
    $('#giftCnt').text(gifts.length);

    // 배지 팝업
    var badgeRows = '';
    badges.forEach(function (b, idx) {
      badgeRows += '<tr><td>' + (idx + 1) + '</td><td class="code-cell">' + b.Reward_Code + '</td><td class="text-left">' + b.Reward_Name + '</td><td>' + BO.dateFormat(b.Regist_Datetime) + '</td></tr>';
    });
    $('#badgeBody').html(badgeRows || '<tr><td colspan="4" class="empty-row">배지 획득 이력이 없습니다.</td></tr>');

    // 상품권 팝업
    var giftRows = '';
    gifts.forEach(function (g, idx) {
      giftRows += '<tr><td>' + (idx + 1) + '</td><td class="code-cell">' + g.Reward_Code + '</td><td class="text-left">' + g.Reward_Name + '</td><td>' + BO.dateFormat(g.Regist_Datetime) + '</td></tr>';
    });
    $('#giftBody').html(giftRows || '<tr><td colspan="4" class="empty-row">상품권 발급 이력이 없습니다.</td></tr>');

    // 챌린지 참여 상세
    var memberResults = results.filter(function (r) { return r.Member_No === memberNo; });
    $('#resultCnt').text(memberResults.length);
    var resultRows = '';
    memberResults.forEach(function (d, idx) {
      resultRows += '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + BO.courseLabel(d.Course_Name) + '</td>' +
        '<td>' + d.Course_Round_No + '</td>' +
        '<td>' + BO.statusLabel(d.Result_Status_Code) + '</td>' +
        '<td>' + BO.dateFormat(d.Course_Start_Datetime) + '</td>' +
        '<td>' + BO.ynIcon(d.Complete_Yn) + '</td>' +
        '<td>' + BO.dateFormat(d.Complete_Datetime) + '</td>' +
        '<td>' + BO.ynIcon(d.Certificate_Create_Yn) + '</td>' +
        '<td>' + BO.ynIcon(d.Badge_Reward_Yn) + '</td>' +
        '<td>' + BO.ynIcon(d.Gift_Reward_Yn) + '</td>' +
        '<td>' + BO.ynIcon(d.Donation_Apply_Yn) + '</td>' +
        '</tr>';
    });
    $('#resultBody').html(resultRows || '<tr><td colspan="11" class="empty-row">참여 이력이 없습니다.</td></tr>');

    // 독서 활동
    var memberActs = activities.filter(function (a) { return a.Member_No === memberNo; });
    memberActs.sort(function (a, b) { return (b.Activity_Date || '').localeCompare(a.Activity_Date || ''); });
    $('#actCnt').text(memberActs.length);
    var actRows = '';
    memberActs.forEach(function (a, idx) {
      actRows += '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + a.Activity_Date + '</td>' +
        '<td>' + BO.courseLabel(a.Course_Name) + '</td>' +
        '<td>' + BO.statusLabel(a.Session_Status) + '</td>' +
        '<td>' + BO.dateFormat(a.Session_Start_Datetime) + '</td>' +
        '<td>' + BO.dateFormat(a.Session_End_Datetime) + '</td>' +
        '<td>' + (a.Reading_Time != null ? a.Reading_Time : '-') + '</td>' +
        '<td>' + (a.Distance != null ? a.Distance : '-') + '</td>' +
        '<td>' + a.Goods_No + '</td>' +
        '</tr>';
    });
    $('#activityBody').html(actRows || '<tr><td colspan="9" class="empty-row">활동 이력이 없습니다.</td></tr>');
  });
});
