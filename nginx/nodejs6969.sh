#!/bin/bash
user=brandynette
domain=bambisleep.chat
ip=$3
home=/home
docroot=$5

mkdir "$home/$user/web/$domain/js-chatai"
chown -R $user:$user "$home/$user/web/$domain/js-chatai"
rm "$home/$user/web/$domain/js-chatai/app.sock"
runuser -l $user -c "pm2 start $home/$user/web/$domain/js-chatai/server.js"
sleep 5
chmod 777 "$home/$user/web/$domain/js-chatai/app.sock"