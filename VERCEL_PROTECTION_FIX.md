# 🔓 Vercel Deployment Protection - Как отключить

## Проблема
Vercel требует аутентификацию для доступа к деплоям (Vercel Authentication).

## Решение 1: Отключить в Dashboard (рекомендуется)

1. Откройте: https://vercel.com/zenxjrfs-projects/poehali/settings/deployment-protection
2. Найдите **"Vercel Authentication"**
3. Переключите в **OFF** для Production
4. Сохраните изменения

## Решение 2: Использовать Production Bypass Token

1. Откройте: https://vercel.com/zenxjrfs-projects/poehali/settings/deployment-protection
2. Скопируйте **Production Bypass Token**
3. Используйте в URL:
   ```
   https://poehali-kip6-d8hbp50kk-zenxjrfs-projects.vercel.app/health?x-vercel-protection-bypass=YOUR_TOKEN
   ```

## Решение 3: Использовать vercel curl с токеном

```bash
vercel curl /health --deployment poehali-kip6-d8hbp50kk-zenxjrfs-projects.vercel.app --protection-bypass YOUR_TOKEN
```

## Проверка

После отключения защиты проверьте:

```bash
curl https://poehali-kip6-d8hbp50kk-zenxjrfs-projects.vercel.app/health
```

Ожидаемый ответ:
```json
{"status":"healthy","timestamp":1234567890}
```

## Telegram Webhook

После успешного деплоя установите webhook:

```bash
curl -X POST "https://api.telegram.org/bot8606991774:AAGoHuOW3OCpN9n03U0gxKv5eDB27br60OQ/setWebhook?url=https://YOUR_VERCEL_URL/webhook/telegram"
```

## Текущие деплои

| Статус | URL |
|--------|-----|
| ✅ Ready | https://poehali-kip6-d8hbp50kk-zenxjrfs-projects.vercel.app |
| ✅ Ready | https://poehali-1-8nmrhd7w3-zenxjrfs-projects.vercel.app |
| ✅ Ready | https://poehali-gpv6-f1xlk1gay-zenxjrfs-projects.vercel.app |
| ✅ Ready | https://poehali-mahw-c1r3cey18-zenxjrfs-projects.vercel.app |

---

**Дата:** 3 марта 2026  
**Статус:** ⏳ Ожидает отключения защиты
