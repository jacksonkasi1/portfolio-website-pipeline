import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { tags } from "../config";

// Create preview environment generator for pull requests
export class PreviewEnvironment extends pulumi.ComponentResource {
  bucketName: pulumi.Output<string>;
  websiteEndpoint: pulumi.Output<string>;

  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super("custom:portfolio:PreviewEnvironment", name, {}, opts);

    // Create temporary S3 bucket for preview
    const previewBucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        acl: "public-read",
        website: {
          indexDocument: "index.html",
          errorDocument: "error.html",
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 7, // Auto-delete after 7 days
            },
          },
        ],
        tags: {
          ...tags,
          PreviewId: name,
        },
      },
      { parent: this }
    );

    this.bucketName = previewBucket.bucket;
    this.websiteEndpoint = previewBucket.websiteDomain;

    // Register outputs
    this.registerOutputs({
      bucketName: this.bucketName,
      websiteEndpoint: this.websiteEndpoint,
    });
  }
}
