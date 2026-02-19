# NOTIFICATIONS_AND_CHECKINS.md
Goal: feel like a daily friend, not a robot.

---

## 1) MVP Notification types
### 1.1 Daily check-in (evening)
Trigger window: 20:00–22:30 local time
Condition:
- no meaningful activity today (no create/edit event, no bill update, no habit entry, no chat sent)

Copy style:
- 1 short question, human tone
- no “3 things” checklist
Examples (tone reference, not literal):
- “Bugün nasıl geçti? Bir şey eklemek ister misin?”
- “Akşam oldu 🙂 Günün içinden bir şey kaldı mı aklında?”
- “Yarın için kafanda netleşen bir şey var mı?”

Action:
- opens Flow -> Check-in modal (quick add: event / note / bill amount / habit)

### 1.2 Bill amount prompt
Trigger:
- bill due in 1–2 days AND bill.amount is null OR (variable bill enabled)
- if bill.autopay=true => ask only amount
Copy:
- “Elektrik bu ay kaç geldi?”
Action:
- opens bill detail quick input

### 1.3 Event reminder
Trigger:
- 30–60 min before event
Copy:
- short heads-up
No “confirm / reschedule” lockscreen flows in MVP.

---

## 2) Phase 2: Context-aware prompts
Use user facts and patterns:
- relationship: nudge before special dates
- pay day: budget-friendly prompts after salary day
- consistent gym: “bugün gym var mıydı?” etc.

Implementation:
- facts in user_profile_facts
- patterns in memories
- AI generates copy via /ai/checkin-copy

END
