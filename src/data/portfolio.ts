/**
 * Single source of truth for the whole site.
 *
 * Notes on data honesty:
 * - `career`, `projects`, `certifications`, and `skills` are SAMPLE DATA
 *   that must be replaced with the portfolio owner's real history.
 *   They all live in this file so they are easy to swap.
 * - Verified registry skills are fetched from verified-skill.com when
 *   reachable (see src/lib/tasteskill.ts). When unreachable, the site
 *   honestly renders an "offline" state instead of fabricated numbers.
 */

export type ProjectStatus = "live" | "active" | "completed" | "on-hold";
export type ProjectKind =
  | "Infrastructure"
  | "Internal Systems"
  | "Integration"
  | "Security"
  | "Data & Monitoring"
  | "ERP Rollout";

export interface Role {
  id: string;
  title: string;
  company: string;
  sector: string;
  location: string;
  start: string; // yyyy-mm
  end: string | null; // null = still ongoing
  level: "IC" | "Lead" | "SPV" | "Manager";
  headcount: number; // people led directly
  summary: string;
  highlights: string[];
  stack: string[];
}

export const career: Role[] = [
  {
    id: "r1",
    title: "IT Support Specialist",
    company: "PT Sinar Distribusi Nusantara",
    sector: "Distribution & Logistics",
    location: "Jakarta",
    start: "2015-03",
    end: "2017-08",
    level: "IC",
    headcount: 0,
    summary:
      "Entry point into IT operations: handling daily tickets, assembling and provisioning hardware, and acting as the first point of contact for 6 branches.",
    highlights: [
      "Cut average ticket resolution time from 2.5 days to 8 hours with a priority-based queueing system.",
      "Built an internal knowledge base containing 180+ solutions to recurring problems.",
    ],
    stack: ["Windows Server", "Active Directory", "GLPI", "Networking Fundamentals"],
  },
  {
    id: "r2",
    title: "Network & Infrastructure Engineer",
    company: "PT Sinar Distribusi Nusantara",
    sector: "Distribution & Logistics",
    location: "Jakarta",
    start: "2017-09",
    end: "2020-01",
    level: "IC",
    headcount: 2,
    summary:
      "Owned network availability across 11 operating sites, including topology redesign and separating warehouse traffic from office traffic.",
    highlights: [
      "Raised network uptime from 97.1% to 99.7% in 14 months.",
      "Led the site-to-site VPN migration from legacy appliances to a template-based managed configuration.",
      "Wrote the topology documentation that the operations team still uses today.",
    ],
    stack: ["MikroTik", "pfSense", "VLAN", "Zabbix", "Proxmox"],
  },
  {
    id: "r3",
    title: "IT Supervisor",
    company: "Koperasi Digital Sejahtera",
    sector: "Financial Services",
    location: "Bandung",
    start: "2020-02",
    end: "2022-10",
    level: "SPV",
    headcount: 6,
    summary:
      "First role with people responsibility: managing 6 IT staff, the annual technology budget, and compliance with regulator requirements.",
    highlights: [
      "Built an ITIL-lite framework for incident & change management that cut repeat incidents by 41%.",
      "Managed an IDR 4.2B annual IT budget at 98% absorption, plus IDR 310M in license savings through vendor consolidation.",
      "Saw the company's first security audit through to zero critical findings.",
    ],
    stack: ["ITIL", "Jira Service Management", "Veeam", "FortiGate", "SQL Server"],
  },
  {
    id: "r4",
    title: "IT Lead",
    company: "Grup Ritel Karya Boga",
    sector: "Multi-site Retail",
    location: "Jakarta",
    start: "2022-11",
    end: null,
    level: "Lead",
    headcount: 11,
    summary:
      "Lead the IT function for 34 stores, 2 warehouses, and head office. Bridge business needs with technical execution while building architecture and observability discipline.",
    highlights: [
      "Redesigned the POS system onto an offline-first architecture, driving transaction disruption to zero over the last 9 months.",
      "Built an internal data platform that unifies 7 sources into a single daily operations dashboard.",
      "Ran a mentorship program for 4 junior engineers; 3 of them now lead their own projects.",
      "Reduced monthly infrastructure cost by 27% through rightsizing and removing unused services.",
    ],
    stack: ["Kubernetes", "Terraform", "PostgreSQL", "Grafana", "NestJS", "React"],
  },
];

