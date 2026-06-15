#!/bin/sh
set -e

PORT="${PORT:-80}"
sed "s/__PORT__/${PORT}/g" /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
