/**
 * Seed script: populates the knowledge base with curated domain articles.
 * Run once: node server/seed-knowledge.mjs
 *
 * Each article is inserted via the tRPC knowledge.create endpoint so that
 * chunking + embedding happens automatically through the same pipeline.
 */

import "dotenv/config";

const BASE_URL = process.env.SEED_BASE_URL || "http://localhost:3000";

const articles = [
  // ─── 1. DAMA-DMBOK Data Quality Dimensions ──────────────────────────────
  {
    title: "DAMA-DMBOK v2: The Six Data Quality Dimensions",
    topic: "data-quality",
    source: "DAMA International — DMBOK v2 (2017)",
    sourceUrl: "https://www.dama.org/cpages/body-of-knowledge",
    content: `The DAMA Data Management Body of Knowledge (DMBOK) v2 defines six core data quality dimensions that organisations should measure and manage:

1. Completeness — The proportion of stored data against the potential of 100% complete data. A field is complete when it contains a value where a value is expected. Incomplete data leads to incorrect analysis and missed business opportunities.

2. Consistency — Data values stored in one location must be consistent with the same data stored elsewhere. Inconsistency arises when the same data element has different values across systems (e.g., a customer's address differs between CRM and billing systems).

3. Accuracy — Data correctly describes the real-world object or event it represents. Accuracy is often the hardest dimension to measure because it requires comparison against a trusted reference source (ground truth).

4. Validity — Data conforms to the syntax (format, type, range) defined by the business rules. For example, a date field must contain a valid calendar date; a phone number must match the expected format for its country.

5. Uniqueness — No entity should be recorded more than once in a dataset. Duplicate records are a major source of data quality problems, inflating counts and distorting analysis.

6. Timeliness — Data is available when it is needed and reflects the state of the world at the required point in time. Stale data can be as harmful as inaccurate data for time-sensitive decisions.

DMBOK also introduces a seventh dimension — Integrity — which refers to the structural soundness of relationships between data elements (referential integrity, foreign key constraints).

Practical application: Organisations should define measurable thresholds for each dimension (e.g., completeness ≥ 95%, uniqueness ≥ 99.9%) and monitor them continuously via data quality dashboards. Root cause analysis should be performed when thresholds are breached, tracing issues back to source systems, ingestion processes, or business rules.`,
    isActive: true,
  },

  // ─── 2. Gartner 2025 Top Data & Analytics Trends ────────────────────────
  {
    title: "Gartner 2025: Top Trends in Data and Analytics",
    topic: "industry-trends",
    source: "Gartner Research — Top Trends in Data and Analytics 2025 (March 2025)",
    sourceUrl: "https://www.gartner.com/en/newsroom/press-releases/2025-03-05-gartner-identifies-top-trends-in-data-and-analytics-for-2025",
    content: `Gartner identified the following top trends shaping data and analytics in 2025:

1. Agentic Analytics — AI agents that autonomously execute multi-step analytical workflows, moving beyond single-query responses to proactive, goal-directed analysis. Organisations should prepare governance frameworks for AI agent actions on data.

2. Data Products — Treating data as a product with defined owners, SLAs, quality standards, and consumers. Data product thinking shifts the focus from pipelines to outcomes. Gartner recommends appointing Data Product Managers and establishing data product catalogues.

3. Metadata Management Renaissance — The explosion of AI-generated content has made metadata management critical again. Organisations need active metadata management (not just passive cataloguing) to track data lineage, quality, and usage at scale.

4. Synthetic Data — AI-generated synthetic data is becoming mainstream for model training, testing, and privacy-preserving analytics. By 2026, Gartner predicts 60% of data used for AI training will be synthetically generated.

5. Decision Intelligence Platforms — Platforms that combine analytics, AI, and decision modelling to support complex, high-stakes decisions. These platforms make the decision logic explicit, auditable, and improvable over time.

6. Composable Data and Analytics — Modular, interchangeable data and analytics capabilities that can be assembled and reassembled to meet changing business needs. This trend is driving the shift from monolithic data warehouses to composable data stacks.

7. Responsible AI and Data Ethics — Increasing regulatory pressure (EU AI Act, GDPR enforcement actions) is forcing organisations to embed fairness, transparency, and accountability into their AI and analytics pipelines.

Strategic implication: Organisations that invest in data products, agentic analytics, and metadata management in 2025 will have a significant competitive advantage in AI readiness by 2027.`,
    isActive: true,
  },

  // ─── 3. DCAM: Data Management Capability Assessment Model ────────────────
  {
    title: "DCAM: Data Management Capability Assessment Model",
    topic: "data-governance",
    source: "EDM Council — DCAM v2.2 (2023)",
    sourceUrl: "https://edmcouncil.org/page/DCAM",
    content: `The Data Management Capability Assessment Model (DCAM), developed by the EDM Council, is the industry standard for assessing and improving enterprise data management capabilities. It is widely used in financial services, insurance, and regulated industries.

DCAM defines 8 capability areas:

1. Data Management Strategy — Establishing a formal data management programme with executive sponsorship, defined objectives, and measurable outcomes aligned to business strategy.

2. Data Governance — The framework of policies, standards, roles, and responsibilities that govern how data is created, managed, and used. DCAM emphasises the need for a Data Governance Council with cross-functional representation.

3. Data Architecture — The design of data structures, flows, and storage to support business processes. DCAM requires a documented enterprise data architecture aligned to business capabilities.

4. Data Quality — Processes and controls to measure, monitor, and improve data quality across all six DAMA dimensions. DCAM requires formal data quality SLAs and remediation workflows.

5. Data Operations — The operational processes for data ingestion, transformation, storage, and delivery. Includes data pipeline management, incident response, and change management.

6. Data Platform and Technology — The technical infrastructure supporting data management, including data warehouses, data lakes, integration platforms, and metadata management tools.

7. Data Risk and Compliance — Identifying, assessing, and mitigating data-related risks including privacy, security, regulatory compliance (GDPR, BCBS 239, HIPAA), and operational risk.

8. Data Culture and Organisation — Building a data-literate organisation with clear data ownership, accountability, and a culture of data-driven decision making.

DCAM Maturity Levels: DCAM uses a 5-level maturity scale (1=Initial, 2=Managed, 3=Defined, 4=Quantitatively Managed, 5=Optimising). Most organisations start at Level 1-2 and target Level 3 as the baseline for effective data management.`,
    isActive: true,
  },

  // ─── 4. ISO 8000 Data Quality Standard ──────────────────────────────────
  {
    title: "ISO 8000: The International Standard for Data Quality",
    topic: "data-quality",
    source: "ISO/IEC 8000 Data Quality Standard (2022)",
    sourceUrl: "https://www.iso.org/standard/81745.html",
    content: `ISO 8000 is the international standard for data quality. It provides a framework for specifying, measuring, and improving the quality of data in master data management and data exchange contexts.

Key parts of ISO 8000:
- ISO 8000-2: Vocabulary and definitions for data quality concepts
- ISO 8000-8: Concepts and measuring (the core measurement framework)
- ISO 8000-61: Data quality management — Process reference model
- ISO 8000-110: Master data — Exchange of characteristic data (syntax, semantic encoding, conformance)

Core principles of ISO 8000:
1. Data quality is context-dependent — Quality must be defined relative to the intended use of the data. The same data can be high quality for one purpose and low quality for another.

2. Provenance matters — ISO 8000 emphasises the importance of data provenance: knowing where data came from, how it was transformed, and who is responsible for it.

3. Portability — Data should be portable across systems without loss of meaning or quality. This requires standardised encoding and semantic definitions.

4. Conformance — Data must conform to specified syntax rules, semantic encoding standards, and business rules to be considered quality data.

Relationship to DAMA-DMBOK: ISO 8000 and DAMA-DMBOK are complementary. DMBOK provides the management framework; ISO 8000 provides the technical specification for measuring and exchanging quality data. Organisations implementing both achieve the strongest data quality posture.

Practical application: Use ISO 8000-61 as the process reference model for your data quality management programme. Define data quality requirements at the point of data specification (before data is created), not after.`,
    isActive: true,
  },

  // ─── 5. McKinsey: Building a Data-Driven Organisation ───────────────────
  {
    title: "McKinsey: How to Build a Data-Driven Organisation",
    topic: "data-strategy",
    source: "McKinsey Global Institute — Data-Driven Enterprise of 2025 (2022)",
    sourceUrl: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-data-driven-enterprise-of-2025",
    content: `McKinsey's research on data-driven organisations identifies seven characteristics of companies that successfully leverage data for competitive advantage:

1. Data is treated as a corporate asset — Data has a formal owner, a defined value, and is managed with the same rigour as financial assets. Data asset inventories are maintained and regularly updated.

2. Data strategy is integrated with business strategy — Data investments are directly tied to business outcomes (revenue, cost reduction, risk mitigation). Data leaders sit at the executive table.

3. Federated data ownership with central governance — Business units own their data domains but operate within a central governance framework. This "federated governance" model balances agility with control.

4. Self-service analytics — Business users can access and analyse data without depending on IT or data engineering teams. This requires investment in data literacy, tooling, and curated data products.

5. Real-time data capabilities — Leading organisations are moving from batch analytics to real-time data pipelines, enabling faster decision-making and operational automation.

6. AI/ML embedded in business processes — Machine learning models are not standalone experiments but are embedded in core business processes (pricing, risk assessment, customer service, supply chain).

7. Data talent and culture — The most important differentiator is talent and culture. Organisations that invest in data literacy programmes, hire data translators (people who bridge business and data), and reward data-driven decision making outperform those that focus solely on technology.

McKinsey's research shows that data-driven organisations are 23x more likely to acquire customers, 6x more likely to retain customers, and 19x more likely to be profitable than their less data-mature peers.

Key failure modes: The most common reasons data transformations fail are (1) lack of executive sponsorship, (2) treating data as an IT problem rather than a business problem, (3) starting with technology before defining use cases, and (4) underinvesting in data quality and governance.`,
    isActive: true,
  },

  // ─── 6. Data Governance Frameworks: Comparison ──────────────────────────
  {
    title: "Data Governance Frameworks: DAMA, DCAM, COBIT, and ISO/IEC 38505",
    topic: "data-governance",
    source: "DAMA International; EDM Council; ISACA; ISO (2022-2024)",
    sourceUrl: "https://www.dama.org",
    content: `Multiple data governance frameworks exist. Choosing the right one depends on industry, regulatory context, and organisational maturity.

DAMA-DMBOK (Data Management Body of Knowledge):
- Best for: General data management across all industries
- Scope: Comprehensive — covers 11 knowledge areas from data governance to data warehousing
- Strengths: Vendor-neutral, widely recognised, strong community
- Weakness: Descriptive rather than prescriptive; does not provide a step-by-step implementation guide

DCAM (Data Management Capability Assessment Model):
- Best for: Financial services, insurance, regulated industries
- Scope: Assessment-focused — measures maturity across 8 capability areas
- Strengths: Quantitative maturity assessment, strong in risk and compliance
- Weakness: Less guidance on implementation; primarily a measurement tool

COBIT (Control Objectives for Information and Related Technologies):
- Best for: IT governance and audit contexts
- Scope: IT governance framework with data governance components
- Strengths: Strong alignment with audit and compliance requirements
- Weakness: IT-centric; less focus on business data management

ISO/IEC 38505 (Data Governance):
- Best for: Organisations seeking international standards alignment
- Scope: Principles and model for data governance at the organisational level
- Strengths: International recognition, integrates with ISO 27001 (information security)
- Weakness: High-level principles only; requires supplementary frameworks for implementation

Recommendation: Most organisations benefit from using DAMA-DMBOK as the primary framework, supplemented by DCAM for maturity assessment and ISO/IEC 38505 for board-level governance alignment. Financial services organisations should add BCBS 239 compliance requirements.`,
    isActive: true,
  },

  // ─── 7. ETL vs ELT: Modern Data Pipeline Patterns ───────────────────────
  {
    title: "ETL vs ELT: Modern Data Pipeline Architecture Patterns",
    topic: "data-engineering",
    source: "Databricks; dbt Labs; Snowflake — Data Engineering Best Practices (2024)",
    sourceUrl: "https://www.databricks.com/glossary/etl",
    content: `The shift from ETL (Extract-Transform-Load) to ELT (Extract-Load-Transform) represents one of the most significant architectural changes in data engineering over the past decade.

Traditional ETL:
- Data is extracted from source systems, transformed in a staging area (often an ETL tool or custom code), then loaded into the target data warehouse
- Transformations happen before data enters the warehouse
- Suitable for: Legacy systems, strict data governance requirements, limited warehouse compute
- Tools: Informatica, Talend, SSIS, Apache Spark

Modern ELT:
- Data is extracted and loaded into the data warehouse in raw form, then transformed using SQL within the warehouse
- Transformations happen inside the warehouse using its compute power
- Suitable for: Cloud data warehouses (Snowflake, BigQuery, Redshift, Databricks), modern analytics stacks
- Tools: dbt (data build tool), Fivetran, Airbyte, Stitch

Key advantages of ELT:
1. Raw data preservation — All source data is retained, enabling reprocessing when business logic changes
2. Scalability — Cloud warehouses scale compute independently of storage
3. Transparency — SQL transformations are version-controlled, tested, and documented in dbt
4. Speed to insight — Data is available in the warehouse immediately; transformations run on-demand

The Modern Data Stack (2024):
- Ingestion: Fivetran or Airbyte (managed connectors)
- Storage: Snowflake, BigQuery, or Databricks Lakehouse
- Transformation: dbt Core or dbt Cloud
- Orchestration: Apache Airflow or Prefect
- BI/Visualisation: Looker, Tableau, or Power BI
- Data Quality: Great Expectations or Monte Carlo

Data Lakehouse architecture (Databricks/Delta Lake) is emerging as the preferred pattern for organisations that need both analytical and operational workloads on the same data platform.`,
    isActive: true,
  },

  // ─── 8. Data Maturity Models ─────────────────────────────────────────────
  {
    title: "Data Maturity Models: Assessing Organisational Data Capability",
    topic: "data-maturity",
    source: "Gartner; CMMI Institute; Stanford Data Lab (2023-2024)",
    sourceUrl: "https://www.gartner.com/en/data-analytics",
    content: `Data maturity models provide a structured way to assess where an organisation currently stands in its data management journey and what steps are needed to progress.

Gartner Data & Analytics Maturity Model (5 levels):
Level 1 — Unaware: Data is managed ad hoc. No formal data strategy. Data quality issues are firefought reactively.
Level 2 — Opportunistic: Some data initiatives exist but are siloed. No enterprise data governance. Analytics is primarily descriptive (reporting).
Level 3 — Systematic: Formal data governance programme in place. Data quality is measured. Analytics moves toward diagnostic (why did this happen?).
Level 4 — Differentiating: Data is treated as a strategic asset. Predictive analytics is embedded in business processes. Data products are defined and managed.
Level 5 — Transformational: Data and AI are core to the business model. Real-time analytics, autonomous decision-making, and continuous learning systems are operational.

Stanford Data Lab Maturity Dimensions:
1. Data Infrastructure — Quality of data storage, pipelines, and integration
2. Data Governance — Policies, standards, ownership, and compliance
3. Data Culture — Data literacy, trust in data, data-driven decision making
4. Analytics Capability — Range from descriptive to prescriptive analytics
5. AI/ML Readiness — Data labelling, feature engineering, model deployment

Common maturity assessment findings:
- 70% of organisations are at Level 1-2 (Gartner, 2024)
- The biggest gap between Level 2 and Level 3 is data governance and data ownership
- Organisations at Level 4+ generate 3x more revenue from data-related initiatives than Level 1-2 organisations

Assessment approach: Conduct a maturity assessment across all five Stanford dimensions. Score each dimension 1-5. Identify the lowest-scoring dimension as the primary constraint — this is where investment will have the highest leverage.`,
    isActive: true,
  },
];

async function seedKnowledge() {
  console.log(`Seeding ${articles.length} knowledge articles via API...`);
  console.log(`Target: ${BASE_URL}/api/trpc/knowledge.create`);

  let successCount = 0;
  let failCount = 0;

  for (const article of articles) {
    try {
      const res = await fetch(`${BASE_URL}/api/trpc/knowledge.create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: article }),
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ Failed: "${article.title}" — HTTP ${res.status}: ${text.slice(0, 200)}`);
        failCount++;
      } else {
        const data = await res.json();
        if (data.result?.data?.json?.id) {
          console.log(`✓ Created: "${article.title}" (id=${data.result.data.json.id})`);
          successCount++;
        } else {
          console.error(`❌ Unexpected response for "${article.title}":`, JSON.stringify(data).slice(0, 200));
          failCount++;
        }
      }
    } catch (err) {
      console.error(`❌ Error for "${article.title}":`, err.message);
      failCount++;
    }
  }

  console.log(`\nDone. ${successCount} created, ${failCount} failed.`);
}

seedKnowledge();
