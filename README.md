# Inkwell AI Writer

React/Vite editor backed by MongoDB with an optional Idea Inbox and a preliminary stateless MCP endpoint.

## Before deploying this branch

**Do not deploy without a full database backup and configuration review.** Set these Vercel server-side environment variables:
- `MONGODB_URI`: MongoDB connection.
- `MONGODB_DB`: database (default `inkwell`).
- `AUTH_SECRET`: independently generated random secret, **at least 32 characters**, never commit it.
- `GEMINI_API_KEY` (or existing `API_KEY`): Google AI Studio key, **server-side only**.

Existing passwords are upgraded from legacy plaintext to PBKDF2 hashes upon successful login. Accounts that never log in retain legacy credentials and should be migrated/reset; arrange a database backup first. Old browser-only sessions need a fresh login. New account passwords require 12+ characters.

## Idea Inbox

Select a book, then click **Idea Inbox** to capture thoughts without assigning them to a chapter. Ideas are stored as separate MongoDB documents, so book autosaves do not overwrite them. Use the chapter picker to associate an idea with an existing chapter; the original idea remains intact.

## Remote MCP foundation (not yet connectable as a ChatGPT OAuth app)

`POST /api/mcp` accepts JSON-RPC 2.0 with a Bearer login token and supports `initialize`, `tools/list`, `tools/call`:
- `list_books`
- `get_book_outline`
- `get_chapter`
- `list_ideas`
- `capture_idea`

All database operations are scoped to the authenticated account. **This is an MCP proof of foundation, not a production OAuth implementation**: ChatGPT's remote app connection requires OAuth authorization/consent flows, token lifecycle, and protocol transport compatibility testing. Never share your login token or place it in a public client.

## Remaining required work

- **Concurrency:** current editor still autosaves whole book records. Add per-chapter revision-based writes and conflict UI before permitting MCP chapter mutations or collaboration.
- **Backups:** implement and test automated MongoDB snapshots + restore before production rollout.
- **OAuth MCP:** implement discovery, authorization, PKCE, token management, revocation and permissions, then test actual ChatGPT connection.
- **Placement recommendations:** add manuscript search and AI classification using chapter context (a new chapter is only a suggestion, not an automatic edit).
- **History and structure:** chapter revision history, flexible order and multi-chapter idea linkage UI.
- **Tests:** server/API integration tests, auth abuse cases, migration tests and end-to-end tests before deployment.

Do not merge this preliminary PR until the server configuration and auth migration are planned and tested. Existing book data are not mutated by repository changes alone.
