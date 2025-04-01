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

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [Node.js](https://nodejs.org/) (v14 or higher)
- AWS Account
- GitHub Account
- Cloudflare Account (for DNS management)
- Domain name

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
   pulumi config set --secret portfolio-website-pipeline:certificateArn arn:aws:acm:ap-south-1:123456789012:certificate/your-cert-id
   pulumi config set --secret portfolio-website-pipeline:pulumiAccessToken <your-pulumi-token>
   pulumi config set --secret portfolio-website-pipeline:awsAccessKeyId <your-aws-key>
   pulumi config set --secret portfolio-website-pipeline:awsSecretAccessKey <your-aws-secret>
   pulumi config set --secret portfolio-website-pipeline:githubToken <your-github-token>
   pulumi config set --secret cloudflareAccountId <your-cloudflare-account-id>
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

1. **Certificate Not Found**: Ensure your ACM certificate is in the ap-south-1 region for CloudFront
2. **DNS Not Resolving**: Check Cloudflare DNS propagation (can take up to 48 hours)
3. **Deployment Failures**: Check GitHub Actions logs for detailed error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Pulumi](https://www.pulumi.com/) for the excellent Infrastructure as Code platform
- [AWS](https://aws.amazon.com/) for the cloud infrastructure services
- [GitHub Actions](https://github.com/features/actions) for CI/CD capabilities
