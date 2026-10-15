# Screenshots erzeugen

Macht die Bilder in [`screenshots/`](../../screenshots) neu: Screens der echten Web-Version mit erfundenen Demo-Daten,
dazu das Titelbild der README und die Link-Vorschau der Landingpage.

So funktioniert es: Ein Headless-Chrome lädt die Web-Version und beantwortet jede Anfrage an Supabase selbst aus
[`mock.mjs`](mock.mjs). Eine angemeldete Sitzung wird nur vorgetäuscht. Das Skript erreicht dabei kein Supabase-Projekt
und kein Sentry und braucht keine Zugangsdaten.

## Ausführen

Voraussetzungen: Node.js und Google Chrome (Pfad unter Windows ist voreingestellt, sonst `CHROME_PATH` setzen).

```bash
cd tools/screenshots
npm install
npm run all          # Screens und Titelbilder
```

Einzelne Screens: `node shoot.mjs chat,profil`. Zusätzlich gibt es `chats` und `meine` (nicht im Standard, weil
„Meine“ im Web gerade keinen seitlichen Rand hat).

Gegen eine noch nicht veröffentlichte Version: im App-Repo `npx expo export -p web` und `npx expo serve --port 8090`,
dann `APP_URL=http://localhost:8090 npm run all`.

## Wann anpassen

- **Ein Screen zeigt „Etwas ist schiefgelaufen“ oder leere Listen:** Die App ruft etwas Neues auf oder erwartet andere
  Felder. Das Skript nennt am Ende die Aufrufe ohne Demo-Daten. Dann in `mock.mjs` die Antwort ergänzen, passend zu den
  Typen in `src/types/database.ts` des App-Repos (auch Status-Werte wie `accepted`).
- **Neue Rollen oder Lizenzstufen:** die Liste `roles` in `mock.mjs` angleichen.
- Nach neuen Screens: Galerie in `README.md` und `index.html` im Hauptordner ergänzen.
