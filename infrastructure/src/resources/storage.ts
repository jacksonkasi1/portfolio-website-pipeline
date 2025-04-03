import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { namePrefix, environmentDomain, tags } from "../config";

/** S3 bucket for hosting website content */
export const siteBucket = new aws.s3.Bucket(`${namePrefix}-bucket`, {
  bucket: environmentDomain,
  website: {
    indexDocument: "index.html",
    errorDocument: "error.html",
  },
  tags,
});

/** Bucket ownership controls for proper access management */
export const bucketOwnershipControls = new aws.s3.BucketOwnershipControls(
  `${namePrefix}-ownership-controls`,
  {
    bucket: siteBucket.id,
    rule: {
      objectOwnership: "BucketOwnerPreferred",
    },
  }
);

/** Public access configuration for website hosting */
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

/** ACL settings for public read access */
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

/** Policy allowing public read access to bucket contents */
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
