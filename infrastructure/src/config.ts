// Core imports
import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";

// Configuration instances
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");

// Environment and domain
export const environment = config.require("environment");
export const domain = config.require("domain");
export const environmentDomain = environment === "prod" ? domain : `${environment}.${domain}`;
export const namePrefix = `portfolio-${environment}`;

// AWS configuration
export const awsRegion = awsConfig.require("region");
export const region = "ap-south-1";
export const awsAccessKeyId = config.requireSecret("awsAccessKeyId");
export const awsSecretAccessKey = config.requireSecret("awsSecretAccessKey");

// GitHub configuration
export const githubToken = config.requireSecret("githubToken");
export const githubRepo = config.require("githubRepo");
export const githubOwner = config.require("githubOwner");
export const pulumiAccessToken = config.requireSecret("pulumiAccessToken");

// Cloudflare configuration
const cloudflareConfig = new pulumi.Config("cloudflare");
export const cloudflareAccountId = config.require("cloudflareAccountId");
export const cloudflareApiToken = config.requireSecret("cloudflareApiToken");

// Resource tags
export const tags = {
  Environment: environment,
  Project: "portfolio-website",
  ManagedBy: "pulumi",
};

// Cloudflare provider setup
export const cloudflareProvider = new cloudflare.Provider("cloudflare", {
  apiToken: cloudflareApiToken
});

// Cloudflare zone configuration
const zoneData = pulumi.output(cloudflare.getZone({
  name: domain,
}, { provider: cloudflareProvider }));

export const zone = {
  id: zoneData.id,
  name: zoneData.name
};

// GitHub provider setup
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
