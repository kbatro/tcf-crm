import type { Identifier, DataProvider } from "ra-core";

import type { Contact, Task, Note, IntentionContact } from "../../types";

/**
 * Merge one contact (loser) into another contact (winner).
 *
 * This function copies properties from the loser to the winner contact,
 * transfers all associated data (tasks, notes, intention_contacts) from the loser to the winner,
 * and deletes the loser contact.
 */
export const mergeContacts = async (
  loserId: Identifier,
  winnerId: Identifier,
  dataProvider: DataProvider,
) => {
  const { data: winnerContact } = await dataProvider.getOne<Contact>(
    "contacts",
    { id: winnerId },
  );
  const { data: loserContact } = await dataProvider.getOne<Contact>(
    "contacts",
    { id: loserId },
  );

  if (!winnerContact || !loserContact) {
    throw new Error("Could not fetch contacts");
  }

  // 1. Reassign all tasks from loser to winner
  const { data: loserTasks } = await dataProvider.getManyReference<Task>(
    "tasks",
    {
      target: "contact_id",
      id: loserId,
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
      filter: {},
    },
  );

  const taskUpdates =
    loserTasks?.map((task) =>
      dataProvider.update("tasks", {
        id: task.id,
        data: { contact_id: winnerId },
        previousData: task,
      }),
    ) || [];

  // 2. Reassign notes (target_type='contact') from loser to winner
  const { data: loserNotes } = await dataProvider.getList<Note>("notes", {
    filter: { target_type: "contact", target_id: loserId },
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "ASC" },
  });

  const noteUpdates =
    loserNotes?.map((note) =>
      dataProvider.update<Note>("notes", {
        id: note.id,
        data: { target_id: winnerId },
        previousData: note,
      }),
    ) || [];

  // 3. Update intention_contacts - replace loser with winner
  const { data: loserIntentionContacts } =
    await dataProvider.getList<IntentionContact>("intention_contacts", {
      filter: { contact_id: loserId },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
    });

  const { data: winnerIntentionContacts } =
    await dataProvider.getList<IntentionContact>("intention_contacts", {
      filter: { contact_id: winnerId },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "id", order: "ASC" },
    });

  const winnerIntentionIds = new Set(
    winnerIntentionContacts?.map((ic) => ic.intention_id) || [],
  );

  const intentionContactUpdates =
    loserIntentionContacts?.flatMap((ic) => {
      if (winnerIntentionIds.has(ic.intention_id)) {
        // Duplicate - delete the loser's entry
        return [
          dataProvider.delete("intention_contacts", {
            id: ic.id,
            previousData: ic,
          }),
        ];
      }
      // Move to winner
      return [
        dataProvider.update("intention_contacts", {
          id: ic.id,
          data: { contact_id: winnerId },
          previousData: ic,
        }),
      ];
    }) || [];

  // 4. Update winner contact with loser data
  const mergedEmails = mergeObjectArraysUnique(
    winnerContact.email_jsonb || [],
    loserContact.email_jsonb || [],
    (email) => email.email,
  );

  const mergedPhones = mergeObjectArraysUnique(
    winnerContact.phone_jsonb || [],
    loserContact.phone_jsonb || [],
    (phone) => phone.number,
  );

  const winnerUpdate = dataProvider.update<Contact>("contacts", {
    id: winnerId,
    data: {
      avatar:
        winnerContact.avatar && winnerContact.avatar.src
          ? winnerContact.avatar
          : loserContact.avatar,
      gender: winnerContact.gender ?? loserContact.gender,
      first_name: winnerContact.first_name ?? loserContact.first_name,
      last_name: winnerContact.last_name ?? loserContact.last_name,
      title: winnerContact.title ?? loserContact.title,
      company_id: winnerContact.company_id ?? loserContact.company_id,
      company_name: winnerContact.company_name ?? loserContact.company_name,
      email_jsonb: mergedEmails,
      phone_jsonb: mergedPhones,
      linkedin_url: winnerContact.linkedin_url || loserContact.linkedin_url,
      background: winnerContact.background ?? loserContact.background,
      has_newsletter:
        winnerContact.has_newsletter ?? loserContact.has_newsletter,
      first_seen: winnerContact.first_seen ?? loserContact.first_seen,
      last_seen:
        winnerContact.last_seen > loserContact.last_seen
          ? winnerContact.last_seen
          : loserContact.last_seen,
      actor_id: winnerContact.actor_id ?? loserContact.actor_id,
      tags: mergeArraysUnique(
        winnerContact.tags || [],
        loserContact.tags || [],
      ),
    },
    previousData: winnerContact,
  });

  await Promise.all([
    ...taskUpdates,
    ...noteUpdates,
    ...intentionContactUpdates,
    winnerUpdate,
  ]);

  // 5. Delete the loser contact
  await dataProvider.delete<Contact>("contacts", {
    id: loserId,
    previousData: loserContact,
  });
};

const mergeArraysUnique = <T>(arr1: T[], arr2: T[]): T[] => [
  ...new Set([...arr1, ...arr2]),
];

function mergeObjectArraysUnique<T>(
  arr1: T[],
  arr2: T[],
  getKey: (item: T) => string,
): T[] {
  const map = new Map<string, T>();

  arr1.forEach((item) => {
    const key = getKey(item);
    if (key) map.set(key, item);
  });

  arr2.forEach((item) => {
    const key = getKey(item);
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}
