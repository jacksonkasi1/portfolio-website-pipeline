import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareAccountId, awsRegion, cloudflareProvider } from "../config";
import { distribution } from "./cdn";

// Create ACM Certificate in us-east-1 (required for CloudFront)
const eastRegionProvider = new aws.Provider('east1-provider', {
    region: awsRegion
});

export const certificate = new aws.acm.Certificate(`${namePrefix}-cert`, {
    domainName: domain,
    validationMethod: "DNS",
    subjectAlternativeNames: [
        `*.${domain}` // Covers all subdomains
    ],
    tags: tags,
}, { provider: eastRegionProvider });

// Set up DNS with Cloudflare
export const zone = new cloudflare.Zone(`${namePrefix}-zone`, {
    zone: domain,
    accountId: cloudflareAccountId,
}, { provider: cloudflareProvider });

// Create DNS validation records
const validationRecords = certificate.domainValidationOptions.apply(options => {
    return options.map(option => {
        return new cloudflare.Record(`${namePrefix}-cert-validation-${option.domainName.replace(/\./g, "-")}`, {
            zoneId: zone.id,
            name: option.resourceRecordName!,
            type: option.resourceRecordType!,
            value: option.resourceRecordValue!,
            ttl: 60,
            proxied: false,
        }, { provider: cloudflareProvider });
    });
});

// Wait for certificate validation to complete
export const certificateValidation = new aws.acm.CertificateValidation(`${namePrefix}-cert-validation`, {
    certificateArn: certificate.arn,
    validationRecordFqdns: validationRecords.apply(records => 
        records.map(record => `${record.name}.${domain}`)
    ),
}, { provider: eastRegionProvider });

// Create DNS record for the domain
export const record = new cloudflare.Record(`${namePrefix}-record`, {
    zoneId: zone.id,
    name: environment === "prod" ? "@" : environment,
    value: distribution.domainName,
    type: "CNAME",
    ttl: 3600,
    proxied: true,
}, { provider: cloudflareProvider });
