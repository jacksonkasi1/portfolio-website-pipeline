import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { namePrefix, environmentDomain, tags } from "../config";

// Create an S3 bucket for the website content
export const siteBucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
  bucket: environmentDomain,
  website: {
    indexDocument: "index.html",
    errorDocument: "error.html",
  },
  tags,
});

// Set bucket ownership controls
export const bucketOwnershipControls = new aws.s3.BucketOwnershipControls(
  `${namePrefix}-ownership-controls`,
  {
    bucket: siteBucket.id,
    rule: {
      objectOwnership: "BucketOwnerPreferred",
    },
  }
);

// Configure public access block
export const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `${namePrefix}-public-access-block`,
  {
    bucket: siteBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }
);

// Set bucket ACL to public-read
export const bucketAcl = new aws.s3.BucketAclV2(
  `${namePrefix}-bucket-acl`,
  {
    bucket: siteBucket.id,
    acl: "public-read",
  },
  {
    dependsOn: [bucketOwnershipControls, publicAccessBlock],
  }
);

// Create bucket policy for public read access
export const bucketPolicy = new aws.s3.BucketPolicy(
  `${namePrefix}-bucket-policy`,
  {
    bucket: siteBucket.id,
    policy: siteBucket.id.apply(id =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${id}/*`]
        }]
      })
    ),
  }
);
