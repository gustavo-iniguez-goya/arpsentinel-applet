#!/bin/sh
# This file is part of ARP Sentinel.
#
#    ARP Sentinel is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
PATH=/usr/bin:/usr/sbin/:/bin
DOMAIN="$1"
[ -z "$DOMAIN" ] && exit
/usr/bin/openssl s_client -showcerts -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | /usr/bin/openssl x509 -fingerprint -noout | cut -d '=' -f 2
