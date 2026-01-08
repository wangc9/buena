# Infrastructure (AWS CDK)

This directory contains the IaC to deploy the entire stack to AWS.

## Architecture

- **VPC**: 2 AZs, Private Subnets for DB/API.
- **RDS**: Postgres 17 (Private Subnet).
- **Fargate**: Dockerised NestJS API.
- **CloudFront + ALB**: HTTPS delivery for the API.
- **S3**: Storage for PDF uploads and AI results.
- **Lambda**: Node.js function for OpenAI interaction.

## Setup

Create a `.env` file in this directory to inject secrets during deployment:

```bash
OPENAI_API_KEY=sk-...
```

## Deployment

```Bash
# Install dependencies
yarn install

# Deploy all resources. Note: Before running this command, make sure that you have docker installed and running.
yarn cdk deploy
```