export interface Project {
  id: string;
  name: string;
  kind: ProjectKind;
  status: ProjectStatus;
  role: string;
  year: number;
  months: number;
  teamSize: number;
  budgetM: number; // millions of IDR
  impact: number; // impact score 0-100 (part of an internal rubric)
  stack: string[];
  summary: string;
  location: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: "p01",
    name: "Offline-First POS Across 34 Stores",
    kind: "Internal Systems",
    status: "active",
    role: "Lead Architect",
    year: 2023,
    months: 9,
    teamSize: 7,
    budgetM: 1450,
    impact: 94,
    stack: ["React", "NestJS", "PostgreSQL", "IndexedDB", "Kubernetes"],
    summary:
      "Rewrote the transaction path so it keeps running when a store connection drops, with vector-clock conflict resolution.",
    location: "Jakarta & 34 stores",
    featured: true,
  },
  {
    id: "p02",
    name: "Operations Data Warehouse",
    kind: "Data & Monitoring",
    status: "active",
    role: "Lead",
    year: 2023,
    months: 6,
    teamSize: 5,
    budgetM: 620,
    impact: 88,
    stack: ["Airbyte", "dbt", "PostgreSQL", "Metabase", "Grafana"],
    summary:
      "Unified 7 data sources into one analytics model; the daily sales report went from 6 hours to 20 minutes.",
    location: "Head Office",
    featured: true,
  },
  {
    id: "p03",
    name: "Infrastructure Migration to Kubernetes",
    kind: "Infrastructure",
    status: "completed",
    role: "Technical Lead",
    year: 2022,
    months: 8,
    teamSize: 4,
    budgetM: 880,
    impact: 82,
    stack: ["Kubernetes", "Terraform", "ArgoCD", "Nginx", "Vault"],
    summary:
      "Moved 21 services from single VMs onto a managed cluster with GitOps and automated secret rotation.",
    location: "Jakarta",
  },
  {
    id: "p04",
    name: "Security Hardening & Network Segmentation",
    kind: "Security",
    status: "completed",
    role: "SPV",
    year: 2021,
    months: 5,
    teamSize: 3,
    budgetM: 410,
    impact: 79,
    stack: ["FortiGate", "VLAN", "Wazuh", "Nessus"],
    summary:
      "Segmented warehouse, office, and guest networks, plus centralized anomaly monitoring; closed 63 audit findings.",
    location: "Bandung",
  },
  {
    id: "p05",
    name: "ERP Financial Module Rollout",
    kind: "ERP Rollout",
    status: "completed",
    role: "IT SPV / PM",
    year: 2021,
    months: 7,
    teamSize: 9,
    budgetM: 2100,
    impact: 86,
    stack: ["Odoo", "PostgreSQL", "Python", "Power BI"],
    summary:
      "Drove the finance & procurement module rollout across 4 business units, including process mapping and training 120 users.",
    location: "Bandung",
  },
  {
    id: "p06",
    name: "Multi-Vendor Payment Gateway Integration",
    kind: "Integration",
    status: "active",
    role: "Tech Lead",
    year: 2024,
    months: 4,
    teamSize: 3,
    budgetM: 330,
    impact: 76,
    stack: ["NestJS", "Redis", "Webhooks", "OpenAPI"],
    summary:
      "Unified 4 payment providers behind a single interface with idempotency and automated reconciliation.",
    location: "Jakarta",
  },
  {
    id: "p07",
    name: "Junior Engineer Mentorship Program",
    kind: "Internal Systems",
    status: "active",
    role: "Mentor",
    year: 2024,
    months: 11,
    teamSize: 4,
    budgetM: 0,
    impact: 71,
    stack: ["Documentation", "Code Review", "Pairing"],
    summary:
      "A 12-week internal curriculum with hands-on tracks, structured review, and a guided on-call rotation.",
    location: "Jakarta",
  },
  {
    id: "p08",
    name: "Unified Observability & On-call",
    kind: "Data & Monitoring",
    status: "active",
    role: "Lead",
    year: 2024,
    months: 5,
    teamSize: 3,
    budgetM: 240,
    impact: 84,
    stack: ["Grafana", "Loki", "Prometheus", "Alertmanager"],
    summary:
      "Defined SLOs for 12 critical services, cutting incident detection time from 22 minutes to 3 minutes.",
    location: "Jakarta",
    featured: true,
  },
  {
    id: "p09",
    name: "Vendor & License Consolidation",
    kind: "Infrastructure",
    status: "completed",
    role: "SPV",
    year: 2020,
    months: 4,
    teamSize: 2,
    budgetM: 90,
    impact: 63,
    stack: ["Cost Analysis", "Negotiation", "SAM Tools"],
    summary:
      "Found surplus licenses and unused hardware; saved IDR 310M without reducing service coverage.",
    location: "Bandung",
  },
  {
    id: "p10",
    name: "Site-to-Site Network Across 11 Sites",
    kind: "Infrastructure",
    status: "completed",
    role: "Engineer",
    year: 2018,
    months: 6,
    teamSize: 2,
    budgetM: 520,
    impact: 74,
    stack: ["MikroTik", "IPsec", "OSPF", "Zabbix"],
    summary:
      "Built the inter-branch network backbone with automatic failover and availability monitoring.",
    location: "Java & Sumatra",
  },
  {
    id: "p11",
    name: "Self-Service IT Portal",
    kind: "Internal Systems",
    status: "on-hold",
    role: "Lead",
    year: 2025,
    months: 2,
    teamSize: 2,
    budgetM: 160,
    impact: 58,
    stack: ["Next.js", "tRPC", "PostgreSQL"],
    summary:
      "An IT request portal to cut repeat tickets; paused pending next quarter's business priorities.",
    location: "Jakarta",
  },
  {
    id: "p12",
    name: "Automated Provisioning for Store Devices",
    kind: "Infrastructure",
    status: "completed",
    role: "Lead",
    year: 2022,
    months: 3,
    teamSize: 3,
    budgetM: 210,
    impact: 69,
    stack: ["Ansible", "PXE", "PowerShell", "Bash"],
    summary:
      "New store setup dropped from 2 days to 4 hours through automated imaging and configuration profiles.",
    location: "Jakarta",
  },
];

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  domain:
    | "Networking"
    | "Security"
    | "Cloud & Infra"
    | "Service Management"
    | "Data"
    | "Project Management";
  issued: string; // yyyy-mm
  expires: string | null;
  credentialId: string;
  status: "active" | "expired" | "renewing";
  cost: number; // millions of IDR, for learning-investment context
}

