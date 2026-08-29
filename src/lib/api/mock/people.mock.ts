import type { Person } from "../types";
import { DAY, int, iso, NOW, pick, slugify } from "./random";

const PEOPLE_SEED: Array<[string, string, string]> = [
  ["Amara Osei", "Staff Engineer", "America/Toronto"],
  ["Daniel Whitfield", "Engineering Manager", "America/New_York"],
  ["Priya Raghunathan", "Product Manager", "Asia/Kolkata"],
  ["Tomas Lindqvist", "Backend Engineer", "Europe/Stockholm"],
  ["Grace Nakamura", "Data Scientist", "Asia/Tokyo"],
  ["Miguel Arroyo", "Platform Engineer", "Europe/Madrid"],
  ["Hannah Feldman", "Design Lead", "America/Los_Angeles"],
  ["Kwame Boateng", "Site Reliability Engineer", "Africa/Accra"],
  ["Sofia Bianchi", "QA Engineer", "Europe/Rome"],
  ["Elliot Marsh", "Security Engineer", "Europe/London"],
  ["Yuki Tanabe", "Frontend Engineer", "Asia/Tokyo"],
  ["Nadia Haddad", "Solutions Architect", "Asia/Dubai"],
  ["Owen Castellanos", "Support Lead", "America/Mexico_City"],
  ["Freya Sorensen", "Technical Writer", "Europe/Copenhagen"],
  ["Ravi Deshpande", "ML Engineer", "Asia/Kolkata"],
  ["Clara Mbeki", "Program Manager", "Africa/Johannesburg"],
  ["Jonas Weber", "DevOps Engineer", "Europe/Berlin"],
  ["Lena Petrova", "Analytics Engineer", "Europe/Warsaw"],
];

const CITIES = [
  "412 Bathurst St, Toronto, ON",
  "88 Greenwich Ave, New York, NY",
  "17 MG Road, Bengaluru",
  "Sveavägen 42, Stockholm",
  "3-9-1 Shibuya, Tokyo",
  "Calle Mayor 21, Madrid",
  "1400 Sunset Blvd, Los Angeles",
  "6 Oxford St, London",
];

/** Builds a fresh copy of the table. Draws from the shared seeded RNG. */
export function seedPeople(): Person[] {
  return PEOPLE_SEED.map(([full_name, job_title, timezone], i) => {
    const created = NOW - int(120, 700) * DAY;
    const active = i % 11 !== 5;
    return {
      id: `usr_${String(i + 1).padStart(4, "0")}`,
      email: `${slugify(full_name)}@mabinsoft.dev`,
      full_name,
      display_name: full_name.split(" ")[0]!,
      job_title,
      address: pick(CITIES),
      employment_start: iso(created).slice(0, 10),
      employment_end: active ? null : iso(created + int(200, 500) * DAY).slice(0, 10),
      timezone,
      is_active: active,
      created_at: iso(created),
      updated_at: iso(created + int(1, 90) * DAY),
    };
  });
}

/** Mutable in-memory table. Endpoint functions read and write this directly. */
export const people: Person[] = seedPeople();
