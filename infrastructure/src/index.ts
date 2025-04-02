import * as pulumi from "@pulumi/pulumi";
import { environment, domain, namePrefix, environmentDomain, awsRegion } from "./config";

// Import all resources
import { siteBucket } from "./resources/storage";
import { zone, record } from "./resources/dns";
import { repo, workflowFile } from "./resources/ci-cd";
import { PreviewEnvironment } from "./resources/preview";
import { dashboard, errorAlarm } from "./resources/monitoring";

// Export outputs
export const websiteUrl = siteBucket.websiteEndpoint;
export const bucketName = siteBucket.bucket;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${namePrefix}-monitoring`;