# System Design Patterns: The Essential Guide to Managing Contention in Distributed Systems

**Author:** Priya Srivastava  
**Published:** October 15, 2025  
**Reading time:** 5 min read  
**Source:** https://medium.com/@priyasrivastava18official/system-design-patterns-the-essential-guide-to-managing-contention-in-distributed-systems-d531b2f69dea

![Priya Srivastava](https://miro.medium.com/v2/resize:fill:32:32/1*TycNyJvjYme09dOfYHVECg@2x.jpeg)

## Motivation

> Be strong enough to stand alone, smart enough to know when you need help, and brave enough to ask for it.

![Article illustration](https://miro.medium.com/v2/resize:fit:614/1*wJYZuZ9UqQjTGQYCkfifpw.png)

## Introduction

Contention is a common challenge in distributed systems and even single-node applications where multiple processes or users compete for the same resource simultaneously. Without proper handling, contention leads to race conditions, data inconsistency, and user dissatisfaction.

This blog will explore:

- What contention is and why it matters
- Real-world scenarios where contention commonly occurs
- Various strategies to handle contention effectively
- Guidance on choosing the right approach depending on system scale and constraints
- Pros and cons of each contention strategy to help you make informed decisions

## What is Contention?

Contention occurs when multiple operations or processes compete for the same resource (database row, file, ticket, etc.) concurrently. This causes issues like race conditions, dirty reads, lost updates, and inconsistent data.

## Real-life Example: Concert Tickets

Imagine 1 seat left for a concert. Two users, Alice and Bob, simultaneously try to buy it. If both check the availability before any update happens, both might get the seat, resulting in:

- Double-booking
- Negative seat count
- Customer frustration

## Common Scenarios of Contention

- E-commerce flash sales (limited stock)
- Booking systems (seats, hotel rooms)
- Auction bidding platforms
- Financial transactions (transferring funds)
- Inventory management systems
- Distributed locks in microservices

### Contention Problems Explained

![Contention problems explained](https://miro.medium.com/v2/resize:fit:700/1*ZF282gXH6FJmbGQokT8aig.png)

## Strategies to Deal with Contention

### 1. Atomic Database Transactions

- Ensure all operations succeed or fail together (ACID).
- Prevent partial updates and maintain consistency.
- Used in: traditional e-commerce platforms and banking systems.

```text
Client
  |
API Server (Transactional Boundary)
  |
+---------------------+
| Relational DB       |
| (ACID Transactions) |
+---------------------+
```

The API server wraps business logic in a database transaction, ensuring atomicity.

### 2. Pessimistic Locking

- Acquire locks before accessing resources to block others.
- Avoid conflicts by serializing access upfront.
- Can cause deadlocks and reduce throughput.
- Used in: inventory management, ERP systems, and financial ledgers.

```text
Client
  |
API Server
  |
+-------------------------------+
| Relational DB                 |
| - Acquire Lock (Row/Table)    |
| - Process Transaction          |
+-------------------------------+
```

The lock is acquired upfront to prevent concurrent modifications.

### 3. Optimistic Concurrency Control (OCC)

- Allow concurrent reads and writes without locking initially.
- Check for conflicts at commit time using a version or timestamp.
- Retry if conflicts are detected.
- Used in: high-traffic web apps like Amazon and Shopify.

```text
Client
  |
API Server
  |
+------------------------------+
| Relational DB                |
| - Read Data with Version     |
| - Check Version on Write     |
+------------------------------+
  |
Retry logic on conflict
```

Reads happen without locks; writes verify versions before commit.

#### CMS implementation in this repository

The runnable example uses Node.js, plain JavaScript, and MySQL for documents that
are rarely edited simultaneously. Each document starts at `version = 1`. The
repository performs an atomic compare-and-update:

```sql
UPDATE documents
SET content = ?, version = version + 1
WHERE document_id = ? AND version = ?;
```

An affected-row count of `1` means the edit won. A count of `0` is checked again
to distinguish a missing document from a stale version. For a stale version, the
service reloads the latest draft, reapplies the domain operation, and retries a
bounded number of times. The example uses `appendContent` instead of blindly
replaying an old full-document payload, which avoids silently replacing another
editor's changes. If the document becomes published or conflicts continue past
the retry limit, the API returns `409 Conflict`.

See [PROMPT.md](PROMPT.md) for the complete contract and [database/documents.sql](database/documents.sql)
for the MySQL schema.

### 4. Database Isolation Levels

- Control how transactions see uncommitted changes.
- Balance consistency versus performance (Serializable, Read Committed, etc.).
- Used in: all relational databases, customized per workload (for example, banking versus analytics).

```text
Client
  |
API Server
  |
+------------------------------+
| Relational DB                |
| - Configurable Isolation    |
|   Levels (Serializable, etc.)|
+------------------------------+
```

The isolation level controls visibility and locking inside the database.

### 5. Distributed Locks

- Use external systems (Redis, Zookeeper) to coordinate locks across nodes.
- Prevent race conditions in distributed microservices.
- Used in: Uber, Airbnb, and Netflix microservices architectures.

```text
Client
  |
API Server Instance 1 <------+
  |                          |
  +-- Lock Service (Redis, Zookeeper)
  |                          |
API Server Instance 2 <------+
```

A distributed lock service coordinates access between multiple servers.

### 6. Queue-Based Serialization

- Funnel conflicting requests into a message queue.
- Process them sequentially to avoid conflicts and smooth load.
- Adds latency but guarantees correctness.
- Used in: ticket booking platforms, payment gateways, and ride-sharing apps.

```text
Client
  |
API Server
  |
+------------------+
| Message Queue    | (Kafka, RabbitMQ)
+------------------+
  |
Sequential Worker Processes
  |
Backend Database
```

Requests are serialized through a queue and processed one at a time.

### 7. Saga Pattern for Distributed Transactions

- Break distributed transactions into local transactions plus compensations.
- Enable eventual consistency without the overhead of two-phase commit.
- Used in: Amazon, Netflix, and Uber to maintain data consistency across multiple microservices.
- Useful in e-commerce orders, payment processing, and travel booking systems.

```text
Client
  |
API Server (Saga Orchestrator)
  |
+--------------------------------+
| Microservice A (Local Txn 1)   |
+--------------------------------+
  |
+--------------------------------+
| Microservice B (Local Txn 2)   |
+--------------------------------+
  |
Compensation Logic if failure
```

The orchestrator manages transaction steps and rollback actions.

### 8. Rate Limiting and Backoff Strategies

- Limit request rate to prevent overload and reduce contention.
- Use exponential backoff on retries to avoid conflict storms.
- Used in: the Twitter API, Google APIs, and public-facing services.

```text
Client
  |
API Gateway (Rate Limiter)
  |
API Server
  |
Backend Services
```

The API gateway throttles requests; clients retry with backoff on failure.

### 9. Sharding and Partitioning

- Split data horizontally to isolate contention to shards.
- Scale horizontally and reduce hotspots.
- Used in: Facebook's social graph, Twitter timelines, and large-scale databases.

```text
Client
  |
API Server (Routing Logic)
  |
+--------------------+  +--------------------+
| DB Shard 1         |  | DB Shard 2         |
+--------------------+  +--------------------+
```

Requests are routed to a specific shard based on the partition key.

### 10. Multi-Version Concurrency Control (MVCC)

- Maintain multiple versions of data for readers and writers to avoid blocking.
- Readers access a snapshot without locking writers.
- Used in: PostgreSQL, Oracle, and CockroachDB.

```text
Client
  |
API Server
  |
+--------------------------+
| MVCC-Enabled Database    |
| - Multiple Versions      |
|   Maintained             |
+--------------------------+
```

The database internally manages versions for concurrent reads and writes.

### 11. Eventual Consistency and Conflict Resolution with CRDTs

- Allow concurrent updates and automatically resolve conflicts.
- Provide high availability with eventual consistency.
- Used in: Google Docs, Dropbox Paper, and the Riak database.

```text
Client 1                 Client 2
   |                        |
+-----------+          +-----------+
| Local DB  |          | Local DB  |
| (CRDT)    |          | (CRDT)    |
+-----------+          +-----------+
       \                  /
        \                /
         +--------------+
         | Replication  |
         | & Conflict   |
         | Resolution   |
         +--------------+
```

Each client updates independently; conflicts are resolved automatically during synchronization.

## Pros and Cons of Contention Strategies

| Strategy | Pros | Cons |
| --- | --- | --- |
| Atomic database transactions | Strong consistency; simple mental model | Can limit throughput and increase lock duration |
| Pessimistic locking | Prevents conflicts before they happen | Deadlocks; reduced concurrency |
| Optimistic concurrency control | Good read scalability; avoids long-held locks | Retries under high contention |
| Database isolation levels | Tunable consistency and performance | Higher isolation can reduce throughput |
| Distributed locks | Coordinates access across nodes | Lock expiry, availability, and operational complexity |
| Queue-based serialization | Smooths load and guarantees ordered processing | Added latency and queue-management overhead |
| Saga pattern | Works across service boundaries; avoids two-phase commit | Requires compensation logic and eventual consistency |
| Rate limiting and backoff | Protects services from overload | Requests may be delayed or rejected |
| Sharding and partitioning | Reduces hotspots and scales horizontally | Routing and rebalancing complexity |
| MVCC | Readers and writers interfere less | Version storage and cleanup overhead |
| CRDTs | Highly available concurrent updates | More complex data models and eventual consistency |

## Choosing the Right Strategy

The right approach depends on the workload, contention level, consistency requirements, and system boundaries:

- Use atomic transactions for tightly scoped changes in one relational database.
- Use pessimistic locking when conflicts are expensive and resources must be reserved before work begins.
- Use OCC when reads are frequent and conflicts are relatively uncommon.
- Use queues when requests can be processed asynchronously and ordering matters.
- Use distributed locks only when coordination must span multiple application instances.
- Use sagas when a business operation crosses service boundaries.
- Use sharding to isolate hotspots at scale.
- Use MVCC or CRDTs when concurrent reads and writes need to remain available.

The goal is to make contention explicit, bound its cost, and choose the smallest coordination mechanism that preserves the system's correctness.
