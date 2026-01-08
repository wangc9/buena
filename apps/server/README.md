# Buena Backend

The server-side application built with NestJS. It handles business logic, connects to the database via Kysely, and orchestrates AI parsing jobs via AWS Lambda.

## Tech Stack

- **Framework**: NestJS
- **Database ORM**: Kysely (Postgres)
- **Validation**: `nestjs-zod` + `@cw/schema`
- **Cloud Integration**: AWS SDK v3 (S3, Lambda)

## Configuration

Create a `.env` file in this directory for local development.  
_Note: In production (AWS Fargate), these values are injected via IAM Roles or Task Definitions, not `.env` files._

```bash
# Database Connection
DATABASE_URL="..."

# AWS Config (Local Dev Only - Prod uses IAM Roles)
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Bucket & Lambda Configuration
UPLOAD_BUCKET_NAME=...
PARSER_LAMBDA_NAME=...
```

## AI Workflow

1. Frontend uploads PDF to S3.
2. API invokes the `PARSER_LAMBDA_NAME` asynchronously (Event type).
3. Lambda processes PDF -> writes JSON to S3.
4. Frontend polls S3 via GET `/ai/status/:jobId` to retrieve results.
