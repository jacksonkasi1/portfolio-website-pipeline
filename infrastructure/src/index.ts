import * as pulumi from "@pulumi/pulumi";

// Import all resources
// import { repo, workflowFile } from "./resources/ci-cd";
// import { PreviewEnvironment } from "./resources/preview";
// import { dashboard, errorAlarm } from "./resources/monitoring";
// import { zone, record } from "./resources/dns";

import { environment, domain, namePrefix, environmentDomain, awsRegion } from "./config";
import { siteBucket } from "./resources/storage";
import { distribution } from "./resources/cdn";

export *  from "./resources/ci-cd";
export * from "./resources/preview";
export * from "./resources/monitoring";
export * from "./resources/dns";
export * from "./resources/storage";
export * from "./resources/cdn";
export * from "./config";


// Export outputs
export const websiteUrl = pulumi.interpolate`https://${environmentDomain}`;
export const distributionId = environment === "prod" ? distribution?.id : undefined;
export const bucketName = siteBucket.bucket;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${namePrefix}-monitoring`;