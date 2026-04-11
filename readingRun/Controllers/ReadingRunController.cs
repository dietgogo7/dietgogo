using System.Web.Mvc;

namespace ReadingRun.Controllers
{
    /// <summary>
    /// 리딩런 BackOffice 통합 컨트롤러
    /// 모든 View는 Views/ReadingRun/ 하위에 위치
    /// </summary>
    public class ReadingRunController : Controller
    {
        // BO-RR_01 : 리딩런 누적 통계 (대시보드)
        public ActionResult Dashboard()
        {
            return View("~/Views/ReadingRun/Dashboard.cshtml");
        }

        // BO-RR_02 : 코스별 현황
        public ActionResult CourseStatus()
        {
            return View("~/Views/ReadingRun/CourseStatus.cshtml");
        }

        // BO-RR_03 : 코스별 기부 현황
        public ActionResult Donation()
        {
            return View("~/Views/ReadingRun/Donation.cshtml");
        }

        // BO-UM_01 : 리딩런 회원관리 목록
        public ActionResult MemberIndex()
        {
            return View("~/Views/ReadingRun/MemberIndex.cshtml");
        }

        // BO-UM_01_DV_01 : 리딩런 회원정보 상세
        public ActionResult MemberDetail(int id, int eventNo = 0)
        {
            ViewBag.MemberNo = id;
            ViewBag.EventNo  = eventNo;
            return View("~/Views/ReadingRun/MemberDetail.cshtml");
        }

        // BO-RW_01 : 배지 관리
        public ActionResult BadgeList(int eventNo = 0)
        {
            ViewBag.EventNo = eventNo;
            return View("~/Views/ReadingRun/BadgeList.cshtml");
        }

        // BO-RW_02 : 배지 획득 통계
        public ActionResult BadgeStats(int eventNo = 0)
        {
            ViewBag.EventNo = eventNo;
            return View("~/Views/ReadingRun/BadgeStats.cshtml");
        }

        // BO-RC_01 : 리딩런 도서순위
        public ActionResult BookRanking(int eventNo = 0)
        {
            ViewBag.EventNo = eventNo;
            return View("~/Views/ReadingRun/BookRanking.cshtml");
        }
    }
}
