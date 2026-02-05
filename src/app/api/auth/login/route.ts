import { NextResponse } from "next/server";

type EnvUser = { user: string; pass: string; n8n?: string; label?: string };

function loadUsersFromEnv(): EnvUser[] {
  const users: EnvUser[] = [];

  // 1) Numbered variables: AUTH_USER_1, AUTH_PASS_1, AUTH_N8N_1, AUTH_LABEL_1, etc.
  for (let i = 1; i <= 50; i++) {
    const u = process.env[`AUTH_USER_${i}` as const];
    const p = process.env[`AUTH_PASS_${i}` as const];
    const n = process.env[`AUTH_N8N_${i}` as const];
    const l = process.env[`AUTH_LABEL_${i}` as const];
    if (u && p) {
      users.push({ user: u, pass: p, n8n: n, label: l || u });
    }
  }

  // 2) Backward compatibility with INS_/SUP_ variables
  const legacy = [
    { user: process.env.INS_USER, pass: process.env.INS_PASS, n8n: process.env.INS_N8N_CODE, label: "Ins" },
    { user: process.env.SUP_USER, pass: process.env.SUP_PASS, n8n: process.env.SUP_N8N_CODE, label: "Supervisor" },
  ];
  for (const entry of legacy) {
    if (entry.user && entry.pass) {
      users.push(entry as EnvUser);
    }
  }

  return users;
}

function isValidCredentials(username: string, password: string) {
  const users = loadUsersFromEnv();
  for (const u of users) {
    if (username === u.user && password === u.pass) {
      return { user: u.label ?? u.user, n8nCode: u.n8n ?? "" };
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Faltan credenciales" }, { status: 400 });
    }

    const match = isValidCredentials(username, password);
    if (!match) {
      return NextResponse.json({ ok: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = crypto.randomUUID();
    return NextResponse.json({ ok: true, token, user: match.user, n8nCode: match.n8nCode });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Error del servidor" }, { status: 500 });
  }
}


