#!/bin/sh
PATH=/usr/bin:/usr/sbin/:/bin
DOMAIN="$1"
/usr/bin/openssl s_client -showcerts -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | /usr/bin/openssl x509 -fingerprint -noout | cut -d '=' -f 2
