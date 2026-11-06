#!/bin/sh
# Turns .env into config.js, which the page loads before briefing.js. Run after editing .env.
set -e
cd "$(dirname "$0")"
key=$(grep -E '^NYT_KEY=' .env | cut -d= -f2- | tr -d '"\x27 ')
printf 'window.NYT_KEY = "%s";\n' "$key" > config.js
echo "config.js written"
