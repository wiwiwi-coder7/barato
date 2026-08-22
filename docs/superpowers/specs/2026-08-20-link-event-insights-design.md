# Link Event Insights Design

## Purpose

Give the Barato owner a private, per-link view of the technical context for link creation and opening events. The feature supports future link-management capabilities without exposing visitor data to public pages or changing the gift experience.

## Event data boundary

Each eligible event records only the gift identifier, event kind (`created` or `opened`), server timestamp, source IP, derived approximate city/region/country, browser family, operating-system family, and device class. The source IP is captured only by the server; it is never accepted from a client request body and is never returned by a public endpoint.

No GPS location, account identity, page-activity stream, referrer history, contact data, or cross-link tracking profile is collected. Existing gift and visit data stays unchanged. Events begin only after this release; historical events are not reconstructed.

## Storage and retention

A new `gift_link_events` table stores one row per creation or opening event. It is accessed only through the existing server-side Supabase service role and is not exposed through direct browser database access. Full IP is retained for 30 days, then the entire event row is purged by the protected endpoint before any administrator read. A SHA-256 IP fingerprint supports safe per-link grouping inside the retention window without returning the fingerprint to the browser.

Approximate location is resolved server-side through an IP geolocation provider using a server-only secret. Resolution failure does not block gift creation or opening; the event is recorded with null location fields and an administrative "unavailable" state.

## Request handling

The creation route captures request metadata before writing the gift. The public gift-opening route continues to return gift content, then its existing visit event is recorded with the same metadata pipeline. The server uses trusted forwarding headers only, ignores malformed/private/local addresses, applies a short timeout to location lookups, and caches no values outside the event record.

The public creation form and public gift page each include a concise Persian notice that technical information and approximate location may be processed for security and link management.

## Admin interface

Every gift row gains an accessible details icon. Selecting it opens a right-to-left dialog containing: creator event summary; total registered openings; the latest event first; and a compact table of event type, timestamp, IP, city/country, browser, and device. The dialog loads its data through a new authenticated endpoint and shows an empty or unavailable state without leaking any values.

## Validation

Unit tests cover client-IP parsing, private-address suppression, 30-day retention filtering, public payload omission, and admin authorization. End-to-end checks verify that creation and opening still function if geolocation fails, unauthenticated callers cannot load event details, and an authenticated owner can open the new details dialog.
