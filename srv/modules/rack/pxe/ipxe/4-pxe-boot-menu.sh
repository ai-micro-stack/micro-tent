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
	#"NTP_SERVER"
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
menuActions=$'\n'"# -------------------- auto populated munu scripts begin --------------------------------"$'\n'
# menuList="menu Select an OS to boot"$'\n'
read -r -d '' menuList <<EOF
:start
menu Select an OS to boot
item --gap -- ===========================================================================
item	exit	Exit: continue BIOS boot
item	reboot	Reboot: reboot this computer
item	shutdown	Shutdown: if ipxe POWEROFF_CMD enabled
item --gap -- ----------------- iPXE Boot Menu ------------------------------------------
EOF

#####################################################################
# Populate Menu list and Menu action script segments
#####################################################################
osImages="${pxeRoot}/os-image"
for item in ${osImages}/*; do
	[ ! -d "$item" ] || [ ! -z "$(ls -A "$item")" ] || continue

	# os store mapping variables
	iso_folder="os-store"
	iso_name="${item##*/}.iso"
	os_name="${item##*/}"
	os_iso="os-store/${os_name}.iso"
	os_root="os-image/${os_name}"
	os_boot="os-image/${os_name}"
	os_conf="${pxeAuto##*/}/${os_name}"
	nfs_root="${pxeRoot}/os-image/${os_name}"

	echo $'\n'${pxeRoot}/os-store/${iso_name}
	echo ${item}

	# populate menu items
	menuItem="item"$'\t'"$os_name"$'\t'"$os_name"
	menuList="${menuList}"$'\n'"${menuItem}"

	# if a specific plugin exists, use it
	_PLUGIN="$_SCRIPT_DIR/plugin/$os_name.plg"
	if [ -f $_PLUGIN ]; then
		. "$_PLUGIN"
		menuAction=":$os_name"$'\n'$(populate_boot_script ${os_name} ${os_iso} ${os_root} ${os_boot} ${os_conf})
	else
		# if a specific module exists, use it
		moduleName=$(echo ${os_name} | sed 's/[-.\_]/\n/g' | head -n 1 | sed -e 's/\(.*\)/\L\1/')
		_MODULE="$_SCRIPT_DIR/module/$moduleName.mdu"
		if [ -f $_MODULE ]; then
			. "$_MODULE"
			menuAction=":$os_name"$'\n'$(populate_boot_script ${os_name} ${os_iso} ${os_root} ${os_boot} ${os_conf})
		else
			# neither module nor plugin exists, empty action
			echo -n "unknown ${os_name}, skip the processing ..."
			moduleName=""
		fi
	fi
	menuActions="${menuActions}"$'\n'"${menuAction} || goto failed"$'\n'"goto start"$'\n'
done
menuList="${menuList}"$'\nitem --gap -- ===========================================================================\n'
menuList="${menuList}"$'\n'"choose --default ${defaultBoot} --timeout 60000 option && goto \${option}"
read -r -d '' actionWrapp <<EOF
# -------------------- auto populated munu scripts end ----------------------------------

:failed
prompt Booting failed. Press Ctl-B to enter the iPXE shell
goto shell

:exit
exit

:reboot
reboot

:shutdown
poweroff
EOF
menuActions="${menuActions}"$'\n'"${actionWrapp}"
# echo "${menuList}"
# echo "${menuActions}"

#####################################################################
# Populate boot menu script
#####################################################################
read -r -d '' bootScript <<EOF
#!ipxe

set server_ip  ${dhcpNextServer}
set root_path  ${pxeRoot}

EOF

bootScript="${bootScript}"$'\n\n'"${menuList}"
bootScript="${bootScript}"$'\n'"${menuActions}"

#####################################################################
# Deploy the config to serve the boot menu
#####################################################################
echo ""
mkdir -pv /tmp/ipxe-script
echo "$bootScript" >/tmp/ipxe-script/main.ipxe
# cat /tmp/ipxe-script/main.ipxe
sudo cp /tmp/ipxe-script/main.ipxe ${pxeRoot}/os-menu/
# rm -r /tmp/ipxe-script
