# 🚀 Call Lana - Netlify Deployment Guide

## Quick Deploy (2 Minuten)

### Option 1: Drag & Drop (einfachste Methode)

1. **Gehe zu:** https://app.netlify.com/drop
2. **Ziehe alle Dateien** aus diesem Ordner ins Fenster
3. **Warte ~30 Sekunden**
4. **Fertig!** Deine URL: `https://deine-site.netlify.app`

---

### Option 2: Netlify CLI

```bash
# 1. CLI installieren (einmalig)
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Im Projektordner deployen
cd call-lana-complete
netlify deploy --prod

# Fertig!
```

---

## 🌐 Custom Domain einrichten

### Schritt 1: Domain bei Netlify hinzufügen
1. Netlify Dashboard → Domain Settings
2. Add Custom Domain
3. Eingabe: `www.call-lana.de`

### Schritt 2: DNS Records setzen

Bei deinem Domain-Provider (z.B. Strato, 1&1, Namecheap):

```
# A Record
@ → 75.2.60.5

# CNAME
www → deine-site.netlify.app
```

### Schritt 3: SSL aktivieren
- Netlify aktiviert automatisch Let's Encrypt SSL
- Wartezeit: ~5 Minuten

---

## ⚙️ Environment Variables

Keine ENV Variables im Frontend nötig!

Alle Supabase Keys sind in `supabase-config.js` (public keys).

**Für Supabase Edge Functions:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📧 Email Setup

### 1. MX Records setzen
```
@ MX 10 mail.call-lana.de
```

### 2. SPF Record
```
@ TXT "v=spf1 include:_spf.google.com ~all"
```

### 3. DKIM aktivieren
Bei deinem Email-Provider (Google Workspace / Mailbox.org)

---

## 🔍 SEO Setup

### 1. Sitemap generieren
```bash
# Erstelle sitemap.xml
cat > sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.call-lana.de/</loc><priority>1.0</priority></url>
  <url><loc>https://www.call-lana.de/funktionen.html</loc></url>
  <url><loc>https://www.call-lana.de/branchen.html</loc></url>
  <url><loc>https://www.call-lana.de/preise.html</loc></url>
  <url><loc>https://www.call-lana.de/kontakt.html</loc></url>
</urlset>
EOF
```

### 2. robots.txt
```bash
cat > robots.txt << 'EOF'
User-agent: *
Allow: /
Sitemap: https://www.call-lana.de/sitemap.xml
EOF
```

### 3. Google Search Console
1. Gehe zu: https://search.google.com/search-console
2. Property hinzufügen: `https://www.call-lana.de`
3. Sitemap einreichen

---

## 📊 Analytics (optional)

### Plausible Analytics (DSGVO-konform)
```html
<!-- Vor </head> in allen HTML-Dateien -->
<script defer data-domain="call-lana.de" src="https://plausible.io/js/script.js"></script>
```

### Google Analytics 4
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## ✅ Post-Deploy Checklist

### Funktionalität:
- [ ] Alle Seiten laden
- [ ] Language Switcher funktioniert
- [ ] Login/Registrierung funktioniert
- [ ] Dashboard lädt
- [ ] Logout → Startseite
- [ ] Mobile responsive

### Performance:
- [ ] Lighthouse Score > 90
- [ ] Bilder optimiert
- [ ] SSL aktiv (HTTPS)

### SEO:
- [ ] Meta Tags korrekt
- [ ] Sitemap eingereicht
- [ ] robots.txt vorhanden
- [ ] Canonical URLs gesetzt

### Legal:
- [ ] Impressum korrekt
- [ ] Datenschutz aktuell
- [ ] Cookie Banner (falls nötig)

---

## 🔄 Updates deployen

### Datei geändert?
```bash
# Einfach neu deployen
netlify deploy --prod

# Netlify baut automatisch neu
```

### Rollback zu alter Version
```bash
# Netlify Dashboard → Deploys
# Klicke auf alte Version → Publish Deploy
```

---

## 🐛 Häufige Probleme

### Problem: 404 auf Unterseiten
**Lösung:** `_redirects` Datei erstellen
```bash
cat > _redirects << 'EOF'
/*    /index.html   200
EOF
```

### Problem: Form Submit funktioniert nicht
**Lösung:** Netlify Forms aktivieren
```html
<form name="contact" netlify>
  ...
</form>
```

### Problem: DNS dauert ewig
**Wartezeit:** 24-48 Stunden normal
**Check:** `nslookup www.call-lana.de`

---

## 📞 Netlify Support

**Dokumentation:** https://docs.netlify.com
**Community:** https://answers.netlify.com
**Status:** https://www.netlifystatus.com

---

**Viel Erfolg mit dem Launch!** 🚀
