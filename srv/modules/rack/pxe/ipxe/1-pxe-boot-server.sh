#!/bin/bash

###############################################################
# uncomment next line for debugging (logging)
###############################################################
exec 1> >(tee /tmp/pxe-boot-server.log) 2>&1

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
[ -z "${OPT_UTILS}" ] && OPT_UTILS="Yes"

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
    #"dhcpNetAddress"
    #"dhcpNetMask"
    #"dhcpStart"
    #"dhcpEnd"
    #"dhcpRouter"
    #"dhcpDnsList"
    #"dhcpDomain"
    "dhcpNextServer"
    "pxeRoot"
    #"imgRoot"
    #"pxeAuto"
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
# Create iPXE folder structure
###############################################################
# sudo mkdir -pv ${pxeRoot}
sudo mkdir -pv ${pxeRoot}/ipxe-bin
sudo mkdir -pv ${pxeRoot}/os-menu
sudo mkdir -pv ${pxeRoot}/ipxe-bin/i386-efi
sudo mkdir -pv ${pxeRoot}/os-image
sudo mkdir -pv ${pxeRoot}/os-store
sudo mkdir -pv ${pxeRoot}/os-install

# sudo chmod -R 777 ${pxeRoot}
# sudo chmod -R 777 ${pxeRoot}/ipxe-bin
sudo chmod -R 777 ${pxeRoot}/os-menu
sudo chmod -R 777 ${pxeRoot}/ipxe-bin/i386-efi
sudo chmod -R 777 ${pxeRoot}/os-image
sudo chmod -R 777 ${pxeRoot}/os-store
sudo chmod -R 777 ${pxeRoot}/os-install

###############################################################
# Setup NFS exports (serve OS by nfs)
###############################################################
echo -e " \033[32;5m Process NFS_SERVER=nfs-kernel-server \033[0m"
sudo apt-get install nfs-kernel-server -y
pushd /etc
sudo [ -f exports.backup ] || sudo mv -v exports exports.backup
sudo bash -c "cat << EOF > /etc/exports
/pxeboot           *(ro,sync,no_wdelay,insecure_locks,no_root_squash,insecure,no_subtree_check)
EOF"
popd
sudo exportfs -av

###############################################################
# Setup TFTP server (serve OS by tftp)
###############################################################
# echo -e " \033[32;5m Process TFTP_SERVER=tftp-hpa \033[0m"
# sudo apt install tftpd-hpa -y
# # sudo apt install tftp -y
# pushd /etc/default
# sudo [ -f tftpd-hpa.backup ] || sudo mv -v tftpd-hpa tftpd-hpa.backup
# sudo bash -c "cat <<EOF > /etc/default/tftpd-hpa
# TFTP_USERNAME=\"tftp\"
# TFTP_DIRECTORY=\"${pxeRoot}\"
# TFTP_ADDRESS=\":69\"
# TFTP_OPTIONS=\"--secure\"
# EOF"
# popd
# sudo systemctl restart tftpd-hpa
# sudo systemctl enable tftpd-hpa
# # sudo rm -rf /srv/tftp/
# sudo rm -rf /srv/

###############################################################
# Setup nGinx server (serve OS by http)
###############################################################
echo -e " \033[32;5m Process HTTP_SERVER=nGinx \033[0m"
sudo apt install nginx -y
pushd /etc/nginx
sudo [ -f nginx.conf.backup ] || sudo mv -v nginx.conf nginx.conf.backup
sudo bash -c "cat << EOF > /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 768;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    gzip on;
    access_log /var/log/nginx/access.log;
    keepalive_timeout 3000;
    server {
        listen 80;
        server_name localhost;
        root ${pxeRoot}; #/var/www;
        autoindex on;

        location = / {
        }
        
        location ~ \"/upload/([\s\S]*)$\" {
            dav_methods             PUT DELETE MKCOL COPY MOVE;
            client_body_temp_path   /tmp/upload_tmp;
            alias                   ${pxeRoot}/os-store/$1;
            create_full_put_path    on;
            dav_access              group:rw  all:r;
            client_max_body_size    10000M;
			client_body_buffer_size 10000M;
        }
    }
}
EOF"
sudo bash -c "cat << EOF > ${pxeRoot}/index.html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to http boot service!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to http boot service!</h1>
<p>This web server serves the pxe boot, no other web contents available ...</p>
</body>
</html>
EOF"
popd