export const certifications: Certification[] = [
  {
    id: "c01",
    name: "Cisco Certified Network Associate (CCNA)",
    issuer: "Cisco",
    domain: "Networking",
    issued: "2018-06",
    expires: "2026-06",
    credentialId: "CSCO-13488210",
    status: "active",
    cost: 6.4,
  },
  {
    id: "c02",
    name: "ITIL 4 Foundation",
    issuer: "PeopleCert",
    domain: "Service Management",
    issued: "2020-11",
    expires: null,
    credentialId: "PC-ITIL4-90231",
    status: "active",
    cost: 5.1,
  },
  {
    id: "c03",
    name: "Certified Kubernetes Administrator (CKA)",
    issuer: "Linux Foundation",
    domain: "Cloud & Infra",
    issued: "2022-03",
    expires: "2025-03",
    credentialId: "LF-CKA-4771",
    status: "renewing",
    cost: 5.9,
  },
  {
    id: "c04",
    name: "CompTIA Security+",
    issuer: "CompTIA",
    domain: "Security",
    issued: "2021-02",
    expires: "2027-02",
    credentialId: "COMP-88120",
    status: "active",
    cost: 5.6,
  },
  {
    id: "c05",
    name: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    domain: "Cloud & Infra",
    issued: "2023-05",
    expires: "2026-05",
    credentialId: "AWS-SAA-33019",
    status: "active",
    cost: 2.4,
  },
  {
    id: "c06",
    name: "Project Management Professional (PMP)",
    issuer: "PMI",
    domain: "Project Management",
    issued: "2023-09",
    expires: "2026-09",
    credentialId: "PMI-2911045",
    status: "active",
    cost: 8.2,
  },
  {
    id: "c07",
    name: "HashiCorp Certified: Terraform Associate",
    issuer: "HashiCorp",
    domain: "Cloud & Infra",
    issued: "2022-08",
    expires: "2024-08",
    credentialId: "HC-TF-66120",
    status: "expired",
    cost: 1.2,
  },
  {
    id: "c08",
    name: "Microsoft Certified: Azure Administrator Associate",
    issuer: "Microsoft",
    domain: "Cloud & Infra",
    issued: "2024-01",
    expires: "2027-01",
    credentialId: "MS-AZ104-77410",
    status: "active",
    cost: 2.1,
  },
  {
    id: "c09",
    name: "Google Data Analytics Professional",
    issuer: "Google",
    domain: "Data",
    issued: "2023-02",
    expires: null,
    credentialId: "GOOG-DA-51230",
    status: "active",
    cost: 0.9,
  },
  {
    id: "c10",
    name: "Certified Information Systems Auditor (CISA)",
    issuer: "ISACA",
    domain: "Security",
    issued: "2025-01",
    expires: "2028-01",
    credentialId: "ISACA-20318",
    status: "active",
    cost: 9.4,
  },
];

