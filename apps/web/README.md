# Buena Web (Frontend)

The customer-facing application built with Next.js, Tailwind CSS, and Shadcn UI. It communicates with the NestJS API and handles file uploads directly to S3 via presigned URLs.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: ShadcnUI
- **State/Fetching**: TanStack Query
- **Validation**: React Hook Form + Zod (Shared Schema)

## Configuration

Create a `.env` file in this directory:

```bash
# URL of your local NestJS API or the CloudFront/ALB URL in production. If you want to create a live version yourself, you can set this according to the output of the CDK deployment (look for the CloudFront URL in the CDK output).
NEXT_PUBLIC_API_URL=http://localhost:3000

# URL of your S3 Bucket (used for storing uploaded PDFs). If using the cdk deployment provided in the root folder, the URL could be found in the CDK output.
NEXT_PUBLIC_S3_URL=https://<your-bucket>.s3.<region>.amazonaws.com
```

## Run locally

```bash
yarn dev
```

# Key Features

- AI-Powered Form Prefill: Uploads a PDF "Teilungserklärung", polls the backend for AI extraction, and autofills the multi-step form.
- Infinite Scroll: Used in Property Tables via TanStack Query.
- Zod Integration: Uses @cw/schema to ensure frontend forms match backend DTOs exactly.
