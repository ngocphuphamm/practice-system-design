# System Design Patterns: Contention Management - CMS Optimistic Locking Example

This directory contains a content management system (CMS) that demonstrates optimistic locking, a key strategy for managing contention in distributed systems. This implementation serves as a practical example of how to handle concurrent edits to shared resources without the overhead of pessimistic locking.

## Project Overview

### Purpose
This repository provides a runnable implementation of optimistic concurrency control for documents that are rarely edited simultaneously. It illustrates how to safely handle concurrent updates through version checking and conflict resolution, following principles described in the companion blog post "System Design Patterns: The Essential Guide to Managing Contention in Distributed Systems."

### Core Concepts
- **Optimistic Concurrency Control**: Allows concurrent reads and writes without locking, with conflict resolution at commit time
- **Version-based Updates**: Each document has an integer `version` that increments with each successful write
- **Compare-and-Update Pattern**: Updates only succeed when the expected version matches the current version
- **Retry Logic**: Automatic retry after conflicts with bounded attempts to handle transient contention

### Technology Stack
- **Runtime**: Node.js (>= 18)
- **Web Framework**: Node.js built-in HTTP server (plain JavaScript)
- **Database**: MySQL using `mysql2` driver
- **Testing**: Node.js built-in test framework

### Architecture
The system follows a clean layered architecture:
- **API Layer**: HTTP endpoints for document operations
- **Service Layer**: Business logic with retry and conflict handling
- **Repository Layer**: Database operations with atomic update patterns
- **Domain Layer**: Business rules and validations

## Building and Running

### Prerequisites
- Node.js (>= 18)
- MySQL server running locally (or configured via environment)
- `mysql2` package (listed in dependencies)

### Initial Setup
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   - The SQL schema is in `database/documents.sql`
   - Run it against your MySQL instance:
   ```bash
   mysql -u root -p < database/documents.sql
   ```

3. **Optional environment variables** (in `.env.example`):
   ```bash
   PORT=3000
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=
   MYSQL_DATABASE=contention_cms
   OPTIMISTIC_LOCK_MAX_ATTEMPTS=3
   ```

### Running the Application
```bash
node src/server.js
```

The service will start on port 3000 (configurable via `PORT` environment variable) and log a confirmation message.

### API Endpoints
- **GET** `/documents/:id` - Retrieve a document and its version
- **PUT** `/documents/:id/content` - Append content to a document (with optimistic locking)

**Response Status Codes**:
- `200` - Successful operation
- `400` - Bad request (invalid payload)
- `404` - Document not found
- `405` - Method not allowed
- `409` - Conflict (version mismatch, published document, or unresolvable conflict)
- `500` - Internal server error

### Running Tests
The project includes comprehensive tests covering all functionality:

```bash
node --test
```

**Test Coverage**:
- `test/config.test.js` - Configuration loading
- `test/document-repository.test.js` - Database layer operations
- `test/document-service.test.js` - Service layer with conflict handling
- `test/server.test.js` - HTTP server integration

### Database Schema
The MySQL schema creates a `documents` table with:
- Auto-incrementing `document_id`
- `title`, `content`, `status` (draft/published)
- Integer `version` starting at 1
- Audit timestamps with millisecond precision

## Development Conventions

### Code Organization
```
src/
├── config.js              # Configuration management
├── server.js              # HTTP server implementation
├── repository/
│   └── document-repository.js  # Database operations
├── service/
│   └── document-service.js      # Business logic with retry logic
└── domain/
    └── document.js              # Business rules and validations
```

### Naming Conventions
- **Files**: kebab-case for file names (`document-service.js`)
- **Classes**: PascalCase (`DocumentService`, `DocumentRepository`)
- **Functions**: snake_case (`append_content`, `get_config`)
- **Variables**: camelCase (`documentId`, `expectedVersion`)

### Error Handling
- Custom error objects with `code` property for consistent error classification
- Codes: `DOCUMENT_NOT_FOUND`, `DOCUMENT_CONFLICT`, `DOCUMENT_NOT_EDITABLE`, `INVALID_CONTENT`, `INVALID_JSON`
- HTTP status codes mapped to error codes in the API layer

### Transaction Patterns
The repository layer uses atomic compare-and-update updates:
```sql
UPDATE documents
SET content = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
WHERE document_id = ? AND version = ?;
```

This single SQL statement handles both the update and version increment, ensuring atomicity.

### Concurrency Contract
- Each document starts with `version = 1`
- Updates require both document ID and expected version
- Version increment happens atomically with the update
- Only documents in `draft` status can be edited

## Key Features and Behavior

