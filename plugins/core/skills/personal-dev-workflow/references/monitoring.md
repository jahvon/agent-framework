# Monitoring & Quiet Hours

**Quiet hours: 23:00–08:00 America/New_York, every day.**

Pausing applies to monitors, pollers, CI and deploy watchers, loops, and scheduled wake-ups. The risky-operations rule below applies to all work. Get the time with `TZ=America/New_York date`; never assume the machine's timezone.

## Behavior

- **Starting during quiet hours:** don't. Schedule the first check for 08:00.
- **Next check would fall in quiet hours:** pause instead.
  1. Post a handoff note on the PR, or in the session if there's no PR.
  2. Schedule a single resume for 08:00.
  3. Stop every polling process. Nothing keeps running in the background.
- **Resuming:** read the handoff note, re-check current state (it may have changed overnight), then continue.

Keep watching overnight only if Jahvon asked for that on this task. Say so in the handoff note.

## Risky operations

During quiet hours, an unattended session never runs a sensitive or risky operation automatically (`R-MON-03`), even if it was approved earlier or a monitor's condition is met. If Jahvon is actively supervising, or has told you to run that operation tonight, the normal approval flow applies instead. Safe work like reading, local builds, and tests can continue. Instead:

1. Prepare it fully (command ready, dry run if available).
2. List it under "Queued for morning" in the handoff note.
3. Run it after 08:00, once you've re-checked that it's still safe and still wanted.

If a watched process fails overnight and the fix is risky, don't fix it. Record the failure and the proposed fix in the handoff note.

## Handoff note

```markdown
**Paused for quiet hours** (resumes 08:00 ET)
- Watching: <what, with a link>
- Last state: <status at pause>
- On resume: <exact next step>
- Queued for morning: <risky operations held, with the prepared command>
- Needs Jahvon if: <condition>
```
