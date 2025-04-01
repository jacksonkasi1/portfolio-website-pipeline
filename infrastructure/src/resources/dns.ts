import * as cloudflare from "@pulumi/cloudflare";
import { namePrefix, domain, environment, cloudflareAccountId } from "../config";
import { distribution } from "./cdn";



// Set up DNS with Cloudflare
export const zone = new cloudflare.Zone(`${namePrefix}-zone`, {
  zone: domain,
  accountId: cloudflareAccountId,
});

export const record = new cloudflare.Record(`${namePrefix}-record`, {
  zoneId: zone.id,
  name: environment === "prod" ? "@" : environment,
  value: distribution.domainName,
  type: "CNAME",
  ttl: 3600,
  proxied: true,
});
