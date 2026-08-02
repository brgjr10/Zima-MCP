# ZimaOS Server Access

> **⚠️ WARNING:** This file contains sensitive credentials.
> Keep it private. Do not commit to version control.

## SSH Target

| Field | Value |
|-------|-------|
| Host | `<<ZIMA_HOST>>` |
| Port | `22` |
| User | `<<ZIMA_USER>>` |
| Auth | SSH key (preferred) or password |

## Sudo Credentials

| Field | Value |
|-------|-------|
| User | `<<ZIMA_ADMIN>>` |
| Password | `<<ZIMA_ADMIN_PASS>>` |

## Usage Notes

- Agents and users can call `ssh_connect` without arguments to reach this server.
- For sudo commands inside an SSH session, use the password above.
- Prefer SSH key authentication when possible.
- Change the password immediately if this file is exposed.
- Last updated: 2026-07-13
