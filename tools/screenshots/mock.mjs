// Demo-Daten für Screenshots der echten Web-Version. Alle Personen, Gesuche und Nachrichten sind erfunden.
// Antworten im Format der Supabase-Aufrufe der App (Funktionen und Tabellen wie in src/types/database.ts des
// App-Repos). Auch die Stammdaten (Rollen) stehen hier; das Skript fragt nie ein Supabase-Projekt ab.
// Termine liegen relativ zu heute, damit die Bilder nie veraltet wirken.

const H = 3600_000;
const D = 24 * H;

/** Abstand Europe/Berlin zu UTC in Minuten zum Zeitpunkt `ms` (Sommer- und Winterzeit). */
function berlinOffset(ms) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - ms) / 60_000);
}

/** Uhrzeit `hh:mm` in Berlin, `dayOffset` Tage nach heute, als ISO-UTC. */
function berlin(dayOffset, hh, mm = 0) {
  const now = new Date();
  const local = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hh, mm);
  return new Date(local - berlinOffset(local) * 60_000).toISOString();
}
const dow = new Date().getDay(); // 0 So … 6 Sa
const toSat = ((6 - dow + 7) % 7) || 7;
const SAT = toSat, SUN = toSat + 1;
const plus = (iso, min) => new Date(new Date(iso).getTime() + min * 60_000).toISOString();
const ago = (ms) => new Date(Date.now() - ms).toISOString();

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const ME = uuid(1);
const LENA = uuid(2), MAX = uuid(3), MIA = uuid(4), CLUB = uuid(5), PAUL = uuid(6), EMRE = uuid(7), SARA = uuid(8);
const KA = uuid(100);

export const IDS = {
  reqLena: uuid(201), reqScorer: uuid(202), reqClub: uuid(203), reqShot: uuid(204), reqRef: uuid(205), reqFree: uuid(206),
  ownReq: uuid(210), ownReqDone: uuid(211),
  convLena: uuid(301), convMax: uuid(302), convMia: uuid(303), convClub: uuid(304),
  asgLena: uuid(401), asgMia: uuid(402), asgMax: uuid(403), asgSara: uuid(404), asgClub: uuid(405),
  offerMine: uuid(501), offerMia: uuid(502), offerPaul: uuid(503), offerEmre: uuid(504),
  lena: LENA, mia: MIA,
};

const trust = (avg, count, late = 0, noShow = 0) =>
  ({ rating_avg: avg, rating_count: count, late_cancellation_count: late, no_show_count: noShow });

// ---- Entdecken: Gesuche -------------------------------------------------------------------------
const searchRequests = [
  { id: IDS.reqScorer, role_name: "Anschreiber (Tablet)", price_cents: 1500, venue_name: "Weinbrennerhalle", place_name: "Karlsruhe",
    distance_km: 2.1, starts_at: berlin(1, 19, 30), license_level_count: 1, min_license_name: "Tablet-Lizenz",
    min_license_required: true, requester_is_club: false, is_own: false },
  { id: IDS.reqLena, role_name: "Zeitnehmer", price_cents: 2000, venue_name: "Lina-Radke-Halle", place_name: "Karlsruhe",
    distance_km: 3.4, starts_at: berlin(SAT, 14), license_level_count: 0, min_license_name: null, min_license_required: null,
    requester_is_club: false, is_own: false },
  { id: IDS.reqClub, role_name: "Kampfgericht (Position egal)", price_cents: 1000, venue_name: "Europahalle", place_name: "Karlsruhe",
    distance_km: 3.9, starts_at: berlin(SAT, 16), license_level_count: 0, min_license_name: null, min_license_required: null,
    requester_is_club: true, is_own: false },
  { id: IDS.reqShot, role_name: "24-Sekunden-Zeitnehmer", price_cents: 1500, venue_name: "Weiherhofhalle", place_name: "Karlsruhe-Durlach",
    distance_km: 6.2, starts_at: berlin(SUN, 11), license_level_count: 0, min_license_name: null, min_license_required: null,
    requester_is_club: false, is_own: false },
  { id: IDS.reqRef, role_name: "Schiedsrichter", price_cents: 3000, venue_name: "Albgauhalle", place_name: "Ettlingen",
    distance_km: 9.8, starts_at: berlin(SUN, 13), license_level_count: 6, min_license_name: "LSE", min_license_required: true,
    requester_is_club: true, is_own: false },
  { id: IDS.reqFree, role_name: "Kampfgericht (Position egal)", price_cents: 0, venue_name: "Sporthalle an der Tennesseeallee",
    place_name: "Karlsruhe", distance_km: 4.5, starts_at: berlin(SAT + 7, 10), license_level_count: 0, min_license_name: null,
    min_license_required: null, requester_is_club: false, is_own: false },
].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

