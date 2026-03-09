-- Seed data: Funds, Portfolio Companies, Program Categories
-- Note: Profiles are created via auth trigger, not seeded here

-- ============================================================
-- FUNDS
-- ============================================================
INSERT INTO public.funds (name, display_order) VALUES
  ('MM X', 1),
  ('MM IX', 2),
  ('ADF', 3);

-- ============================================================
-- PORTFOLIO COMPANIES
-- ============================================================
-- MM X
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('Zwart', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Critical Power', 'Netherlands', 'active'),
  ('HRK Lunis', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Wealth Management', 'Germany', 'active'),
  ('Fulgard', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Lumion', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Infraneo', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Efficy', (SELECT id FROM public.funds WHERE name = 'MM X'), 'CRM', 'Belgium', 'active'),
  ('MCG', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'active'),
  ('Odigo', (SELECT id FROM public.funds WHERE name = 'MM X'), 'CCaaS', 'France', 'active'),
  ('Hirsch', (SELECT id FROM public.funds WHERE name = 'MM X'), 'Security', 'France', 'active'),
  ('Opteven', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, 'France', 'active'),
  ('Crystal', (SELECT id FROM public.funds WHERE name = 'MM X'), NULL, NULL, 'inactive');

-- MM IX
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('DSTNY', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('AEB', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('Graitec', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active'),
  ('Infovista', (SELECT id FROM public.funds WHERE name = 'MM IX'), NULL, NULL, 'active');

-- ADF
INSERT INTO public.portfolio_companies (name, fund_id, sector, geography, status) VALUES
  ('Illuin', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Olifan', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Pandat Finance', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('School of Arts', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Almond', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Eric Bompard', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('BTPC', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('CEME', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Mailinblack', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Porsolt', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active'),
  ('Odin', (SELECT id FROM public.funds WHERE name = 'ADF'), NULL, NULL, 'active');

-- ============================================================
-- PROGRAM CATEGORIES
-- ============================================================
-- Fundamentals
INSERT INTO public.program_categories (name, type, display_order) VALUES
  ('Governance', 'fundamental', 1),
  ('Leadership', 'fundamental', 2),
  ('Sustainability', 'fundamental', 3),
  ('Strategy', 'fundamental', 4),
  ('Finance & Reporting', 'fundamental', 5),
  ('Cybersecurity', 'fundamental', 6);

-- Programs
INSERT INTO public.program_categories (name, type, display_order) VALUES
  ('AI/Digital', 'program', 7),
  ('Pricing', 'program', 8),
  ('Purchasing', 'program', 9),
  ('Opex', 'program', 10),
  ('M&A', 'program', 11),
  ('PMI', 'program', 12),
  ('Sales & Marketing', 'program', 13),
  ('IT/Data', 'program', 14),
  ('HR', 'program', 15),
  ('Environment', 'program', 16);
