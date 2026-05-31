using Microsoft.AspNetCore.Mvc;
using ReadingRunAdmin.Services;

namespace ReadingRunAdmin.Controllers
{
    public class ReadingRunController : Controller
    {
        private readonly ReadingRunDataService _dataService;

        public ReadingRunController(ReadingRunDataService dataService)
        {
            _dataService = dataService;
        }

        // 누적 통계 (대시보드)
        public IActionResult Dashboard() => View();

        // 코스별 현황
        public IActionResult CourseStatus() => View();

        // 코스별 기부 현황
        public IActionResult Donation() => View();

        // 리딩런 회원관리
        public IActionResult MemberList() => View();

        // 회원 상세
        public IActionResult MemberDetail(int memberNo)
        {
            ViewBag.MemberNo = memberNo;
            return View();
        }

        // 배지 관리
        public IActionResult BadgeList() => View();

        // 배지 획득 통계
        public IActionResult BadgeStats() => View();

        // 리딩런 도서순위
        public IActionResult BookRanking() => View();
    }
}
