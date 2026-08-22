# Independent Public Deployment Design

## Objective

Move Barato from its coupled server runtime to an independent Supabase backend while serving the public React application from GitHub Pages.

## Architecture

The GitHub Pages build remains a static SPA with a repository-relative base path and hash routing. It replaces tRPC calls with a small typed HTTPS client for Barato Edge Functions. A dedicated Supabase project owns Postgres data, private object storage, Row Level Security policies, and Edge Functions. Browser code receives only a publishable key; service credentials and administrative signing secrets remain server-side.

## Functional Scope

The migration preserves personalised gift creation, token-based public viewing, visit recording, password-gated image upload, birthday content, administrative sign-in, gift administration, analytics and image storage. Existing MySQL data is imported into equivalent relational tables before cutover. The administrator login remains server-verified and uses opaque, short-lived session tokens instead of exposing an administrator password or hash to the public site.

## API and Security

Public functions validate all gift and token inputs. Owner-only functions validate the owner session, while uploaded images are stored outside the public source repository. Storage paths are validated server-side. Rate limits, expiration checks, and CORS allow only the GitHub Pages origin. No user session, secret, password hash, or service-role credential is bundled into the static client.

## Verification

Automated tests cover public gift retrieval, owner authorization, token validation, expiration, upload authorization and analytics aggregation. The release process builds the static client, deploys Edge Functions and database migrations, publishes Pages, then verifies creation, a public gift URL, owner management, birthday content and image retrieval end-to-end.

## Deployment status

GitHub Pages was enabled from the public `main` branch on 15 August 2026. The next workflow deployment publishes the static client at the repository Pages URL.
