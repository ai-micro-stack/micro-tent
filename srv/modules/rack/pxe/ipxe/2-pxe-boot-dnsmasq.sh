#!/bin/bash

###############################################################
# uncomment next line for debugging (logging)
###############################################################
exec 1> >(tee /tmp/pxe-boot-dhcp.log) 2>&1

###############################################################
# Parse Command-line arguments
###############################################################
help() {
    # Display Help
    echo "Command-line option when run this file"
    echo
    echo "Options: "
    echo
    echo "h     Print this Help."
    echo "n     Need the NTP server (Yes/No)"
    echo "d     Need the DHCP server (Yes/No)"
    echo "u     Need the Utils (Yes/No)"
    echo
    echo "Usage: "
    echo "     ./pxe-server-setup.sh [<-option> [<Value>] ... ] "
    echo
}
OPTSTRING=":n:d:u:h"
while getopts ${OPTSTRING} opt; do
    case ${opt} in
    h) # Display Help
        help
        exit
        ;;
    n) # Need NTP server or not
        NTP_SERVER="${OPTARG}"
        ;;
    d) # Need DHCP server or not
        DHCP_SERVER="${OPTARG}"
        ;;
    u) # Need File Utils or not
        OPT_UTILS="${OPTARG}"
        ;;
    :)
        echo "Option -${OPTARG} requires an argument of 'Yes/No'."
        exit 1
        ;;
    ?)
        echo "Invalid option: -${OPTARG}."
        exit 1
        ;;
    esac
done

[ -z "${NTP_SERVER}" ] && NTP_SERVER="No"
[ -z "${DHCP_SERVER}" ] && DHCP_SERVER="Yes"
[ -z "${OPT_UTILS}" ] && OPT_UTILS="No"

echo "Command-line arguments:"
echo "NTP_SERVER(-n): ${NTP_SERVER}"
echo "DHCP_SERVER(-d): ${DHCP_SERVER}"
echo "OPT_UTILS(-u): ${OPT_UTILS}"
echo ""

###############################################################
# Include Server Configuration
###############################################################
_SCRIPT_DIR="${0%/*}"
if [[ ! -d "$_SCRIPT_DIR" ]]; then _SCRIPT_DIR="$PWD"; fi

# . "$_SCRIPT_DIR/config/pxe-server.conf"

echo "Server configuration:"
_REQUISITES=(
    "dhcpInterface"
    "dhcpNetAddress"
    "dhcpNetMask"
    "dhcpStart"
    "dhcpEnd"
    "dhcpRouter"
    "dhcpDnsList"
    "dhcpDomain"
    "dhcpNextServer"
    "pxeRoot"
    # "imgRoot"
    # "pxeAuto"
    "DHCP_SERVER"
    "NTP_SERVER"
    "ISO_UTILS"
)
tr -d '\r' <"$_SCRIPT_DIR/config/pxe-server.conf" >/tmp/pxe-server.conf
for _req in "${_REQUISITES[@]}"; do
    while IFS='= ' read -r lhs rhs; do
        if [[ $_req == $lhs ]] && [[ ! $lhs =~ ^\ *# && -n $lhs ]]; then
            rhs="${rhs%%\#*}"  # Del in line right comments
            rhs="${rhs%%*( )}" # Del trailing spaces
            rhs="${rhs%\"*}"   # Del opening string quotes
            rhs="${rhs#\"*}"   # Del closing string quotes
            declare $lhs="$rhs"
            echo "declare ${lhs}=${rhs}"
            break
        fi
    done </tmp/pxe-server.conf
    if [[ $_req != $lhs ]]; then
        echo "missing ${_req} from the conf."
        exit 1
    fi
done
rm -rf /tmp/pxe-server.conf

###############################################################
# Setup NTP Server (for clients no Internet)
###############################################################
echo -e " \033[32;5m Process NTP_SERVER=${NTP_SERVER} \033[0m"
if [ -n "${NTP_SERVER}" ]; then
    case "$NTP_SERVER" in
    "true" | "yes" | "Yes" | "y" | "Y")
        sudo apt install ntp -y
        sudo systemctl restart ntp
        ;;
    "false" | "no" | "No" | "n" | "N")
        sudo systemctl stop ntp
        sudo apt remove ntp -y
        ;;
    *)
        echo "Ignore unknown option argument ${NTP_SERVER}"
        ;;
    esac
fi

###############################################################
# Setup DHCP server (optional, if exists one)
###############################################################
echo -e " \033[32;5m Process DHCP_SERVER=${DHCP_SERVER} \033[0m"
if [ -n "${DHCP_SERVER}" ]; then
    case "$DHCP_SERVER" in
    "true" | "yes" | "Yes" | "y" | "Y")
        sudo apt install isc-dhcp-server -y
        pushd /etc/default
        sudo [ -f isc-dhcp-server.backup ] || sudo mv -v isc-dhcp-server isc-dhcp-server.backup
        sudo bash -c "cat <<EOF > /etc/default/isc-dhcp-server
INTERFACESv4=\"${dhcpInterface}\"
INTERFACESv6=\"\"
EOF"
        popd

        pushd /etc/dhcp
        sudo [ -f dhcpd.conf.backup ] || sudo mv -v dhcpd.conf dhcpd.conf.backup
        sudo bash -c "cat << EOF > /etc/dhcp/dhcpd.conf
