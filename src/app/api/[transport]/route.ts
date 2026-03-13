import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Auth helper ──────────────────────────────────────────────────────────────

function checkApiKey(req: Request): Response | null {
  const apiKey = process.env.MCP_API_KEY
  if (!apiKey) return null // No key configured → open (dev mode)

  const header = req.headers.get('x-api-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (header !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}

// ─── MCP Handler ──────────────────────────────────────────────────────────────

const mcpHandler = createMcpHandler(
  (server) => {
    const db = () => createAdminClient()

    // ── STATS ──────────────────────────────────────────────────────────────────

    server.registerTool(
      'get_stats',
      {
        title: 'Statistiques globales',
        description: 'Retourne un résumé : nb utilisateurs, sociétés, assignments actifs, demandes ouvertes.',
        inputSchema: {},
      },
      async () => {
        const supabase = db()
        const [users, companies, staffing, requests] = await Promise.all([
          supabase.from('profiles').select('role, status, is_active', { count: 'exact' }),
          supabase.from('portfolio_companies').select('status', { count: 'exact' }),
          supabase.from('staffing_assignments').select('status', { count: 'exact' }),
          supabase.from('support_requests').select('status', { count: 'exact' }),
        ])
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              users: { total: users.count, data: users.data },
              companies: { total: companies.count, data: companies.data },
              staffing: { total: staffing.count, data: staffing.data },
              requests: { total: requests.count, data: requests.data },
            }, null, 2),
          }],
        }
      }
    )

    // ── USERS / PROFILES ───────────────────────────────────────────────────────

    server.registerTool(
      'list_users',
      {
        title: 'Lister les utilisateurs',
        description: 'Retourne tous les profils. Filtrage optionnel par rôle et/ou statut.',
        inputSchema: {
          role: z.enum(['owner', 'admin', 'core_vct', 'sop', 'requester', 'viewer']).optional(),
          status: z.enum(['pending', 'approved', 'rejected']).optional(),
          is_active: z.boolean().optional(),
        },
      },
      async ({ role, status, is_active }) => {
        const supabase = db()
        let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
        if (role) query = query.eq('role', role)
        if (status) query = query.eq('status', status)
        if (is_active !== undefined) query = query.eq('is_active', is_active)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'get_user',
      {
        title: 'Détail utilisateur',
        description: 'Retourne le profil complet d\'un utilisateur par ID ou email.',
        inputSchema: {
          id: z.string().optional(),
          email: z.string().email().optional(),
        },
      },
      async ({ id, email }) => {
        const supabase = db()
        if (!id && !email) return { content: [{ type: 'text' as const, text: 'Fournir id ou email.' }] }
        let query = supabase.from('profiles').select('*')
        if (id) query = query.eq('id', id)
        else if (email) query = query.eq('email', email)
        const { data, error } = await query.single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'approve_user',
      {
        title: 'Approuver un utilisateur',
        description: 'Approuve un utilisateur en attente (status=approved, is_active=true).',
        inputSchema: {
          id: z.string().describe('UUID du profil'),
        },
      },
      async ({ id }) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('profiles')
          .update({ status: 'approved', is_active: true })
          .eq('id', id)
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `✅ Utilisateur approuvé : ${data.email}` }] }
      }
    )

    server.registerTool(
      'reject_user',
      {
        title: 'Rejeter un utilisateur',
        description: 'Rejette un utilisateur (status=rejected, is_active=false).',
        inputSchema: {
          id: z.string().describe('UUID du profil'),
        },
      },
      async ({ id }) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('profiles')
          .update({ status: 'rejected', is_active: false })
          .eq('id', id)
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `❌ Utilisateur rejeté : ${data.email}` }] }
      }
    )

    server.registerTool(
      'update_user',
      {
        title: 'Modifier un utilisateur',
        description: 'Met à jour le rôle, le nom, les spécialités ou l\'état d\'activation d\'un utilisateur.',
        inputSchema: {
          id: z.string().describe('UUID du profil'),
          full_name: z.string().optional(),
          role: z.enum(['owner', 'admin', 'core_vct', 'sop', 'requester', 'viewer']).optional(),
          is_active: z.boolean().optional(),
          specialties: z.array(z.string()).optional(),
          phone: z.string().optional(),
        },
      },
      async ({ id, ...fields }) => {
        const supabase = db()
        const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_user',
      {
        title: 'Supprimer un utilisateur',
        description: 'Supprime le profil d\'un utilisateur (irréversible).',
        inputSchema: {
          id: z.string().describe('UUID du profil'),
        },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Profil supprimé.` }] }
      }
    )

    // ── FONDS ─────────────────────────────────────────────────────────────────

    server.registerTool(
      'list_funds',
      {
        title: 'Lister les fonds',
        description: 'Retourne tous les fonds (MM X, MM IX, ADF…).',
        inputSchema: {},
      },
      async () => {
        const supabase = db()
        const { data, error } = await supabase.from('funds').select('*').order('display_order')
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'create_fund',
      {
        title: 'Créer un fonds',
        description: 'Crée un nouveau fonds.',
        inputSchema: {
          name: z.string(),
          display_order: z.number().int().optional(),
        },
      },
      async ({ name, display_order }) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('funds')
          .insert({ name, display_order: display_order ?? 99 })
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'update_fund',
      {
        title: 'Modifier un fonds',
        description: 'Met à jour le nom ou l\'ordre d\'affichage d\'un fonds.',
        inputSchema: {
          id: z.string(),
          name: z.string().optional(),
          display_order: z.number().int().optional(),
        },
      },
      async ({ id, name, display_order }) => {
        const supabase = db()
        const updates = Object.fromEntries(Object.entries({ name, display_order }).filter(([, v]) => v !== undefined))
        const { data, error } = await supabase.from('funds').update(updates).eq('id', id).select().single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_fund',
      {
        title: 'Supprimer un fonds',
        description: 'Supprime un fonds (irréversible). Toutes les sociétés liées seront orphelines.',
        inputSchema: { id: z.string() },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('funds').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Fonds supprimé.` }] }
      }
    )

    // ── SOCIÉTÉS ──────────────────────────────────────────────────────────────

    server.registerTool(
      'list_companies',
      {
        title: 'Lister les sociétés',
        description: 'Retourne les sociétés du portfolio. Filtrage optionnel par fonds ou statut.',
        inputSchema: {
          fund_id: z.string().optional(),
          status: z.enum(['active', 'inactive', 'exited']).optional(),
        },
      },
      async ({ fund_id, status }) => {
        const supabase = db()
        let query = supabase
          .from('portfolio_companies')
          .select('*, fund:funds(name)')
          .order('name')
        if (fund_id) query = query.eq('fund_id', fund_id)
        if (status) query = query.eq('status', status)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'get_company',
      {
        title: 'Détail société',
        description: 'Retourne le détail complet d\'une société avec ses assignments.',
        inputSchema: {
          id: z.string().optional(),
          name: z.string().optional(),
        },
      },
      async ({ id, name }) => {
        const supabase = db()
        if (!id && !name) return { content: [{ type: 'text' as const, text: 'Fournir id ou name.' }] }
        let query = supabase
          .from('portfolio_companies')
          .select('*, fund:funds(name), staffing_assignments(*, member:profiles(full_name, initials, role), program:program_categories(name, type))')
        if (id) query = query.eq('id', id)
        else if (name) query = query.ilike('name', `%${name}%`)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'create_company',
      {
        title: 'Créer une société',
        description: 'Ajoute une nouvelle société au portfolio.',
        inputSchema: {
          name: z.string(),
          fund_id: z.string(),
          sector: z.string().optional(),
          geography: z.string().optional(),
          status: z.enum(['active', 'inactive', 'exited']).optional(),
          deal_partner: z.string().optional(),
          deal_team: z.array(z.string()).optional(),
          notes: z.string().optional(),
        },
      },
      async (fields) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('portfolio_companies')
          .insert({ ...fields, status: fields.status ?? 'active' })
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'update_company',
      {
        title: 'Modifier une société',
        description: 'Met à jour les champs d\'une société (nom, secteur, statut, notes…).',
        inputSchema: {
          id: z.string(),
          name: z.string().optional(),
          fund_id: z.string().optional(),
          sector: z.string().optional(),
          geography: z.string().optional(),
          status: z.enum(['active', 'inactive', 'exited']).optional(),
          deal_partner: z.string().optional(),
          deal_team: z.array(z.string()).optional(),
          notes: z.string().optional(),
          strategic_priorities: z.record(z.string(), z.unknown()).optional(),
          kpis: z.record(z.string(), z.unknown()).optional(),
        },
      },
      async ({ id, ...fields }) => {
        const supabase = db()
        const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        const { data, error } = await supabase
          .from('portfolio_companies')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_company',
      {
        title: 'Supprimer une société',
        description: 'Supprime une société et ses assignments associés (irréversible).',
        inputSchema: { id: z.string() },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('portfolio_companies').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Société supprimée.` }] }
      }
    )

    // ── PROGRAMMES ────────────────────────────────────────────────────────────

    server.registerTool(
      'list_programs',
      {
        title: 'Lister les programmes',
        description: 'Retourne toutes les catégories de programmes et fondamentaux.',
        inputSchema: {
          type: z.enum(['fundamental', 'program']).optional(),
        },
      },
      async ({ type }) => {
        const supabase = db()
        let query = supabase.from('program_categories').select('*').order('display_order')
        if (type) query = query.eq('type', type)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'create_program',
      {
        title: 'Créer un programme',
        description: 'Ajoute une nouvelle catégorie de programme ou fondamental.',
        inputSchema: {
          name: z.string(),
          type: z.enum(['fundamental', 'program']),
          display_order: z.number().int().optional(),
          color: z.string().optional(),
        },
      },
      async (fields) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('program_categories')
          .insert({ ...fields, display_order: fields.display_order ?? 99 })
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'update_program',
      {
        title: 'Modifier un programme',
        description: 'Met à jour un programme ou fondamental.',
        inputSchema: {
          id: z.string(),
          name: z.string().optional(),
          type: z.enum(['fundamental', 'program']).optional(),
          display_order: z.number().int().optional(),
          color: z.string().optional(),
        },
      },
      async ({ id, ...fields }) => {
        const supabase = db()
        const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        const { data, error } = await supabase.from('program_categories').update(updates).eq('id', id).select().single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_program',
      {
        title: 'Supprimer un programme',
        description: 'Supprime une catégorie de programme.',
        inputSchema: { id: z.string() },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('program_categories').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Programme supprimé.` }] }
      }
    )

    // ── STAFFING ──────────────────────────────────────────────────────────────

    server.registerTool(
      'list_staffing',
      {
        title: 'Lister les assignments',
        description: 'Retourne les assignments de staffing avec détails membre/société/programme.',
        inputSchema: {
          member_id: z.string().optional(),
          company_id: z.string().optional(),
          program_id: z.string().optional(),
          workload: z.enum(['heavy', 'light', 'none']).optional(),
          status: z.enum(['to_start', 'ongoing', 'completed', 'roadblock']).optional(),
        },
      },
      async ({ member_id, company_id, program_id, workload, status }) => {
        const supabase = db()
        let query = supabase
          .from('staffing_assignments')
          .select('*, member:profiles(full_name, initials, email), company:portfolio_companies(name, fund_id), program:program_categories(name, type)')
          .order('created_at', { ascending: false })
        if (member_id) query = query.eq('member_id', member_id)
        if (company_id) query = query.eq('company_id', company_id)
        if (program_id) query = query.eq('program_id', program_id)
        if (workload) query = query.eq('workload', workload)
        if (status) query = query.eq('status', status)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'upsert_staffing',
      {
        title: 'Créer / modifier un assignment',
        description: 'Crée ou met à jour un assignment (upsert sur member_id + company_id + program_id).',
        inputSchema: {
          member_id: z.string(),
          company_id: z.string(),
          program_id: z.string(),
          workload: z.enum(['heavy', 'light', 'none']).optional(),
          status: z.enum(['to_start', 'ongoing', 'completed', 'roadblock']).optional(),
          start_date: z.string().optional(),
          end_date: z.string().optional(),
          objectives: z.string().optional(),
          notes: z.string().optional(),
          external_resources: z.string().optional(),
          created_by: z.string().optional(),
        },
      },
      async (fields) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('staffing_assignments')
          .upsert(fields, { onConflict: 'member_id,company_id,program_id' })
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_staffing',
      {
        title: 'Supprimer un assignment',
        description: 'Supprime un assignment de staffing par son ID.',
        inputSchema: { id: z.string() },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('staffing_assignments').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Assignment supprimé.` }] }
      }
    )

    // ── DEMANDES DE SUPPORT ───────────────────────────────────────────────────

    server.registerTool(
      'list_requests',
      {
        title: 'Lister les demandes de support',
        description: 'Retourne les demandes de support. Filtrage par statut, priorité ou société.',
        inputSchema: {
          status: z.enum(['submitted', 'reviewed', 'assigned', 'in_progress', 'completed', 'rejected']).optional(),
          priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
          company_id: z.string().optional(),
        },
      },
      async ({ status, priority, company_id }) => {
        const supabase = db()
        let query = supabase
          .from('support_requests')
          .select('*, requester:profiles!requester_id(full_name, email), company:portfolio_companies(name), assignee:profiles!assigned_to(full_name)')
          .order('created_at', { ascending: false })
        if (status) query = query.eq('status', status)
        if (priority) query = query.eq('priority', priority)
        if (company_id) query = query.eq('company_id', company_id)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'update_request',
      {
        title: 'Modifier une demande',
        description: 'Met à jour le statut, la priorité ou l\'assignation d\'une demande de support.',
        inputSchema: {
          id: z.string(),
          status: z.enum(['submitted', 'reviewed', 'assigned', 'in_progress', 'completed', 'rejected']).optional(),
          priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
          assigned_to: z.string().optional(),
          resolved_at: z.string().optional(),
        },
      },
      async ({ id, ...fields }) => {
        const supabase = db()
        const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
        const { data, error } = await supabase
          .from('support_requests')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'delete_request',
      {
        title: 'Supprimer une demande',
        description: 'Supprime une demande de support.',
        inputSchema: { id: z.string() },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('support_requests').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `🗑️ Demande supprimée.` }] }
      }
    )

    // ── SOP ASSIGNMENTS ───────────────────────────────────────────────────────

    server.registerTool(
      'list_sop',
      {
        title: 'Lister les SOP assignments',
        description: 'Retourne les associations SOP ↔ société.',
        inputSchema: {
          sop_id: z.string().optional(),
          company_id: z.string().optional(),
        },
      },
      async ({ sop_id, company_id }) => {
        const supabase = db()
        let query = supabase
          .from('sop_assignments')
          .select('*, sop:profiles(full_name, email, initials), company:portfolio_companies(name)')
        if (sop_id) query = query.eq('sop_id', sop_id)
        if (company_id) query = query.eq('company_id', company_id)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'add_sop',
      {
        title: 'Assigner un SOP',
        description: 'Assigne un Senior Operating Partner à une société.',
        inputSchema: {
          sop_id: z.string().describe('UUID du profil SOP'),
          company_id: z.string().describe('UUID de la société'),
        },
      },
      async ({ sop_id, company_id }) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('sop_assignments')
          .insert({ sop_id, company_id })
          .select('*, sop:profiles(full_name), company:portfolio_companies(name)')
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'remove_sop',
      {
        title: 'Retirer un SOP',
        description: 'Retire l\'association SOP ↔ société.',
        inputSchema: { id: z.string().describe('UUID du sop_assignment') },
      },
      async ({ id }) => {
        const supabase = db()
        const { error } = await supabase.from('sop_assignments').delete().eq('id', id)
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: `✅ Association SOP supprimée.` }] }
      }
    )

    // ── ACTIVITY LOG ──────────────────────────────────────────────────────────

    server.registerTool(
      'get_activity',
      {
        title: 'Journal d\'activité',
        description: 'Retourne le journal d\'audit. Filtrage par entité, utilisateur ou action.',
        inputSchema: {
          entity_type: z.string().optional().describe('Ex: staffing_assignments, portfolio_companies'),
          entity_id: z.string().optional(),
          user_id: z.string().optional(),
          action: z.string().optional().describe('Ex: INSERT, UPDATE, DELETE'),
          limit: z.number().int().min(1).max(200).optional().default(50),
        },
      },
      async ({ entity_type, entity_id, user_id, action, limit }) => {
        const supabase = db()
        let query = supabase
          .from('activity_log')
          .select('*, user:profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(limit ?? 50)
        if (entity_type) query = query.eq('entity_type', entity_type)
        if (entity_id) query = query.eq('entity_id', entity_id)
        if (user_id) query = query.eq('user_id', user_id)
        if (action) query = query.eq('action', action)
        const { data, error } = await query
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    // ── PARAMÈTRES ────────────────────────────────────────────────────────────

    server.registerTool(
      'get_settings',
      {
        title: 'Paramètres de l\'application',
        description: 'Retourne tous les paramètres (domaines email autorisés, etc.).',
        inputSchema: {},
      },
      async () => {
        const supabase = db()
        const { data, error } = await supabase.from('app_settings').select('*')
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )

    server.registerTool(
      'update_setting',
      {
        title: 'Modifier un paramètre',
        description: 'Met à jour un paramètre de l\'application (ex: allowed_email_domains).',
        inputSchema: {
          key: z.string().describe('Clé du paramètre, ex: allowed_email_domains'),
          value: z.string().describe('Nouvelle valeur (JSON string si objet/array)'),
        },
      },
      async ({ key, value }) => {
        const supabase = db()
        const { data, error } = await supabase
          .from('app_settings')
          .upsert({ key, value, updated_at: new Date().toISOString() })
          .select()
          .single()
        if (error) return { content: [{ type: 'text' as const, text: `Erreur : ${error.message}` }] }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
      }
    )
  },
  {},
  {
    basePath: '/api',
    maxDuration: 60,
    verboseLogs: false,
  }
)

// ─── Route handlers avec protection par API key ───────────────────────────────

export async function GET(req: Request) {
  const authError = checkApiKey(req)
  if (authError) return authError
  return mcpHandler(req)
}

export async function POST(req: Request) {
  const authError = checkApiKey(req)
  if (authError) return authError
  return mcpHandler(req)
}
