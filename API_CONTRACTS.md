# API_CONTRACTS.md
HTTP API for mobile. Base URL: /apps/api on :3001

Auth:
- Mobile sends Supabase JWT in Authorization: Bearer <token>
- API verifies -> userId.

---

## 1) Timeline / Flow
GET /timeline?date=YYYY-MM-DD
Response:
{
  "date": "YYYY-MM-DD",
  "items": [
    { "id": "...", "kind":"event", "startAt":"...", "endAt":"...", "title":"...", "summary": "...", "status":"scheduled", "metadata":{} }
  ],
  "highlights": { "focusState": 0.84, "netLiquid": 1240, "bioSync": "optimal" } // computed placeholders OK
}

POST /timeline/item
PATCH /timeline/item/:id

---

## 2) Events (Network + Flow)
POST /events
Body:
{
  "title": "...",
  "startAt": "ISO",
  "endAt": "ISO",
  "location": "...?",
  "visibility": "private|shared",
  "recurrenceRrule": "RRULE:FREQ=WEEKLY;BYDAY=MO,WE"?,
  "participantsEmails": ["a@b.com"]?
}
Creates:
- timeline_item(kind=event)
- events row
- event_participants (host + invited)
- conversation row

PATCH /events/:id
POST /events/:id/invite { "email": "x@y.com" }
POST /events/:id/rsvp { "status": "accepted|declined" }

GET /events/:id
GET /events/:id/conversation
POST /events/:id/messages { "text": "..." }

---

## 3) Bills (Vault)
POST /bills
Body: { "vendor":"", "dueDate":"YYYY-MM-DD", "recurrence":"monthly"?, "autopay":true/false, "amount": 123.45? }

PATCH /bills/:id
- update amount/autopay/dueDate/recurrence

POST /bills/:id/amount
Body: { "amount": 142.00, "currency":"TRY"? }

GET /bills?range=month|upcoming

Rules:
- if autopay=true => do not ask “paid?”
- amount can be null until user provides

---

## 4) Habits / Routine
POST /habits { "title":"", "schedule":{...}, "category":""? }
PATCH /habits/:id
GET /habits?active=true

POST /habits/:id/entry
Body: { "date":"YYYY-MM-DD", "status":"done|skipped|missed", "note":""? }

GET /routine?date=YYYY-MM-DD
Response includes:
- flowState (0..1)
- active habits list (with today status)
- consistencyMatrix for last N days (for the matrix UI)

---

## 5) Notifications
POST /notifications/register-token { "expoPushToken":"ExponentPushToken[...]" }
POST /notifications/run-rules (dev only)

---

## 6) AI (scaffold)
POST /ai/jobs { "jobType":"weekly_insight", "input":{...} }
GET /ai/jobs/:id

FAST paths (Phase 2):
POST /ai/parse-command
POST /ai/checkin-copy
POST /ai/weekly-insight (always async)

END
