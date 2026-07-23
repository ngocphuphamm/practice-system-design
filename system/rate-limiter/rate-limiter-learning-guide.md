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

Downside: 

Khi bạn đặt giới hạn là **100 request/phút**, hệ thống sẽ chia thời gian thành các "khung" (window) cố định 1 phút:

* **Khung 1:** 12:00:00 - 12:00:59
* **Khung 2:** 12:01:00 - 12:01:59

Bộ đếm chỉ quan tâm xem **trong mỗi khung cố định đó** user đã dùng bao nhiêu request, chứ **không quan tâm các request đó nằm ở khoảng thời gian nào trong khung**.

#### kịch bản diễn ra:

1. **At 12:00:59** (giây cuối cùng của Khung 1): User gửi dồn dập **100 request**.
* *Hệ thống kiểm tra:* Khung 1 mới có 100 request $\rightarrow$ Hợp lệ, cho qua!


2. **At 12:01:00** (giây đầu tiên của Khung 2, chỉ cách 1 giây trước đó): User lại gửi tiếp **100 request**.
* *Hệ thống kiểm tra:* Sang Khung 2 rồi, bộ đếm vừa reset về 0. Khung 2 mới có 100 request $\rightarrow$ Vẫn hợp lệ, cho qua!



---

### Kết quả (Hậu quả):

* Về mặt **lý thuyết của hệ thống**: Ở Khung 1 user gửi 100 request, Khung 2 user gửi 100 request $\rightarrow$ Không vi phạm quy tắc "100 request/phút".
* Về mặt **thực tế (độ tải server)**: Chỉ trong đúng **2 giây** (từ 12:00:59 đến 12:01:00), user này đã dội tới **200 request** vào server, **gấp đôi** lưu lượng tối đa mà bạn muốn cho phép trong vòng 1 phút!

> **Tóm lại:** "Boundary effects" xảy ra ở giao điểm/ranh giới giữa 2 khung thời gian cố định. Nó khiến người dùng có thể gian lận (hoặc vô tình) tạo ra một đợt bùng nổ traffic (burst) gấp đôi giới hạn trong một khoảng thời gian cực ngắn.

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

Downside: 
- Memory 


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

Ví dụ cách tính:

Bây giờ là 1:15 (tức là tiếng hiện tại đã trôi qua $25\%$ thời gian, đồng nghĩa với việc khoảng thời gian 60 phút gần nhất sẽ dính $75\%$ thời gian của tiếng trước).

Tiếng trước (12h - 1h): Khách uống 100 ly.
Tiếng này (1h - 2h): Khách đã uống 10 ly.
Khi khách đòi uống ly tiếp theo lúc 1:15, bạn làm phép tính nhẩm nhanh:

$$\text{Số ly ước tính} = (100 \text{ ly tiếng trước} \times 75\%) + 10 \text{ ly tiếng này} = 75 + 10 = 85 \text{ ly}$$

So sánh: $85 < 100 \implies$ "Cho uống tiếp!"

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

# REDIS 
 A typical Redis instance can handle around 100,000-200,000 operations per second depending on the operation complexity. Each one of our rate limit checks requires multiple Redis operations, at minimum an HMGET to fetch state and an HSET to update it. So our single Redis instance can realistically handle maybe 50,000-100,000 rate limit checks per second before becoming the bottleneck.

 With 10 Redis shards, each handling ~100k operations/second, we should be able to handle our 1M request/second target.
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
