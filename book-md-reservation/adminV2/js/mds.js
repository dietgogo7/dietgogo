/**
 * adminV2/js/mds.js
 * MD 관리 페이지 전용 (mds.html)
 */
$(function () {
    var AC = window.AdminCommon;
    var allMds = [];
    var allBookings = [];

    // DOM Elements
    var mdsTbody = $('#mds-tbody');
    var mdIdInput = $('#md-no');
    var mdNameInput = $('#md-name');
    var mdTeamNameInput = $('#md-team');
    var mdCategoryInput = $('#md-category');
    var mdEmailInput = $('#md-email');
    var mdPhoneInput = $('#md-phone');
    var $mdForm = $('#md-form');
    var btnResetMd = $('#btn-md-reset');

    // --- 초기화 ---
    AC.loadSidebar(function () {
        $.when(
            AC.loadJSON('mds.json'),
            AC.loadJSON('bookings.json')
        ).done(function (mdsRes, bookingsRes) {
            allMds = mdsRes[0];
            allBookings = bookingsRes[0];
            renderMdsTable();
            AC.renderMeetingKing(allBookings);
        }).fail(function (err) {
            console.error('데이터 로드 실패:', err);
        });
    });

    // --- MD 목록 렌더링 ---
    function renderMdsTable() {
        if (!mdsTbody.length) return;
        mdsTbody.empty();

        $.each(allMds, function (i, md) {
            var $row = $('<tr>' +
                '<td>' + md.Md_No + '</td>' +
                '<td>' + md.Md_Name + '</td>' +
                '<td>' + (md.Team_Name || '-') + '</td>' +
                '<td>' + md.Category_Name + '</td>' +
                '<td>' + (md.Email || '-') + '</td>' +
                '<td>' + (md.Phone_No || '-') + '</td>' +
                '<td>' +
                '<button class="btn-xs btn-approve action-edit">수정</button>' +
                '<button class="btn-xs btn-reject action-delete">삭제</button>' +
                '</td>' +
                '</tr>');

            $row.find('.action-edit').on('click', function () { editMd(md.Md_No); });
            $row.find('.action-delete').on('click', function () { deleteMd(md.Md_No); });
            mdsTbody.append($row);
        });
    }

    // --- MD 수정 ---
    function editMd(id) {
        var md = null;
        $.each(allMds, function (i, m) {
            if (m.Md_No === id) { md = m; return false; }
        });
        if (!md) return;
        mdIdInput.val(md.Md_No);
        mdNameInput.val(md.Md_Name);
        mdTeamNameInput.val(md.Team_Name || '');
        mdCategoryInput.val(md.Category_Name);
        mdEmailInput.val(md.Email || '');
        mdPhoneInput.val(md.Phone_No || '');
        $(window).scrollTop(0);
    }

    // --- MD 삭제 ---
    function deleteMd(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        allMds = $.grep(allMds, function (m) { return m.Md_No !== id; });
        renderMdsTable();
    }

    // --- 저장 ---
    if ($mdForm.length) {
        $mdForm.on('submit', function (e) {
            e.preventDefault();
            var id = mdIdInput.val();
            var name = mdNameInput.val().trim();
            var teamName = mdTeamNameInput.val().trim();
            var category = mdCategoryInput.val().trim();
            var email = mdEmailInput.val().trim();
            var phone = mdPhoneInput.val().trim();

            if (!name || !category) {
                alert('이름과 분야는 필수입니다.');
                return;
            }

            if (id) {
                $.each(allMds, function (i, m) {
                    if (m.Md_No === id) {
                        m.Md_Name = name;
                        m.Team_Name = teamName;
                        m.Category_Name = category;
                        m.Email = email;
                        m.Phone_No = phone;
                        return false;
                    }
                });
            } else {
                allMds.push({
                    Md_No: 'md-' + Date.now(), Md_Name: name, Team_Name: teamName,
                    Category_Name: category, Email: email, Phone_No: phone, Status: 'AVAILABLE'
                });
            }

            console.log('[POST] MD 저장:', { Md_No: id, Md_Name: name, Team_Name: teamName, Category_Name: category });
            alert('저장되었습니다.');
            resetMdForm();
            renderMdsTable();
        });
    }

    // --- 초기화 버튼 ---
    if (btnResetMd.length) {
        btnResetMd.on('click', resetMdForm);
    }

    function resetMdForm() {
        mdIdInput.val('');
        mdNameInput.val('');
        mdTeamNameInput.val('');
        mdCategoryInput.val('');
        mdEmailInput.val('');
        mdPhoneInput.val('');
    }
});
