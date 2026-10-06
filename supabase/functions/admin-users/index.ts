// admin-users — user management that needs the service-role key.
//
// Actions
//   bootstrap     (no login)  create the very first admin; refused once an admin exists
//   create_user   (admin)     create a login with a temporary password + area access
//   set_password  (admin)     reset someone's password
//   set_email     (admin)     correct someone's login email
//   set_active    (admin)     deactivate / reactivate a login (also blocks sign-in)
import { bootstrap } from "./actions/bootstrap.ts";
import { createUser } from "./actions/createUser.ts";
import { setActive, setEmail, setPassword } from "./actions/updateUser.ts";
import { requireAdmin, serviceClient } from "./admin.ts";
import { cors, json, type Body } from "./http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const admin = serviceClient();
  try {
    if (body.action === "bootstrap") return await bootstrap(admin, body);

    const caller = await requireAdmin(admin, req);
    if ("error" in caller) return json({ error: caller.error }, caller.status);

    switch (body.action) {
      case "create_user":
        return await createUser(admin, body);
      case "set_password":
        return await setPassword(admin, body);
      case "set_email":
        return await setEmail(admin, body);
      case "set_active":
        return await setActive(admin, body, caller.userId);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
