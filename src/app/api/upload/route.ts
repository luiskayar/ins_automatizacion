import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const n8nCode = form.get("n8nCode");
    const file = (form.get("data") ?? form.get("file")) as unknown;

    if (!n8nCode || typeof n8nCode !== "string") {
      return NextResponse.json({ ok: false, error: "Falta n8nCode" }, { status: 400 });
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Falta archivo" }, { status: 400 });
    }

    // Validar estrictamente .xlsx por MIME o por extensión de nombre
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "",
    ];
    const isXlsxByMime = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileName = (file as File).name || "";
    const isXlsxByExt = /\.xlsx$/i.test(fileName);
    if (!(isXlsxByMime || (allowedTypes.includes(file.type) && isXlsxByExt))) {
      return NextResponse.json({ ok: false, error: "Formato no permitido. Solo se admiten archivos .xlsx" }, { status: 415 });
    }

    let webhookUrl: string;
    const isFullUrl = /^https?:\/\//i.test(n8nCode);
    if (isFullUrl) {
      webhookUrl = n8nCode;
    } else {
      const base = process.env.N8N_WEBHOOK_BASE;
      if (!base) {
        return NextResponse.json({ ok: false, error: "N8N_WEBHOOK_BASE no configurado" }, { status: 500 });
      }
      webhookUrl = `${base.replace(/\/$/, "")}/${encodeURIComponent(n8nCode)}`;
    }

    const outbound = new FormData();
    // n8n espera el archivo bajo la clave "data" (como en Postman)
    outbound.set("data", file, (file as File).name || "archivo.xlsx");

    const res = await fetch(webhookUrl, {
      method: "POST",
      body: outbound,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Webhook error: ${res.status} ${text}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Error procesando la carga" }, { status: 500 });
  }
}