# sudo chown -R www-data ${pxeRoot}
# sudo chown -R www-data ${pxeRoot}/ipxe-bin
sudo chown -R www-data ${pxeRoot}/os-image
sudo chown -R www-data ${pxeRoot}/os-store
sudo chown -R www-data ${pxeRoot}/os-menu

sudo systemctl restart nginx
sudo systemctl enable nginx
# sudo rm -rf /var/www/html/
sudo rm -rf /var/www/

###############################################################
# Setup iPXE chainload
# 1) ip -4 a show enp6s19 | grep inet
###############################################################
echo -e " \033[32;5m Process iPXE \033[0m"
sudo rm -rf /tmp/ipxe-setup
sudo apt install make gcc binutils perl mtools mkisofs syslinux liblzma-dev isolinux git -y
mkdir -pv /tmp/ipxe-setup
pushd /tmp/ipxe-setup
git clone https://github.com/ipxe/ipxe.git
cd /tmp/ipxe-setup/ipxe/src
touch embed.ipxe
bash -c "cat << EOF > /tmp/ipxe-setup/ipxe/src/embed.ipxe
#!ipxe

dhcp
chain tftp://${dhcpNextServer}/os-menu/main.ipxe
EOF"
make bin/ipxe.pxe bin/undionly.kpxe bin/undionly.kkpxe bin/undionly.kkkpxe bin-x86_64-efi/ipxe.efi EMBED=embed.ipxe
sudo cp -v bin/ipxe.pxe ${pxeRoot}/ipxe-bin
sudo cp -v bin/undionly.kpxe ${pxeRoot}/ipxe-bin
sudo cp -v bin/undionly.kkpxe ${pxeRoot}/ipxe-bin
sudo cp -v bin/undionly.kkkpxe ${pxeRoot}/ipxe-bin
sudo cp -v bin-x86_64-efi/ipxe.efi ${pxeRoot}/ipxe-bin
popd
#rm -rf /tmp/ipxe-setup
sudo chmod -R 777 ${pxeRoot}/ipxe-bin

###############################################################
# Create iPXE main.ipxe (optional, for initial test only)
###############################################################
echo -e " \033[32;5m Process PXE_MENU \033[0m"
sudo touch ${pxeRoot}/os-menu/main.ipxe
sudo chmod -R 777 ${pxeRoot}/os-menu/main.ipxe
sudo bash -c "cat <<EOF > ${pxeRoot}/os-menu/main.ipxe
#!ipxe

:start
menu Select an option to check the iPXE works (use up/down & enter)
item --gap -- ===========================================================================
item	exit	Exit: continue BIOS boot
item	reboot	Reboot: reboot this computer
item	shutdown	Shutdown: if ipxe POWEROFF_CMD enabled
item --gap -- ----------------- iPXE Boot Menu ------------------------------------------
item	menu-item-1	Menu item 1
item	menu-item-2	Menu item 2
item	menu-item-3	Menu item 3
item --gap -- ===========================================================================

choose target && goto \${target}

# -------------------- auto populated munu scripts begin --------------------------

:menu-item-1
echo \${target} selected:
prompt Press any key to continue ...
goto start

:menu-item-2
echo \${target} selected:
prompt Press any key to continue ...
goto start

:menu-item-3
echo \${target} selected:
prompt Press any key to continue ...
goto start

# -------------------- auto populated munu scripts end ----------------------------

:exit
exit

:reboot
reboot

:shutdown
poweroff

EOF"

###############################################################
# Appendix: Install utils for OS image processing
###############################################################
echo -e " \033[32;5m Process OPT_UTILS=${OPT_UTILS} \033[0m"
if [ -n "${OPT_UTILS}" ]; then
    case "$OPT_UTILS" in
    "true" | "yes" | "Yes" | "y" | "Y")
        sudo apt install xorriso 7zip zstd cpio genisoimage -y
        ;;
    "false" | "no" | "No" | "n" | "N")
        sudo apt remove xorriso 7zip zstd cpio genisoimage -y
        ;;
    *)
        echo "Ignore unknown option argument ${OPT_UTILS}"
        ;;
    esac
fi