/**
 * Local skills: these are self-assessed, and flagged honestly in the UI.
 * `category` is an open string because the owner can add categories from the admin panel.
 */
export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number; // 1-10, self-assessment, 10 is the strongest
  years: number;
  since: number; // year the skill was first picked up
  evidence: string[]; // project ids that back it up
}

export const skills: Skill[] = [
  // Leadership
  { id: "s01", name: "Technical Team Leadership", category: "Leadership", level: 8, years: 6, since: 2019, evidence: ["p01", "p07", "p08"] },
  { id: "s02", name: "IT Budget Planning", category: "Leadership", level: 8, years: 5, since: 2020, evidence: ["p05", "p09"] },
  { id: "s03", name: "Vendor Management", category: "Leadership", level: 8, years: 5, since: 2019, evidence: ["p09", "p05"] },
  { id: "s04", name: "Mentoring & People Development", category: "Leadership", level: 8, years: 4, since: 2021, evidence: ["p07"] },
  { id: "s05", name: "Cross-functional Communication", category: "Leadership", level: 8, years: 8, since: 2017, evidence: ["p05", "p01"] },
  { id: "s06", name: "IT Strategy Planning", category: "Leadership", level: 8, years: 4, since: 2021, evidence: ["p02", "p08"] },

  // Infrastructure
  { id: "s07", name: "Linux Server", category: "Infrastructure", level: 8, years: 9, since: 2016, evidence: ["p03", "p08"] },
  { id: "s08", name: "Kubernetes", category: "Infrastructure", level: 8, years: 4, since: 2021, evidence: ["p03"] },
  { id: "s09", name: "Terraform / IaC", category: "Infrastructure", level: 8, years: 4, since: 2021, evidence: ["p03"] },
  { id: "s10", name: "Networking & Routing", category: "Infrastructure", level: 8, years: 9, since: 2015, evidence: ["p10", "p04"] },
  { id: "s11", name: "Virtualization (Proxmox/VMware)", category: "Infrastructure", level: 8, years: 8, since: 2016, evidence: ["p03"] },
  { id: "s12", name: "CI/CD & GitOps", category: "Infrastructure", level: 8, years: 3, since: 2022, evidence: ["p03", "p06"] },

  // Engineering
  { id: "s13", name: "TypeScript / Node.js", category: "Engineering", level: 8, years: 5, since: 2020, evidence: ["p01", "p06", "p11"] },
  { id: "s14", name: "React", category: "Engineering", level: 8, years: 5, since: 2020, evidence: ["p01", "p11"] },
  { id: "s15", name: "PostgreSQL", category: "Engineering", level: 8, years: 7, since: 2018, evidence: ["p01", "p02"] },
  { id: "s16", name: "API Design & Integration", category: "Engineering", level: 8, years: 6, since: 2019, evidence: ["p06", "p02"] },
  { id: "s17", name: "Python (Automation & Data)", category: "Engineering", level: 8, years: 6, since: 2018, evidence: ["p05", "p12"] },

  // Security
  { id: "s18", name: "System Hardening", category: "Security", level: 8, years: 6, since: 2019, evidence: ["p04"] },
  { id: "s19", name: "Network Segmentation", category: "Security", level: 8, years: 6, since: 2018, evidence: ["p04", "p10"] },
  { id: "s20", name: "Compliance & Audit", category: "Security", level: 8, years: 4, since: 2021, evidence: ["p04", "c10"] },
  { id: "s21", name: "Incident Management", category: "Security", level: 8, years: 7, since: 2018, evidence: ["p08", "p04"] },

  // Data
  { id: "s22", name: "Data Modeling", category: "Data", level: 8, years: 4, since: 2021, evidence: ["p02"] },
  { id: "s23", name: "Dashboarding (Grafana/Metabase)", category: "Data", level: 8, years: 5, since: 2020, evidence: ["p02", "p08"] },
  { id: "s24", name: "Analytical SQL", category: "Data", level: 8, years: 8, since: 2017, evidence: ["p02"] },

  // Operations
  { id: "s25", name: "ITIL / Service Management", category: "Operations", level: 8, years: 6, since: 2019, evidence: ["r3"] },
  { id: "s26", name: "Project Management", category: "Operations", level: 8, years: 6, since: 2019, evidence: ["p05"] },
  { id: "s27", name: "Technical Documentation", category: "Operations", level: 8, years: 9, since: 2016, evidence: ["p10", "p09"] },
  { id: "s28", name: "On-call & Incident Response", category: "Operations", level: 8, years: 8, since: 2017, evidence: ["p08"] },
  { id: "s29", name: "User Training", category: "Operations", level: 8, years: 7, since: 2017, evidence: ["p05", "p07"] },
  { id: "s30", name: "Technology Cost Analysis", category: "Operations", level: 8, years: 4, since: 2020, evidence: ["p09"] },
];