default-lease-time 600;
max-lease-time 7200;
subnet ${dhcpNetAddress} netmask ${dhcpNetMask} {
  range ${dhcpStart} ${dhcpEnd};
  option routers ${dhcpRouter};
  option domain-name-servers ${dhcpDnsList};
  option domain-name \"${dhcpDomain}\";
}
EOF"
        popd
        sudo systemctl restart isc-dhcp-server
        sudo systemctl enable isc-dhcp-server
        ;;

    "false" | "no" | "No" | "n" | "N")
        sudo systemctl stop isc-dhcp-server
        sudo apt remove isc-dhcp-server -y
        ;;

    *)
        echo "Ignore unknown option argument ${DHCP_SERVER}"
        ;;
    esac
fi

###############################################################
# Setup dnsmasq DHCP proxy
###############################################################
echo -e " \033[32;5m Process DHCP_PROXY=${DHCP_PROXY} \033[0m"
pushd /etc

# Disable default name resolv
# sudo systemctl stop systemd-resolved
# sudo systemctl disable systemd-resolved
# sudo [ -f resolv.conf.backup ] || sudo mv resolv.conf resolv.conf.backup
# sudo bash -c "cat <<EOF > /etc/resolv.conf
# ###########################################
# ## Use the local dnsmase as the DNS
# ###########################################
# # setup name servers for dnsmasq installation.
# # will be alternate to local IP after
# nameserver 1.1.1.1
# nameserver 8.8.8.8
# EOF"

# Install dnsmasq to support DHCP_PROXY & DNS
sudo apt install dnsmasq -y
sudo [ -f dnsmasq.conf.backup ] || sudo mv -v dnsmasq.conf dnsmasq.conf.backup
sudo bash -c "cat <<EOF > /etc/dnsmasq.conf
###########################################
## Interface Binding
###########################################
interface=${dhcpInterface}
bind-interfaces

###########################################
## DNS Config Section
###########################################
# Disable the DNS server if port=0, default UDP-53
# port=0
# log-queries
# listen-address=::1,127.0.0.1,$dhcpNextServer
# domain-needed
# bogus-priv
# expand-hosts
# no-resolv
# local=/$dhcpDomain/
# domain=$dhcpDomain
# server=$dhcpRouter

# # enable DNS Cache and cache-size in record
# cache-size=1000

###########################################
## TFTP Config Section
###########################################
enable-tftp
tftp-root=${pxeRoot}
tftp-no-fail # prevent failed while tftp-root not accessible

###########################################
## DHCP Config Section
###########################################
# Enable DHCP transaction log.
log-dhcp

# # Run as DHCP proxy
# dhcp-range=${dhcpNetAddress},proxy,${dhcpNetMask}

# Run as DHCP server
domain=${dhcpDomain}
dhcp-range=${dhcpStart},${dhcpEnd},24h
# # assign static ip for certain client
# dhcp-host=AB:CD:EF:11:22:33,192.168.1.10,24h
# dhcp-host=computername,192.168.1.10,24h
dhcp-option=option:router,${dhcpRouter}
dhcp-option=option:dns-server,${dhcpDnsList}
dhcp-authoritative

###########################################
## PXEboot Options Config
###########################################
# Disable re-use of the DHCP servername and filename fields as extra
# option space. That's to avoid confusing some old or broken DHCP clients.
dhcp-no-override

# inspect the vendor class string and match the text to set the tag
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009

# Set the boot file name based on the matching tag from the vendor class (above)
# The boot filename, Server name, Server Ip Address
dhcp-boot=net:UEFI32,ipxe-bin/i386-efi/ipxe.efi,,$dhcpNextServer
dhcp-boot=net:UEFI,ipxe-bin/ipxe.efi,,$dhcpNextServer
dhcp-boot=net:UEFI64,ipxe-bin/ipxe.efi,,$dhcpNextServer

# If no matche exists, fallback to default boot file.
dhcp-boot=ipxe-bin/undionly.kpxe,,$dhcpNextServer

# pxe-prompt before the menu load
pxe-prompt=\"PXE booting in\", 3 # wait 3 seconds

# The known types are x86PC, PC98, IA64_EFI, Alpha, Arc_x86,
# Intel_Lean_Client, IA32_EFI, BC_EFI, Xscale_EFI and X86-64_EFI
# This option is first and will be the default if there is no input from the user.
pxe-service=X86PC,\"Boot from network\",ipxe-bin/undionly.kpxe
pxe-service=X86-64_EFI,\"Boot from network\",ipxe-bin/ipxe.efi
pxe-service=BC_EFI,\"Boot from network\",ipxe-bin/i386-efi/ipxe.efi

EOF"

# sudo bash -c "cat <<EOF > /etc/resolv.conf
# ###########################################
# ## Use the local dnsmase as the DNS
# ###########################################
# nameserver ::1
# nameserver 127.0.0.1
# options trust-ad
# EOF"

popd

pushd /etc/default
# Disable dnsmasq against interface "lo" to prevent conflicts with systemd-resolvd
sudo [ -f dnsmasq.backup ] || sudo cp dnsmasq dnsmasq.backup
sudo sed -i '/DNSMASQ_EXCEPT/s/^#//g' dnsmasq
# sudo sed -i '/DNSMASQ_EXCEPT/s/^/#/g' dnsmasq
popd

sudo systemctl restart dnsmasq
sudo systemctl enable dnsmasq
