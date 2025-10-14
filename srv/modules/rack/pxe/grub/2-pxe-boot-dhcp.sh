#!/bin/bash

###############################################################
# uncomment next line for debugging (logging)
###############################################################
# exec 1> >(tee /tmp/pxe-boot-dhcp.log) 2>&1

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
    "NTP_SERVE"
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
if [ -n "${NTP_SERVER}" ]; then
    case "$NTP_SERVER" in
    "yes" | "Yes" | "y" | "Y")
        sudo apt install ntp -y
        sudo systemctl restart ntp
        ;;
    "no" | "No" | "n" | "N")
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
sudo dnf install dhcp-server -y

# pushd /etc/dhcp
sudo [ -f /etc/dhcp/dhcpd.conf.backup ] || sudo mv -v /etc/dhcp/dhcpd.conf /etc/dhcp/dhcpd.conf.backup
sudo bash -c "cat <<EOF > /etc/dhcp/dhcpd.conf
ddns-update-style interim;

allow booting;
allow bootp;
authoritative;
log-facility local6;

ignore client-updates;
set vendorclass = option vendor-class-identifier;

## Allowing EFI Clients
option pxe-system-type code 93 = unsigned integer 16;
option rfc3442-classless-static-routes code 121 = array of integer 8;
option ms-classless-static-routes code 249 = array of integer 8;

option space pxelinux;
option pxelinux.magic code 208 = string;
option pxelinux.configfile code 209 = text;
option pxelinux.pathprefix code 210 = text;
option pxelinux.reboottime code 211 = unsigned integer 32;
option architecture-type code 93 = unsigned integer 16;

option pxelinux.mtftp-ip    code 1 = ip-address;
option pxelinux.mtftp-cport code 2 = unsigned integer 16;
option pxelinux.mtftp-sport code 3 = unsigned integer 16;
option pxelinux.mtftp-tmout code 4 = unsigned integer 8;
option pxelinux.mtftp-delay code 5 = unsigned integer 8;

subnet ${dhcpNetAddress} netmask ${dhcpNetMask} {
	interface					${dhcpInterface};
	option routers				${dhcpRouter};
	option domain-name-servers	${dhcpDnsList};
	option domain-name			\"${dhcpDomain}\";
	option subnet-mask			${dhcpNetMask};
	range						${dhcpStart} ${dhcpEnd};
	## EFI Client Catch
	class \"pxeclients\" {
		match if substring (option vendor-class-identifier, 0, 9) = \"PXEClient\";
		if option pxe-system-type = 00:07 {
			filename \"boot/grub2/x86_64-efi/core.efi\";
		} else if option pxe-system-type = 00:08 {
			filename \"boot/grub2/x86_64-efi/core.efi\";
		} else if option pxe-system-type = 00:09 {
			filename \"boot/grub2/x86_64-efi/core.efi\";
		} else if option pxe-system-type = 00:0a {
			filename \"boot/grub2/armv7a-efi/core.efi\";
		} else if option pxe-system-type = 00:0b {
			filename \"boot/grub2/aarch64-efi/core.efi\";
		} else {
			filename \"boot/grub2/i386-pc/core.0\";
		}
	}
	default-lease-time	21600;
	max-lease-time		43200;
	next-server			${dhcpNextServer};
}
EOF"
# popd
sudo systemctl restart dhcpd
sudo systemctl enable dhcpd

###############################################################
# Setup dnsmasq DHCP proxy
###############################################################
