# CMS Optimistic Locking Implementation

## Goal

Build a content-management application for documents that are rarely edited simultaneously. Use optimistic locking so normal edits remain lock-free while concurrent edits are detected safely.

## Stack

- Node.js
- Plain JavaScript
- MySQL
- Node.js built-in HTTP server and test runner
- `mysql2` for MySQL access

## Concurrency contract

Each document has an integer `version`, initialized to `1`. A write must compare the caller's expected version and increment the version atomically:

```sql
UPDATE documents
SET content = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
WHERE document_id = ? AND version = ?;
```

An affected-row count of `1` means the update succeeded. A count of `0` means the document is missing or the expected version is stale. The repository must distinguish those cases.

## Retry behavior

The service may retry a stale update a bounded number of times. A retry must:

1. Reload the latest document.
2. Recheck authorization, status, and content rules.
3. Reapply a domain-level operation such as `appendContent`.
4. Attempt the compare-and-update with the latest version.

Do not blindly retry a stale full-document payload because that can overwrite another editor's changes. Return a conflict after the retry limit is exhausted.

## Business rules

- Only documents in `draft` status can be edited.
- Content must be a non-empty string of at most 100,000 characters.
- The business rules must run again after every reload before a retry.

## API contract

- `GET /documents/:id` returns the document and its version.
- `PUT /documents/:id/content` accepts `{ "expectedVersion": 1, "append": "new text" }`.
- Success returns `200` and the updated document/version.
- Missing documents return `404`.
- Invalid requests return `400`.
- Published documents return `409`.
- Unresolvable optimistic-lock conflicts return `409`.

## Verification checklist

- Two writers using the same version result in one success and one conflict.
- A forced conflict reloads the latest document and safely reapplies the domain operation.
- Repeated conflicts stop at the configured retry limit.
- Published documents cannot be edited, including during retry.
- Successful writes increment the version exactly once.
- API responses expose the updated version and correct status codes.