const lenaRequest = {
  id: IDS.reqLena, role_name: "Zeitnehmer", role_description: "Bedient die Spieluhr", price_cents: 2000,
  venue_name: "Lina-Radke-Halle", venue_address: "Steinhäuserstraße 29", place_name: "Karlsruhe",
  starts_at: berlin(SAT, 14), arrival_at: plus(berlin(SAT, 14), -15), ends_at: plus(berlin(SAT, 14), 120),
  team_info: "U16 Bezirksliga, Heimspiel", status: "open", is_expired: false, is_own: false,
  description: "Ich habe Samstag eine Familienfeier und kann unseren Dienst nicht selbst machen. Die Spieluhr erklären wir dir vor Ort, Vorkenntnisse sind nicht nötig.",
  license_level_count: 0, min_license_name: null, min_license_description: null, min_license_required: null, my_license_covers: null,
  requester_id: LENA, requester_name: "Lena M.", requester_avatar_path: null, requester_club_name: null,
  requester_completed_count: 9, ...trust(4.8, 12),
};

const ownRequest = {
  id: IDS.ownReq, role_name: "Anschreiber (Tablet)", role_description: "Führt den digitalen Spielberichtsbogen", price_cents: 2000,
  venue_name: "Sporthalle an der Tennesseeallee", venue_address: "Tennesseeallee 101", place_name: "Karlsruhe",
  starts_at: berlin(SUN, 16), arrival_at: plus(berlin(SUN, 16), -15), ends_at: plus(berlin(SUN, 16), 120),
  team_info: "Herren Kreisliga, Heimspiel", status: "open", is_expired: false, is_own: true,
  description: "Ich spiele selbst und kann deshalb nicht anschreiben. Tablet und Ladekabel liegen am Kampfgericht.",
  license_level_count: 1, min_license_name: "Tablet-Lizenz", min_license_description: "Pflicht fürs digitale Spielprotokoll am Tablet",
  min_license_required: true, my_license_covers: null,
  requester_id: ME, requester_name: "Jonas B.", requester_avatar_path: null, requester_club_name: null,
  requester_completed_count: 6, ...trust(4.9, 7),
};

// ---- Entdecken: Helfer ------------------------------------------------------------------------------
const offerRow = (o) => ({ helper_avatar_path: null, is_own: false, license_level_names: [], ...o });
const searchOffers = [
  offerRow({ id: IDS.offerMia, helper_id: MIA, helper_name: "Mia S.", role_names: ["Kampfgericht (Position egal)", "Zeitnehmer"],
    window_start: berlin(SAT, 11), window_end: berlin(SAT, 20), place_name: "Karlsruhe", radius_km: 20, price_cents: 1000, ...trust(4.7, 5) }),
  offerRow({ id: IDS.offerEmre, helper_id: EMRE, helper_name: "Emre T.", role_names: ["Anschreiber (Tablet)"], license_level_names: ["Tablet-Lizenz"],
    window_start: berlin(SAT, 14), window_end: berlin(SAT, 18), place_name: "Karlsruhe", radius_km: 10, price_cents: 1500, ...trust(null, 0) }),
  offerRow({ id: IDS.offerPaul, helper_id: PAUL, helper_name: "Paul R.", role_names: ["Schiedsrichter"], license_level_names: ["LSD"],
    window_start: berlin(SUN, 10), window_end: berlin(SUN, 16), place_name: "Ettlingen", radius_km: 15, price_cents: 2500, ...trust(5, 3) }),
];
const helperRow = (h) => ({ avatar_path: null, license_level_names: [], ...h });
const searchHelpers = [
  helperRow({ id: SARA, display_name: "Sara K.", place_name: "Karlsruhe", radius_km: 15, role_names: ["Anschreiber (Tablet)", "Zeitnehmer", "24-Sekunden-Zeitnehmer"],
    license_level_names: ["Tablet-Lizenz"], completed_count: 14, ...trust(4.9, 11) }),
  helperRow({ id: MIA, display_name: "Mia S.", place_name: "Karlsruhe", radius_km: 20, role_names: ["Kampfgericht (Position egal)", "Zeitnehmer"],
    completed_count: 6, ...trust(4.7, 5) }),
  helperRow({ id: PAUL, display_name: "Paul R.", place_name: "Ettlingen", radius_km: 15, role_names: ["Schiedsrichter"], license_level_names: ["LSD"],
    completed_count: 3, ...trust(5, 3) }),
  helperRow({ id: EMRE, display_name: "Emre T.", place_name: "Karlsruhe", radius_km: 10, role_names: ["Anschreiber (Tablet)"],
    license_level_names: ["Tablet-Lizenz"], completed_count: 0, ...trust(null, 0) }),
];

