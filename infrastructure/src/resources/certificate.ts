import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import { 
  namePrefix, 
  tags, 
  domain, 
  environment, 
  cloudflareProvider, 
  zone 
} from "../config";

/** AWS provider for us-east-1 region (required for CloudFront certificates) */
const usEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

/** Domain names for certificate (includes wildcard for production) */
const domainNames = environment === "prod" 
  ? [domain, `*.${domain}`]
  : [`${environment}.${domain}`];

/** ACM certificate for HTTPS */
export const certificate = new aws.acm.Certificate(
  `${namePrefix}-certificate`,
  {
    domainName: domainNames[0],
    subjectAlternativeNames: domainNames.length > 1 ? domainNames.slice(1) : undefined,
    validationMethod: "DNS",
    tags,
  },
  { provider: usEast1 }
);

const skipDnsCreation = false;
const validationRecords: { [key: string]: cloudflare.Record | undefined } = {};

/** Certificate validation options with DNS records */
export const validationOptions = certificate.domainValidationOptions.apply(options => {
  if (!skipDnsCreation) {
    options.forEach((option, index) => {
      const recordName = option.resourceRecordName.replace(`.${domain}.`, '');
      
      validationRecords[`validation-${index}`] = new cloudflare.Record(
        `${namePrefix}-cert-validation-${Date.now()}-${index}-${recordName}`,
        {
          zoneId: zone.id,
          name: recordName,
          content: option.resourceRecordValue,
          type: option.resourceRecordType,
          ttl: 60,
          proxied: false,
          allowOverwrite: true,
        },
        { provider: cloudflareProvider }
      );
    });
  }
  return options;
});

/** Certificate validation resource */
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