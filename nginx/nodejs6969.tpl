server {
        listen %ip%:%proxy_port%;
        server_name %domain_idn% %alias_idn%;
        error_log /var/log/%web_system%/domains/%domain%.error.log error;

        location / {
                proxy_pass http://127.0.0.1:6969;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }

        location /error/ {
                 alias %home%/%user%/web/%domain%/document_errors/;
        }

        location @fallback {
                 proxy_pass http://127.0.0.1:6969:/$1;
        }

        location ~ /\.ht {return 404;}
        location ~ /\.svn/ {return 404;}
        location ~ /\.git/ {return 404;}
        location ~ /\.hg/ {return 404;}
        location ~ /\.bzr/ {return 404;}
        include %home%/%user%/conf/web/nginx.%domain%.conf*;
}