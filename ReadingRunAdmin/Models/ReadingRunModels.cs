using System.Text.Json.Serialization;

namespace ReadingRunAdmin.Models
{
    // tReadingRunMember
    public class ReadingRunMember
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public string Member_Id { get; set; } = string.Empty;
        public string Current_Course { get; set; } = string.Empty;
        public int Total_Reading_Time { get; set; }
        public double Total_Distance { get; set; }
        public int Complete_Count { get; set; }
        public string? Last_Activity_Datetime { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunActivity
    public class ReadingRunActivity
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public string? Activity_Date { get; set; }
        public string? Session_Status { get; set; }
        public string? Session_Key { get; set; }
        public string? Course_Name { get; set; }
        public int? Goods_No { get; set; }
        public string? Session_Start_Datetime { get; set; }
        public string? Session_End_Datetime { get; set; }
        public int? Reading_Time { get; set; }
        public double? Distance { get; set; }
        public string? Update_Datetime { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunResult
    public class ReadingRunResult
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public int Course_Round_No { get; set; }
        public string? Course_Name { get; set; }
        public string? Result_Status_Code { get; set; }
        public string? Course_Start_Datetime { get; set; }
        public bool Complete_Yn { get; set; }
        public string? Complete_Datetime { get; set; }
        public bool Certificate_Create_Yn { get; set; }
        public string? Certificate_Create_Datetime { get; set; }
        public bool Badge_Reward_Yn { get; set; }
        public bool Gift_Reward_Yn { get; set; }
        public bool Donation_Apply_Yn { get; set; }
        public string? Update_Datetime { get; set; }
        public string? Result_Apply_Datetime { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunRewardMaster
    public class ReadingRunRewardMaster
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public string? Reward_Code { get; set; }
        public string? Reward_Type { get; set; }
        public string? Reward_Name { get; set; }
        public string? Reward_Description { get; set; }
        public string? Reward_Message { get; set; }
        public int? Reward_Value { get; set; }
        public bool Use_YN { get; set; }
        public bool Delete_YN { get; set; }
        public string? Regist_Datetime { get; set; }
        public string? Update_Datetime { get; set; }
    }

    // tReadingRunRewardHistory
    public class ReadingRunRewardHistory
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public string? Reward_Type { get; set; }
        public string? Reward_Code { get; set; }
        public string? Reward_Name { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunMemberBook
    public class ReadingRunMemberBook
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public int Goods_No { get; set; }
        public int Display_Order { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunRankingHistory
    public class ReadingRunRankingHistory
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public int Member_No { get; set; }
        public string? Standard_Date { get; set; }
        public int Ranking { get; set; }
        public int Accumulate_Reading_Time { get; set; }
        public double Accumulate_Distance { get; set; }
        public string? Progress_Course { get; set; }
        public string? Update_Datetime { get; set; }
        public string? Regist_Datetime { get; set; }
    }

    // tReadingRunDailySummary (복합 구조)
    public class DailySummaryData
    {
        [JsonPropertyName("campaignStart")]
        public string? CampaignStart { get; set; }

        [JsonPropertyName("updateDt")]
        public string? UpdateDt { get; set; }

        [JsonPropertyName("total")]
        public TotalStats? Total { get; set; }

        [JsonPropertyName("starter")]
        public CourseStats? Starter { get; set; }

        [JsonPropertyName("half")]
        public CourseStats? Half { get; set; }

        [JsonPropertyName("marathon")]
        public CourseStats? Marathon { get; set; }

        [JsonPropertyName("daily")]
        public List<DailyRecord>? Daily { get; set; }
    }

    public class TotalStats
    {
        [JsonPropertyName("participant")]
        public long Participant { get; set; }

        [JsonPropertyName("session")]
        public long Session { get; set; }

        [JsonPropertyName("readingTime")]
        public long ReadingTime { get; set; }

        [JsonPropertyName("complete")]
        public long Complete { get; set; }

        [JsonPropertyName("donationAmt")]
        public long DonationAmt { get; set; }
    }

    public class CourseStats
    {
        [JsonPropertyName("join")]
        public long Join { get; set; }

        [JsonPropertyName("complete")]
        public long Complete { get; set; }

        [JsonPropertyName("remain")]
        public long Remain { get; set; }

        [JsonPropertyName("donation")]
        public long Donation { get; set; }
    }

    public class DailyRecord
    {
        public int Seq { get; set; }
        public int Event_No { get; set; }
        public string? Standard_Date { get; set; }
        public long Total_Participant_Count { get; set; }
        public long Total_Donation_Amount { get; set; }
        public long Total_Complete_Times { get; set; }
        public long Starter_Join_Times { get; set; }
        public long Half_Join_Times { get; set; }
        public long Marathon_Join_Times { get; set; }
        public long Starter_Complete_Times { get; set; }
        public long Half_Complete_Times { get; set; }
        public long Marathon_Complete_Times { get; set; }
        public long Starter_Donation_Amount { get; set; }
        public long Half_Donation_Amount { get; set; }
        public long Marathon_Donation_Amount { get; set; }
        public long Starter_Remain_Complete_Count { get; set; }
        public long Half_Remain_Complete_Count { get; set; }
        public long Marathon_Remain_Complete_Count { get; set; }
        public string? Regist_Datetime { get; set; }
    }
}
