// Core imports
import * as pulumi from "@pulumi/pulumi";

// Config imports
import {
  environment,
  domain,
  namePrefix,
  environmentDomain,
  awsRegion
} from "./config";

// Resource imports
import { siteBucket } from "./resources/storage";
import { distribution } from "./resources/cdn";

// Export all resources
export * from "./resources/ci-cd";
export * from "./resources/preview";
export * from "./resources/monitoring";
export * from "./resources/dns";
export * from "./resources/storage";
export * from "./resources/cdn";
export * from "./config";

// Public outputs
export const websiteUrl = pulumi.interpolate`https://${environmentDomain}`;
export const distributionId = environment === "prod" ? distribution?.id : undefined;
export const bucketName = siteBucket.bucket;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${namePrefix}-monitoring`;