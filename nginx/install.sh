#!/bin/bash

coloroff='\033[0m'
magenta='\033[0;35m'
red='\033[0;31m' 
green='\033[0;32m' 
blue='\033[0;34m'
cyan='\033[0;36m'
white='\033[0;37m'
yellow='\033[0;33m' 

sleep 1
echo -e $magenta " _____ ______   _______   ___       ___  __    ________  ________   _______   ________     " $coloroff
echo -e $magenta "|\   _ \  _   \|\  ___ \ |\  \     |\  \|\  \ |\   __  \|\   ___  \|\  ___ \ |\   __  \    " $coloroff
echo -e $magenta "\ \ \ \ \_\ \  \ \   __/|\ \  \    \ \  \/  /|\ \  \|\  \ \ \ \ \  \ \   __/|\ \  \|\  \   " $coloroff
echo -e $magenta " \ \ \ \|__| \  \ \  \_|/_\ \  \    \ \   ___  \ \   __  \ \ \ \ \  \ \  \_|/_\ \   __  \  " $coloroff
echo -e $magenta "  \ \  \    \ \  \ \  \_|\ \ \  \____\ \ \ \ \  \ \  \ \  \ \ \ \ \  \ \  \_|\ \ \  \ \  \ " $coloroff
echo -e $magenta "   \ \__\    \ \__\ \_______\ \_______\ \_\ \ \__\ \__\ \__\ \_\ \ \__\ \_______\ \__\ \__\ " $coloroff
echo -e $magenta "    \|__|     \|__|\|_______|\|_______|\|__| \|__|\|__|\|__|\|__| \|__|\|_______|\|__|\|__|" $coloroff

echo -e $cyan "melkanea" $magenta "bash" $white "hestiacp" $magenta "nginx" $cyan "portopener" $coloroff

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <user> <port> <location>"
    exit 1
fi
# Assign arguments to variables
port=$2
location=$3
user=$1

ip=$(hostname -I | awk '{print $1}')
if [ $? -ne 0 ]; then
    echo -e "${red}Failed to get IP address${coloroff}"
    exit 1
fi

home=/home

domain=bambisleep.chat

nodeapp=test
docroot=$home/$user/web/$domain/$nodeapp

echo -e $magenta "user: "$user $coloroff
echo -e $red "domain: "$domain $coloroff
echo -e $green "ip: "$ip $coloroff
echo -e $blue "home: "$home $coloroff
echo -e $cyan "userapp: "$userapp $coloroff
echo -e $yellow "docroot: "$docroot $coloroff

sleep 2
# Predefined locations
source_file="./nginx.conf_melkanea"

# Check if the template file exists
if [ ! -f "$source_file" ]; then
    echo "Error: Template file '$source_file' not found."
    exit 1
fi

# Define the file paths for placeholder replace
FILE_PATH="$home/$user/conf/web/$domain/nginx.conf_$port"
FILE_PATH_SSL="$home/$user/conf/web/$domain/nginx.ssl.conf_$port"

cp "$source_file" "$home/$user/conf/web/$domain/nginx.conf_$port"
cp "$source_file" "$home/$user/conf/web/$domain/nginx.ssl.conf_$port"

# Replace placeholders
sed -i 's/%port%/'$port'/g' "$FILE_PATH"
sed -i 's/%ip%/'$ip'/g' "$FILE_PATH"
sed -i 's/%location%/'$location'/g' "$FILE_PATH"

sed -i 's/%port%/'$port'/g' "$FILE_PATH_SSL"
sed -i 's/%ip%/'$ip'/g' "$FILE_PATH_SSL"
sed -i 's/%location%/'$location'/g' "$FILE_PATH_SSL"

echo "Files '$FILE_PATH' and '$FILE_PATH_SSL' have been created based on the template and placeholders have been replaced."

