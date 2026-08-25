import { NextResponse } from "next/server";
import { isValidCnMobile } from "@/lib/phone";
import {
  createCompany,
  listCompanies,
} from "@/lib/server/company-store";

/**
 * 公司注册表。
 * - GET：公开公司列表（完整 CompanyInfo：id / name / createdAt / phone / registrantName），
 *   供登录下拉、管理员切换公司、admin 首页新公司注册提醒使用；
 * - POST：公开注册（创建公司 + 空数据快照 + 注册者账号，个人版设计经理；手机号必填并校验格式）。
 */
export async function GET() {
  try {
    const companies = await listCompanies();
    return NextResponse.json(companies);
  } catch (err) {
    console.error("[api/companies] GET failed", err);
    return NextResponse.json({ error: "读取公司列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      stores?: unknown;
      registrant?: { name?: unknown; password?: unknown; phone?: unknown };
    } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }
    const name = typeof body.name === "string" ? body.name : "";
    const stores = Array.isArray(body.stores)
      ? body.stores.filter((s): s is string => typeof s === "string")
      : [];
    const registrantName =
      typeof body.registrant?.name === "string" ? body.registrant.name : "";
    const password =
      typeof body.registrant?.password === "string"
        ? body.registrant.password
        : "";
    const phone =
      typeof body.registrant?.phone === "string" ? body.registrant.phone : "";
    if (!registrantName || !password) {
      return NextResponse.json(
        { error: "请填写账号与密码" },
        { status: 400 },
      );
    }
    if (!isValidCnMobile(phone)) {
      return NextResponse.json(
        { error: "请输入有效的 11 位手机号码" },
        { status: 400 },
      );
    }

    const result = await createCompany({
      name,
      stores,
      registrant: { name: registrantName, password, phone: phone.trim() },
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "注册失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
