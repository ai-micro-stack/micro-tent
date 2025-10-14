#!/bin/bash

# check script location
echo $0
_SCRIPT_DIR="${0%/*}"
echo $_SCRIPT_DIR

# server nic IPv4
ip a | grep $1 | grep 'inet' | cut -d" " -f6 | cut -d"/" -f1 | awk '{print $1}'
