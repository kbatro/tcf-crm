import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sql, type Selectable } from "https://esm.sh/kysely@0.27.2";
import { db, type ContactsTable, CompiledQuery } from "../_shared/db.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";

type Contact = Selectable<ContactsTable>;

async function mergeContacts(
  loserId: number,
  winnerId: number,
  userId: string,
) {
  try {
    return await db.transaction().execute(async (trx) => {
      // Enable RLS by switching to authenticated role and setting user context
      await trx.executeQuery(CompiledQuery.raw("SET LOCAL ROLE authenticated"));
      await trx.executeQuery(
        CompiledQuery.raw(
          `SELECT set_config('request.jwt.claim.sub', '${userId}', true)`,
        ),
      );

      // 1. Fetch both contacts
      const [winner, loser] = await Promise.all([
        trx
          .selectFrom("contacts")
          .selectAll()
          .where("id", "=", winnerId)
          .executeTakeFirstOrThrow(),
        trx
          .selectFrom("contacts")
          .selectAll()
          .where("id", "=", loserId)
          .executeTakeFirstOrThrow(),
      ]);

      // 2. Reassign tasks from loser to winner
      await trx
        .updateTable("tasks")
        .set({ contact_id: winnerId })
        .where("contact_id", "=", loserId)
        .execute();

      // 3. Reassign notes (target_type='contact') from loser to winner
      await trx
        .updateTable("notes")
        .set({ target_id: winnerId })
        .where("target_type", "=", "contact")
        .where("target_id", "=", loserId)
        .execute();

      // 4. Update intention_contacts - replace loserId with winnerId, skip duplicates
      await trx.executeQuery(
        CompiledQuery.raw(
          `INSERT INTO intention_contacts (intention_id, contact_id)
           SELECT intention_id, ${winnerId}
           FROM intention_contacts
           WHERE contact_id = ${loserId}
             AND NOT EXISTS (
               SELECT 1 FROM intention_contacts
               WHERE contact_id = ${winnerId}
                 AND intention_id = intention_contacts.intention_id
             )`,
        ),
      );
      await trx
        .deleteFrom("intention_contacts")
        .where("contact_id", "=", loserId)
        .execute();

      // 5. Merge channels: move loser's channels to winner, skip duplicates
      await trx.executeQuery(
        CompiledQuery.raw(
          `INSERT INTO channels (contact_id, type, value, label)
           SELECT ${winnerId}, type, value, label
           FROM channels
           WHERE contact_id = ${loserId}
             AND NOT EXISTS (
               SELECT 1 FROM channels
               WHERE contact_id = ${winnerId}
                 AND type = channels.type
                 AND value = channels.value
             )`,
        ),
      );
      await trx
        .deleteFrom("channels")
        .where("contact_id", "=", loserId)
        .execute();

      // 6. Merge properties: move loser's properties to winner, skip duplicates
      await trx.executeQuery(
        CompiledQuery.raw(
          `INSERT INTO properties (contact_id, key, value, type)
           SELECT ${winnerId}, key, value, type
           FROM properties
           WHERE contact_id = ${loserId}
             AND NOT EXISTS (
               SELECT 1 FROM properties
               WHERE contact_id = ${winnerId}
                 AND key = properties.key
             )`,
        ),
      );
      await trx
        .deleteFrom("properties")
        .where("contact_id", "=", loserId)
        .execute();

      // 7. Merge contact_tags: move loser's tags to winner, skip duplicates
      await trx.executeQuery(
        CompiledQuery.raw(
          `INSERT INTO contact_tags (contact_id, tag_id)
           SELECT ${winnerId}, tag_id
           FROM contact_tags
           WHERE contact_id = ${loserId}
             AND NOT EXISTS (
               SELECT 1 FROM contact_tags
               WHERE contact_id = ${winnerId}
                 AND tag_id = contact_tags.tag_id
             )`,
        ),
      );
      await trx
        .deleteFrom("contact_tags")
        .where("contact_id", "=", loserId)
        .execute();

      // 8. Merge group_members: move loser's memberships to winner, skip duplicates
      await trx.executeQuery(
        CompiledQuery.raw(
          `INSERT INTO group_members (group_id, contact_id, role, joined_at, left_at)
           SELECT group_id, ${winnerId}, role, joined_at, left_at
           FROM group_members
           WHERE contact_id = ${loserId}
             AND NOT EXISTS (
               SELECT 1 FROM group_members
               WHERE contact_id = ${winnerId}
                 AND group_id = group_members.group_id
             )`,
        ),
      );
      await trx
        .deleteFrom("group_members")
        .where("contact_id", "=", loserId)
        .execute();

      // 9. Update winner contact with merged basic fields
      const selectedAvatar =
        winner.avatar && (winner.avatar as any).src
          ? winner.avatar
          : loser.avatar;

      await trx
        .updateTable("contacts")
        .set({
          avatar: selectedAvatar
            ? (JSON.stringify(selectedAvatar) as any)
            : null,
          first_name: winner.first_name ?? loser.first_name,
          last_name: winner.last_name ?? loser.last_name,
          first_seen: winner.first_seen ?? loser.first_seen,
          last_seen:
            winner.last_seen && loser.last_seen
              ? winner.last_seen > loser.last_seen
                ? winner.last_seen
                : loser.last_seen
              : (winner.last_seen ?? loser.last_seen),
          actor_id: winner.actor_id ?? loser.actor_id,
        })
        .where("id", "=", winnerId)
        .execute();

      // 10. Delete loser contact
      await trx.deleteFrom("contacts").where("id", "=", loserId).execute();

      return { success: true, winnerId };
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req, user) => {
        // Handle POST request
        if (req.method === "POST") {
          try {
            const { loserId, winnerId } = await req.json();

            if (!loserId || !winnerId) {
              return createErrorResponse(400, "Missing loserId or winnerId");
            }

            const result = await mergeContacts(loserId, winnerId, user.id);

            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          } catch (error) {
            console.error("Merge failed:", error);
            return createErrorResponse(
              500,
              `Failed to merge contacts: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            );
          }
        }

        return createErrorResponse(405, "Method Not Allowed");
      }),
    ),
  ),
);
