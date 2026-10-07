# Contract: Configuration (`.env`)

`.env` is loaded with Node's built-in `process.loadEnvFile`; values are validated before the socket is opened. Failures report variable **names** only. `.env` is git-ignored; `.env.example` holds placeholders only.

**URL conventions**: *Root* = scheme + host only (no path, query, or trailing slash; subdomains allowed); code appends documented paths. *Endpoint* = complete URL used verbatim; code never appends to it.

| Service | Variable | Kind | Example placeholder |
|---------|----------|------|---------------------|
| Bridge | `BRIDGE_WS_BASE_URL` | root | `wss://bridge.example.com` |
| Bridge | `PAIR_ID` | value | `your_pair_id` |
| Bridge | `RECONNECT_DELAY_MS` | value | `1000` |
| Bridge | `RECONNECT_MAX_DELAY_MS` | value | `30000` |
| Webex | `WEBEX_API_ROOT_URL` | root | `https://webexapis.com` |
| Webex | `WEBEX_BOT_TOKEN` | secret | `<bot-token>` |
| Webex | `WEBEX_BOT_EMAIL` | value | `bot@webex.bot` |
| WxCC | `WXCC_API_ROOT_URL` | root | `https://api.wxcc-us1.cisco.com` |
| WxCC | `WXCC_TOKEN_URL` | endpoint | `https://webexapis.com/v1/access_token` |
| WxCC | `WXCC_CLIENT_ID` | secret | `<client-id>` |
| WxCC | `WXCC_CLIENT_SECRET` | secret | `<client-secret>` |
| WxCC | `WXCC_REFRESH_TOKEN` | secret | `<refresh-token>` |
| WxCC | `WXCC_BUSINESS_ADDRESS` | value | `support@channel.example` |
| WxCC | `WXCC_CHANNEL_NAME` | value | `my-custom-channel` |
| Service | `PENDING_TASK_TIMEOUT_MS` | value | `30000` |
| Service | `READINESS_PORT` | value | `3000` |

Validation: required non-empty; roots parse as URL with `https:` (`wss:` for the socket), no path beyond `/`; endpoint parses as `https:`; integers positive; `PAIR_ID` matches the bridge rule.
