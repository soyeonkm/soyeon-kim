#!/bin/sh
# Turns .env into config.js, which the page loads before briefing.js. Run after editing .env.
set -e
cd "$(dirname "$0")"
key=$(grep '^NYT_KEY=' .env | cut -d= -f2- | sed "s/[\"' ]//g")
printf 'window.NYT_KEY = "%s";\n' "$key" > config.js
echo "config.js written"
