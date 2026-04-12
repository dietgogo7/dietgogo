var _allBadges = [];

$(document).ready(function () {
  loadSidebar('badge-list');

  $.getJSON('/api/readingrun/rewards/masters', function (data) {
    _allBadges = data.filter(function (d) { return !d.Delete_YN; });
    $('#totalCnt').text(_allBadges.length);
    renderPage(1);
  });
});

function renderPage(page) {
  var pageSize = 20;
  var start = (page - 1) * pageSize;
  var end = Math.min(start + pageSize, _allBadges.length);
  var rows = '';

  for (var i = start; i < end; i++) {
    var d = _allBadges[i];
    var typeLabel = d.Reward_Type === 'BADGE' ? '<span class="badge badge-blue">BADGE</span>' : '<span class="badge badge-yellow">GIFT</span>';
    rows += '<tr>' +
      '<td><input type="checkbox" class="row-check" value="' + d.Seq + '" onchange="updateDeleteBtn()"/></td>' +
      '<td>' + (i + 1) + '</td>' +
      '<td class="code-cell">' + d.Reward_Code + '</td>' +
      '<td class="text-left">' + d.Reward_Name + '</td>' +
      '<td>' + typeLabel + '</td>' +
      '<td class="text-left text-ellipsis">' + (d.Reward_Description || '-') + '</td>' +
      '<td>' + (d.Reward_Value != null ? BO.numFormat(d.Reward_Value) : '-') + '</td>' +
      '<td>' + BO.ynIcon(d.Use_YN) + '</td>' +
      '<td>' + BO.dateFormat(d.Regist_Datetime) + '</td>' +
      '<td>' + BO.dateFormat(d.Update_Datetime) + '</td>' +
      '<td><button class="link-btn" onclick="openEditModal(' + d.Seq + ')">수정</button></td>' +
      '</tr>';
  }

  $('#tableBody').html(rows || '<tr><td colspan="11" class="empty-row">데이터가 없습니다.</td></tr>');
  renderPagination('pagination', _allBadges.length, page, pageSize, 'renderPage');
}

function toggleAll(el) {
  $('.row-check').prop('checked', el.checked);
  updateDeleteBtn();
}

function updateDeleteBtn() {
  var cnt = $('.row-check:checked').length;
  if (cnt > 0) { $('#btnDeleteSel').removeClass('hidden'); } else { $('#btnDeleteSel').addClass('hidden'); }
}

function deleteSelected() {
  var seqs = [];
  $('.row-check:checked').each(function () { seqs.push(parseInt($(this).val(), 10)); });
  if (!seqs.length) return;

  BO.confirm(seqs.length + '개 항목을 삭제하시겠습니까?', function () {
    console.log('[DELETE] 배지 삭제 요청:', seqs);
    $.ajax({
      url: '/api/readingrun/rewards/masters',
      type: 'DELETE',
      contentType: 'application/json',
      data: JSON.stringify(seqs)
    });
    BO.toast(seqs.length + '개 항목이 삭제되었습니다.', 'success');
    _allBadges = _allBadges.filter(function (d) { return seqs.indexOf(d.Seq) === -1; });
    $('#totalCnt').text(_allBadges.length);
    $('#checkAll').prop('checked', false);
    renderPage(1);
  });
}

function openRegisterModal() {
  $('#regName').val('');
  $('#regType').val('BADGE');
  $('#regCode').val('');
  $('#regDesc').val('');
  $('#regMsg').val('');
  $('#regVal').val('');
  $('#regUse').prop('checked', true);
  $('#regModal').addClass('active');
}

function confirmRegister() {
  var name = $.trim($('#regName').val());
  if (!name) { BO.toast('배지명을 입력하세요.', 'error'); return; }

  var payload = {
    Reward_Name: name,
    Reward_Type: $('#regType').val(),
    Reward_Code: $.trim($('#regCode').val()),
    Reward_Description: $.trim($('#regDesc').val()),
    Reward_Message: $.trim($('#regMsg').val()),
    Reward_Value: $('#regVal').val() ? parseInt($('#regVal').val(), 10) : null,
    Use_YN: $('#regUse').is(':checked')
  };

  console.log('[POST] 배지 등록 요청:', JSON.stringify(payload, null, 2));
  $.ajax({
    url: '/api/readingrun/rewards/masters',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(payload)
  });
  BO.toast('배지가 등록되었습니다.', 'success');
  $('#regModal').removeClass('active');

  // 로컬 반영
  payload.Seq = (_allBadges.length > 0 ? Math.max.apply(null, _allBadges.map(function (d) { return d.Seq; })) : 0) + 1;
  payload.Event_No = 1;
  payload.Delete_YN = false;
  payload.Regist_Datetime = new Date().toISOString();
  payload.Update_Datetime = null;
  _allBadges.push(payload);
  $('#totalCnt').text(_allBadges.length);
  renderPage(1);
}

function openEditModal(seq) {
  var item = null;
  for (var i = 0; i < _allBadges.length; i++) {
    if (_allBadges[i].Seq === seq) { item = _allBadges[i]; break; }
  }
  if (!item) return;

  $('#editSeq').val(item.Seq);
  $('#editCode').val(item.Reward_Code);
  $('#editName').val(item.Reward_Name);
  $('#editDesc').val(item.Reward_Description || '');
  $('#editMsg').val(item.Reward_Message || '');
  $('#editVal').val(item.Reward_Value || '');
  $('#editUse').prop('checked', item.Use_YN);
  $('#editModal').addClass('active');
}

function confirmEdit() {
  var seq = parseInt($('#editSeq').val(), 10);
  var name = $.trim($('#editName').val());
  if (!name) { BO.toast('배지명을 입력하세요.', 'error'); return; }

  var payload = {
    Seq: seq,
    Reward_Name: name,
    Reward_Description: $.trim($('#editDesc').val()),
    Reward_Message: $.trim($('#editMsg').val()),
    Reward_Value: $('#editVal').val() ? parseInt($('#editVal').val(), 10) : null,
    Use_YN: $('#editUse').is(':checked')
  };

  console.log('[POST] 배지 수정 요청:', JSON.stringify(payload, null, 2));
  $.ajax({
    url: '/api/readingrun/rewards/masters/' + seq,
    type: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(payload)
  });
  BO.toast('배지가 수정되었습니다.', 'success');
  $('#editModal').removeClass('active');

  // 로컬 반영
  for (var i = 0; i < _allBadges.length; i++) {
    if (_allBadges[i].Seq === seq) {
      _allBadges[i].Reward_Name = payload.Reward_Name;
      _allBadges[i].Reward_Description = payload.Reward_Description;
      _allBadges[i].Reward_Message = payload.Reward_Message;
      _allBadges[i].Reward_Value = payload.Reward_Value;
      _allBadges[i].Use_YN = payload.Use_YN;
      _allBadges[i].Update_Datetime = new Date().toISOString();
      break;
    }
  }
  renderPage(1);
}
