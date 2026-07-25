# 2PC Distributed Transaction System in NestJS

This project implements a Two-Phase Commit (2PC) distributed transaction pattern for an e-commerce order placement system using NestJS.

## System Components

### 1. Order Service (Coordinator)
- Orchestrates the 2PC workflow
- Generates global transaction IDs (G-TIDs)
- Coordinates Prepare and Commit phases
- Handles rollbacks if participants fail
- Manages order lifecycle (PENDING, PAID, FAILED)

### 2. Payment Service (Participant)
- Handles balance checking and fund locking
- Implements Prepare, Commit, and Rollback operations
- Manages payment ledger with transaction status tracking

### 3. Inventory Service (Participant)
- Manages stock checking and inventory locking
- Implements Prepare, Commit, and Rollback operations
- Tracks inventory transactions with status

## Technologies Used

- **Framework**: NestJS (TypeScript)
- **Database**: TypeORM with MySQL
- **Communication**: REST APIs between services
- **Concurrency**: Row-level locks during Prepare phase

## Implementation Details

### Core Components

#### DTOs
- `PrepareDto`: Defines structure for prepare requests
- `CommitDto`: Defines structure for commit requests  
- `RollbackDto`: Defines structure for rollback requests
- `TwoPhaseResponse`: Standard response format for 2PC operations

#### Enums
- `TransactionStatus`: PREPARED, COMMITTED, ABORTED
- `OrderStatus`: PENDING, PAID, FAILED

#### Database Models
- `PaymentTransaction`: Stores payment-related transaction data
- `InventoryTransaction`: Stores inventory-related transaction data  
- `Order`: Stores order data and status

### 2PC Workflow

#### Phase 1: Prepare
1. Order Service receives order request
2. Generates global transaction ID (G-TID)
3. Creates initial order record with PENDING status
4. Sends Prepare requests to Payment and Inventory services in parallel
5. Waits for responses from all participants

#### Phase 2: Decision
1. IF ALL participants return SUCCESS:
   - Send Commit requests to Payment and Inventory services in parallel
   - Update order status to PAID
   - Return success response
2. ELSE (any participant fails):
   - Send Rollback requests to all participants in parallel  
   - Update order status to FAILED
   - Return failure response

#### Error Handling
- Timeout handling for participant calls
- Idempotent operations to allow retries
- Graceful fallbacks in case of participant failures

## Running the System

### Prerequisites
1. Node.js (v14+)
2. MySQL database
3. Docker (optional, for easy db setup)

### Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure database connections in each service:
   - Update database configuration in `payment-service/ormconfig.ts`
   - Update database configuration in `inventory-service/ormconfig.ts`  
   - Update database configuration in `order-service/ormconfig.ts`

3. Create databases in MySQL:
```sql
CREATE DATABASE db_payment;
CREATE DATABASE db_inventory;
CREATE DATABASE db_order;
```

4. Run services:
```bash
# Start respective services in different terminals
cd payment-service && npm run start
cd inventory-service && npm run start
cd order-service && npm run start
```

### API Endpoints

#### Order Service
- `POST /orders` - Place a new order

#### Payment Service
- `POST /payment/prepare` - Prepare payment transaction
- `POST /payment/commit` - Commit payment transaction  
- `POST /payment/rollback` - Rollback payment transaction

#### Inventory Service
- `POST /inventory/prepare` - Prepare inventory transaction
- `POST /inventory/commit` - Commit inventory transaction
- `POST /inventory/rollback` - Rollback inventory transaction

### Testing

End-to-end testing with sample requests to `POST /orders`.

## Notes

This implementation showcases the core principles of distributed transactions using 2PC, including:
- Coordination between multiple services
- Atomicity across distributed systems
- Proper failure handling and rollback mechanisms
- Idempotent operations to support retries