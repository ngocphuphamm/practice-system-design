# Rate Limiter Learning Guide (Node.js)

This guide is written for learning and practice. It turns the distributed-rate-limiter idea into a simple Node.js service you can run locally.

## 1. What is a rate limiter?

A rate limiter controls how many requests a client can make in a time window.

Examples:
- 100 requests per minute per user
- 10 requests per second from one IP
- 1000 requests per hour for premium users

When the limit is exceeded, the service returns HTTP 429 (Too Many Requests).

## 2. Why do we need rate limiting?

Rate limiting helps us:
- protect backend services from overload
- prevent abuse and bots
- keep APIs fair for all clients
- reduce cost during traffic spikes

## 3. The four common algorithms

### Fixed Window Counter
Use when:
- you want the simplest possible solution
- the traffic is not too sensitive to boundary issues

Idea:
- split time into windows such as 1 minute
- count requests inside each window
- reset the counter at the start of the next window

Good for:
- small internal tools
- early MVPs
- simple dashboards

### Sliding Window Log
Use when:
- accuracy matters more than memory usage
- you want to avoid burst issues at window boundaries

Idea:
- keep a log of timestamps
- remove old timestamps that are outside the window
- allow only if the count is still below the limit

Good for:
- strict API limits
- billing systems
- audit-friendly enforcement

### Sliding Window Counter
Use when:
- you want a balance between accuracy and memory
- you need better behavior than fixed window but not full log storage

Idea:
- keep counters for the current and previous window
- estimate the current usage using a weighted calculation

Good for:
- high-traffic APIs
- balancing memory and accuracy

### Token Bucket
Use when:
- the traffic is bursty
- users should be allowed short spikes but still follow a long-term limit

Idea:
- each client has a bucket of tokens
- tokens refill over time
- each request consumes one token

Good for:
- modern APIs
- social media feeds
- search services
- bursty traffic patterns

## 4. Node.js files in this folder

- rate-limiter-service.js: a small HTTP service that demonstrates all four algorithms
- client-requests.js: a client script that sends requests to the service
- distributed-rate-limiter.md: the learning note you already created

## 5. How to run it

1. Open a terminal in this folder.
2. Run the service:

```bash
node rate-limiter-service.js
```

3. In another terminal, run the client:

```bash
node client-requests.js
```

## 6. Example request flow

The service exposes four endpoints:

- /fixed-window
- /sliding-window-log
- /sliding-window-counter
- /token-bucket

Each request returns:
- allowed or rejected
- remaining requests
- the algorithm name
- a short description

## 7. What the client will show

The client script sends several requests quickly. You will see:
- some requests accepted
- later requests rejected once the limit is reached

That helps you understand the difference between each algorithm in a very practical way.

## 8. Simple learning summary

If you are learning for interviews, remember this:

- Fixed window: simple and easy
- Sliding window log: accurate but more memory
- Sliding window counter: balanced trade-off
- Token bucket: best for bursts and real-world APIs

## 9. Good interview answer

A strong answer is:

- place the limiter at the API gateway or service boundary
- identify the client clearly
- choose an algorithm based on accuracy and scale
- use shared state in Redis for distributed systems
- return 429 with helpful headers when blocked
