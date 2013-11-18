#!/bin/sh
URL="http://office.sola.co.il:3000/radius"

uci set dhcp.@dnsmasq[0].dhcpscript=/etc/dhcp-script.sh
uci commit

cat > /etc/dhcp-script.sh << EOF
#!/bin/sh
# (c) OktaSpot 2012
BASE_URL="$URL"
PATH="/bin:/sbin:/usr/bin:/usr/sbin"
export PATH

MAC=\`echo \$2 | tr '[a-z:]' '[A-Z-]'\`

# Log to syslog
log() {
    logger -t dhcp -p daemon.info "\$1"
}

updateRadius() {
    local NASID=\`/sbin/ifconfig br-lan | awk '{ if(/^br-lan/) {print \$5} }' | tr : -\`
    case "\$1" in
    logon|logoff|online)
        wget -q -O /dev/null "\$BASE_URL/\$1?mac=\$MAC&nasid=\$NASID" > /dev/null 2>&1
        ;;
    *)
        log "bad command: \$1"
    esac
}

case "\$1" in
logon)
    log "logon \$MAC"
    updateRadius "logon"
    ;;

logoff)
    log "logoff \$MAC"
    updateRadius "logoff"
    ;;

old)
    log "old lease \$MAC"
    updateRadius "online"
    ;;

*)
    log "wrong parameter"
esac
EOF

chmod 555 /etc/dhcp-script.sh
