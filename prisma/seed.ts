import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve DB URL — same logic as src/lib/prisma.ts */
function getDbUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env) {
    if (/^file:\/.+/.test(env)) return env;
    if (env.startsWith("file:")) {
      const rel = env.replace(/^file:/, "");
      const abs = path.resolve(process.cwd(), rel);
      return "file:" + abs.split(path.sep).join("/");
    }
  }
  const abs = path.resolve(__dirname, "../dev.db");
  return "file:" + abs.split(path.sep).join("/");
}

const dbUrl = getDbUrl();
console.log("Connecting to:", dbUrl);

const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.campaign.count();
  if (existing > 0) {
    console.log(`✓ Seed skipped — ${existing} campaigns already exist.`);
    return;
  }

  await prisma.campaign.createMany({
    data: [
      {
        title: "街友關懷冬季物資包募集",
        organizerName: "台灣街友服務協會",
        description:
          "為台北市街友募集冬季禦寒物資包，每包含毛毯、暖暖包、衛生用品及乾糧。您的每一筆捐款都能直接幫助需要的街友度過寒冬，讓他們感受到社會的溫暖與關懷。",
        goalAmount: 150000,
        currentAmount: 0,
        imageUrl: "https://picsum.photos/seed/homeless/800/400",
        deadline: new Date("2027-06-30T23:59:59Z"),
      },
      {
        title: "偏鄉助學計畫 — 為花蓮孩子添購課輔教材",
        organizerName: "花蓮縣偏鄉教育基金會",
        description:
          "幫助花蓮偏鄉國小學童取得課後輔導教材與學習資源，讓每個孩子都有公平的學習機會。預計採購數學、國語、英語課輔書籍及文具，嘉惠超過 200 名學童。",
        goalAmount: 80000,
        currentAmount: 0,
        imageUrl: "https://picsum.photos/seed/education/800/400",
        deadline: new Date("2027-05-15T23:59:59Z"),
      },
      {
        title: "流浪動物結紮救援行動",
        organizerName: "台灣流浪動物之家",
        description:
          "資助北部地區流浪貓狗結紮手術與醫療費用，從源頭減少流浪動物數量，改善動物福利。每筆捐款將直接用於獸醫手術費及術後照護。",
        goalAmount: 200000,
        currentAmount: 0,
        imageUrl: "https://picsum.photos/seed/animals/800/400",
        deadline: new Date("2027-08-01T23:59:59Z"),
      },
    ],
  });

  console.log("✓ Seed complete — 3 campaigns created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
