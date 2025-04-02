import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {
  namePrefix,
  environmentDomain,
  environment,
  tags,
} from "../config";
import { siteBucket } from "./storage";
import { createBucketPolicy } from "./storage";
import { certificateValidation } from "./dns";

// Create an origin access identity for CloudFront
export const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
  `${namePrefix}-oai`,
  {
    comment: `OAI for ${environmentDomain}`,
  }
);

// Create a CloudFront distribution for the website
export const distribution = new aws.cloudfront.Distribution(
  `${namePrefix}-distribution`,
  {
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    aliases: [environmentDomain],

    origins: [
      {
        domainName: siteBucket.bucketRegionalDomainName,
        originId: siteBucket.arn,
        s3OriginConfig: {
          originAccessIdentity:
            originAccessIdentity.cloudfrontAccessIdentityPath,
        },
      },
    ],

    defaultCacheBehavior: {
      targetOriginId: siteBucket.arn,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      forwardedValues: {
        queryString: false,
        cookies: {
          forward: "none",
        },
      },
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: environment === "prod" ? 86400 : 3600, // Longer cache for production
      compress: true,
    },

    // Different settings for different environments
    priceClass: environment === "prod" ? "PriceClass_All" : "PriceClass_100",

    // Custom error responses
    customErrorResponses: [
      {
        errorCode: 404,
        responseCode: 404,
        responsePagePath: "/error.html",
      },
    ],

    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },

    viewerCertificate: {
      acmCertificateArn: certificateValidation.certificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    },

    tags: tags,
  }
);

// Set up bucket policy to allow CloudFront access
export const bucketPolicy = pulumi
  .all([siteBucket.arn, originAccessIdentity.iamArn])
  .apply(([bucketArn, oaiArn]) => {
    return createBucketPolicy(bucketArn, oaiArn);
  });
