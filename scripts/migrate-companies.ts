/**
 * 公司注册表迁移：把现有单租户数据归为默认公司「万象天冠」。
 *
 * - 幂等：重复执行安全；
 * - 默认公司沿用 data/snapshot.json（现有 352 条订单等数据零搬移，自动归属万象天冠）；
 * - 新注册公司将写入 data/snapshots/<companyId>.json。
 *
 * 用法：npm run companies:migrate
 */
import { ensureCompanyRegistry, listCompanies } from "../src/lib/server/company-store";

async function main() {
  const companies = await ensureCompanyRegistry();
  const list = await listCompanies();

  console.log(`公司注册表就绪：共 ${list.length} 个公司`);
  for (const company of list) {
    const suffix = company.id === "wanxiang-tianguan" ? "（默认公司，数据位于 data/snapshot.json）" : "";
    console.log(`  - ${company.id} · ${company.name}${suffix}`);
  }

  const defaultCompany = companies.find(
    (c) => c.id === "wanxiang-tianguan" && c.name === "万象天冠",
  );
  if (!defaultCompany) {
    console.warn("警告：未找到默认公司「万象天冠」，请检查 data/companies.json");
    process.exitCode = 1;
    return;
  }

  console.log("现有数据已全部归为「万象天冠」公司，无需移动数据文件。");
}

main().catch((err) => {
  console.error("迁移失败：", err);
  process.exit(1);
});
