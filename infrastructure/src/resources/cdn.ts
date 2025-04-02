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

// Create an origin access identity for CloudFront
export const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
  `${namePrefix}-oai`,
  {
    comment: `OAI for ${environmentDomain}`,
  }
);

// Function to create CloudFront distribution
export function createDistribution(certificateArn: pulumi.Input<string>) {
  return new aws.cloudfront.Distribution(
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
        maxTtl: environment === "prod" ? 86400 : 3600,
        compress: true,
      },

      priceClass: environment === "prod" ? "PriceClass_All" : "PriceClass_100",

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
        acmCertificateArn: certificateArn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
      },

      tags: tags,
    }
  );
}

// Set up bucket policy to allow CloudFront access
export function createBucketPolicyForOai(oaiArn: pulumi.Input<string>) {
  return pulumi
    .all([siteBucket.arn, oaiArn])
    .apply(([bucketArn, oaiArn]) => {
      return createBucketPolicy(bucketArn, oaiArn);
    });
}

