# History Storage Strategy

## Current state
- AI output is stored in `ToolRun.outputText`.
- Metadata is stored in `ToolRun`: tool, provider/model, status, token usage, estimated cost.

## Recommended production strategy
1. Keep recent runs in primary DB for quick UI access.
- Suggested retention in `ToolRun`: 90-180 days.

2. Move older runs to archive storage.
- Option A: `ToolRunArchive` table in same Postgres.
- Option B: object storage (S3/Blob) with only reference in DB.

3. Add data minimization controls.
- Optional toggle per tool/user: store full output vs. masked output.
- Optional redaction before save (emails, phone numbers, IDs).

4. Add lifecycle jobs.
- Daily job: move old records from `ToolRun` to archive.
- Daily/weekly job: delete records past legal retention period.

5. Add user-level controls.
- Delete selected run.
- Delete all runs for a user (subject to policy).
- Export run history (JSON/CSV).

## Suggested schema extension (future)
- `ToolRun` for fast metadata + short output preview.
- `ToolRunArtifact` for full prompt/output payload:
  - `toolRunId`
  - `promptText`
  - `outputText`
  - `storageType` (`db` | `blob`)
  - `storagePath`
  - `createdAt`

This split keeps history fast while allowing scalable long-term storage.
