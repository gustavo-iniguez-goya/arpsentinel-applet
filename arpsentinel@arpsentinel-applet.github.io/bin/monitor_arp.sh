#!/bin/sh
# ARP Sentinel - https://github.com/gustavo-iniguez-goya/arpsentinel-applet
#
# monitor arp cache table
# 
[ ! -f /proc/net/arp ] && exit

while read IP _ _ MAC _ DEV
do
    if [ "$IP" != "IP" ]
    then
        echo "$MAC $IP $DEV"
    else
        continue
    fi
done < /proc/net/arp
