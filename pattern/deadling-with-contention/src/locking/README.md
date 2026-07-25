# Redlock integration

This folder contains a simple Redlock-style lock manager for the document update path.

## How it works

- The service creates a lock key per document, such as `document:42`.
- The lock manager tries to acquire the key on multiple Redis instances.
- A lock is granted when a quorum of instances accepts the write.
- The lock is released using the same token so only the original owner can delete it.

## Configuration

Set the following environment variables to enable the distributed lock:

- `REDIS_ENDPOINTS`: comma-separated Redis URLs such as `redis://127.0.0.1:6379,redis://127.0.0.1:6380,redis://127.0.0.1:6381`
- `REDIS_LOCK_TTL_MS`: TTL before the lock expires
- `REDIS_LOCK_RETRY_COUNT`: how many acquisition attempts the manager makes
- `REDIS_LOCK_RETRY_DELAY_MS`: delay between retries

## Important caveat

Redlock is useful for cross-instance coordination, but it does not provide fencing. Keep the database version check and optimistic locking in place so a slow holder cannot overwrite a newer version after its TTL expires.
