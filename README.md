<div align="center">
  <h1>💖 Lovely Toon</h1>
  <p><b>Know what your person is vibing to, right now.</b></p>
  <p>
    <a href="https://github.com/local-over/LovelyToon/releases/latest">
      <img src="https://img.shields.io/github/v/release/local-over/LovelyToon?style=flat-square&color=FF6B8A" alt="Latest Release">
    </a>
    <a href="https://github.com/local-over/LovelyToon/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/local-over/LovelyToon?style=flat-square&color=7C5CFC" alt="License">
    </a>
  </p>
</div>

A free, open-source Android app for couples and besties that shares what music you're listening to with your partner in real time. 

It runs quietly in the background, detects songs from Spotify, YouTube Music, and other media players, and beams them to your partner's phone instantly. No accounts needed — just share a 6-character pairing code.

## ✨ Features

* **Live Sync**: See what they are playing exactly when they play it.
* **History**: Look back at what you both listened to recently.
* **Battery Friendly**: Built to sip battery, not gulp it.
* **Zero Accounts**: No signups, no emails, no passwords. Just a pairing code.
* **Private**: No data is stored on servers. Messages disappear after they are sent.

## 📱 Screenshots
*(Screenshots coming soon)*

## 📥 How to Install

1. Go to the [Releases page](https://github.com/local-over/LovelyToon/releases)
2. Download the latest `.apk` file
3. Open the file on your Android phone (you might need to allow "Install from unknown sources")
4. Open the app and pair with your partner!

## ⚙️ How It Works

Lovely Toon uses standard Android notification listeners to securely detect when a media player (like Spotify or Apple Music) updates its playback state. It then sends a lightweight MQTT message to a public broker. Your partner's phone listens for this specific message using your unique pairing code. Because MQTT is lightweight, it happens instantly without draining your battery.

## 🛠️ Build From Source

You need Android Studio and Java 17.

```bash
git clone https://github.com/local-over/LovelyToon.git
cd LovelyToon
./gradlew assembleDebug
```
The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

## 🔒 Privacy

We care about privacy. Lovely Toon does not use a central database. It does not store your listening history on any server. Pairing codes are used as MQTT topics, and messages are ephemeral (they vanish once delivered). We don't want your data.

## 🤝 Contributing

Found a bug? Want to add a feature?
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/cool-thing`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💖 Support This Project

Made with 💕 by Hassan Elkady.

If you enjoy Lovely Toon and want to help keep the lights on, you can donate via USDT (TRC20):
`TYourUSDTAddressHere`
