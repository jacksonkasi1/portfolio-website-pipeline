import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { 
    namePrefix, 
    tags, 
    zone,
    environment,
    domain,
    environmentDomain,
    cloudflareProvider
} from "../config";
import { siteBucket } from "./storage";
import { distribution } from "./cdn";

const config = new pulumi.Config();
const domainName = config.require("domain");

// We now use CloudFront distribution instead of the default IP
// Set to false to create DNS records (after manually deleting the old A records in Cloudflare)
const skipDnsCreation = false;

// Create main record for the domain (root domain)
export const mainRecord = skipDnsCreation ? undefined : new cloudflare.Record(`${namePrefix}-record`, {
    zoneId: zone.id,
    name: environment === "prod" ? "@" : environment,
    content: distribution.domainName.apply(name => name),
    type: "CNAME",
    proxied: false,
    ttl: 1,
    allowOverwrite: true,
}, { 
    provider: cloudflareProvider
});

// Also create a 'www' record for the root domain if this is the production environment
export const wwwRecord = skipDnsCreation || environment !== "prod" ? undefined : 
    new cloudflare.Record(`${namePrefix}-www-record`, {
        zoneId: zone.id,
        name: "www",
        content: distribution.domainName.apply(name => name),
        type: "CNAME",
        proxied: false,
        ttl: 1,
        allowOverwrite: true,
    }, { 
        provider: cloudflareProvider
    });

// Also create a wildcard record for the root domain if this is the production environment
export const wildcardRecord = skipDnsCreation || environment !== "prod" ? undefined : 
    new cloudflare.Record(`${namePrefix}-wildcard-record`, {
        zoneId: zone.id,
        name: "*",
        content: distribution.domainName.apply(name => name),
        type: "CNAME",
        proxied: false,
        ttl: 1,
        allowOverwrite: true,
    }, { 
        provider: cloudflareProvider
    });

// Create DNS record for ACM validation
export const validationRecord = skipDnsCreation ? undefined : new cloudflare.Record(`${namePrefix}-dns-validation-${Date.now()}`, {
    zoneId: zone.id,
    name: "_acm-validation",
    type: "CNAME",
    content: `_cfbd377b475c2394187653d2f5a8f5a9.xlfgrmvvlj.acm-validations.aws`,
    ttl: 1,
    proxied: false,
    allowOverwrite: true,
}, { provider: cloudflareProvider });

// Create additional validation records if needed (use this pattern)
export const additionalValidationRecords: {[key: string]: cloudflare.Record | undefined} = {};

// If we have a specific validation record from certificate setup, add it here
if (environment === "prod" && !skipDnsCreation) {
    additionalValidationRecords["_6ea6d11dff2166264fad0b2d97658855"] = new cloudflare.Record(
        `${namePrefix}-dns-validation-${Date.now()}-additional`,
        {
            zoneId: zone.id,
            name: "_6ea6d11dff2166264fad0b2d97658855",
            content: "_cfbd377b475c2394187653d2f5a8f5a9.xlfgrmvvlj.acm-validations.aws",
            type: "CNAME",
            ttl: 1,
            proxied: false,
            allowOverwrite: true,
        },
        { provider: cloudflareProvider }
    );
}