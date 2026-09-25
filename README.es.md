# Monitor IoT de sensores en tiempo real · Arduino + DHT11 + Firebase

[![Arduino](https://img.shields.io/badge/hardware-Arduino%20%2B%20DHT11-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc/)
[![Next.js](https://img.shields.io/badge/dashboard-Next.js%2015-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/database-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Idiomas:** [English](README.md) · **Español**

Sistema completo de **telemetría IoT**: un **Arduino con sensor DHT11** mide temperatura y humedad, un
pequeño *gateway* lee el puerto serie y lo publica en **Firestore**, y un **dashboard web en tiempo real**
(Next.js, desplegado en Vercel) lo muestra desde cualquier sitio, con **alertas por correo** cuando los
valores salen de rango.

**Casos de uso:** centros de datos (CPD), invernaderos, salas de servidores, almacenes, laboratorios —
cualquier sitio donde la temperatura y la humedad importen y nadie esté mirando.

## Arranque rápido

| # | Qué necesitas | Dónde |
| --- | --- | --- |
| 1 | **Arduino + sensor DHT11** | [Conexionado y programación →](#3-configuración-del-arduino) |
| 2 | **Node.js 18+** para el gateway | [Script local →](#6-configuración-del-script-local-gateway-nodejs) |
| 3 | **Proyecto de Firebase** (gratis) | [Base de datos →](#4-configuración-de-firebase-base-de-datos) |
| 4 | **Cuenta de EmailJS** (gratis) para los avisos | [Correos →](#5-configuración-del-servicio-de-correos-emailjs) |
| 5 | **Vercel** (gratis) para publicar el panel | [Despliegue →](#8-despliegue-en-vercel-puesta-en-producción) |

El manual completo, paso a paso y pensado para quien no haya hecho esto nunca, empieza en el
[punto 1](#1-descripción-del-proyecto-y-arquitectura).

## English summary

**Real-time IoT sensor monitor**: an **Arduino with a DHT11** sensor measures temperature and humidity, a
local Node.js gateway reads the serial port and publishes to **Firebase Firestore**, and a **Next.js
dashboard** (deployed on Vercel) visualises the data live from anywhere, with **email alerts** when values
leave a safe range. Built for data centres, greenhouses and server rooms. Full manual in Spanish, below.

## Contenido

1. [Descripción del proyecto y arquitectura](#1-descripción-del-proyecto-y-arquitectura)
2. [Requisitos previos](#2-requisitos-previos)
3. [Configuración del Arduino](#3-configuración-del-arduino)
4. [Configuración de Firebase (base de datos)](#4-configuración-de-firebase-base-de-datos)
5. [Configuración del servicio de correos (EmailJS)](#5-configuración-del-servicio-de-correos-emailjs)
6. [Configuración del script local (gateway Node.js)](#6-configuración-del-script-local-gateway-nodejs)
7. [Frontend y control de versiones](#7-frontend-y-control-de-versiones-github)
8. [Despliegue en Vercel](#8-despliegue-en-vercel-puesta-en-producción)
9. [Puesta en marcha completa](#9-puesta-en-marcha-completa)
10. [Solución de problemas](#10-solución-de-problemas-comunes)
11. [Estructura del proyecto](#11-estructura-del-proyecto-frontend)
12. [Seguridad](#seguridad) · [Licencia](#licencia) · [Créditos](#créditos)

---
Este documento detalla paso a paso la construcción, configuración y despliegue de un sistema completo de telemetría IoT (Internet of Things). El proyecto lee datos físicos de temperatura y humedad, los transmite a un ordenador, los sube a una base de datos en la nube y los visualiza en un panel de control web (dashboard) accesible desde cualquier lugar.

Este manual está diseñado para que cualquier persona, incluso sin experiencia previa avanzada, pueda replicar el proyecto desde cero configurando sus propios servicios y credenciales.

---

## 1. Descripción del Proyecto y Arquitectura

El sistema está diseñado para monitorizar entornos críticos (como un Centro de Procesamiento de Datos o un invernadero) y emitir alertas visuales, sonoras y por correo electronico si los valores superan los limites seguros.

La arquitectura se divide en tres capas principales:

1. Capa de Hardware (Edge): Un microcontrolador Arduino lee los datos de un sensor físico (DHT11) y los envia por un cable USB utilizando comunicación serial.
2. Capa de Enlace (Gateway Local): Un script ejecutado en tu ordenador (Node.js) escucha el puerto USB, recoge los datos del Arduino y los envia a una base de datos en la nube (Firebase).
3. Capa de Presentación (Frontend Cloud): Una aplicación web alojada en internet (Vercel) lee la base de datos en tiempo real y muestra los gráficos. Si detecta anomalias, hace sonar una alarma en el navegador y envia un correo electronico.

Diagrama de flujo de datos:

```text
[Sensor DHT11] --(Cable de pines)--> [Arduino UNO]
                                          |
                                          | (Cable USB / Puerto Serie COM)
                                          v
                                 [Ordenador Local]
                          (Script Node.js: server.js)
                                          |
                                          | (Conexion a Internet)
                                          v
                            [Base de Datos en la Nube]
                          (Google Firebase Firestore)
                                          |
                                          | (Sincronización en Tiempo Real)
                                          v
                              [Aplicación Web Pública]
                            (Next.js alojado en Vercel)
```

---

## 2. Requisitos Previos

Para replicar este proyecto, necesitaras el siguiente hardware y software. Todas las herramientas de software utilizadas son gratuitas.

Hardware necesario:
* Placa Arduino (UNO, Nano, Mega, etc.) y su cable USB.
* Sensor de temperatura y humedad DHT11 (o DHT22).
* Cables puente (jumper wires) para conectar el sensor al Arduino.

Software necesario:
* Node.js (Versión 18 o superior): Entorno de ejecución para el script local y la web. Descárgalo en: https://nodejs.org/
* Arduino IDE: Para programar la placa Arduino. Descárgalo en: https://www.arduino.cc/en/software
* Git: Sistema de control de versiones. Descárgalo en: https://git-scm.com/
* GitHub Desktop: Interfaz grafica para gestionar tu código. Descárgalo en: https://desktop.github.com/
* Visual Studio Code (Recomendado): Editor de código. Descárgalo en: https://code.visualstudio.com/

Cuentas gratuitas necesarias:
* Cuenta de Google (para acceder a Firebase).
* Cuenta de GitHub (para guardar el código de la web).
* Cuenta de Vercel (para publicar la web en internet).
* Cuenta de EmailJS (para el envio de correos automáticos).

---

## 3. Configuración del Arduino

El primer paso es programar el cerebro físico del proyecto para que lea el sensor y envie los datos al ordenador.

### 3.1. Conexionado físico
1. Conecta el pin VCC (o +) del sensor DHT11 al pin 5V del Arduino.
2. Conecta el pin GND (o -) del sensor al pin GND del Arduino.
3. Conecta el pin DATA (o OUT) del sensor al Pin Digital 2 del Arduino.

### 3.2. Programación
1. Abre el programa Arduino IDE.
2. Ve al menú "Programa" > "Incluir Libreria" > "Administrar Librerias...".
3. En el buscador, escribe "DHT sensor library". Busca la que está creada por "Adafruit" y haz clic en Instalar. (Si te pregunta si deseas instalar dependencias adicionales como "Adafruit Unified Sensor", dile que si).
4. Copia el siguiente código y pegalo en el editor, borrando todo lo anterior:

```cpp
#include "DHT.h"

// Definimos el pin digital donde está conectado el sensor
#define DHTPIN 2     

// Definimos el tipo de sensor (cambiar a DHT22 si usas ese modelo)
#define DHTTYPE DHT11   

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Iniciamos la comunicación con el ordenador a 9600 baudios
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  // Esperamos 2 segundos entre cada lectura (el DHT11 es un sensor lento)
  delay(2000); 

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Comprobamos si hubo un error en la lectura
  if (isnan(h) || isnan(t)) {
    Serial.println("Error leyendo el sensor DHT!");
    return;
  }

  // Imprimimos los datos en un formato estricto que nuestro script entendera
  // Formato esperado: T:25.00,H:60.00
  Serial.print("T:");
  Serial.print(t);
  Serial.print(",H:");
  Serial.println(h);
}
```

5. Conecta el Arduino al ordenador por USB.
6. En Arduino IDE, ve a "Herramientas" > "Placa" y selecciona tu modelo (ej. Arduino UNO).
7. Ve a "Herramientas" > "Puerto" y selecciona el puerto donde está conectado (ej. COM3, COM4). Anota este número de puerto, lo necesitaras luego.
8. Haz clic en el boton "Subir" (la flecha hacia la derecha) para programar la placa.

---

## 4. Configuración de Firebase (Base de Datos)

Firebase almacenara los datos para que la pagina web pueda leerlos desde cualquier parte del mundo.

### 4.1. Crear el proyecto
1. Ve a https://console.firebase.google.com/ e inicia sesión con tu cuenta de Google.
2. Haz clic en "Crear un proyecto" o "Anadir proyecto".
3. Ponle un nombre (ej. "Monitor-IoT") y haz clic en Continuar.
4. Puedes desactivar Google Analytics para este proyecto, no es necesario. Haz clic en "Crear proyecto".

### 4.2. Crear la base de datos (Firestore)
1. En el menú lateral izquierdo, despliega "Compilación" (Build) y selecciona "Firestore Database".
2. Haz clic en "Crear base de datos".
3. Selecciona una ubicación cercana a ti y haz clic en Siguiente.
4. Selecciona "Comenzar en modo de prueba" (Start in test mode) y haz clic en Crear.

### 4.3. Configurar las reglas de seguridad
Para que nuestro script y nuestra web puedan escribir y leer sin bloqueos, debemos configurar las reglas.
1. Dentro de Firestore Database, ve a la pestana "Reglas" (Rules).
2. Borra todo el contenido y pega exactamente esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitimos leer y escribir unicamente en el documento especifico de telemetria
    match /telemetry/latest {
      allow read, write: if true;
    }
  }
}
```
3. Haz clic en el botón "Publicar" para guardar los cambios.

> ⚠️ **Léelo antes de publicar.** Esta regla está abierta (`if true`), que es la forma más rápida de
> que el proyecto funcione: el panel público sí necesita **lectura** abierta, pero la **escritura**
> abierta significa que cualquiera que conozca el identificador de tu proyecto puede publicar lecturas
> falsas y disparar tus alertas de correo. El arreglo en dos pasos —hacer que el gateway inicie sesión y
> cerrar la escritura— está en **[Seguridad](#seguridad)** y en **[SECURITY.md](SECURITY.md)**.

### 4.4. Obtener las credenciales de conexión
1. En el menú lateral izquierdo, arriba del todo, haz clic en el icono del engranaje y selecciona "Configuración del proyecto".
2. En la pestana "General", baja hasta la sección "Tus aplicaciones".
3. Haz clic en el icono web (</>) para anadir una aplicación web.
4. Ponle un apodo (ej. "Dashboard Web") y haz clic en "Registrar app".
5. Aparecera un bloque de código con una variable llamada `firebaseConfig`. Copia los valores que hay dentro de ese bloque (apiKey, authDomain, projectId, etc.). Guárdalos en un bloc de notas, los necesitaras para el script local y para la pagina web.

---

## 5. Configuración del Servicio de Correos (EmailJS)

Este servicio permite que la pagina web envie correos electronicos sin necesidad de programar un servidor de correos complejo.

1. Ve a https://www.emailjs.com/ y crea una cuenta gratuita.
2. En el panel de control, ve a la sección "Email Services" y haz clic en "Add New Service".
3. Selecciona "Gmail" (o tu proveedor), conecta tu cuenta y haz clic en "Create Service".
4. Anota el "Service ID" que se ha generado (suele ser algo como `service_xxxxx`).
5. Ve a la sección "Email Templates" y haz clic en "Create New Template".
6. En la pestana "Code" o "HTML" de la plantilla, pega el siguiente diseño:

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
    <p style="color: #666; line-height: 1.6;">Se ha detectado una anomalia en los sensores del CPD que requiere atención inmediata.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Tipo de Alerta</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{alert_type}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Ubicación</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{location}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Valor Actual</td>
        <td style="padding: 10px 0; color: #ff3b00; font-weight: bold; font-size: 20px; text-align: right;">{{current_value}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Limite Superado</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{threshold}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Fecha/Hora</td>
        <td style="padding: 10px 0; color: #1a1a1a; text-align: right;">{{timestamp}}</td>
      </tr>
    </table>
    
    <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #1a1a1a; margin-bottom: 25px;">
      <h4 style="margin: 0 0 10px; color: #1a1a1a; text-transform: uppercase; font-size: 12px;">Acción Requerida:</h4>
      <p style="margin: 0; color: #444; font-size: 14px;">{{action_required}}</p>
    </div>
    
    <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Estado del Sistema: <span style="color: #666; font-weight: bold;">{{system_status}}</span><br>
      Este es un mensaje automático generado por el sistema de telemetria.
    </div>
  </div>
</div>
```

7. En la pestana "Settings" de la plantilla, configura el campo "Subject" (Asunto) así: `{{alert_title}} [{{severity}}] - {{location}}`
8. Guarda la plantilla (Boton Save). Anota el "Template ID" (suele ser algo como `template_xxxxx`).
9. Ve a la sección "Account" en el menú principal, luego a la pestana "API Keys". Ahi encontraras tu "Public Key". Anotala también.

---

## 6. Configuración del Script Local (Gateway Node.js)

Este script se ejecuta en tu ordenador. Su función es escuchar el puerto USB donde está el Arduino y reenviar esos datos a Firebase.

1. En tu ordenador, crea una carpeta nueva llamada `arduino-gateway`.
2. Abre una terminal de comandos (Simblo del sistema, PowerShell o Terminal de Mac) y navega hasta esa carpeta.
3. Ejecuta los siguientes comandos uno por uno para inicializar el proyecto e instalar las librerias necesarias:
   ```bash
   npm init -y
   npm install serialport firebase
   ```
4. Abre la carpeta en tu editor de código (Visual Studio Code) y crea un archivo llamado `server.js`.
5. Pega el siguiente código en `server.js`. 
6. Modifica la sección `firebaseConfig` con los datos que obtuviste en el paso 4.4.
7. Modifica la variable `path: "COM4"` con el puerto real donde está conectado tu Arduino (el que anotaste en el paso 3.2).

```javascript
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

// 1. Configuración de Firebase (REEMPLAZA ESTOS VALORES CON LOS TUYOS)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Conexion con Arduino (REEMPLAZA "COM4" POR TU PUERTO REAL)
// En Windows suele ser COM3, COM4, etc. En Mac/Linux suele ser /dev/ttyUSB0 o similar.
const port = new SerialPort({ path: "COM4", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

console.log("Puente iniciado. Esperando datos del Arduino...");

parser.on("data", async (line) => {
  // Limpiamos la linea de posibles espacios o saltos de linea invisibles
  const cleanLine = line.trim();
  console.log("Recibido desde USB:", cleanLine);
  
  // El Arduino envia "T:25.00,H:60.00". Separamos por la coma.
  const values = cleanLine.split(",");
  
  if (values.length === 2) {
    // Extraemos solo el numero, separando por los dos puntos ":"
    // values[0] es "T:25.00", al hacer split(":")[1] obtenemos "25.00"
    const tempStr = values[0].split(":")[1]; 
    const humStr = values[1].split(":")[1];  
    
    // Convertimos el texto a numero decimal
    const temp = parseFloat(tempStr);
    const hum = parseFloat(humStr);

    // Si la conversión fue exitosa y son números válidos
    if (!isNaN(temp) && !isNaN(hum)) {
      try {
        // 3. Enviar a la nube (Firebase Firestore)
        await setDoc(doc(db, "telemetry", "latest"), {
          temp: temp,
          hum: hum,
          timestamp: Date.now()
        });
        console.log(`Nube actualizada correctamente: ${temp} grados, ${hum}% humedad`);
      } catch (e) {
        console.error("Error al subir a Firebase:", e.message);
      }
    } else {
      console.log("Error de formato. No se pudo convertir a numero:", tempStr, humStr);
    }
  }
});

port.on('error', (err) => {
  console.error('Error en el puerto serie. Comprueba que el puerto es correcto y que el Monitor Serie de Arduino IDE está cerrado. Detalle:', err.message);
});
```

---

## 7. Frontend y Control de Versiones (GitHub)

El código de la interfaz web (frontend) está construido con Next.js, React y Tailwind CSS. 

1. Asegúrate de tener todo el código del frontend en una carpeta en tu ordenador.
2. Abre el programa GitHub Desktop.
3. Ve a "File" > "Add Local Repository" y selecciona la carpeta del frontend.
4. Haz clic en "Publish Repository" para subir el código a tu cuenta de GitHub. Mantenlo como repositorio privado o público segun prefieras.

---

## 8. Despliegue en Vercel (Puesta en Producción)

Vercel es la plataforma que alojara nuestra pagina web para que este disponible en internet 24/7.

1. Ve a https://vercel.com/ y registrate usando tu cuenta de GitHub.
2. En el panel principal, haz clic en "Add New..." y selecciona "Project".
3. Aparecera una lista con tus repositorios de GitHub. Busca el que acabas de subir y haz clic en "Import".
4. Antes de hacer clic en Deploy, despliega la sección "Environment Variables" (Variables de entorno).
5. Aquí debes anadir todas las credenciales para que la web pueda conectarse a Firebase y a EmailJS. Anade una por una las siguientes variables (el nombre exacto a la izquierda, y tu valor a la derecha):

Variables de Firebase (las mismas del paso 4.4):
* `NEXT_PUBLIC_FIREBASE_API_KEY`
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
* `NEXT_PUBLIC_FIREBASE_APP_ID`

Variables de EmailJS (las del paso 5):
* `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
* `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
* `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

6. Una vez anadidas todas las variables, haz clic en el boton "Deploy".
7. Espera un par de minutos. Cuando termine, Vercel te proporcionara una URL publica (ej. `tu-proyecto.vercel.app`).

---

## 9. Puesta en Marcha Completa

Para arrancar el sistema completo y ver los datos fluyendo, sigue este orden estricto:

1. Conecta el Arduino: Enchufa el cable USB del Arduino a tu ordenador.
2. Inicia el Gateway Local: Abre la terminal en la carpeta `arduino-gateway` (la que creaste en el paso 6) y ejecuta el comando:
   ```bash
   node server.js
   ```
   Debes ver mensajes indicando que recibe datos y actualiza la nube. Deja esta ventana negra abierta.
3. Abre el Dashboard: Ve a la URL que te proporciono Vercel en tu navegador web.
4. Habilita las alertas: En la pagina web, busca el boton de estado del sistema (abajo a la derecha) y haz clic para habilitar el audio. Esto es un requisito de seguridad de los navegadores para permitir que suene la sirena.
5. Prueba el sistema: Aplica calor o aliento al sensor físico DHT11. Veras como la grafica sube en tiempo real. Si supera los umbrales de peligro, la pantalla parpadeara en rojo, sonara la alarma y recibiras un correo electronico.

---

## 10. Solución de Problemas Comunes

* Error "Access to the port is denied" al ejecutar server.js: Esto ocurre porque otro programa está usando el puerto del Arduino. Normalmente es el "Monitor Serie" del propio Arduino IDE. Cierra el Monitor Serie o cierra el Arduino IDE por completo y vuelve a ejecutar `node server.js`.
* El script server.js dice "Error al convertir a número": Significa que el Arduino está enviando texto basura o el formato no es exactamente `T:25.00,H:60.00`. Revisa el código subido al Arduino.
* La pagina web carga pero no muestra datos: Revisa las variables de entorno en Vercel. Si te equivocaste al copiar la API Key de Firebase, la web no podra conectarse a la base de datos.
* Los correos no llegan: Verifica que las variables de EmailJS en Vercel son correctas. Comprueba también en el panel de EmailJS si has agotado el limite gratuito mensual de correos.
* Error de permisos en Firebase: Si la consola del navegador muestra un error de "Missing or insufficient permissions", significa que no guardaste correctamente las reglas de seguridad en el paso 4.3.

---

## 11. Estructura del Proyecto Frontend

Para referencia, esta es la organización de los archivos del código de la pagina web (Next.js):

```text
/
├── app/                         # Rutas de Next.js (App Router)
│   ├── globals.css              # Tailwind y estilos globales
│   ├── layout.tsx               # Estructura base del documento HTML
│   └── page.tsx                 # Página principal que ensambla el dashboard
├── components/                  # Componentes visuales e interactivos
│   ├── LiveMetrics.tsx          # Lecturas de Firestore, gráficos y lógica de alertas
│   ├── GestureAuth.tsx          # Desbloqueo de la alarma con gestos (cámara + MediaPipe)
│   ├── BootSequence.tsx         # Animación de arranque
│   ├── ChartModal.tsx           # Gráfica ampliada a pantalla completa
│   ├── CustomCursor.tsx         # Cursor personalizado
│   ├── GlitchText.tsx           # Texto con efecto glitch
│   ├── Header.tsx               # Cabecera
│   └── SmoothScroll.tsx         # Desplazamiento suave
├── hooks/                       # Hooks de React
│   ├── use-sensor-data.ts       # Suscripción en tiempo real a Firestore
│   └── use-mobile.ts            # Detección de pantalla pequeña
├── lib/
│   ├── firebase.ts              # Inicialización del cliente de Firebase
│   ├── patch-fetch.ts           # Ajuste de window.fetch para las librerías WASM
│   └── utils.ts                 # Utilidades de estilo
├── store/use-ui-store.ts        # Estado global de la interfaz (Zustand)
├── firebase-applet-config.json  # Credenciales web de Firebase (públicas por diseño)
├── firestore.rules              # Reglas de seguridad de Firestore
├── .env.example                 # Variables de EmailJS que debes rellenar
├── metadata.json                # Nombre y permisos del panel (cámara)
└── vercel.json · next.config.ts · postcss.config.mjs · package.json · tsconfig.json
```

---

## Seguridad

Este proyecto escribe en una base de datos en la nube, así que conviene tener claro qué está protegido y
qué no. Dos cosas que deberías ajustar **en tu proyecto de Firebase** (son ajustes en la consola de
Google, no en este repositorio):

1. **Las reglas de Firestore.** Las que hay en [`firestore.rules`](firestore.rules) permiten **leer a
   cualquiera** (lo necesita el panel público) pero también, tal como están, **escribir a cualquiera** que
   conozca el identificador del proyecto y la clave web. Cualquiera podría publicar lecturas falsas y
   disparar alertas de correo. La solución recomendada, con el detalle y el texto listo para pegar, está en
   [SECURITY.md](SECURITY.md).
2. **Restringir la clave web de Firebase.** En [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials)
   → tu clave `AIza…` → *Restricciones de aplicaciones* → **Sitios web** → añade tu dominio de Vercel, y en
   *Restricciones de API* deja solo **Cloud Firestore API**.

> La clave que aparece en `firebase-applet-config.json` **no es un secreto**: las claves web de Firebase
> se envían al navegador por diseño. Lo que de verdad protege los datos son las reglas (punto 1) y las
> restricciones (punto 2).

## Licencia

[MIT](LICENSE) © 2026 LockerDocx — puedes usarlo, modificarlo y publicarlo, citando la autoría.

## Créditos

- El andamiaje inicial del panel web salió de un *applet* de **Google AI Studio**; el hardware, el gateway
  y la lógica del sistema son de este proyecto.
- Librerías principales: [Adafruit DHT sensor library](https://github.com/adafruit/DHT-sensor-library),
  [serialport](https://serialport.io/), [Firebase](https://firebase.google.com/),
  [Next.js](https://nextjs.org/) y [Tailwind CSS](https://tailwindcss.com/).

## Otros proyectos

- 🤖 **[firefox-ai-agent](https://github.com/LockerDocx/firefox-ai-agent)** — agente de IA libre que
  conduce tu propio Firefox.
