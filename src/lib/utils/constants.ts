// VCT Team Members (from seven2-slide-reader SKILL.md)
export const VCT_MEMBERS = [
  { initials: "FC", name: "Francois Candelon", specialties: ["AI/Digital", "Strategy"] },
  { initials: "DA", name: "Dominica Adam", specialties: ["Sustainability", "Leadership"] },
  { initials: "PLA", name: "Paul-Louis Andres", specialties: ["Sales", "IT", "Pricing", "PMI"] },
  { initials: "AC", name: "Alain Crozier", specialties: ["Finance", "Org", "Data"] },
  { initials: "SM", name: "Sandrine Meunier", specialties: ["HR"] },
  { initials: "CA", name: "Christophe Aulnette", specialties: ["GTM", "PMI"] },
  { initials: "FL", name: "Franck Lebouchard", specialties: ["Product & Tech"] },
  { initials: "CS", name: "Cedric Sellin", specialties: ["Product & Tech"] },
  { initials: "HW", name: "Hendrik Witt", specialties: ["CPTO"] },
  { initials: "FB", name: "Florian Bienvenu", specialties: ["Sales Excellence"] },
  { initials: "JR", name: "Jacques Reynaud", specialties: ["IT & Data"] },
  { initials: "RN", name: "Ron Nicol", specialties: ["US"] },
] as const;

// Funds
export const FUNDS = [
  { name: "MM X", display_order: 1 },
  { name: "MM IX", display_order: 2 },
  { name: "ADF", display_order: 3 },
] as const;

// Portfolio Companies (from Visuals.pptx)
export const PORTFOLIO_COMPANIES = [
  // MM X
  { name: "Zwart", fund: "MM X", sector: "Critical Power", geography: "Netherlands", status: "active" as const },
  { name: "HRK Lunis", fund: "MM X", sector: "Wealth Management", geography: "Germany", status: "active" as const },
  { name: "Fulgard", fund: "MM X", sector: null, geography: null, status: "active" as const },
  { name: "Lumion", fund: "MM X", sector: null, geography: null, status: "active" as const },
  { name: "Infraneo", fund: "MM X", sector: null, geography: null, status: "active" as const },
  { name: "Efficy", fund: "MM X", sector: "CRM", geography: "Belgium", status: "active" as const },
  { name: "MCG", fund: "MM X", sector: null, geography: null, status: "active" as const },
  { name: "Odigo", fund: "MM X", sector: "CCaaS", geography: "France", status: "active" as const },
  { name: "Hirsch", fund: "MM X", sector: "Security", geography: "France", status: "active" as const },
  { name: "Opteven", fund: "MM X", sector: null, geography: "France", status: "active" as const },
  { name: "Crystal", fund: "MM X", sector: null, geography: null, status: "inactive" as const },
  // MM IX
  { name: "DSTNY", fund: "MM IX", sector: null, geography: null, status: "active" as const },
  { name: "AEB", fund: "MM IX", sector: null, geography: null, status: "active" as const },
  { name: "Graitec", fund: "MM IX", sector: null, geography: null, status: "active" as const },
  { name: "Infovista", fund: "MM IX", sector: null, geography: null, status: "active" as const },
  // ADF
  { name: "Illuin", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Olifan", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Pandat Finance", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "School of Arts", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Almond", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Eric Bompard", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "BTPC", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "CEME", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Mailinblack", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Porsolt", fund: "ADF", sector: null, geography: null, status: "active" as const },
  { name: "Odin", fund: "ADF", sector: null, geography: null, status: "active" as const },
] as const;

// Program Categories (from Visuals.pptx slide 5)
export const PROGRAM_CATEGORIES = [
  // Fundamentals
  { name: "Governance", type: "fundamental" as const, display_order: 1 },
  { name: "Leadership", type: "fundamental" as const, display_order: 2 },
  { name: "Sustainability", type: "fundamental" as const, display_order: 3 },
  { name: "Strategy", type: "fundamental" as const, display_order: 4 },
  { name: "Finance & Reporting", type: "fundamental" as const, display_order: 5 },
  { name: "Cybersecurity", type: "fundamental" as const, display_order: 6 },
  // Programs
  { name: "AI/Digital", type: "program" as const, display_order: 7 },
  { name: "Pricing", type: "program" as const, display_order: 8 },
  { name: "Purchasing", type: "program" as const, display_order: 9 },
  { name: "Opex", type: "program" as const, display_order: 10 },
  { name: "M&A", type: "program" as const, display_order: 11 },
  { name: "PMI", type: "program" as const, display_order: 12 },
  { name: "Sales & Marketing", type: "program" as const, display_order: 13 },
  { name: "IT/Data", type: "program" as const, display_order: 14 },
  { name: "HR", type: "program" as const, display_order: 15 },
  { name: "Environment", type: "program" as const, display_order: 16 },
] as const;
