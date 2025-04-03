# Multi-Environment Portfolio Website Pipeline

A complete CI/CD pipeline solution for deploying and managing a portfolio website across multiple environments (development, staging, production) using Pulumi's Infrastructure as Code capabilities.

## Features

- **Multi-environment Infrastructure**: Separate dev, staging, and production environments with appropriate configurations
- **Automated Deployment Pipeline**: GitHub Actions workflows for testing and deployment
- **Preview Environments**: Automatically create preview deployments for pull requests
- **CDN Integration**: CloudFront distribution for fast global content delivery
- **Monitoring and Alerting**: CloudWatch dashboards and alerts for monitoring website health
- **DNS Management**: Automatic DNS configuration with Cloudflare
- **Security Best Practices**: Private S3 buckets with CloudFront access, TLS certificates
- **Cost Optimization**: Environment-specific settings to minimize costs in non-production

## Architecture

This solution uses the following AWS services:

- **S3**: For hosting the static website files
- **CloudFront**: CDN for global content delivery
- **Route 53**: DNS management (through Cloudflare provider)
- **CloudWatch**: Monitoring and alerting
- **Secrets Manager**: Secure storage of credentials

The infrastructure is defined with Pulumi and deployed through GitHub Actions workflows.

## Getting Started

### Prerequisites

Before getting started, make sure you have:

