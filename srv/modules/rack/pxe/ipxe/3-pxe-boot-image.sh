#!/bin/bash

###############################################################
# uncomment next line for debugging (logging)
###############################################################
# exec 1> >(tee /tmp/pxe-boot-image.log) 2>&1

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
	echo "r     Remove all previously loaded os-image and clear the boot menu."
	echo "i     Specify iso wildcard to load/update. Default to process all iso files."
	echo
	echo "Usage: "
	echo "     ./pxe-os-preparation.sh [<-option> [<Value>] ... ] "
	echo
}
OPTSTRING=":i:rh"
while getopts ${OPTSTRING} opt; do
	case ${opt} in
	h) # Display Help
		help
		exit
		;;
	r) # Remove all loaed os-image
		REMOVE_ALL="Y"
		;;
	i) # Specify an iso file
		ISO_SEARCH="${OPTARG}"
		;;
	:)
		echo "Option -${OPTARG} requires an argument of iso file name."
		exit 1
		;;
	?)
		echo "Invalid option: -${OPTARG}."
		exit 1
		;;
	esac
done

[ -z "${REMOVE_ALL}" ] && REMOVE_ALL="No"
[ -z "${ISO_SEARCH}" ] && ISO_SEARCH="*.iso"

echo "Command-line arguments:"
echo "REMOVE_ALL(-r): ${REMOVE_ALL}"
echo "ISO_SEARCH(-i): ${ISO_SEARCH}"
echo ""

###############################################################
# Parse Server Configuration
###############################################################
_SCRIPT_DIR="${0%/*}"
if [[ ! -d "$_SCRIPT_DIR" ]]; then _SCRIPT_DIR="$PWD"; fi

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

##############################################################
# Clear the previously loaded ISOs (if full refresh required)
##############################################################
case "${REMOVE_ALL}" in
"Y" | "Yes" | "y" | "yes")
	sudo rm -rf ${pxeRoot}/os-image/*
	# sudo rm -rf ${pxeRoot}/os-menu/*
	# sudo rm -rf ${pxeAuto}/*
	sudo rm -rf ${pxeRoot}/os-install/*
	;;
esac

##############################################################
# Loop through the ISO searched list
##############################################################
isoFolder="${pxeRoot}/os-store"
IFS=',;' read -r -a WILDCARD_LIST <<<"$ISO_SEARCH"
for ISO_WILDCARD in ${WILDCARD_LIST[@]}; do
	for item in ${isoFolder}/${ISO_WILDCARD}; do
		# [ -f "$i" ] || continue;

		# os store mapping variables
		iso_folder="os-store"
		iso_name="${item##*/}"
		os_name="${iso_name%.*}"
		os_iso="os-store/${os_name}.iso"
		os_root="os-image/${os_name}"
		os_boot="os-image/${os_name}"
		nfs_root="${pxeRoot}/os-image/${os_name}"

		sudo rm -rf ${nfs_root}

		cat <<EOF

#########################################################################################################
# Processing: ${iso_name}
#--------------------------------------------------------------------------------------------------------
EOF
		os_iso_path="${pxeRoot}/os-store/${os_name}.iso"
		os_zip_path="${pxeRoot}/os-store/${os_name}.zip"
		os_root_path="${pxeRoot}/os-image/${os_name}"
		os_boot_path="${pxeRoot}/os-image/${os_name}"
		os_conf_side="${pxeRoot}/os-install/${os_name}"
		os_conf_path="${pxeAuto}/${os_name}"

		# remove existing contents (todo: rewrite for those deleted isos)
		[ -d "${os_root_path}" ] && sudo rm -rf ${os_root_path}
		[ -d "${os_boot_path}" ] && sudo rm -rf ${os_boot_path}
		[ -d "${os_conf_side}" ] && sudo rm -rf ${os_conf_side}
		[ -d "${os_conf_path}" ] && sudo rm -rf ${os_conf_path}

		# if a specific plugin exists, use it & skip the module matching
		_PLUGIN="$_SCRIPT_DIR/plugin/$os_name.plg"
		if [ -f $_PLUGIN ]; then
			. "$_PLUGIN"
			parse_release_info $os_name $os_iso
			populate_os_image $os_name $os_iso_path $os_root_path $os_boot_path $os_conf_path $os_zip_path
		else
			# if a specific module exists, use it
			moduleName=$(echo $os_name | sed 's/[-.\_]/\n/g' | head -n 1 | sed -e 's/\(.*\)/\L\1/')
			_MODULE="$_SCRIPT_DIR/module/$moduleName.mdu"
			if [ -f $_MODULE ]; then
				. "$_MODULE"
				parse_release_info $os_name $os_iso
				populate_os_image $os_name $os_iso_path $os_root_path $os_boot_path $os_conf_path $os_zip_path
			else
				# neither plugin nor module exists, report info & skip
				brand=$moduleName
				isoVersion=""
				isoEdition=""
				isoRelease=""
				isoArch=""
				isoPublish="iso"
				echo -n "unknown $os_iso with module name \"${moduleName}\", skip the processing ..."
				echo ""
			fi
		fi

		cat <<EOF
#--------------------------------------------------------------------------------------------------------
# Processed OS Info:
#--------------------------------------------------------------------------------------------------------
# isoOsBrand: ${brand}
# isoVersion: ${isoVersion}
# isoEdition: ${isoEdition}
# isoRelease: ${isoRelease}
# isoCpuArch: ${isoArch}
# isoPublish: ${isoPublish}
EOF

	done
done
