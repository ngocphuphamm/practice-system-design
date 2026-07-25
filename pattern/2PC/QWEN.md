# 2PC Distributed Transaction System in NestJS

## Project Overview

This project implements a Two-Phase Commit (2PC) distributed transaction pattern for an e-commerce order placement system using NestJS. The system demonstrates how to coordinate atomic operations across multiple microservices (Order, Payment, and Inventory) to ensure consistency in distributed environments.

## Architecture

The system consists of three services that work together:
1. **Order Service (Coordinator)**: Orchestrates the 2PC workflow, generates global transaction IDs, and coordinates the Prepare and Commit phases.
2. **Payment Service (Participant)**: Handles balance checking and fund locking, implementing Prepare, Commit, and Rollback operations.
3. **Inventory Service (Participant)**: Manages stock checking and inventory locking, implementing Prepare, Commit, and Rollback operations.

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

## Building and Running

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

Or start all services at once:
```bash
npm run start:dev
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
```bash
npm test
```

## Development Conventions

1. **Monorepo Structure**: Services are organized as a NestJS monorepo using workspace configuration in `nest-cli.json`
2. **Shared Code**: DTOs, enums, and entities are shared across services through the `shared` directory
3. **TypeScript Best Practices**: Uses decorators, interfaces, and proper type annotations
4. **Database Transactions**: Implements proper database transaction management with pessimistic locking
5. **Error Handling**: Comprehensive error handling and logging throughout the system
6. **Idempotency**: Operations are designed to be idempotent to support retries

## Directory Structure

- `order-service/` - Main service coordinating the 2PC workflow
- `payment-service/` - Service handling payment-related operations  
- `inventory-service/` - Service handling inventory-related operations
- `shared/` - Shared DTOs, enums, and models used by all services
- `test-2pc.ts` - Test script to simulate the complete 2PC workflow
- `package.json` - Root dependencies and scripts for the monorepo
- `nest-cli.json` - Workspace configuration for NestJS projects

## Key Features

1. **Distributed Transaction Coordination**: Implements the classic 2PC protocol for maintaining atomicity across distributed services
2. **Fault Tolerance**: Robust rollback mechanisms in case of participant failures
3. **Concurrency Control**: Proper row-level locking to prevent race conditions
4. **Extensible Design**: Well-defined interfaces and contracts to support additional services
5. **Monitoring Ready**: Clear separation of concerns makes it easier to add metrics and monitoring