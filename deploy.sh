#!/bin/bash

# Deployment Script für ICS-Generator-Web
# Optimierter Update-Prozess: Aktualisiert das Repo, ohne den Ordner zu löschen.
# Nutzung auf dem Server: ./deploy.sh

# Sofortiger Abbruch bei Fehlern
set -e

# Konfiguration
BRANCH="main"
REMOTE="origin"

echo "🚀 Starte Deployment..."

# 1. Prüfen ob wir in einem Git Repo sind
if [ ! -d ".git" ]; then
    echo "❌ Fehler: Dies ist kein Git-Repository!"
    echo "Bitte klonen Sie das Repo zuerst einmalig:"
    echo "git clone https://github.com/Schello805/ICS-Generator-Web.git"
    exit 1
fi

# 2. Status vor dem Update prüfen (optional)
echo "📂 Aktuelles Verzeichnis: $(pwd)"

# 3. Änderungen vom Remote holen
echo "⬇️  Hole Änderungen von $REMOTE..."
git fetch $REMOTE

# 4. Hard Reset auf den neuesten Stand
# ACHTUNG: Dies überschreibt alle lokalen Änderungen am Server!
echo "🔄 Setze Branch auf $REMOTE/$BRANCH zurück..."
git reset --hard $REMOTE/$BRANCH

# 5. Berechtigungen setzen (Optional, für Apache Webserver oft hilfreich)
# Hier konservativ nur lesbar machen, falls gewünscht einkommentieren:
# echo "🔒 Setze Berechtigungen..."
# chown -R www-data:www-data .
# find . -type d -exec chmod 755 {} \;
# find . -type f -exec chmod 644 {} \;

echo "✅ Deployment erfolgreich abgeschlossen!"
echo "📄 Aktuelle Version:"
git log -1 --format="%h - %s (%cd)"