// ---- Chats --------------------------------------------------------------------------------------------
const conv = (c) => ({
  assignment_origin: "application", blocked_by_me: false, is_blocked: false, is_expired: false, license_covers: true,
  min_license_name: null, my_rating: null, other_avatar_path: null, proposed_price_cents: null, review_deadline: null,
  review_due: false, safety_notice_seen: true, unread: false, agreed_price_cents: null, created_at: ago(2 * D), ...c,
});
const conversations = [
  conv({ conversation_id: IDS.convLena, request_id: IDS.reqLena, assignment_id: IDS.asgLena, assignment_status: "accepted",
    agreed_price_cents: 2000, my_side: "helper", other_id: LENA, other_name: "Lena M.", role_name: "Zeitnehmer",
    starts_at: lenaRequest.starts_at, arrival_at: lenaRequest.arrival_at, ends_at: lenaRequest.ends_at,
    venue_name: "Lina-Radke-Halle", place_name: "Karlsruhe", price_cents: 2000, request_status: "assigned",
    last_message_body: "Gegenüber vom Eingang, Halle 1. Ich bin ab 13:15 da.", last_message_at: ago(12 * 60_000), unread: true }),
  conv({ conversation_id: IDS.convMax, request_id: IDS.ownReq, assignment_id: IDS.asgMax, assignment_status: "pending",
    my_side: "requester", other_id: MAX, other_name: "Max K.", role_name: "Anschreiber (Tablet)", min_license_name: "Tablet-Lizenz",
    starts_at: ownRequest.starts_at, arrival_at: ownRequest.arrival_at, ends_at: ownRequest.ends_at,
    venue_name: "Sporthalle an der Tennesseeallee", place_name: "Karlsruhe", price_cents: 2000, request_status: "open",
    last_message_body: "Hi Jonas, ich habe die Tablet-Lizenz und Sonntag Zeit.", last_message_at: ago(2 * H), unread: true }),
  conv({ conversation_id: IDS.convMia, request_id: IDS.ownReq, assignment_id: IDS.asgMia, assignment_status: "pending",
    my_side: "requester", other_id: SARA, other_name: "Sara K.", role_name: "Anschreiber (Tablet)", min_license_name: "Tablet-Lizenz",
    starts_at: ownRequest.starts_at, arrival_at: ownRequest.arrival_at, ends_at: ownRequest.ends_at,
    venue_name: "Sporthalle an der Tennesseeallee", place_name: "Karlsruhe", price_cents: 2000, request_status: "open",
    last_message_body: "Ich könnte das übernehmen, schreibe seit drei Jahren an.", last_message_at: ago(5 * H) }),
  conv({ conversation_id: IDS.convClub, request_id: IDS.ownReqDone, assignment_id: IDS.asgClub, assignment_status: "completed",
    agreed_price_cents: 1500, my_side: "helper", other_id: CLUB, other_name: "BG Durlach-Süd", role_name: "24-Sekunden-Zeitnehmer",
    starts_at: berlin(-4, 18), arrival_at: plus(berlin(-4, 18), -15), ends_at: plus(berlin(-4, 18), 120),
    venue_name: "Weiherhofhalle", place_name: "Karlsruhe-Durlach", price_cents: 1500, request_status: "closed",
    review_due: true, review_deadline: plus(berlin(-4, 20), 14 * 24 * 60),
    last_message_body: "Danke für deinen Einsatz, hat super geklappt!", last_message_at: ago(3 * D) }),
];

