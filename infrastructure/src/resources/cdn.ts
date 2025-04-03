import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {
  namePrefix,
  environmentDomain,
  tags,
} from "../config";
import { siteBucket, bucketPolicy } from "./storage";
import { certificate, certificateValidation } from "./certificate";

/** CloudFront Origin Access Identity for S3 bucket access */
export const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
  `${namePrefix}-oai`,
  {
    comment: `OAI for ${environmentDomain}`,
  }
);

/** CloudFront distribution for content delivery */
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
          originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
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
      maxTtl: 86400,
      compress: true,
    },

    priceClass: "PriceClass_All",

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
      acmCertificateArn: certificate.arn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    },

    tags: tags,
  },
  { dependsOn: [certificateValidation, siteBucket] }
);

/** Helper function to create bucket policy for OAI access */
export function createBucketPolicyForOai(oaiArn: pulumi.Input<string>) {
  return pulumi
    .all([siteBucket.arn, oaiArn])
    .apply(([bucketArn, oaiArn]) => bucketPolicy);
}

