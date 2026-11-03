# Research corpus import: 2026-11 dossier

## What this change actually imports

The migration `drizzle/migrations/0001_kabbalah_research_corpus.sql` contains:

- 37 bibliography records from the earlier Occult Killer v3 registry (all **metadata only**).
- 5 additional linked, independently checked publisher/reference records (metadata and original paraphrases only).
- 1 document for the user-supplied multidisciplinary research dossier.
- 17 short research-note entries associated with the dossier, with provenance and claim status **unverified** pending claim-level review.

The file `docs/research/KABBALAH_MULTIDISCIPLINARY_DOSSIER.md` preserves the six-discipline framework, theological lens and limits on what can legitimately be inferred from it.

**It does not contain any full copyrighted books, scans, journal articles or unauthorized copies.**

## Apply the migration

The changes on GitHub alone **do not modify the deployed Supabase database**. Run the new SQL migration in the correct project's authenticated migration process or Supabase SQL editor after reviewing it.

The migration uses fixed document IDs and `ON CONFLICT DO NOTHING`. For the dossier's note entries it checks `independence_cluster` before inserting, so reruns do not duplicate them. It does not delete or overwrite user-supplied records.

Check the import using:

```sql
SELECT origin, count(*) FROM public.source_documents GROUP BY origin ORDER BY origin;
SELECT count(*) FROM public.source_documents WHERE id LIKE 'ok3_%';
SELECT count(*) FROM public.source_excerpts WHERE source_id = 'gc_dossier_kabbalah_multidisciplinary_20261102';
SELECT id, title, license, origin, verification
FROM public.source_documents
WHERE id IN ('harari_love_2022','myers_marketing_2014','zohar_nli_catalogue');
```

Expected records **added by this migration**: 43 documents (37 + 5 + 1) and 17 original research notes. Total database counts can be higher when prior records already exist.

## Chatbot integration

`src/lib/chat.functions.ts` already implements keyword retrieval over `source_documents` and `source_excerpts`. This change tightens excerpt retrieval by project scope and makes `user_synthesis` provenance visible in the context.

To verify after deployment, open **AI Research**, select the **Occult Killer** scope, and ask about the distinction between historical Jewish magic and claims of physical efficacy. The assistant should retrieve relevant source notes and cite their database IDs. When asked if a book has been read, it must answer that bibliography-only records lack indexed full text. The **Neural Atlas**-only scope must not retrieve this dossier.

The project is using simple lexical retrieval, not a full embedding-based semantic RAG index. This means paraphrases and synonyms may not match reliably yet.

## What remains

1. Apply the migration to the correct Supabase project.
2. Review authentication/authorization for server functions that currently access the service-role database client; these bypass RLS and should not serve untrusted requests without ownership checks.
3. Add legally obtained specific excerpts, with accurate edition/page/URL, rights, verification status and independent corroboration data.
4. Add a source review workflow before elevating any claim to `verified`.
5. Add evaluation tests against a clean database and a configured Gemini API key.

Use the research corpus for **evidence-aware analysis**, not as a direct source of unverified motive weights for real groups.