const msg = (id, sender, body, at) => ({ id: uuid(9000 + id), sender_id: sender, body, created_at: at });
const messages = {
  [IDS.convLena]: [
    msg(1, ME, "Hallo Lena, ich hätte Samstag Zeit und übernehme gern die Spieluhr.", ago(26 * H)),
    msg(2, LENA, "Super, danke! Ich habe dir gerade zugesagt.", ago(25 * H)),
    msg(3, ME, "Wo genau ist das Kampfgericht?", ago(24.5 * H)),
    msg(4, LENA, "Gegenüber vom Eingang, Halle 1. Ich bin ab 13:15 da.", ago(12 * 60_000)),
  ].reverse(),
};

// ---- Meine ------------------------------------------------------------------------------------------
const myAssignments = [
  { assignment_id: IDS.asgLena, request_id: IDS.reqLena, conversation_id: IDS.convLena, status: "accepted", origin: "application",
    role_name: "Zeitnehmer", starts_at: lenaRequest.starts_at, venue_name: "Lina-Radke-Halle", place_name: "Karlsruhe",
    price_cents: 2000, agreed_price_cents: 2000, proposed_price_cents: null, request_status: "assigned",
    license_level_count: 0, min_license_name: null, min_license_required: null, review_due: false },
  { assignment_id: IDS.asgSara, request_id: IDS.reqScorer, conversation_id: uuid(305), status: "pending", origin: "application",
    role_name: "Anschreiber (Tablet)", starts_at: searchRequests.find((r) => r.id === IDS.reqScorer).starts_at, venue_name: "Weinbrennerhalle",
    place_name: "Karlsruhe", price_cents: 1500, agreed_price_cents: null, proposed_price_cents: null, request_status: "open",
    license_level_count: 1, min_license_name: "Tablet-Lizenz", min_license_required: true, review_due: false },
  { assignment_id: IDS.asgClub, request_id: IDS.ownReqDone, conversation_id: IDS.convClub, status: "completed", origin: "invitation",
    role_name: "24-Sekunden-Zeitnehmer", starts_at: berlin(-4, 18), venue_name: "Weiherhofhalle", place_name: "Karlsruhe-Durlach",
    price_cents: 1500, agreed_price_cents: 1500, proposed_price_cents: 1500, request_status: "closed",
    license_level_count: 0, min_license_name: null, min_license_required: null, review_due: true },
];
const myRequests = [
  { id: IDS.ownReq, starts_at: ownRequest.starts_at, duration_minutes: 120, price_cents: 2000, status: "open", venue_name: null,
    venue: { name: "Sporthalle an der Tennesseeallee" }, place: { name: "Karlsruhe" },
    role: { name: "Anschreiber (Tablet)", levels: [{ is_active: true }] }, min_license: { name: "Tablet-Lizenz", requires_license: true },
    assignments: [
      { status: "pending", helper_id: MAX, completed_at: null, reviews: [] },
      { status: "pending", helper_id: SARA, completed_at: null, reviews: [] },
    ] },
];
const myOffers = [
  { id: IDS.offerMine, window_start: berlin(SAT + 7, 10), window_end: berlin(SAT + 7, 18), radius_km: 15, price_cents: 1500,
    status: "open", place: { name: "Karlsruhe" },
    offer_roles: [{ role: { name: "Zeitnehmer", sort_order: 30 } }, { role: { name: "Anschreiber (Tablet)", sort_order: 20 } }] },
];

