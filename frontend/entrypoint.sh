#!/bin/sh

sed -i "s|__API_URL__|$API_URL|g" /usr/share/nginx/html/assets/*.js
exec nginx -g "daemon off;"
