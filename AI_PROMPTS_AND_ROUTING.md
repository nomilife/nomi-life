# AI_PROMPTS_AND_ROUTING.md
Phase 1: scaffold (jobs + templates).  
Phase 2: enable with OpenAI Responses API.

---

## 1) Model routing (recommended)
- FAST parse/extract: **gpt-5-nano**
- short friendly copy: **gpt-5-mini**
- weekly insight reasoning: **gpt-5.2**

Why:
- nano = cheapest/fastest for structured JSON
- mini = best speed/quality for microcopy
- 5.2 = stronger for weekly insights and pattern finding

---

## 2) Job strategy (non-blocking)
If expected > 1–2s => create ai_job:
- status: queued -> running -> done/failed
- progress_stage: collecting|summarizing|suggesting|finalizing

Mobile UX:
- show small “LifeOS hazırlanıyor…” card
- user can navigate away
- completion shows banner + optional push

---

## 3) Prompt templates (store as files)
Store under /apps/api/src/ai/prompts/*.txt

### 3.1 parse-command (FAST)
Goal: map user text -> action JSON.
Output JSON only.

Schema:
{
  "action": "create_event" | "create_bill" | "update_bill_amount" | "create_journal" | "create_habit" | "unknown",
  "data": { ... },
  "facts_to_upsert": [{ "key": "...", "value": "...", "confidence": 0.0-1.0 }]
}

### 3.2 checkin-copy (CHAT)
Input:
- minimal context summary
- assistant tone settings
Output:
{ "text": "..." } (1–2 short sentences)

Hard rules:
- no judgement
- no robotic “list 3 things”
- ask one question max

### 3.3 weekly-insight (INSIGHT)
Output JSON:
{
  "week_range": "YYYY-MM-DD..YYYY-MM-DD",
  "bullets": ["...", "...", "..."],
  "pattern": "...",
  "suggestion": "..."
}

Store output as:
- timeline_item(kind=insight) + metadata

END
