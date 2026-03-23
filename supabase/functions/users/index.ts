import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { getActorForUser } from "../_shared/getActorForUser.ts";

async function updateActorDisabled(user_id: string, disabled: boolean) {
  return await supabaseAdmin
    .from("actors")
    .update({ disabled: disabled ?? false })
    .eq("user_id", user_id);
}

async function updateActorAdministrator(
  user_id: string,
  administrator: boolean,
) {
  const { data: actors, error: actorsError } = await supabaseAdmin
    .from("actors")
    .update({ administrator })
    .eq("user_id", user_id)
    .select("*");

  if (!actors?.length || actorsError) {
    console.error("Error updating user:", actorsError);
    throw actorsError ?? new Error("Failed to update actor");
  }
  return actors.at(0);
}

async function createActor(
  user_id: string,
  data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    disabled: boolean;
    administrator: boolean;
  },
) {
  const { data: actors, error: actorsError } = await supabaseAdmin
    .from("actors")
    .insert({ ...data, user_id })
    .select("*");

  if (!actors?.length || actorsError) {
    console.error("Error creating user:", actorsError);
    throw actorsError ?? new Error("Failed to create actor");
  }
  return actors.at(0);
}

async function updateActorAvatar(user_id: string, avatar: string) {
  const { data: actors, error: actorsError } = await supabaseAdmin
    .from("actors")
    .update({ avatar })
    .eq("user_id", user_id)
    .select("*");

  if (!actors?.length || actorsError) {
    console.error("Error updating user:", actorsError);
    throw actorsError ?? new Error("Failed to update actor");
  }
  return actors.at(0);
}

async function inviteUser(req: Request, currentUserActor: any) {
  const { email, password, first_name, last_name, disabled, administrator } =
    await req.json();

  if (!currentUserActor.administrator) {
    return createErrorResponse(401, "Not Authorized");
  }

  const { data, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { first_name, last_name },
  });

  let user = data?.user;

  if (!user && userError?.code === "email_exists") {
    // This may happen if users cleared their database but not the users
    // We have to create the actor directly
    const { data, error } = await supabaseAdmin.rpc("get_user_id_by_email", {
      email,
    });

    if (!data || error) {
      console.error(
        `Error inviting user: error=${error ?? "could not fetch users for email"}`,
      );
      return createErrorResponse(500, "Internal Server Error");
    }

    user = data[0];
    try {
      const { data: existingActor, error: actorsError } = await supabaseAdmin
        .from("actors")
        .select("*")
        .eq("user_id", user.id);
      if (actorsError) {
        return createErrorResponse(actorsError.status, actorsError.message, {
          code: actorsError.code,
        });
      }
      if (existingActor.length > 0) {
        return createErrorResponse(
          400,
          "An actor for this email already exists",
        );
      }

      const actor = await createActor(user.id, {
        email,
        password,
        first_name,
        last_name,
        disabled,
        administrator,
      });

      return new Response(
        JSON.stringify({
          data: actor,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    } catch (error) {
      return createErrorResponse(
        (error as any).status ?? 500,
        (error as Error).message,
        {
          code: (error as any).code,
        },
      );
    }
  } else {
    if (userError) {
      console.error(`Error inviting user: user_error=${userError}`);
      return createErrorResponse(userError.status, userError.message, {
        code: userError.code,
      });
    }
    if (!data?.user) {
      console.error("Error inviting user: undefined user");
      return createErrorResponse(500, "Internal Server Error");
    }
    const { error: emailError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (emailError) {
      console.error(`Error inviting user, email_error=${emailError}`);
      return createErrorResponse(500, "Failed to send invitation mail");
    }
  }

  try {
    await updateActorDisabled(user.id, disabled);
    const actor = await updateActorAdministrator(user.id, administrator);

    return new Response(
      JSON.stringify({
        data: actor,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e) {
    console.error("Error patching actor:", e);
    return createErrorResponse(500, "Internal Server Error");
  }
}

async function patchUser(req: Request, currentUserActor: any) {
  const {
    actor_id,
    email,
    first_name,
    last_name,
    avatar,
    administrator,
    disabled,
  } = await req.json();
  const { data: actor } = await supabaseAdmin
    .from("actors")
    .select("*")
    .eq("id", actor_id)
    .single();

  if (!actor) {
    return createErrorResponse(404, "Not Found");
  }

  // Users can only update their own profile unless they are an administrator
  if (!currentUserActor.administrator && currentUserActor.id !== actor.id) {
    return createErrorResponse(401, "Not Authorized");
  }

  const { data, error: userError } =
    await supabaseAdmin.auth.admin.updateUserById(actor.user_id, {
      email,
      ban_duration: disabled ? "87600h" : "none",
      user_metadata: { first_name, last_name },
    });

  if (!data?.user || userError) {
    console.error("Error patching user:", userError);
    return createErrorResponse(500, "Internal Server Error");
  }

  if (avatar) {
    await updateActorAvatar(data.user.id, avatar);
  }

  // Only administrators can update the administrator and disabled status
  if (!currentUserActor.administrator) {
    const { data: new_actor } = await supabaseAdmin
      .from("actors")
      .select("*")
      .eq("id", actor_id)
      .single();
    return new Response(
      JSON.stringify({
        data: new_actor,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  try {
    await updateActorDisabled(data.user.id, disabled);
    const actor = await updateActorAdministrator(data.user.id, administrator);
    return new Response(
      JSON.stringify({
        data: actor,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (e) {
    console.error("Error patching actor:", e);
    return createErrorResponse(500, "Internal Server Error");
  }
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req, user) => {
        const currentUserActor = await getActorForUser(user);
        if (!currentUserActor) {
          return createErrorResponse(401, "Unauthorized");
        }

        if (req.method === "POST") {
          return inviteUser(req, currentUserActor);
        }

        if (req.method === "PATCH") {
          return patchUser(req, currentUserActor);
        }

        return createErrorResponse(405, "Method Not Allowed");
      }),
    ),
  ),
);