// ---- Anfragen am eigenen Gesuch -------------------------------------------------------------------
const applications = [
  { assignment_id: IDS.asgMax, conversation_id: IDS.convMax, helper_id: MAX, helper_name: "Max K.", helper_avatar_path: null,
    status: "pending", origin: "application", created_at: ago(2 * H), first_message: "Hi Jonas, ich habe die Tablet-Lizenz und Sonntag Zeit.",
    license_covers: true, license_level_name: "Tablet-Lizenz", proposed_price_cents: null, completed_count: 5, my_rating: null,
    review_due: false, ...trust(4.9, 7) },
  { assignment_id: IDS.asgMia, conversation_id: IDS.convMia, helper_id: SARA, helper_name: "Sara K.", helper_avatar_path: null,
    status: "pending", origin: "application", created_at: ago(5 * H), first_message: "Ich könnte das übernehmen, schreibe seit drei Jahren an.",
    license_covers: true, license_level_name: "Tablet-Lizenz", proposed_price_cents: null, completed_count: 14, my_rating: null,
    review_due: false, ...trust(4.9, 11) },
];

// ---- Profile ----------------------------------------------------------------------------------------
const ownProfile = {
  id: ME, account_type: "person", first_name: "Jonas", last_name: "Becker", display_name: "Jonas B.", birth_date: "2003-05-14",
  place_id: KA, place: { id: KA, name: "Karlsruhe" }, bio: "Studiere am KIT und spiele selbst Basketball. Am Wochenende helfe ich gern am Kampfgericht aus.",
  avatar_path: null, club_name: null, club_authority_confirmed_at: null, banned_at: null, analytics_consent: false,
  email_notifications: true, listed_as_helper: true, travel_radius_km: 15, terms_accepted_at: ago(10 * D),
  terms_version: "2026-10-07", created_at: ago(12 * D), updated_at: ago(2 * D),
};
const publicProfiles = {
  [LENA]: { id: LENA, display_name: "Lena M.", avatar_path: null, place_name: "Karlsruhe", is_club: false, club_name: null,
    bio: "Spiele in der Damenmannschaft und koordiniere die Dienste unserer U16.", member_since: ago(40 * D), completed_count: 9,
    agreed_count: 1, role_names: ["Kampfgericht (Position egal)", "Zeitnehmer"], licenses: [], is_listed: true, is_own: false, ...trust(4.8, 12) },
};
const reviews = {
  [LENA]: [
    { id: uuid(801), rating: 5, comment: "Sehr zuverlässig und pünktlich, gerne wieder!", reviewee_side: "requester", role_name: "Anschreiber (Tablet)", starts_at: berlin(-9, 15), published_at: ago(7 * D) },
    { id: uuid(802), rating: 5, comment: "Klare Absprachen im Chat, alles hat gepasst.", reviewee_side: "requester", role_name: "Zeitnehmer", starts_at: berlin(-16, 11), published_at: ago(14 * D) },
    { id: uuid(803), rating: 4, comment: "Kurzfristig eingesprungen, danke!", reviewee_side: "helper", role_name: "Kampfgericht (Position egal)", starts_at: berlin(-23, 17), published_at: ago(21 * D) },
  ],
};

/** Antwort auf eine RPC; `undefined` heißt: unbekannt. */
export function rpc(name, body) {
  switch (name) {
    case "search_requests": return body.p_cursor_id ? [] : searchRequests;
    case "get_request": return body.p_id === IDS.ownReq ? [ownRequest] : body.p_id === IDS.reqLena ? [lenaRequest] : [];
    case "search_offers": return body.p_cursor_id ? [] : searchOffers;
    case "search_helpers": return body.p_offset ? [] : searchHelpers;
    case "get_my_conversations":
      return body.p_conversation_id ? conversations.filter((c) => c.conversation_id === body.p_conversation_id) : conversations;
    case "get_my_assignments": return myAssignments;
    case "get_request_applications": return body.p_request_id === IDS.ownReq ? applications : [];
    case "get_public_profile": return publicProfiles[body.p_user_id] ? [publicProfiles[body.p_user_id]] : [];
    case "get_published_reviews": return body.p_cursor_id ? [] : reviews[body.p_user_id] ?? [];
    case "get_user_offers": return [];
    case "get_matching_offers": return [];
    case "get_matching_helpers": return body.p_request_id === IDS.ownReq ? searchHelpers.slice(0, 2) : [];
    case "get_matching_requests": return [];
    case "get_assignment_license": return [];
    case "get_blocked_users": return [];
    case "get_invite_requests": return [];
    case "search_places": return [{ id: KA, kind: "municipality", name: "Karlsruhe" }];
    // Schreibende Funktionen: nur bestätigen, nie weiterleiten
    case "mark_conversation_read": case "mark_safety_notice_seen": return null;
    default: return undefined;
  }
}

