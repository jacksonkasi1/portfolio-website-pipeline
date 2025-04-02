import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareAccountId, awsRegion, cloudflareProvider } from "../config";
import { siteBucket } from "./storage";

// Get the Cloudflare zone using the provider
const zoneData = pulumi.output(cloudflare.getZone({
    name: domain,
}, { provider: cloudflareProvider }));

export const zone = {
    id: zoneData.id,
    name: zoneData.name
};

// Create DNS record for the domain pointing directly to S3 website endpoint
export const record = new cloudflare.Record(`${namePrefix}-record`, {
    zoneId: zone.id,
    name: environment === "prod" ? "@" : environment,
    content: siteBucket.websiteEndpoint,
    type: "CNAME",
    ttl: 1,
    proxied: true,
}, { provider: cloudflareProvider });