# Incident Response Plan

Internal playbook for personal data breaches and security incidents. Review annually.

## Roles

| Role                                | Responsibility                                         |
| ----------------------------------- | ------------------------------------------------------ |
| Privacy contact (initially founder) | Owns external communications, regulatory notifications |
| Engineering lead                    | Containment, forensics, remediation                    |
| Legal counsel (when engaged)        | Regulatory filing review                               |

Contact: privacy@revcollect.app, security@revcollect.app

## Severity tiers

| Tier        | Description                                                          | Example                        |
| ----------- | -------------------------------------------------------------------- | ------------------------------ |
| S1 Critical | Confirmed exfiltration of customer PII or email content              | Database dump leaked           |
| S2 High     | Unauthorized access to production systems, no confirmed exfiltration | Compromised admin credential   |
| S3 Medium   | Vulnerability with plausible exploit path                            | RLS policy gap on staging      |
| S4 Low      | Minor issue, no customer data at risk                                | Dependency CVE with no exploit |

## Response timeline

### Within 1 hour (all S1–S2)

1. Acknowledge alert in internal channel.
2. Assign incident commander.
3. Begin containment (revoke credentials, block IPs, disable affected integration).

### Within 24 hours

1. Determine scope: which tenants, which data categories, time window.
2. Preserve logs and audit trail (do not delete evidence).
3. Document timeline in incident record.

### Within 72 hours (S1 — GDPR / UK GDPR)

1. Notify supervisory authority if breach poses risk to individuals.
2. Notify affected Controllers (RevCollect customers) with:
   - Nature of the breach
   - Categories and approximate number of records
   - Likely consequences
   - Measures taken and contact point

### Without undue delay (Australia — OAIC)

For eligible data breaches under the Notifiable Data Breaches scheme, notify OAIC and affected individuals when serious harm is likely.

## Customer communication template

Subject: Security incident affecting RevCollect

We are writing to inform you of a security incident involving RevCollect. [Describe what happened, what data may be affected, what we have done, and what you should do.] Contact privacy@revcollect.app with questions.

## Post-incident

1. Root cause analysis within 5 business days.
2. Remediation tracked to completion.
3. Update Security Practices page if controls changed.
4. Retain incident record for 3 years.

## Related documents

- [data-layer-and-compliance.md](./data-layer-and-compliance.md)
- [ai-inference-policy.md](./ai-inference-policy.md)
