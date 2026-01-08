# Buena Monorepo

This is a full-stack real estate management application. It uses a Monorepo structure managed by **Turborepo**.

## Project Structure

- **apps/web**: Next.js 15 (App Router) Frontend.
- **apps/server**: NestJS Backend API (Fargate).
- **packages/database**: Shared Kysely database client & migrations.
- **packages/schema**: Shared Zod schemas & TypeScript types.
- **cdk**: AWS CDK Infrastructure as Code.

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn 1.22
- Docker (for building images during deployment to AWS)
- AWS CLI (configured for deployment)

### Installation

```bash
# Install dependencies for all workspaces
yarn install
```

### Local Development

```bash
# Start both backend and frontend
yarn run dev
```

The backend will first be started, available at `http://localhost:3000`.
The frontend will wait for the backend to be ready, then start at `http://localhost:3001`.

### Building for Production

```bash
# Build both backend and frontend
yarn run build
```

This will create optimized production builds in the `dist` directory of each workspace.

### Deploying to AWS

```bash
# Go to the CDK directory
cd cdk

# Make sure you have the latest CDK version
yarn run cdk --version

# Bootstrap CDK (if not done already)
yarn run cdk bootstrap

# Deploy the entire stack to AWS
yarn run deploy
```

This will use CDK to provision the required AWS resources and deploy the application.

# Live Demo

You can access the live demo at [https://buena.vercel.app](https://buena.vercel.app).
A walkthrough of the application features and usage can be found in the [live demo video](https://drive.google.com/file/d/1fynyWS0SNhC1f6po2a7t6Yz7PX9iL1uN/view?usp=sharing).
