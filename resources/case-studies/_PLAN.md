# Case study ideas (private planning)

Add one idea per week. The Tuesday 5pm cron reads this file and nudges you if anything is unchecked.

**Status legend:** `[ ]` idea · `[~]` drafting · `[x]` published

## Queue

- [ ] **Andromeda** — Startups: Migrated a monolithic Rails app to serverless AWS Lambda + API Gateway, cut monthly infra costs 73%, eliminated recurring 3am pager alerts from EC2 out-of-memory kills.
- [ ] **Orion** — Fintech: Built a full CI/CD pipeline (GitHub Actions + Terraform + ECS Fargate) for a PCI-compliant payments platform. Deploy time went from 4h manual tag-and-pray to 8min zero-downtime. Audit-proof change log included.
- [ ] **Pegasus** — SaaS: Migrated 12 microservices from Heroku (USD 4,700/mo) to ECS Fargate spot + RDS (USD 920/mo) with blue-green deploys, zero downtime, no code changes. DB replication catch-up was the hard part; automated with a Lambda state machine.
- [ ] **Cygnus** — e-Commerce: WooCommerce + Redis + CloudFront CDN for a store doing $2.4M/yr. Optimized DB queries (40s category pages down to 180ms), added async order processing with SQS, cut checkout abandonment 18 points.
- [ ] **Phoenix** — Healthtech: Full security audit and remediation for a HIPAA-eligible platform. Closed 37 findings from infrastructure scan, implemented WAF + Shield Advanced, built automated compliance reporting. Passed audit on first attempt.
- [ ] **Lyra** — AI/ML: Built a Bedrock + Lambda RAG pipeline for a legal document search product. Custom knowledge base sync, Guardrails for PII filtering, CloudWatch dashboard for token spend per user. Prod serving 8k queries/day at p95 2.4s.

## Published log

| Codename | Slug | Published |
|----------|------|-----------|
| — | — | — |

## Notes

- Codename theme: **constellations / stars**
- Sections: Stack → Context → Problem → Diagnosis → Approach → Outcomes
- Never put client names or NDA-sensitive numbers here; keep bullets vague.
- Use `_PLAN.md` (private queue). Case study files go in this same directory, one `.md` per slug, with YAML frontmatter.
