import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareProvider } from "../config";

// Create ACM certificate in us-east-1 region (required for CloudFront)
const usEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

// For development, use a self-signed certificate
export const certificate = new aws.acm.Certificate(`${namePrefix}-certificate`, {
    domainName: domain,
    validationMethod: "DNS",
    tags: tags,
}, { provider: usEast1 });

// Only create validation records in production
export const certificateValidation = environment === "prod" 
    ? (() => {
        // Get the Cloudflare zone using the provider
        const zoneData = pulumi.output(cloudflare.getZone({
            name: domain,
        }, { provider: cloudflareProvider }));

        // Create DNS validation records
        const validationOptions = certificate.domainValidationOptions;
        validationOptions.apply(options => {
            options.forEach(option => {
                new cloudflare.Record(`${namePrefix}-validation-${option.resourceRecordName}`, {
                    zoneId: zoneData.id,
                    name: option.resourceRecordName,
                    content: option.resourceRecordValue,
                    type: option.resourceRecordType,
                    ttl: 1,
                    proxied: true,
                }, { provider: cloudflareProvider });
            });
        });

        // Wait for certificate validation
        return new aws.acm.CertificateValidation(`${namePrefix}-certificate-validation`, {
            certificateArn: certificate.arn,
            validationRecordFqdns: validationOptions.apply(options => 
                options.map(option => option.resourceRecordName)
            ),
        }, { provider: usEast1 });
    })()
    : undefined; 