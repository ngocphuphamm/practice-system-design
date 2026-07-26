# NOTES: DISTRIBUTED TRANSACTIONS - 2PC VS SAGA PATTERN

## 1. Core Definitions
* **Two-Phase Commit (2PC):** A protocol that ensures **Strong Consistency** by locking resources across all participating databases until the entire transaction successfully completes.
* **Saga Pattern:** A design pattern that ensures **Eventual Consistency** by breaking a large transaction into a sequence of independent local transactions. If a step fails, a compensating transaction is triggered to undo the changes made by previous steps.

---

## 2. Quick Comparison Table

| Criteria | Two-Phase Commit (2PC) | Saga Pattern |
| :--- | :--- | :--- |
| **Consistency** | Strong Consistency (Immediate) | Eventual Consistency (Delayed) |
| **Control Mechanism** | Resource Locking (Blocking) | Asynchronous Processing (Non-blocking) |
| **Performance / Speed** | Low (Prone to bottlenecks) | Very High (Highly scalable) |
| **Error Handling** | Atomic Rollback (Automatic) | Compensating Transactions (Manual code) |
| **Architecture Fit** | Monolith, Same-type Distributed DBs | Microservices, Complex Distributed Systems |

---

## 3. Deep Dive into Models

### 3.1. Two-Phase Commit (2PC)

#### Use Cases
* **Core Financial Transactions:** Bank transfers (money deducted from Account A must be credited to Account B immediately).
* **Ticketing Systems:** Flight or cinema seat bookings (prevents double-booking the same seat simultaneously).
* **Distributed Databases:** Data synchronization across internal shards within the same DB engine (e.g., Spanner, CockroachDB).

#### Disadvantages
* **Poor Performance:** Holding resource locks for too long causes heavy system-wide blocking.
* **Single Point of Failure:** If the Coordinator crashes during the second phase, the entire system hangs.
* **Not Fit for Microservices:** Extremely difficult to implement when services use heterogeneous databases (SQL + NoSQL).
* **High Latency Sensitivity:** Network hiccups severely prolong the data locking duration.

#### When to Use?
* Absolute data accuracy is required; zero discrepancy is tolerated even for a single second.
* Transactions are ultra-short (executing within milliseconds).
* The system has full administrative control over all internal databases supporting the XA/2PC standard.

---

### 3.2. Saga Pattern

#### Use Cases
* **E-Commerce Systems:** Complex order workflows (Create Order $\rightarrow$ Charge Payment $\rightarrow$ Deduct Inventory $\rightarrow$ Ship Order).
* **Travel Booking Combos:** Customers booking Flights + Hotels + Car Rentals all at once within a single application.
* **Asynchronous Processing:** Long-running background processes that need to return a quick response to the user first.

#### Disadvantages
* **Eventual Consistency:** Data can look temporarily inconsistent or out of sync before the entire Saga finishes.
* **Dirty Reads:** Other transactions can read uncommitted or intermediate data before the Saga gets rolled back.
* **Complex Design:** Developers must manually write code for compensating transactions to reverse data changes.
* **Hard to Debug:** Distributed tracing and troubleshooting failures mid-way through a long workflow is highly time-consuming.

#### When to Use?
* Long-running transactions that take seconds, minutes, or even days to fully complete.
* Large-scale Microservices architectures communicating via Message Brokers (Kafka, RabbitMQ).
* Workflows involving third-party API integrations (Payment gateways, shipping vendors) where you cannot lock their external resources.
* User experience is a priority; the system needs to immediately return a "Processing" status to the client.
