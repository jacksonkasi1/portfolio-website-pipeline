import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, tags, domain, environment, cloudflareProvider } from "../config";
import { distribution } from "./cdn";
import { siteBucket } from "./storage";

// Get the Cloudflare zone using the provider
const zoneData = pulumi.output(cloudflare.getZone({
    name: domain,
}, { provider: cloudflareProvider }));

export const zone = {
    id: zoneData.id,
    name: zoneData.name
};

// Create DNS record for the domain
export const record = new cloudflare.Record(`${namePrefix}-record`, {
    zoneId: zone.id,
    name: environment === "prod" ? "@" : environment,
    content: environment === "prod" && distribution 
        ? distribution.domainName 
        : siteBucket.websiteEndpoint,
    type: "CNAME",
    ttl: 1,
    proxied: true,
}, { provider: cloudflareProvider });