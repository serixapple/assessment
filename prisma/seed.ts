import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const libsqlUrl = dbUrl.startsWith("file:")
  ? "file:" + dbUrl.slice(5)
  : dbUrl;

const adapter = new PrismaLibSql({ url: libsqlUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const sampleCases = [
    {
      reviewNumber: "CERO-2024-001",
      gameTitle: "サンプルRPG",
      caseTitle: "戦闘シーンにおける流血表現",
      summary:
        "主人公が敵を剣で倒した際、赤い飛沫が散るエフェクトが使用されている。表現は誇張されているものの、写実的な描写ではなく、アニメ調のスタイルが採用されている。傷口の詳細な描写はなく、全体的に軽度の暴力表現に留まると判断した。",
      ceroRating: "B",
    },
    {
      reviewNumber: "CERO-2024-002",
      gameTitle: "ファミリーアドベンチャー",
      caseTitle: "全年齢向けの判断基準について",
      summary:
        "全体を通じて暴力表現・性表現・恐怖表現はなく、教育的かつ楽しいコンテンツとして構成されている。キャラクターが軽くぶつかる程度の接触描写のみで、年齢制限を設ける必要がないと判断した。",
      ceroRating: "A",
    },
    {
      reviewNumber: "CERO-2024-003",
      gameTitle: "ホラーサバイバル",
      caseTitle: "グロテスク表現とホラー演出",
      summary:
        "ゾンビキャラクターの腐敗した外観、内臓描写を含む死体の表示、血だまりの詳細な再現など、写実的なグロテスク表現が多数含まれる。プレイヤーキャラクターの死亡シーンも残虐な表現が使われており、18才以上を対象とする表現水準と判断した。",
      ceroRating: "Z",
    },
    {
      reviewNumber: "CERO-2024-004",
      gameTitle: "ティーンズスポーツ",
      caseTitle: "軽度の競争シーンにおける暴力表現",
      summary:
        "スポーツゲームであるが、タックルや衝突シーンでキャラクターが倒れる演出がある。痛みを示す表情や軽微な擦り傷の描写はあるが、流血や重傷描写はない。12才以上を対象とする軽度の表現と判断した。",
      ceroRating: "B",
    },
    {
      reviewNumber: "CERO-2024-005",
      gameTitle: "ミステリーアドベンチャー18",
      caseTitle: "成人向け性的表現の判断",
      summary:
        "成人キャラクター間のロマンスシーンを含むが、露骨な描写は画面外または暗転処理がされている。セクシャルな示唆を含む台詞・演出があるが、直接的な性行為描写は存在しない。17才以上を対象とする表現水準と判断した。",
      ceroRating: "D",
    },
  ];

  for (const data of sampleCases) {
    await prisma.case.upsert({
      where: { reviewNumber: data.reviewNumber },
      update: {},
      create: data,
    });
  }

  console.log("✅ シードデータを登録しました");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
