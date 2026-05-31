using System.Text.Json;
using ReadingRunAdmin.Models;

namespace ReadingRunAdmin.Services
{
    /// <summary>
    /// JSON 파일에서 리딩런 데이터를 읽어오는 서비스.
    /// 추후 DB 연동 시 이 클래스만 수정하면 됩니다.
    /// </summary>
    public class ReadingRunDataService
    {
        private readonly string _dataPath;
        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public ReadingRunDataService(IWebHostEnvironment env)
        {
            _dataPath = Path.Combine(env.ContentRootPath, "Data");
        }

        private T ReadJson<T>(string fileName) where T : new()
        {
            var filePath = Path.Combine(_dataPath, fileName);
            if (!File.Exists(filePath))
                return new T();

            var json = File.ReadAllText(filePath);
            return JsonSerializer.Deserialize<T>(json, _jsonOptions) ?? new T();
        }

        // ── 조회 메서드 (추후 DB 쿼리로 교체) ──────────────────────────

        public List<ReadingRunMember> GetMembers()
            => ReadJson<List<ReadingRunMember>>("tReadingRunMember.json");

        public ReadingRunMember? GetMember(int memberNo)
            => GetMembers().FirstOrDefault(m => m.Member_No == memberNo);

        public List<ReadingRunActivity> GetActivities()
            => ReadJson<List<ReadingRunActivity>>("tReadingRunActivity.json");

        public List<ReadingRunResult> GetResults()
            => ReadJson<List<ReadingRunResult>>("tReadingRunResult.json");

        public List<ReadingRunRewardMaster> GetRewardMasters()
            => ReadJson<List<ReadingRunRewardMaster>>("tReadingRunRewardMaster.json");

        public List<ReadingRunRewardHistory> GetRewardHistories()
            => ReadJson<List<ReadingRunRewardHistory>>("tReadingRunRewardHistory.json");

        public List<ReadingRunMemberBook> GetMemberBooks()
            => ReadJson<List<ReadingRunMemberBook>>("tReadingRunMemberBook.json");

        public List<ReadingRunRankingHistory> GetRankingHistories()
            => ReadJson<List<ReadingRunRankingHistory>>("tReadingRunRankingHistory.json");

        public DailySummaryData GetDailySummary()
            => ReadJson<DailySummaryData>("tReadingRunDailySummary.json");
    }
}
