# RackFlow — static site served by nginx
# Build from the PROJECT ROOT (docker/docker-compose.yml sets that as the context):
#   docker build -f docker/Dockerfile .
FROM nginx:1.27-alpine

COPY index.html users.html admin.html dashboard.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
