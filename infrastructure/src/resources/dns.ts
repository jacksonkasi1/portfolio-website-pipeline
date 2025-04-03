import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { 
    namePrefix, 
    zone,
    environment,
    cloudflareProvider
} from "../config";
import { distribution } from "./cdn";

const config = new pulumi.Config();
const skipDnsCreation = false;

export const mainRecord = skipDnsCreation ? undefined : new cloudflare.Record(
    `${namePrefix}-record`,
    {
        zoneId: zone.id,
        name: environment === "prod" ? "@" : environment,
        content: distribution.domainName.apply(name => name),
        type: "CNAME",
        proxied: false,
        ttl: 1,
        allowOverwrite: true,
    },
    { provider: cloudflareProvider }
);

export const wwwRecord = skipDnsCreation || environment !== "prod" ? undefined : 
    new cloudflare.Record(
        `${namePrefix}-www-record`,
        {
            zoneId: zone.id,
            name: "www",
            content: distribution.domainName.apply(name => name),
            type: "CNAME",
            proxied: false,
            ttl: 1,
            allowOverwrite: true,
        },
        { provider: cloudflareProvider }
    );

export const wildcardRecord = skipDnsCreation || environment !== "prod" ? undefined : 
    new cloudflare.Record(
        `${namePrefix}-wildcard-record`,
        {
            zoneId: zone.id,
            name: "*",
            content: distribution.domainName.apply(name => name),
            type: "CNAME",
            proxied: false,
            ttl: 1,
            allowOverwrite: true,
        },
        { provider: cloudflareProvider }
    );

export const validationRecord = skipDnsCreation ? undefined : new cloudflare.Record(
    `${namePrefix}-dns-validation-${Date.now()}`,
    {
        zoneId: zone.id,
        name: "_acm-validation",
        type: "CNAME",
        content: "_cfbd377b475c2394187653d2f5a8f5a9.xlfgrmvvlj.acm-validations.aws",
        ttl: 1,
        proxied: false,
        allowOverwrite: true,
    },
    { provider: cloudflareProvider }
);

export const additionalValidationRecords: { [key: string]: cloudflare.Record | undefined } = {};

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