import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { namePrefix, tags, environmentDomain, awsRegion } from "../config";
import { distribution } from "./cdn";
import { siteBucket } from "./storage";

// Set up monitoring and alerting
export const dashboard = new aws.cloudwatch.Dashboard(
  `${namePrefix}-dashboard`,
  {
    dashboardName: `${namePrefix}-monitoring`,
    dashboardBody: pulumi
      .all([distribution.id, siteBucket.id])
      .apply(([distributionId, bucketId]) =>
        JSON.stringify({
          widgets: [
            {
              type: "metric",
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    "AWS/CloudFront",
                    "Requests",
                    "DistributionId",
                    distributionId,
                    "Region",
                    "Global",
                  ],
                ],
                period: 300,
                stat: "Sum",
                region: "us-east-1",
                title: "CloudFront Requests",
              },
            },
            {
              type: "metric",
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    "AWS/CloudFront",
                    "TotalErrorRate",
                    "DistributionId",
                    distributionId,
                    "Region",
                    "Global",
                  ],
                ],
                period: 300,
                stat: "Average",
                region: "us-east-1",
                title: "Error Rate",
              },
            },
            {
              type: "metric",
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    "AWS/S3",
                    "BucketSizeBytes",
                    "BucketName",
                    bucketId,
                    "StorageType",
                    "StandardStorage",
                  ],
                ],
                period: 86400,
                stat: "Maximum",
                region: awsRegion,
                title: "Bucket Size",
              },
            },
          ],
        })
      ),
  }
);

// Create an alarm for high error rates
export const errorAlarm = new aws.cloudwatch.MetricAlarm(
  `${namePrefix}-error-alarm`,
  {
    alarmDescription: `High error rate for ${environmentDomain}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "5xxErrorRate",
    namespace: "AWS/CloudFront",
    period: 60,
    statistic: "Average",
    threshold: 5,
    alarmActions: [], // Add SNS topic ARN for notifications
    dimensions: {
      DistributionId: distribution.id,
      Region: "Global",
    },
    tags: tags,
  }
);