// ---- Stammdaten: Rollen und Lizenzstufen wie im App-Repo (Migration master_data, Stand Oktober 2026) ----------
const level = (n, name, description, rank, requires_license = true) =>
  ({ id: uuid(700 + n), name, description, rank, requires_license, is_active: true });
const role = (n, slug, role_group, is_generic, name, description, requires_license, levels = []) =>
  ({ id: uuid(600 + n), slug, role_group, is_generic, name, description, requires_license, arrival_minutes_before: 15,
    license_levels: levels });
const roles = [
  role(0, "table_any", "table_official", true, "Kampfgericht (Position egal)",
    "Irgendeine Position am Kampfgericht, wird vor Ort verteilt. Ohne Lizenz nicht am Tablet.", false),
  role(1, "scorer", "table_official", false, "Anschreiber (Tablet)", "Führt den digitalen Spielberichtsbogen", true,
    [level(11, "Tablet-Lizenz", "Pflicht fürs digitale Spielprotokoll am Tablet", 10)]),
  role(2, "timekeeper", "table_official", false, "Zeitnehmer", "Bedient die Spieluhr", false),
  role(3, "shot_clock", "table_official", false, "24-Sekunden-Zeitnehmer", "Bedient die 24-Sekunden-Uhr", false),
  role(4, "referee", "referee", false, "Schiedsrichter", "Leitet das Spiel, wenn der Verband niemanden stellt", true, [
    level(40, "ohne Lizenz", "Für Spiele ohne Lizenzpflicht, z. B. Freundschaftsspiele", 10, false),
    level(41, "LSE", "Einstieg: Spiele auf Bezirksebene, auch Jugend", 20),
    level(42, "LSD", "Spiele bis einschließlich Landesliga", 30),
    level(43, "LSC", "Oberliga und Regionalliga Baden-Württemberg", 40),
    level(44, "LSB", "1. Regionalliga", 50),
    level(45, "LSA", "Bundesligen", 60),
  ]),
];

/** Antwort auf eine Tabellenabfrage; `undefined` heißt: unbekannt (das Skript antwortet dann mit einer leeren Liste). */
export function table(name, params) {
  const eq = (col) => params.get(col)?.replace(/^eq\./, "");
  switch (name) {
    case "roles": return roles;
    case "places": return [{ id: KA, name: "Karlsruhe" }];
    case "profiles": return [ownProfile];
    case "requests": return eq("requester_id") ? myRequests : [];
    case "offers": return eq("helper_id") ? myOffers : [];
    case "messages": return messages[eq("conversation_id")] ?? [];
    case "assignments": return [];
    case "conversations": return [];
    case "helper_roles":
      return [{ role_id: uuid(601), role: { name: "Anschreiber (Tablet)", sort_order: 20 } }, { role_id: uuid(602), role: { name: "Zeitnehmer", sort_order: 30 } }];
    case "helper_licenses":
      return [{ role_id: uuid(601), level_id: uuid(711), license_number: "DEMO-0000", level: { name: "Tablet-Lizenz" } }];
    case "push_tokens": return [];
    default: return undefined;
  }
}

export const session = () => {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const access = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: ME, role: "authenticated", aud: "authenticated", exp: now + 86400, iat: now, email: "jonas@example.com", session_id: uuid(999) })}.demo`;
  return {
    access_token: access, token_type: "bearer", expires_in: 86400, expires_at: now + 86400, refresh_token: "demo-refresh",
    user: { id: ME, aud: "authenticated", role: "authenticated", email: "jonas@example.com", app_metadata: { provider: "email" },
      user_metadata: {}, created_at: ownProfile.created_at, email_confirmed_at: ownProfile.created_at },
  };
};
