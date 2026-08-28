import { personNotes } from "../mock";
import type { PersonNote } from "../types";
import { delay } from "./_shared";

/** GET /api/v1/users/{id}/notes */
export async function getUserNotes(id: string): Promise<PersonNote[]> {
  await delay(220);
  return personNotes
    .filter((n) => n.user_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** POST /api/v1/users/{id}/notes */
export async function createUserNote(
  id: string,
  body: string,
  author: string,
): Promise<PersonNote> {
  await delay(350);
  const note: PersonNote = {
    id: `note_${Date.now()}`,
    user_id: id,
    author,
    body,
    created_at: new Date().toISOString(),
  };
  personNotes.push(note);
  return note;
}

/** DELETE /api/v1/notes/{id} */
export async function deleteUserNote(noteId: string): Promise<{ id: string }> {
  await delay(250);
  const idx = personNotes.findIndex((n) => n.id === noteId);
  if (idx !== -1) personNotes.splice(idx, 1);
  return { id: noteId };
}
