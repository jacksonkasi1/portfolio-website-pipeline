import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareProvider, zone } from "../config";

// Create ACM certificate in us-east-1 region (required for CloudFront)
const usEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

// Use wildcard domain for production (covers both root and subdomains)
const domainNames = environment === "prod" 
    ? [domain, `*.${domain}`]  // For prod, include wildcard for all subdomains
    : [`${environment}.${domain}`];  // For non-prod, just the environment subdomain

// Create certificate with appropriate domain names
export const certificate = new aws.acm.Certificate(`${namePrefix}-certificate`, {
    domainName: domainNames[0],
    subjectAlternativeNames: domainNames.length > 1 ? domainNames.slice(1) : undefined,
    validationMethod: "DNS",
    tags: tags,
}, { provider: usEast1 });

// Create DNS validation records
const skipDnsCreation = false;

// Map to store validation records
const validationRecords: {[key: string]: cloudflare.Record | undefined} = {};

// Create validation records for the certificate
export const validationOptions = certificate.domainValidationOptions.apply(options => {
    if (!skipDnsCreation) {
        options.forEach((option, index) => {
            // Extract just the validation domain part, removing the domain suffix
            const recordName = option.resourceRecordName.replace(`.${domain}.`, '');
            
            validationRecords[`validation-${index}`] = new cloudflare.Record(
                `${namePrefix}-cert-validation-${Date.now()}-${index}-${recordName}`,
                {
                    zoneId: zone.id,
                    name: recordName,
                    content: option.resourceRecordValue,
                    type: option.resourceRecordType,
                    ttl: 60, // Longer TTL is fine for validation
                    proxied: false, // IMPORTANT: Must not be proxied
                    allowOverwrite: true,
                },
                { provider: cloudflareProvider }
            );
        });
    }
    return options;
});

// Create certificate validation
export const certificateValidation = new aws.acm.CertificateValidation(
    `${namePrefix}-certificate-validation`,
    {
        certificateArn: certificate.arn,
        validationRecordFqdns: validationOptions.apply(options => 
            options.map(option => option.resourceRecordName)
        ),
    },
    { provider: usEast1 }
); 