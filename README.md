# Real-time IoT sensor monitor · Arduino + DHT11 + Firebase

[![Arduino](https://img.shields.io/badge/hardware-Arduino%20%2B%20DHT11-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Next.js](https://img.shields.io/badge/dashboard-Next.js%2015-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/database-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A complete **IoT telemetry** system: an **Arduino with a DHT11 sensor** measures temperature and humidity, a
small *gateway* reads the serial port and publishes the readings to **Firestore**, and a **real-time web
dashboard** (Next.js, deployed on Vercel) shows them from anywhere — with **email alerts** when values leave
the safe range.

**Use cases:** data centres, greenhouses, server rooms, warehouses, laboratories — anywhere temperature and
humidity matter and nobody is watching.

**Languages:** **English** · [Español](README.es.md)

## Quick start

| # | What you need | Where |
| --- | --- | --- |
| 1 | **Arduino + DHT11 sensor** | [Wiring and programming →](#3-arduino-setup) |
| 2 | **Node.js 18+** for the gateway | [Local script →](#6-local-script-setup-nodejs-gateway) |
| 3 | **Firebase project** (free) | [Database →](#4-firebase-setup-database) |
| 4 | **EmailJS account** (free) for the alerts | [Email →](#5-email-service-setup-emailjs) |
| 5 | **Vercel** (free) to publish the dashboard | [Deploy →](#8-deploying-to-vercel-going-live) |

The full manual, step by step, is written for someone who has never done this before. It starts at
[section 1](#1-project-description-and-architecture).

## Table of contents

1. [Project description and architecture](#1-project-description-and-architecture)
2. [Prerequisites](#2-prerequisites)
3. [Arduino setup](#3-arduino-setup)
4. [Firebase setup (database)](#4-firebase-setup-database)
5. [Email service setup (EmailJS)](#5-email-service-setup-emailjs)
6. [Local script setup (Node.js gateway)](#6-local-script-setup-nodejs-gateway)
7. [Frontend and version control](#7-frontend-and-version-control-github)
8. [Deploying to Vercel](#8-deploying-to-vercel-going-live)
9. [Running the whole system](#9-running-the-whole-system)
10. [Troubleshooting](#10-troubleshooting)
11. [Project structure](#11-project-structure-frontend)
12. [Security](#security) · [License](#license) · [Credits](#credits)

---

This document explains, step by step, how to build, configure and deploy a complete IoT (Internet of
Things) telemetry system. The project reads physical temperature and humidity data, sends it to a computer,
uploads it to a cloud database and visualises it in a web dashboard you can open from anywhere.

The manual is designed so that anyone — even without advanced previous experience — can replicate the
project from scratch by configuring their own services and credentials.

---

## 1. Project description and architecture

The system is built to monitor critical environments (such as a data centre or a greenhouse) and to raise
visual, audible and email alerts when the values cross the safe limits.

The architecture has three main layers:

1. **Hardware layer (edge):** an Arduino microcontroller reads a physical sensor (DHT11) and sends the
   readings over a USB cable using serial communication.
2. **Link layer (local gateway):** a script running on your computer (Node.js) listens on the USB port,
   collects the data coming from the Arduino and sends it to a cloud database (Firebase).
3. **Presentation layer (cloud frontend):** a web application hosted on the internet (Vercel) reads the
   database in real time and draws the charts. If it detects an anomaly, it sounds an alarm in the browser
   and sends an email.

Data flow diagram:

```text
[DHT11 sensor] --(jumper wires)--> [Arduino UNO]
                                        |
                                        | (USB cable / serial port COM)
                                        v
                                [Local computer]
                          (Node.js script: server.js)
                                        |
                                        | (internet connection)
                                        v
                             [Cloud database]
                        (Google Firebase Firestore)
                                        |
                                        | (real-time sync)
                                        v
                          [Public web application]
                         (Next.js hosted on Vercel)
```

---

## 2. Prerequisites

To replicate this project you need the hardware and software listed below. Every software tool used is
free.

Hardware needed:

* An Arduino board (UNO, Nano, Mega, etc.) and its USB cable.
* A DHT11 temperature and humidity sensor (or a DHT22).
* Jumper wires to connect the sensor to the Arduino.

Software needed:

* **Node.js (version 18 or later):** runtime for the local script and for the web app. Download it from
  https://nodejs.org/
* **Arduino IDE:** to program the Arduino board. Download it from https://www.arduino.cc/en/software
* **Git:** version control system. Download it from https://git-scm.com/
* **GitHub Desktop:** a graphical interface for managing your code. Download it from https://desktop.github.com/
* **Visual Studio Code (recommended):** code editor. Download it from https://code.visualstudio.com/

Free accounts needed:

* A Google account (to use Firebase).
* A GitHub account (to store the web app code).
* A Vercel account (to publish the site on the internet).
* An EmailJS account (to send the automatic emails).

---

## 3. Arduino setup

The first step is to program the physical brain of the project so that it reads the sensor and sends the
data to the computer.

### 3.1. Wiring

1. Connect the VCC (or +) pin of the DHT11 sensor to the 5V pin of the Arduino.
2. Connect the GND (or −) pin of the sensor to the GND pin of the Arduino.
3. Connect the DATA (or OUT) pin of the sensor to **digital pin 2** of the Arduino.

### 3.2. Programming

1. Open the Arduino IDE.
2. Go to **Sketch → Include Library → Manage Libraries…**.
3. In the search box, type "DHT sensor library". Find the one created by "Adafruit" and click Install. (If
   it asks whether to install additional dependencies such as "Adafruit Unified Sensor", say yes.)
4. Copy the code below and paste it into the editor, deleting everything that was there before:

```cpp
#include "DHT.h"

// Define the digital pin the sensor is connected to
#define DHTPIN 2

// Define the sensor type (change to DHT22 if you use that model)
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Start serial communication with the computer at 9600 baud
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  // Wait 2 seconds between readings (the DHT11 is a slow sensor)
  delay(2000);

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Check whether the reading failed
  if (isnan(h) || isnan(t)) {
    Serial.println("Error reading the DHT sensor!");
    return;
  }

  // Print the data in the strict format our script understands
  // Expected format: T:25.00,H:60.00
  Serial.print("T:");
  Serial.print(t);
  Serial.print(",H:");
  Serial.println(h);
}
```

5. Connect the Arduino to the computer with the USB cable.
6. In the Arduino IDE, go to **Tools → Board** and select your model (e.g. Arduino UNO).
7. Go to **Tools → Port** and select the port the board is connected to (e.g. COM3, COM4). Write down that
   port number: you will need it later.
8. Click the **Upload** button (the right-pointing arrow) to flash the board.

---

## 4. Firebase setup (database)

Firebase stores the readings so that the web page can read them from anywhere in the world.

### 4.1. Create the project

1. Go to https://console.firebase.google.com/ and sign in with your Google account.
2. Click "Create a project" or "Add project".
3. Give it a name (e.g. "Monitor-IoT") and click Continue.
4. You can turn Google Analytics off for this project; it is not needed. Click "Create project".

### 4.2. Create the database (Firestore)

1. In the left-hand menu, expand **Build** and select **Firestore Database**.
2. Click "Create database".
3. Choose a location near you and click Next.
4. Choose **Start in test mode** and click Create.

### 4.3. Configure the security rules

So that our script and our web app can read and write without being blocked, we have to configure the
rules.

1. Inside Firestore Database, open the **Rules** tab.
2. Delete everything and paste exactly this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write only on the specific telemetry document
    match /telemetry/latest {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish** to save the changes.

> ⚠️ **Read this before you publish it.** This rule is wide open (`if true`), which is the quickest way to
> get the project working: the public dashboard does need open **read**, but open **write** means anybody
> who knows your project id can publish fake readings and trigger your email alerts. The two-step fix —
> signing the gateway in and closing the write path — is in **[Security](#security)** and
> **[SECURITY.md](SECURITY.md)**.

### 4.4. Get the connection credentials

1. In the left-hand menu, at the very top, click the gear icon and select "Project settings".
2. On the **General** tab, scroll down to the "Your apps" section.
3. Click the web icon (`</>`) to add a web app.
4. Give it a nickname (e.g. "Web Dashboard") and click "Register app".
5. A code block appears with a variable called `firebaseConfig`. Copy the values inside that block
   (`apiKey`, `authDomain`, `projectId`, etc.). Keep them in a note: you will need them for the local script
   and for the web page.

---

## 5. Email service setup (EmailJS)

This service lets the web page send emails without having to program a mail server of your own.

1. Go to https://www.emailjs.com/ and create a free account.
2. In the dashboard, go to **Email Services** and click **Add New Service**.
3. Choose **Gmail** (or your provider), connect your account and click **Create Service**.
4. Note the **Service ID** that was generated (usually something like `service_xxxxx`).
5. Go to **Email Templates** and click **Create New Template**.
6. In the **Code** or **HTML** tab of the template, paste this design:

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #1a1a1a; color: #ffffff; padding: 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">IGLOO INC.</h1>
    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7; text-transform: uppercase;">Environmental Telemetry System</p>
  </div>

  <div style="padding: 30px; background-color: #ffffff;">
    <div style="display: inline-block; padding: 5px 15px; border-radius: 4px; background-color: #ff3b00; color: white; font-weight: bold; font-size: 12px; margin-bottom: 20px;">
      {{severity}} ALERT
    </div>

    <h2 style="color: #1a1a1a; margin-top: 0;">{{alert_title}}</h2>
    <p style="color: #666; line-height: 1.6;">An anomaly has been detected in the data centre sensors and it requires immediate attention.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Alert type</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{alert_type}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Location</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{location}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Current value</td>
        <td style="padding: 10px 0; color: #ff3b00; font-weight: bold; font-size: 20px; text-align: right;">{{current_value}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Threshold exceeded</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{threshold}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Date / time</td>
        <td style="padding: 10px 0; color: #1a1a1a; text-align: right;">{{timestamp}}</td>
      </tr>
    </table>

    <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #1a1a1a; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px; color: #1a1a1a; text-transform: uppercase; font-size: 12px;">Action required:</h4>
      <p style="margin: 0; color: #444; font-size: 14px;">{{action_required}}</p>
    </div>

    <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      System status: <span style="color: #666; font-weight: bold;">{{system_status}}</span><br>
      This is an automatic message generated by the telemetry system.
    </div>
  </div>
</div>
```

7. On the **Settings** tab of the template, set the **Subject** field like this:
   `{{alert_title}} [{{severity}}] - {{location}}`
8. Save the template (the Save button). Note the **Template ID** (usually something like `template_xxxxx`).
9. Go to the **Account** section in the main menu and then to the **API Keys** tab. There you will find your
   **Public Key**. Write that down as well.

---

## 6. Local script setup (Node.js gateway)

This script runs on your computer. Its job is to listen on the USB port where the Arduino is connected and
forward those readings to Firebase.

1. On your computer, create a new folder called `arduino-gateway`.
2. Open a command terminal (Command Prompt, PowerShell or macOS Terminal) and go into that folder.
3. Run the following commands one by one to initialise the project and install the libraries you need:
   ```bash
   npm init -y
   npm install serialport firebase
   ```
4. Open the folder in your code editor (Visual Studio Code) and create a file called `server.js`.
5. Paste the code below into `server.js`.
6. Edit the `firebaseConfig` block with the values you obtained in step 4.4.
7. Edit the variable `path: "COM4"` with the real port your Arduino is connected to (the one you wrote down
   in step 3.2).

```javascript
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

// 1. Firebase configuration (REPLACE THESE VALUES WITH YOUR OWN)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Connection to the Arduino (REPLACE "COM4" WITH YOUR REAL PORT)
// On Windows it is usually COM3, COM4, etc. On Mac/Linux it is usually /dev/ttyUSB0 or similar.
const port = new SerialPort({ path: "COM4", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

console.log("Bridge started. Waiting for data from the Arduino...");

parser.on("data", async (line) => {
  // Clean the line of any invisible spaces or line breaks
  const cleanLine = line.trim();
  console.log("Received from USB:", cleanLine);

  // The Arduino sends "T:25.00,H:60.00". Split on the comma.
  const values = cleanLine.split(",");

  if (values.length === 2) {
    // Extract just the number, splitting on the colon ":"
    // values[0] is "T:25.00", so split(":")[1] gives us "25.00"
    const tempStr = values[0].split(":")[1];
    const humStr = values[1].split(":")[1];

    // Convert the text to a decimal number
    const temp = parseFloat(tempStr);
    const hum = parseFloat(humStr);

    // If the conversion worked and both values are valid numbers
    if (!isNaN(temp) && !isNaN(hum)) {
      try {
        // 3. Send to the cloud (Firebase Firestore)
        await setDoc(doc(db, "telemetry", "latest"), {
          temp: temp,
          hum: hum,
          timestamp: Date.now()
        });
        console.log(`Cloud updated successfully: ${temp} degrees, ${hum}% humidity`);
      } catch (e) {
        console.error("Error uploading to Firebase:", e.message);
      }
    } else {
      console.log("Format error. Could not convert to a number:", tempStr, humStr);
    }
  }
});

port.on('error', (err) => {
  console.error('Serial port error. Check that the port is correct and that the Arduino IDE Serial Monitor is closed. Details:', err.message);
});
```

---

## 7. Frontend and version control (GitHub)

The web interface (frontend) is built with Next.js, React and Tailwind CSS.

1. Make sure you have all the frontend code in a folder on your computer.
2. Open GitHub Desktop.
3. Go to **File → Add Local Repository** and select the frontend folder.
4. Click **Publish Repository** to upload the code to your GitHub account. Keep it private or public,
   whichever you prefer.

---

## 8. Deploying to Vercel (going live)

Vercel is the platform that will host the web page so that it is available on the internet 24/7.

1. Go to https://vercel.com/ and sign up with your GitHub account.
2. In the main dashboard, click **Add New…** and select **Project**.
3. A list of your GitHub repositories appears. Find the one you just uploaded and click **Import**.
4. Before clicking Deploy, expand the **Environment Variables** section.
5. There you must add all the credentials so the site can connect to Firebase and EmailJS. Add the
   following variables one by one (exact name on the left, your value on the right):

Firebase variables (the same ones from step 4.4):

* `NEXT_PUBLIC_FIREBASE_API_KEY`
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
* `NEXT_PUBLIC_FIREBASE_APP_ID`

EmailJS variables (from step 5):

* `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
* `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
* `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

6. Once all the variables are added, click **Deploy**.
7. Wait a couple of minutes. When it finishes, Vercel gives you a public URL
   (e.g. `your-project.vercel.app`).

---

## 9. Running the whole system

To start the complete system and see the data flowing, follow this order strictly:

1. **Connect the Arduino:** plug the Arduino's USB cable into your computer.
2. **Start the local gateway:** open a terminal in the `arduino-gateway` folder (the one you created in
   step 6) and run:
   ```bash
   node server.js
   ```
   You should see messages saying it is receiving data and updating the cloud. Leave that window open.
3. **Open the dashboard:** go to the URL Vercel gave you in your web browser.
4. **Enable the alerts:** on the web page, find the system status button (bottom right) and click it to
   enable audio. This is a browser security requirement for the siren to be allowed to sound.
5. **Test the system:** apply heat or breathe on the physical DHT11 sensor. You will see the chart rise in
   real time. If it crosses the danger thresholds, the screen will flash red, the alarm will sound and you
   will receive an email.

---

## 10. Troubleshooting

* **"Access to the port is denied" when running server.js:** another program is using the Arduino's port.
  It is usually the Arduino IDE's own Serial Monitor. Close the Serial Monitor, or quit the Arduino IDE
  completely, and run `node server.js` again.
* **server.js prints "Error converting to number":** the Arduino is sending garbage text, or the format is
  not exactly `T:25.00,H:60.00`. Check the code you uploaded to the Arduino.
* **The web page loads but shows no data:** check the environment variables in Vercel. If you mistyped the
  Firebase API key, the site cannot connect to the database.
* **The emails do not arrive:** check that the EmailJS variables in Vercel are correct. Also check in the
  EmailJS dashboard whether you have used up the free monthly email allowance.
* **Firebase permission error:** if the browser console shows "Missing or insufficient permissions", you
  did not save the security rules correctly in step 4.3.

---

## 11. Project structure (frontend)

For reference, this is how the files of the web app (Next.js) are organised:

```text
/
├── app/                         # Next.js routes (App Router)
│   ├── globals.css              # Tailwind and global styles
│   ├── layout.tsx               # Base structure of the HTML document
│   └── page.tsx                 # Main page that assembles the dashboard
├── components/                  # Visual and interactive components
│   ├── LiveMetrics.tsx          # Firestore readings, charts and alert logic
│   ├── GestureAuth.tsx          # Alarm unlock with hand gestures (camera + MediaPipe)
│   ├── BootSequence.tsx         # Boot animation
│   ├── ChartModal.tsx           # Full-screen enlarged chart
│   ├── CustomCursor.tsx         # Custom cursor
│   ├── GlitchText.tsx           # Glitch text effect
│   ├── Header.tsx               # Header
│   └── SmoothScroll.tsx         # Smooth scrolling
├── hooks/                       # React hooks
│   ├── use-sensor-data.ts       # Real-time subscription to Firestore
│   └── use-mobile.ts            # Small-screen detection
├── lib/
│   ├── firebase.ts              # Firebase client initialisation
│   ├── patch-fetch.ts           # window.fetch adjustment for the WASM libraries
│   └── utils.ts                 # Styling utilities
├── store/use-ui-store.ts        # Global UI state (Zustand)
├── firebase-applet-config.json  # Firebase web credentials (public by design)
├── firestore.rules              # Firestore security rules
├── .env.example                 # EmailJS variables you must fill in
├── metadata.json                # Dashboard name and permissions (camera)
└── vercel.json · next.config.ts · postcss.config.mjs · package.json · tsconfig.json
```

---

## Security

This project writes to a cloud database, so it is worth being clear about what is protected and what is
not. Two things you should adjust **in your Firebase project** (they are settings in the Google console,
not in this repository):

1. **The Firestore rules.** The ones in [`firestore.rules`](firestore.rules) allow **anyone to read** (the
   public dashboard needs that) but, as written, they also allow **anyone to write** who knows the project
   id and the web key. Anybody could publish fake readings and trigger the email alerts. The recommended
   fix — with the details and the text ready to paste — is in [SECURITY.md](SECURITY.md).
2. **Restrict the Firebase web key.** In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   → your `AIza…` key → *Application restrictions* → **Websites** → add your Vercel domain, and under
   *API restrictions* keep only **Cloud Firestore API**.

> The key that appears in `firebase-applet-config.json` **is not a secret**: Firebase web keys are sent to
> the browser by design. What really protects the data is the rules (point 1) and the restrictions
> (point 2).

## License

[MIT](LICENSE) © 2026 LockerDocx — you can use, modify and publish it, crediting the author.

## Credits

- The initial scaffolding of the web dashboard came from a **Google AI Studio** *applet*; the hardware, the
  gateway and the system logic belong to this project.
- Main libraries: [Adafruit DHT sensor library](https://github.com/adafruit/DHT-sensor-library),
  [serialport](https://serialport.io/), [Firebase](https://firebase.google.com/),
  [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/).

## Other projects

- 🤖 **[firefox-ai-agent](https://github.com/LockerDocx/firefox-ai-agent)** — a free AI agent that drives
  your own Firefox.
