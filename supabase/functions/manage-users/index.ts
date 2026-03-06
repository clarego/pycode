import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const STANDALONE_URL = "https://qfitpwdrswvnbmzvkoyd.supabase.co";
const STANDALONE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    if (action === "seed") {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1);

      if (existing && existing.length > 0) {
        return jsonResponse({ message: "Already seeded" });
      }

      const { data: adminUser, error: adminErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: "clarence@pycode.local",
          password: "admin123",
          email_confirm: true,
          app_metadata: { role: "admin" },
        });
      if (adminErr) throw adminErr;

      await supabaseAdmin.from("profiles").insert({
        id: adminUser.user.id,
        username: "clarence",
        role: "admin",
      });

      const { data: studentUser, error: studentErr } =
        await supabaseAdmin.auth.admin.createUser({
          email: "guest@pycode.local",
          password: "guest123",
          email_confirm: true,
          app_metadata: { role: "student" },
        });
      if (studentErr) throw studentErr;

      await supabaseAdmin.from("profiles").insert({
        id: studentUser.user.id,
        username: "guest",
        role: "student",
      });

      return jsonResponse({ message: "Seeded successfully" });
    }

    const { _adminUsername } = body;
    if (!_adminUsername) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const standaloneClient = createClient(STANDALONE_URL, STANDALONE_ANON_KEY);
    const { data: adminRow } = await standaloneClient
      .from("users_login")
      .select("is_admin")
      .eq("username", _adminUsername)
      .maybeSingle();

    if (!adminRow || !adminRow.is_admin) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    switch (action) {
      case "create": {
        const { username, password, role } = body;
        if (!username || !password) {
          return jsonResponse(
            { error: "Username and password required" },
            400
          );
        }

        const { data: existing } = await standaloneClient
          .from("users_login")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (existing) {
          return jsonResponse({ error: "Username already exists" }, 400);
        }

        const userRole = role === "admin" ? "admin" : "student";

        const { data: newRow, error: insertErr } = await standaloneClient
          .from("users_login")
          .insert({ username, password, is_admin: userRole === "admin" })
          .select("id, username")
          .maybeSingle();

        if (insertErr) throw insertErr;

        return jsonResponse({
          user: { id: newRow?.id, username, role: userRole },
        });
      }

      case "update": {
        const { userId, username, password } = body;
        if (!userId) {
          return jsonResponse({ error: "userId required" }, 400);
        }

        const updates: Record<string, unknown> = {};
        if (password) updates.password = password;
        if (username) updates.username = username;

        if (Object.keys(updates).length === 0) {
          return jsonResponse({ success: true });
        }

        const { error: updateErr } = await standaloneClient
          .from("users_login")
          .update(updates)
          .eq("id", userId);

        if (updateErr) throw updateErr;

        return jsonResponse({ success: true });
      }

      case "delete": {
        const { userIds } = body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return jsonResponse({ error: "userIds array required" }, 400);
        }

        const { data: callerRow } = await standaloneClient
          .from("users_login")
          .select("id")
          .eq("username", _adminUsername)
          .maybeSingle();

        if (callerRow && userIds.includes(callerRow.id)) {
          return jsonResponse({ error: "Cannot delete yourself" }, 400);
        }

        const { error: deleteErr } = await standaloneClient
          .from("users_login")
          .delete()
          .in("id", userIds);

        if (deleteErr) throw deleteErr;

        return jsonResponse({ success: true, deleted: userIds.length });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
