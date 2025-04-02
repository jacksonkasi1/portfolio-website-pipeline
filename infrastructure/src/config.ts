import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");
const cloudflareConfig = new pulumi.Config("cloudflare");

export const environment = config.require("environment"); // dev, staging, or prod
export const domain = config.require("domain"); // Your base domain, e.g., example.com
export const githubToken = config.requireSecret("githubToken");
export const githubRepo = config.require("githubRepo");
export const githubOwner = config.require("githubOwner");
// export const certificateArn = config.require("certificateArn");
export const pulumiAccessToken = config.requireSecret("pulumiAccessToken");
export const awsAccessKeyId = config.requireSecret("awsAccessKeyId");
export const awsSecretAccessKey = config.requireSecret("awsSecretAccessKey");
export const cloudflareAccountId = config.require("cloudflareAccountId");
export const cloudflareApiToken = config.requireSecret("cloudflareApiToken");

// AWS provider configuration
export const awsRegion = awsConfig.require("region") as aws.Region; // eg: ap-south-1

// Derived configuration
export const namePrefix = `portfolio-${environment}`;
export const environmentDomain =
  environment === "prod" ? domain : `${environment}.${domain}`;

// Common tags for all resources
export const tags = {
  Environment: environment,
  Project: "portfolio-website",
  ManagedBy: "pulumi",
};

// Configure Cloudflare provider
export const cloudflareProvider = new cloudflare.Provider("cloudflare", {
    apiToken: cloudflareApiToken
});
