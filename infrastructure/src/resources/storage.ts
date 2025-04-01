import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { namePrefix, environmentDomain, tags } from "../config";

// Create an S3 bucket for the website content
export const siteBucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
  bucket: environmentDomain,
  acl: "private", // Private access, content served through CloudFront
  website: {
    indexDocument: "index.html",
    errorDocument: "error.html",
  },
  tags: tags,
});

// Create bucket policy (will be set up after creating CloudFront OAI)
export function createBucketPolicy(bucketArn: string, oaiArn: string) {
  return new aws.s3.BucketPolicy(`${namePrefix}-bucket-policy`, {
    bucket: siteBucket.id,
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: oaiArn,
          },
          Action: "s3:GetObject",
          Resource: `${bucketArn}/*`,
        },
      ],
    }),
  });
}
