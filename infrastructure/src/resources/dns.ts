import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareAccountId, awsRegion, cloudflareProvider } from "../config";
import { createDistribution, originAccessIdentity } from "./cdn";

// Create ACM Certificate in us-east-1 (required for CloudFront)
const eastRegionProvider = new aws.Provider('east1-provider', {
    region: 'us-east-1'
});

export const certificate = new aws.acm.Certificate(`${namePrefix}-cert`, {
    domainName: domain,
    validationMethod: "DNS",
    subjectAlternativeNames: [
        `*.${domain}`
    ],
    tags: tags,
}, { provider: eastRegionProvider });

// Get the Cloudflare zone using the provider
const zoneData = pulumi.output(cloudflare.getZone({
    name: domain,
}, { provider: cloudflareProvider }));

export const zone = {
    id: zoneData.id,
    name: zoneData.name
};

// Skip DNS validation since records already exist in Cloudflare
export const certificateValidation = new aws.acm.CertificateValidation(`${namePrefix}-cert-validation`, {
    certificateArn: certificate.arn,
    // Skip validation by setting custom FQDNs (AWS will still validate)
}, { provider: eastRegionProvider, ignoreChanges: ["validationRecordFqdns"] });

// Create CloudFront distribution with the validated certificate
export const distribution = createDistribution(certificate.arn);

// Create DNS record for the domain
export const record = new cloudflare.Record(`${namePrefix}-record`, {
    zoneId: zone.id,
    name: environment === "prod" ? "@" : environment,
    content: distribution.domainName,
    type: "CNAME",
    ttl: 1,
    proxied: true,
}, { provider: cloudflareProvider });