- **Development Environment**:
  - [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) (version 3.0 or higher)
  - [Node.js](https://nodejs.org/) (v14 or higher)
  - [Git](https://git-scm.com/downloads)

- **Cloud Accounts**:
  - **AWS Account** with IAM user having appropriate permissions:
    - S3, CloudFront, ACM, CloudWatch, Secrets Manager
    - Access key and secret key pair
  - **GitHub Account** with:
    - Personal access token with repo and workflow permissions
    - Repository for your portfolio website
  - **Cloudflare Account** with:
    - Registered domain with DNS managed by Cloudflare
    - API token with Zone Read and DNS Edit permissions
    - Account ID (found in the dashboard overview)

- **Domain Name**:
  - Must be registered and managed in Cloudflare
  - DNS records will be managed by Pulumi through the Cloudflare provider

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/jacksonkasi1/portfolio-website-pipeline.git
   cd portfolio-website-pipeline
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Pulumi:

   ```bash
   pulumi stack init dev
   pulumi config set aws:region ap-south-1
   pulumi config set portfolio-website-pipeline:domain your-domain.com
   pulumi config set portfolio-website-pipeline:environment dev
   pulumi config set portfolio-website-pipeline:githubRepo your-repo-name
   pulumi config set portfolio-website-pipeline:githubOwner your-github-username
   ```

4. Set up secrets (make sure to use `--secret` flag):

   ```bash
   pulumi config set --secret portfolio-website-pipeline:pulumiAccessToken <your-pulumi-token>
   pulumi config set --secret portfolio-website-pipeline:awsAccessKeyId <your-aws-key>
   pulumi config set --secret portfolio-website-pipeline:awsSecretAccessKey <your-aws-secret>
   pulumi config set --secret portfolio-website-pipeline:githubToken <your-github-token>
   pulumi config set --secret cloudflareAccountId <your-cloudflare-account-id>
   pulumi config set --secret cloudflareApiToken <your-api-token>
   ```

5. Deploy the infrastructure:

   ```bash
   pulumi up
   ```

6. Repeat steps 3-5 for staging and production environments:

   ```bash
   pulumi stack init staging
   # Configure staging environment

   pulumi stack init prod
   # Configure production environment
   ```

## Usage

### Deploying Your Website

1. Add your website code to the GitHub repository
2. Create a PR to test changes in a preview environment
3. Merge to the develop branch to deploy to the development environment
4. Merge to the main branch to deploy to production

### Monitoring Your Website

Access the CloudWatch dashboard URL from the Pulumi outputs:

```bash
pulumi stack output dashboardUrl
```

## CI/CD Pipeline Workflow

1. **Pull Request Created**:

   - Code is built and tested
   - Preview environment is created
   - Preview URL is posted as a comment on the PR

2. **Merge to Develop Branch**:

   - Code is built and tested
   - Infrastructure is updated if needed
   - Website is deployed to the development environment

3. **Merge to Main Branch**:
   - Code is built and tested
   - Infrastructure is updated if needed
   - Website is deployed to the production environment
   - CloudFront cache is invalidated

## Cost Optimization

This solution is designed to minimize costs:

- Development and staging environments use cheaper CloudFront pricing tiers
- Preview environments are automatically cleaned up after 7 days
- Production uses optimal caching settings to reduce origin requests

## Security Features

- Private S3 buckets (no public access)
- CloudFront Origin Access Identity for S3 access
- TLS certificates for secure connections
- Secret management using AWS Secrets Manager and GitHub Actions secrets

## Customization

You can customize this solution by:

- Modifying the CloudFront distribution settings
- Adding custom error pages
- Implementing additional monitoring metrics
- Adding build steps for different frontend frameworks

## Troubleshooting

### Common Issues

1. **Certificate Not Found**: Ensure your ACM certificate is in the us-east-1 region for CloudFront
2. **DNS Not Resolving**: Check Cloudflare DNS propagation (can take up to 48 hours)
3. **Deployment Failures**: Check GitHub Actions logs for detailed error messages

### DNS Issues and Solutions

#### Cloudflare DNS Setup

If you encounter errors related to DNS records already existing in Cloudflare, follow these steps:

1. **Issue**: When trying to create DNS records with Pulumi, you might see errors like:
   ```
   attempted to override existing record however didn't find an exact match
   ```

2. **Solution**:
   - Log in to Cloudflare and check existing DNS records
   - If you're changing record types (e.g., from A records to CNAME records), you need to manually delete the old records first
   - Specifically, you may need to delete existing A records for:
     - Your root domain (e.g., jacksonkasi.xyz)
     - www subdomain (e.g., www.jacksonkasi.xyz)
     - Wildcard record (*.jacksonkasi.xyz)
   - After deleting the records, run `pulumi up --stack prod --yes` to create the new records

3. **My Experience**: In my case, I had default A records from my domain registrar gen.xyz pointing to a default IP (54.67.87.110). I needed to remove these and replace them with CNAME records pointing to CloudFront for proper CDN functionality.

#### Certificate Validation Issues

If your certificate validation fails:

1. Make sure validation records in Cloudflare have `proxied: false` (this is critical)
2. Allow sufficient time for validation (up to 30 minutes)
3. Check that your certificate is in the us-east-1 region, which is required for CloudFront

### Required AWS Permissions

The AWS credentials used need the following permissions:

- S3 full access
- CloudFront full access
- ACM (Certificate Manager) full access
- Route 53 full access (if using Route 53)
- CloudWatch full access (for monitoring)
- Secrets Manager full access

Consider using a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "acm:*",
        "cloudwatch:*",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Required Cloudflare Permissions

The Cloudflare API token needs:

- Zone Read access
- DNS Edit access

To create an API token with these permissions:
1. Log in to your Cloudflare account
2. Go to My Profile > API Tokens
3. Create Token > Edit Zone DNS template
4. Select the specific zone (domain) you're managing
5. Create Token and use this token in your Pulumi configuration

## Advanced Configuration

### Transitioning from Default IP to CloudFront

If you've registered your domain with a provider like gen.xyz, it may initially have A records pointing to a default IP. To properly use CloudFront with your domain:

1. **Understand Current Setup**:
   - Default setup often uses A records pointing to a provider-supplied IP
   - This doesn't leverage CloudFront's CDN capabilities or proper HTTPS

2. **Migration Steps**:
   - First, confirm your CloudFront distribution is properly set up
   - Delete the existing A records in Cloudflare for:
     - Root domain (@)
     - www subdomain
     - Wildcard (*) if it exists
   - Run `pulumi up` to create new CNAME records pointing to your CloudFront domain

3. **Verify the Changes**:
   - Wait for DNS propagation (can take up to 48 hours, but often less)
   - Check that your website loads via HTTPS
   - Verify the CloudFront distribution is being used by checking response headers

4. **Benefits of CloudFront**:
   - Global CDN with edge caching for faster loading
   - Built-in HTTPS with your ACM certificate
   - DDoS protection and security features
   - Better reliability and redundancy

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Pulumi](https://www.pulumi.com/) for the excellent Infrastructure as Code platform
- [AWS](https://aws.amazon.com/) for the cloud infrastructure services
- [GitHub Actions](https://github.com/features/actions) for CI/CD capabilities