/** Profile summary: used in the hero and the about page. */
export const profile = {
  name: "Arnal",
  fullName: "Arnal Putra",
  role: "IT Lead / Supervisor",
  tagline:
    "I build and lead IT teams that keep systems running when pressure arrives, not teams that merely keep servers powered on.",
  location: "Jakarta, Indonesia",
  timezone: "WIB (UTC+7)",
  email: "halo@arnal.dev",
  yearsExperience: 10,
  teamLed: 11,
  sitesManaged: 34,
  availability: "Open to conversations about IT Lead / Head of IT roles",
  socials: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    // A marker, not a destination: the email channel renders whatever address
    // the owner typed in the profile, by way of mailtoHref.
    { label: "Email", href: "mailto:" },
  ],
};

/** Working principles: used as editorial blocks. */
export const principles = [
  {
    title: "Uptime is a promise, not a metric",
    body: "A system that stops means people stop working. I design for failure from the start, not after the first incident.",
  },
  {
    title: "Documentation beats heroics",
    body: "Midnight rescues should not become a culture. If knowledge lives in one person's head, that is a risk, not a skill.",
  },
  {
    title: "Budget is a design language",
    body: "The best solution is one that can be sustained three years out without draining cost. I always start from the real constraint.",
  },
  {
    title: "Teams grow slower than technology",
    body: "New tool adoption always outpaces people's readiness. I pick a pace the whole team can follow.",
  },
];
