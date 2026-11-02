// Register only on the private, owner-authenticated MCP server.
// db must use a dedicated login with only the werktag_knowledge_agent role.
export function registerWerkTagKnowledge(server, db, z, requireOwner) {
  const project = z.literal('werktag')
  const key = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,159}$/)
  const area = z.enum(['company_shop','learning_products','assistance','technical_components'])
  const fields = { project, canonical_key: key, request_id: z.string().uuid(),
    title: z.string().trim().min(1).max(512), content: z.string().trim().min(1).max(100000),
    area, source: z.string().trim().min(1).max(4096), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: z.enum(['fact','decision','idea','draft']),
    status: z.enum(['unverified','documented','confirmed','archived']) }
  function register(name, inputSchema, handler) {
    server.registerTool(name, { inputSchema }, async (args, context) => {
      if (await requireOwner(context) !== true) throw new Error('Owner access required')
      const rows = await handler(args)
      return { content: [{ type: 'text', text: JSON.stringify(rows) }] }
    })
  }
  async function append(a, expected) {
    return (await db.query('select $1::text as canonical_key, werktag_knowledge.append_revision($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as version',
      [a.canonical_key,expected,a.request_id,a.title,a.content,a.area,a.source,a.date,a.kind,a.status])).rows
  }
  register('knowledge_store', fields, a => append(a, 0))
  register('knowledge_update', { ...fields, expected_version: z.number().int().positive() }, a => append(a, a.expected_version))
  register('knowledge_read', { project, canonical_key: key, version: z.number().int().positive().optional() },
    async a => (await db.query('select * from werktag_knowledge.revisions where canonical_key=$1 and ($2::integer is null or version=$2) order by version desc limit 1',
      [a.canonical_key,a.version ?? null])).rows)
  register('knowledge_search', { project, query: z.string().max(512), area: area.optional(), cursor: key.optional() },
    async a => (await db.query(`with latest as (select distinct on (canonical_key) * from werktag_knowledge.revisions
      where canonical_key > $3 order by canonical_key, version desc)
      select canonical_key,version,title,area,kind,status from latest where ($2::text is null or area=$2)
      and strpos(lower(title || ' ' || content || ' ' || canonical_key),lower($1)) > 0 order by canonical_key limit 50`,
      [a.query,a.area ?? null,a.cursor ?? ''])).rows)
}
