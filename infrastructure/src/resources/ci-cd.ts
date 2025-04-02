import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as github from "@pulumi/github";
import { 
    namePrefix, 
    tags, 
    githubRepo, 
    githubOwner, 
    pulumiAccessToken, 
    awsAccessKeyId, 
    awsSecretAccessKey,
    environmentDomain,
    domain,
    environment,
    githubProvider
} from "../config";
import { distribution } from "./cdn";

// Set up GitHub Actions workflow for CI/CD
export const actionsSecret = new aws.secretsmanager.Secret(`${namePrefix}-gh-secret`, {
    name: `${namePrefix}-pulumi-access`,
    description: "Access credentials for Pulumi deployments from GitHub Actions",
    tags: tags,
});

// Store the Pulumi access token securely
export const secretValue = new aws.secretsmanager.SecretVersion(`${namePrefix}-gh-secret-version`, {
    secretId: actionsSecret.id,
    secretString: pulumi.interpolate`{
        "PULUMI_ACCESS_TOKEN": "${pulumiAccessToken}",
        "AWS_ACCESS_KEY_ID": "${awsAccessKeyId}",
        "AWS_SECRET_ACCESS_KEY": "${awsSecretAccessKey}"
    }`,
});

// Set up GitHub repository if it doesn't exist
export const repo = new github.Repository(`${namePrefix}-repo`, {
    name: githubRepo,
    visibility: "private",
    hasIssues: true,
    hasProjects: true,
    hasWiki: true,
    allowMergeCommit: false,
    allowSquashMerge: true,
    allowRebaseMerge: true,
    deleteBranchOnMerge: true,
    autoInit: true,  // Initialize with README
    description: "Portfolio website repository",
    topics: ["portfolio", "website", "pulumi"],
    defaultBranch: "main",
    vulnerabilityAlerts: true,
    allowAutoMerge: true,
    allowUpdateBranch: true,
    squashMergeCommitMessage: "PR_BODY",
    squashMergeCommitTitle: "PR_TITLE"
}, { 
    provider: githubProvider,
    dependsOn: [githubProvider]
});

// Create GitHub Actions secrets
export const pulumiAccessTokenSecret = new github.ActionsSecret(`${namePrefix}-pulumi-token-secret`, {
    repository: repo.name,
    secretName: "PULUMI_ACCESS_TOKEN",
    plaintextValue: pulumiAccessToken,
}, { provider: githubProvider });

export const awsAccessKeySecret = new github.ActionsSecret(`${namePrefix}-aws-key-secret`, {
    repository: repo.name,
    secretName: "AWS_ACCESS_KEY_ID",
    plaintextValue: awsAccessKeyId,
}, { provider: githubProvider });

export const awsSecretKeySecret = new github.ActionsSecret(`${namePrefix}-aws-secret-secret`, {
    repository: repo.name,
    secretName: "AWS_SECRET_ACCESS_KEY",
    plaintextValue: awsSecretAccessKey,
}, { provider: githubProvider });

// Create GitHub Actions workflow file for CI/CD pipeline
const workflowContent = `
name: Portfolio Website CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: package.json
      
      - name: Install dependencies
        run: npm install --no-package-lock
      
      - name: Build website
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          compression-level: 9
          retention-days: 5

  preview:
    needs: build-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Set up Pulumi
        uses: pulumi/actions@v4
        with:
          command: preview
          stack-name: ${githubOwner}/portfolio-website-pipeline-new/preview
        env:
          PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}

  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Set up Pulumi
        uses: pulumi/actions@v4
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}
      
      - name: Deploy to S3
        run: |
          echo "Deploying to ${environmentDomain}"
          aws s3 sync dist/ s3://${environmentDomain}/ --delete
      
      - name: Invalidate CloudFront cache
        if: ${environment === "prod" && distribution?.id}
        run: aws cloudfront create-invalidation --distribution-id ${distribution?.id} --paths "/*"

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Set up Pulumi
        uses: pulumi/actions@v4
        with:
          command: up
          stack-name: prod
        env:
          PULUMI_ACCESS_TOKEN: \${{ secrets.PULUMI_ACCESS_TOKEN }}
      
      - name: Deploy to S3
        run: |
          echo "Deploying to ${domain}"
          aws s3 sync dist/ s3://${domain}/ --delete

      - name: Invalidate CloudFront cache
        if: ${environment === "prod" && distribution?.id}
        run: aws cloudfront create-invalidation --distribution-id ${distribution?.id} --paths "/*"
`;

export const workflowFile = new github.RepositoryFile(`${namePrefix}-workflow-file`, {
    repository: repo.name,
    file: ".github/workflows/deploy.yml",
    content: workflowContent,
    branch: "main",
    commitMessage: "Add CI/CD workflow for portfolio website",
    commitAuthor: "Pulumi Automation",
    commitEmail: "automation@pulumi.com",
    overwriteOnCreate: true,
    autocreateBranch: true,
}, { provider: githubProvider });