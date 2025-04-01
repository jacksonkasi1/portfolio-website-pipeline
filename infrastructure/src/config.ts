import * as pulumi from "@pulumi/pulumi";

// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");

export const environment = config.require("environment"); // dev, staging, or prod
export const domain = config.require("domain"); // Your base domain, e.g., example.com
export const githubToken = config.requireSecret("githubToken");
export const githubRepo = config.require("githubRepo");
export const githubOwner = config.require("githubOwner");
export const certificateArn = config.require("certificateArn");
export const pulumiAccessToken = config.requireSecret("pulumiAccessToken");
export const awsAccessKeyId = config.requireSecret("awsAccessKeyId");
export const awsSecretAccessKey = config.requireSecret("awsSecretAccessKey");
export const cloudflareAccountId = config.require("cloudflareAccountId");

// AWS provider configuration
export const awsRegion = awsConfig.require("region");

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
