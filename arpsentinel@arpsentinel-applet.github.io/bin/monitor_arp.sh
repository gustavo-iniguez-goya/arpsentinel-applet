#!/bin/sh
# ARP Sentinel - https://github.com/gustavo-iniguez-goya/arpsentinel-applet
#
# monitor arp cache table
# 
[ ! -f /proc/net/arp ] && exit

while read line
do
    IP=`echo $line|cut -d " " -f 1`
    MAC=`echo $line|cut -d " " -f 4`

    if [ "$IP" != "IP" ]
    then
        echo "$MAC $IP"
    else
        continue
    fi
done < /proc/net/arp
