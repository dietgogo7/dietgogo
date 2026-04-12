using Microsoft.AspNetCore.Mvc;
using ReadingRunAdmin.Services;

namespace ReadingRunAdmin.Controllers
{
    /// <summary>
    /// 프론트엔드 jQuery Ajax 호출을 위한 API 컨트롤러.
    /// 현재는 JSON 파일 데이터를 반환하며, 추후 DB 연동으로 교체됩니다.
    /// </summary>
    [Route("api/readingrun")]
    [ApiController]
    public class ReadingRunApiController : ControllerBase
    {
        private readonly ReadingRunDataService _dataService;

        public ReadingRunApiController(ReadingRunDataService dataService)
        {
            _dataService = dataService;
        }

        [HttpGet("members")]
        public IActionResult GetMembers() => Ok(_dataService.GetMembers());

        [HttpGet("members/{memberNo:int}")]
        public IActionResult GetMember(int memberNo)
        {
            var member = _dataService.GetMember(memberNo);
            if (member == null) return NotFound();
            return Ok(member);
        }

        [HttpGet("activities")]
        public IActionResult GetActivities() => Ok(_dataService.GetActivities());

        [HttpGet("results")]
        public IActionResult GetResults() => Ok(_dataService.GetResults());

        [HttpGet("rewards/masters")]
        public IActionResult GetRewardMasters() => Ok(_dataService.GetRewardMasters());

        [HttpGet("rewards/histories")]
        public IActionResult GetRewardHistories() => Ok(_dataService.GetRewardHistories());

        [HttpGet("memberbooks")]
        public IActionResult GetMemberBooks() => Ok(_dataService.GetMemberBooks());

        [HttpGet("rankings")]
        public IActionResult GetRankings() => Ok(_dataService.GetRankingHistories());

        [HttpGet("dashboard")]
        public IActionResult GetDashboard() => Ok(_dataService.GetDailySummary());

        // ── 등록/수정/삭제 (현재는 console.log 수준, 추후 DB 연동) ──────

        [HttpPost("rewards/masters")]
        public IActionResult CreateRewardMaster([FromBody] object payload)
        {
            Console.WriteLine($"[POST] 배지 등록 요청: {System.Text.Json.JsonSerializer.Serialize(payload)}");
            return Ok(new { success = true, message = "배지가 등록되었습니다." });
        }

        [HttpPut("rewards/masters/{seq:int}")]
        public IActionResult UpdateRewardMaster(int seq, [FromBody] object payload)
        {
            Console.WriteLine($"[PUT] 배지 수정 요청 seq={seq}: {System.Text.Json.JsonSerializer.Serialize(payload)}");
            return Ok(new { success = true, message = "배지가 수정되었습니다." });
        }

        [HttpDelete("rewards/masters")]
        public IActionResult DeleteRewardMasters([FromBody] int[] seqs)
        {
            Console.WriteLine($"[DELETE] 배지 삭제 요청: [{string.Join(", ", seqs)}]");
            return Ok(new { success = true, message = $"{seqs.Length}개 항목이 삭제되었습니다." });
        }
    }
}
