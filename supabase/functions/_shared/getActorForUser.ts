import { type User } from "jsr:@supabase/supabase-js@2";
import { supabaseAdmin } from "./supabaseAdmin.ts";

/**
 * Get the actor associated to the provided user.
 */
export const getActorForUser = async (user: User) => {
  return (
    await supabaseAdmin
      .from("actors")
      .select("*")
      .eq("user_id", user.id)
      .single()
  )?.data;
};
