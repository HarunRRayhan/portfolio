# Short links and QR code API

Create a key under **Account → API Keys**. Copy it when it's shown; the stored token hash can't be recovered later. Send the key in the `Authorization: Bearer` header for `/api/v1` requests.

## Choose capabilities for the integration

New keys require at least one explicit capability. The form starts with **Create links** and an expiration 90 days from creation. You can select a preset or adjust the checkboxes.

| Capability | Requests allowed |
| --- | --- |
| `short-links:create` | `POST /api/v1/short-links` |
| `short-links:read` | `GET /api/v1/short-links` and `GET /api/v1/short-links/{code}` |
| `short-links:manage` | `PATCH /api/v1/short-links/{code}/deactivate` and `DELETE /api/v1/short-links/{code}` |
| `qr-codes:create` | `POST /api/v1/qr-codes` |

The **Manage links** preset includes read and manage permissions. Choose **Create links and QR codes** when the integration needs both creation endpoints. Scopes don't change the owner's role: non-admin callers can only read or manage their own links. Admin keys with the appropriate capability can read or manage all links.

The API requires a personal API key. A browser login session doesn't grant API capabilities. Missing or expired keys return `401`; a missing capability or a link ownership violation returns `403`.

## Expiration and revocation

The expiration input uses your browser's local time and is saved in UTC. Clear it to choose no expiration. When creating a key through the admin endpoint, omitting `expires_at` defaults to 90 days; sending an explicit `null` selects no expiration.

The table shows capabilities, expiration, and last use. Revoking a key stops its next request immediately. Rate limits still default to 60 requests per minute and 2,000 per day unless the key has overrides.

Existing keys with `*` remain valid and appear as **Legacy: unrestricted**. This release doesn't revoke them, change their permissions, or add an expiration. Create a scoped replacement, update the integration, then revoke the old key when you're ready.

## Create a short link

```sh
curl https://harun.dev/api/v1/short-links \
  -H "Authorization: Bearer $HARUN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"destination_url":"https://example.com/article","title":"Article"}'
```

The response includes the code, short URL, destination, title, active state, and expiration. Keys with both create and read capabilities reuse a matching link owned by the same caller. Create-only keys always create a fresh link, so creation cannot disclose metadata from an existing link. A destination already shortened by someone else gets a separate link owned by the caller; the response doesn't disclose the other owner's title or expiration. Shared deduplication in the website's admin tools is unchanged.

The returned `qr_code_url` names the QR endpoint, which requires a separate authenticated `POST` with the short URL as `content`. It isn't a public image URL.

## Generate a QR code

```sh
curl https://harun.dev/api/v1/qr-codes \
  -H "Authorization: Bearer $HARUN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"content":"https://example.com/article"}'
```

The JSON response contains a PNG data URI in `qr_code`. Add `?format=png` to receive PNG bytes instead. The request must still include the key and `content`.
