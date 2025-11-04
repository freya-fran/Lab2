# Dockerfile — оптимизированная сборка для статического сайта
FROM nginx:stable-alpine

# Мета-информация
LABEL maintainer="freya"
LABEL description="Static site about Windows history"
LABEL version="1.1"

# Устанавливаем временную зону
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Europe/Moscow /etc/localtime && \
    echo "Europe/Moscow" > /etc/timezone && \
    apk del tzdata

# Устанавливаем curl для healthcheck (в Alpine нет wget)
RUN apk add --no-cache curl

# Удаляем дефолтный конфиг nginx
RUN rm -rf /etc/nginx/conf.d/*

# Копируем наш оптимизированный конфиг
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем директорию для сайта
RUN mkdir -p /usr/share/nginx/html

# Копируем статические файлы сайта
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/

# Устанавливаем правильные права
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Создаем директорию для логов и устанавливаем права
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Переключаемся на пользователя root
USER root

# Открываем порт
EXPOSE 80

# Health check для мониторинга (используем curl вместо wget)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
