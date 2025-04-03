import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";
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
export const awsRegion = awsConfig.require("region");

export const region = "ap-south-1";

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

// Get the Cloudflare zone using the provider
const zoneData = pulumi.output(cloudflare.getZone({
    name: domain,
}, { provider: cloudflareProvider }));

export const zone = {
    id: zoneData.id,
    name: zoneData.name
};

// Configure GitHub provider
export const githubProvider = new github.Provider("github", {
    token: githubToken,
    owner: githubOwner,
    baseUrl: "https://api.github.com/",
    insecure: false,
    writeDelayMs: 1000,
    readDelayMs: 1000,
    retryableErrors: [429, 500, 502, 503, 504],
    maxRetries: 3,
    retryDelayMs: 1000,
});
