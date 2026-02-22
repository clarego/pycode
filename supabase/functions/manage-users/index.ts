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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "admin") {
      return jsonResponse({ error: "Admin access required" }, 403);
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

        const email = `${username.toLowerCase().replace(/\s+/g, "_")}@pycode.local`;
        const userRole = role === "admin" ? "admin" : "student";

        const { data: newUser, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            app_metadata: { role: userRole },
          });
        if (createErr) throw createErr;

        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: newUser.user.id,
            username,
            role: userRole,
          });
        if (profileErr) {
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          throw profileErr;
        }

        return jsonResponse({
          user: { id: newUser.user.id, username, role: userRole },
        });
      }

      case "update": {
        const { userId, username, password } = body;
        if (!userId) {
          return jsonResponse({ error: "userId required" }, 400);
        }

        if (password) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password }
          );
          if (error) throw error;
        }

        if (username) {
          const email = `${username.toLowerCase().replace(/\s+/g, "_")}@pycode.local`;
          const { error: emailErr } =
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              email,
              user_metadata: { username },
            });
          if (emailErr) throw emailErr;

          const { error: profileErr } = await supabaseAdmin
            .from("profiles")
            .update({ username })
            .eq("id", userId);
          if (profileErr) throw profileErr;
        }

        return jsonResponse({ success: true });
      }

      case "delete": {
        const { userIds } = body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return jsonResponse({ error: "userIds array required" }, 400);
        }

        if (userIds.includes(user.id)) {
          return jsonResponse({ error: "Cannot delete yourself" }, 400);
        }

        for (const uid of userIds) {
          await supabaseAdmin.auth.admin.deleteUser(uid);
        }

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
