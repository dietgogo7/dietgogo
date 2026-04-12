using Microsoft.AspNetCore.Mvc;

namespace ReadingRunAdmin.Web.Controllers
{
    public class ReadingRunController : Controller
    {
        private readonly IWebHostEnvironment _env;

        public ReadingRunController(IWebHostEnvironment env)
        {
            _env = env;
        }

        /* ──────────────────────────────
           View Actions
           ────────────────────────────── */
        public IActionResult Dashboard() => View();
        public IActionResult CourseStatus() => View();
        public IActionResult Donation() => View();
        public IActionResult MemberList() => View();
        public IActionResult MemberDetail(int memberNo) => View();
        public IActionResult BadgeList() => View();
        public IActionResult BadgeStats() => View();
        public IActionResult BookRanking() => View();

        /* ──────────────────────────────
           API Actions  (/v2/ReadingRun/*)
           이관 후 DB 연동 시 이 영역만 교체
           ────────────────────────────── */
        [HttpGet("v2/ReadingRun/DailySummary")]
        public IActionResult GetDailySummary() => JsonFile("tReadingRunDailySummary.json");

        [HttpGet("v2/ReadingRun/Members")]
        public IActionResult GetMembers() => JsonFile("tReadingRunMember.json");

        [HttpGet("v2/ReadingRun/Results")]
        public IActionResult GetResults() => JsonFile("tReadingRunResult.json");

        [HttpGet("v2/ReadingRun/Activities")]
        public IActionResult GetActivities() => JsonFile("tReadingRunActivity.json");

        [HttpGet("v2/ReadingRun/RewardHistory")]
        public IActionResult GetRewardHistory() => JsonFile("tReadingRunRewardHistory.json");

        [HttpGet("v2/ReadingRun/RewardMaster")]
        public IActionResult GetRewardMaster() => JsonFile("tReadingRunRewardMaster.json");

        [HttpGet("v2/ReadingRun/MemberBooks")]
        public IActionResult GetMemberBooks() => JsonFile("tReadingRunMemberBook.json");

        [HttpGet("v2/ReadingRun/RankingHistory")]
        public IActionResult GetRankingHistory() => JsonFile("tReadingRunRankingHistory.json");

        /* ──────────────────────────────
           CUD Stub  (console.log → DB 연동 전환 예정)
           ────────────────────────────── */
        [HttpPost("v2/ReadingRun/Badge/Register")]
        public IActionResult RegisterBadge([FromBody] object payload)
        {
            // TODO: DB 연동 시 서비스 레이어 호출로 교체
            return Json(new { success = true, message = "배지가 등록되었습니다." });
        }

        [HttpPost("v2/ReadingRun/Badge/Update")]
        public IActionResult UpdateBadge([FromBody] object payload)
        {
            return Json(new { success = true, message = "배지가 수정되었습니다." });
        }

        [HttpPost("v2/ReadingRun/Badge/Delete")]
        public IActionResult DeleteBadge([FromBody] object payload)
        {
            return Json(new { success = true, message = "배지가 삭제되었습니다." });
        }

        /* ---- helper ---- */
        private IActionResult JsonFile(string fileName)
        {
            var path = Path.Combine(_env.WebRootPath, "data", fileName);
            if (!System.IO.File.Exists(path))
                return NotFound();

            var json = System.IO.File.ReadAllText(path);
            return Content(json, "application/json");
        }
    }
}
