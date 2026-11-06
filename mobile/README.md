# Saxa iOS-app (Expo)

Appen visar Saxa-sajten i en native iOS-app med ikon, splash, pull-to-refresh, svep tillbaka,
offline-skärm, vibration vid bokning och externa länkar (telefon, kalender, Instagram) i rätt app.

Sajtadressen styrs av `extra.siteUrl` i `app.json` (standard: https://saxa1001.vercel.app).

## Till TestFlight (första gången)

```bash
cd mobile
npm install
npm install -g eas-cli
eas login                      # ditt Expo-konto (skapa gratis på expo.dev)
eas init                       # kopplar projektet till Expo, svara Ja
eas build -p ios --profile production
```
EAS frågar efter Apple ID → logga in med ditt Apple Developer-konto och svara **Ja** på att skapa
certifikat och provisioning profile automatiskt.

När bygget är klart (ca 10–20 min):
```bash
eas submit -p ios --latest
```
Välj **Ja** på att skapa appen i App Store Connect om den frågar. Efter 5–30 min syns bygget under
App Store Connect → Saxa → **TestFlight**. Lägg till dig själv som intern testare och installera via TestFlight-appen.

## Nya versioner
Ändringar på sajten syns direkt i appen – ingen ny build behövs.
Ny build behövs bara vid ändring av ikon, namn eller native-kod:
```bash
eas build -p ios --profile production --auto-submit
```