### Optimistic Locking Implementation
1. **Initial Check**: Service first loads the document and checks if the current version matches the expected version
2. **Update Attempt**: If versions match, attempt the atomic update
3. **Conflict Resolution**: If update fails (affected rows = 0):
   - If document exists with newer version: reload, recheck business rules, retry
   - If document doesn't exist: throw 404
   - If retry limit exceeded: throw conflict error

### Retry Logic
- Maximum configurable retries (default: 3 attempts)
- Between retries: reload document, recheck authorization and business rules
- Reapply domain operations (`appendContent`) after each reload
- Avoids stale payload replay to prevent overwriting other editors' changes

### Business Rules
- **Status Check**: Only documents in `draft` status can be edited
- **Content Validation**: Non-empty string, max 100,000 characters
- **Version Integrity**: Published documents cannot be edited, even during retry

### Conflict Scenarios Handled
1. **Stale Version**: Another editor updated the document
2. **Published Document**: Document status changed to `published`
3. **Missing Document**: Document was deleted or never existed
4. **Retry Limit Exceeded**: Repeated conflicts detected

## Usage Examples

### Create and Edit Documents
```bash
# Document created with version 1
PUT /documents/1/content
Content-Type: application/json

{
  "expectedVersion": 1,
  "append": "Hello"
}

# Response: 200 with updated document and version 2
```

### Concurrent Editing Scenario
Two clients editing the same document:

**Client A (version 1)**:
```bash
PUT /documents/1/content
{"expectedVersion": 1, "append": " first edit"}
```

**Client B (version 1)**:
```bash
PUT /documents/1/content
{"expectedVersion": 1, "append": " second edit"}
```

**Result**: Client A succeeds, Client B gets 409 Conflict, Client B must reload, recheck, and retry with updated version.

### Testing the Implementation
The test suite includes scenarios for:
- Successful updates with version increment
- Conflict reload and retry behavior
- Published document protection
- Missing document handling
- Malformed payload rejection

## Testing and Verification

### Test Strategy
- **Unit Tests**: Isolated testing of individual components
- **Integration Tests**: Repository operations with mock database
- **Service Tests**: Business logic with conflict scenarios
- **API Tests**: End-to-end HTTP behavior

### Verification Checklist
- ✅ Two writers using same version result in one success and one conflict
- ✅ Forced conflicts reload latest document and safely reapply domain operations
- ✅ Repeated conflicts stop at configured retry limit
- ✅ Published documents cannot be edited, including during retry
- ✅ Successful writes increment version exactly once
- ✅ API responses expose updated version and correct status codes

## Scaling Considerations

### Performance Characteristics
- **Read Scalability**: Optimistic locking allows unlimited concurrent reads
- **Write Scalability**: Limited by contention frequency
- **Conflict Handling**: Bounded retry limits prevent conflict storms
- **Database Load**: Single-row updates minimize contention

### Extension Points
1. **Database Optimization**: Consider MVCC or sharding for large-scale deployments
2. **Read Replicas**: Separate read/replica for high-traffic scenarios
3. **Circuit Breakers**: Add timeout and failure handling for database outages
4. **Metrics**: Add monitoring for version conflicts and retry frequency

## Relationship to System Design Patterns

This implementation demonstrates the **Optimistic Concurrency Control** pattern discussed in the companion blog post, contrasting with:
- **Pessimistic Locking**: Acquiring locks upfront (reduces concurrency)
- **Distributed Locks**: External coordination across service instances
- **Queue-based Serialization**: Sequential processing with guaranteed ordering

The blog post explores 11 different strategies for managing contention in distributed systems, with this example serving as a practical implementation of the **Optimistic Concurrency Control** approach.

## Project Files Summary

### Essential Files
- `PROMPT.md` - Complete API specification and requirements
- `src/server.js` - HTTP server implementation
- `src/repository/document-repository.js` - Database layer with atomic updates
- `src/service/document-service.js` - Business logic with retry handling
- `src/domain/document.js` - Business rules and validations
- `database/documents.sql` - SQL schema for MySQL

### Supporting Files
- `package.json` - Node.js project configuration
- `QWEN.md` - This documentation
- `contention-patterns.md` - Companion blog article
- Various test files - Comprehensive test coverage

## Files to Remember
- Primary source logic is in `src/` with modular separation
- Business rules in `src/domain/document.js` enforce editing constraints
- Repository layer handles atomic database updates and conflict detection
- Service layer implements retry logic and conflict resolution
- API contract defined in `PROMPT.md`
- Tests verify all edge cases and conflict scenarios

## Running the Demo

```bash
# Start the server
node src/server.js

# Example curl commands
curl -X GET http://localhost:3000/documents/1
curl -X PUT -H "Content-Type: application/json" -d '{"expectedVersion":1,"append":" test"}' http://localhost:3000/documents/1/content

# Run tests
node --test
```

This implementation provides a complete, production-ready example of optimistic locking patterns, suitable for learning and reference in distributed system design.