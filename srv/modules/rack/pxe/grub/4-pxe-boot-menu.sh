#!/bin/bash

###############################################################
# uncomment next line for debugging (logging)
###############################################################
# exec 1> >(tee /tmp/pxe-boot-menu.log) 2>&1

###############################################################
# Include Server Configuration
###############################################################
_SCRIPT_DIR="${0%/*}"
if [[ ! -d "$_SCRIPT_DIR" ]]; then _SCRIPT_DIR="$PWD"; fi

if [[ -n "$1" && "$1" != "undefined" ]]; then
	defaultBoot=$1

else
	defaultBoot="exit"
fi

# . "$_SCRIPT_DIR/config/pxe-server.conf"

echo "Server configuration:"
_REQUISITES=(
	#"dhcpInterface"
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
	"pxeAuto"
	#"DHCP_SERVER"
	#"NTP_SERVE"
	#"ISO_UTILS"
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

#####################################################################
# Initialize temp Vars
#####################################################################
menuActions=""
# menuList="menu Select an OS to boot"$'\n'
read -r -d '' menuList <<EOF
set default=0
set timeout=60
menuentry 'EFI Firmware System Setup' $menuentry_id_option 'uefi-firmware' { fwsetup }
menuentry 'Reboot' { reboot }
menuentry 'Shutdown' { halt }
EOF

#####################################################################
# Populate Menu list and Menu action script segments
#####################################################################
menuBreak="menuentry '-----------------------------------------' {true}"
osImages="${imgRoot}/os-images"
for item in ${osImages}/*; do
	[ ! -d "$item" ] || [ ! -z "$(ls -A "$item")" ] || continue

	# os store mapping variables
	iso_folder="os-isos"
	iso_name="${item##*/}.iso"
	os_name="${item##*/}"
	os_iso="os-isos/${os_name}.iso"
	os_root="os-images/${os_name}"
	os_boot="os-images/${os_name}"
	nfs_root="${imgRoot}/os-images/${os_name}"

	echo $'\n'${imgRoot}/os-isos/${iso_name}
	echo ${item}

	# populate menu items
	# menuBreak="menuentry '---------------- $os_name ---------------'{true}"
	menuBreak="menuentry '-----------------------------------------' {true}"

	# if a specific plugin exists, use it
	_PLUGIN="$_SCRIPT_DIR/plugin/$os_name.plg"
	if [ -f $_PLUGIN ]; then
		. "$_PLUGIN"
		menuAction=":$os_name"$'\n'$(populate_boot_script ${os_name} ${os_iso} ${os_root} ${os_boot})
	else
		# if a specific module exists, use it
		moduleName=$(echo ${os_name} | sed 's/[-.\_]/\n/g' | head -n 1 | sed -e 's/\(.*\)/\L\1/')
		_MODULE="$_SCRIPT_DIR/module/$moduleName.mdu"
		if [ -f $_MODULE ]; then
			. "$_MODULE"
			menuAction="${menuBreak}"$'\n'$(populate_boot_script ${os_name} ${os_iso} ${os_root} ${os_boot})
		else
			# neither module nor plugin exists, empty action
			echo -n "unknown ${os_name}, skip the processing ..."
			moduleName=""
		fi
	fi
	menuActions="${menuActions}"$'\n'"${menuAction}"$'\n'
	menuBreak=""
done
# menuActions="${menuActions}"$'\n:exit\nexit'

# echo "${menuList}"
# echo "${menuActions}"

#####################################################################
# Populate boot menu script
#####################################################################
read -r -d '' bootScript <<EOF
#!grub

set server_ip  ${dhcpNextServer}
set root_path  ${pxeRoot}

EOF

bootScript="${bootScript}"$'\n\n'"${menuList}"
bootScript="${bootScript}"$'\n'"${menuActions}"

#####################################################################
# Deploy the config to serve the boot menu
#####################################################################
echo ""
mkdir -pv /tmp/grub-script
echo "$bootScript" >/tmp/grub-script/main.grub
# cat /tmp/grub-script/main.grub
sudo cp /tmp/grub-script/main.grub ${pxeRoot}/grub.cfg
rm -r /tmp/grub-script
