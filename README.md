# Monitor IoT de Sensores en Tiempo Real

Este documento detalla paso a paso la construccion, configuracion y despliegue de un sistema completo de telemetria IoT (Internet of Things). El proyecto lee datos fisicos de temperatura y humedad, los transmite a un ordenador, los sube a una base de datos en la nube y los visualiza en un panel de control web (dashboard) accesible desde cualquier lugar.

Este manual esta disenado para que cualquier persona, incluso sin experiencia previa avanzada, pueda replicar el proyecto desde cero configurando sus propios servicios y credenciales.

---

## 1. Descripcion del Proyecto y Arquitectura

El sistema esta disenado para monitorizar entornos criticos (como un Centro de Procesamiento de Datos o un invernadero) y emitir alertas visuales, sonoras y por correo electronico si los valores superan los limites seguros.

La arquitectura se divide en tres capas principales:

1. Capa de Hardware (Edge): Un microcontrolador Arduino lee los datos de un sensor fisico (DHT11) y los envia por un cable USB utilizando comunicacion serial.
2. Capa de Enlace (Gateway Local): Un script ejecutado en tu ordenador (Node.js) escucha el puerto USB, recoge los datos del Arduino y los envia a una base de datos en la nube (Firebase).
3. Capa de Presentacion (Frontend Cloud): Una aplicacion web alojada en internet (Vercel) lee la base de datos en tiempo real y muestra los graficos. Si detecta anomalias, hace sonar una alarma en el navegador y envia un correo electronico.

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
                                          | (Sincronizacion en Tiempo Real)
                                          v
                              [Aplicacion Web Publica]
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
* Node.js (Version 18 o superior): Entorno de ejecucion para el script local y la web. Descargalo en: https://nodejs.org/
* Arduino IDE: Para programar la placa Arduino. Descargalo en: https://www.arduino.cc/en/software
* Git: Sistema de control de versiones. Descargalo en: https://git-scm.com/
* GitHub Desktop: Interfaz grafica para gestionar tu codigo. Descargalo en: https://desktop.github.com/
* Visual Studio Code (Recomendado): Editor de codigo. Descargalo en: https://code.visualstudio.com/

Cuentas gratuitas necesarias:
* Cuenta de Google (para acceder a Firebase).
* Cuenta de GitHub (para guardar el codigo de la web).
* Cuenta de Vercel (para publicar la web en internet).
* Cuenta de EmailJS (para el envio de correos automaticos).

---

## 3. Configuracion del Arduino

El primer paso es programar el cerebro fisico del proyecto para que lea el sensor y envie los datos al ordenador.

### 3.1. Conexionado fisico
1. Conecta el pin VCC (o +) del sensor DHT11 al pin 5V del Arduino.
2. Conecta el pin GND (o -) del sensor al pin GND del Arduino.
3. Conecta el pin DATA (o OUT) del sensor al Pin Digital 2 del Arduino.

### 3.2. Programacion
1. Abre el programa Arduino IDE.
2. Ve al menu "Programa" > "Incluir Libreria" > "Administrar Librerias...".
3. En el buscador, escribe "DHT sensor library". Busca la que esta creada por "Adafruit" y haz clic en Instalar. (Si te pregunta si deseas instalar dependencias adicionales como "Adafruit Unified Sensor", dile que si).
4. Copia el siguiente codigo y pegalo en el editor, borrando todo lo anterior:

```cpp
#include "DHT.h"

// Definimos el pin digital donde esta conectado el sensor
#define DHTPIN 2     

// Definimos el tipo de sensor (cambiar a DHT22 si usas ese modelo)
#define DHTTYPE DHT11   

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  // Iniciamos la comunicacion con el ordenador a 9600 baudios
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
7. Ve a "Herramientas" > "Puerto" y selecciona el puerto donde esta conectado (ej. COM3, COM5). Anota este numero de puerto, lo necesitaras luego.
8. Haz clic en el boton "Subir" (la flecha hacia la derecha) para programar la placa.

---

## 4. Configuracion de Firebase (Base de Datos)

Firebase almacenara los datos para que la pagina web pueda leerlos desde cualquier parte del mundo.

### 4.1. Crear el proyecto
1. Ve a https://console.firebase.google.com/ e inicia sesion con tu cuenta de Google.
2. Haz clic en "Crear un proyecto" o "Anadir proyecto".
3. Ponle un nombre (ej. "Monitor-IoT") y haz clic en Continuar.
4. Puedes desactivar Google Analytics para este proyecto, no es necesario. Haz clic en "Crear proyecto".

### 4.2. Crear la base de datos (Firestore)
1. En el menu lateral izquierdo, despliega "Compilacion" (Build) y selecciona "Firestore Database".
2. Haz clic en "Crear base de datos".
3. Selecciona una ubicacion cercana a ti y haz clic en Siguiente.
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
3. Haz clic en el boton "Publicar" para guardar los cambios.

### 4.4. Obtener las credenciales de conexion
1. En el menu lateral izquierdo, arriba del todo, haz clic en el icono del engranaje y selecciona "Configuracion del proyecto".
2. En la pestana "General", baja hasta la seccion "Tus aplicaciones".
3. Haz clic en el icono web (</>) para anadir una aplicacion web.
4. Ponle un apodo (ej. "Dashboard Web") y haz clic en "Registrar app".
5. Aparecera un bloque de codigo con una variable llamada `firebaseConfig`. Copia los valores que hay dentro de ese bloque (apiKey, authDomain, projectId, etc.). Guardalos en un bloc de notas, los necesitaras para el script local y para la pagina web.

---

## 5. Configuracion del Servicio de Correos (EmailJS)

Este servicio permite que la pagina web envie correos electronicos sin necesidad de programar un servidor de correos complejo.

1. Ve a https://www.emailjs.com/ y crea una cuenta gratuita.
2. En el panel de control, ve a la seccion "Email Services" y haz clic en "Add New Service".
3. Selecciona "Gmail" (o tu proveedor), conecta tu cuenta y haz clic en "Create Service".
4. Anota el "Service ID" que se ha generado (suele ser algo como `service_xxxxx`).
5. Ve a la seccion "Email Templates" y haz clic en "Create New Template".
6. En la pestana "Code" o "HTML" de la plantilla, pega el siguiente diseno:

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
    <p style="color: #666; line-height: 1.6;">Se ha detectado una anomalia en los sensores del CPD que requiere atencion inmediata.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Tipo de Alerta</td>
        <td style="padding: 10px 0; color: #1a1a1a; font-weight: bold; text-align: right;">{{alert_type}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; color: #999; font-size: 13px; text-transform: uppercase;">Ubicacion</td>
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
      <h4 style="margin: 0 0 10px; color: #1a1a1a; text-transform: uppercase; font-size: 12px;">Accion Requerida:</h4>
      <p style="margin: 0; color: #444; font-size: 14px;">{{action_required}}</p>
    </div>
    
    <div style="text-align: center; font-size: 11px; color: #aaa; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
      Estado del Sistema: <span style="color: #666; font-weight: bold;">{{system_status}}</span><br>
      Este es un mensaje automatico generado por el sistema de telemetria.
    </div>
  </div>
</div>
```

7. En la pestana "Settings" de la plantilla, configura el campo "Subject" (Asunto) asi: `{{alert_title}} [{{severity}}] - {{location}}`
8. Guarda la plantilla (Boton Save). Anota el "Template ID" (suele ser algo como `template_xxxxx`).
9. Ve a la seccion "Account" en el menu principal, luego a la pestana "API Keys". Ahi encontraras tu "Public Key". Anotala tambien.

---

## 6. Configuracion del Script Local (Gateway Node.js)

Este script se ejecuta en tu ordenador. Su funcion es escuchar el puerto USB donde esta el Arduino y reenviar esos datos a Firebase.

1. En tu ordenador, crea una carpeta nueva llamada `arduino-gateway`.
2. Abre una terminal de comandos (Simblo del sistema, PowerShell o Terminal de Mac) y navega hasta esa carpeta.
3. Ejecuta los siguientes comandos uno por uno para inicializar el proyecto e instalar las librerias necesarias:
   ```bash
   npm init -y
   npm install serialport firebase
   ```
4. Abre la carpeta en tu editor de codigo (Visual Studio Code) y crea un archivo llamado `server.js`.
5. Pega el siguiente codigo en `server.js`. 
6. Modifica la seccion `firebaseConfig` con los datos que obtuviste en el paso 4.4.
7. Modifica la variable `path: "COM5"` con el puerto real donde esta conectado tu Arduino (el que anotaste en el paso 3.2).

```javascript
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

// 1. Configuracion de Firebase (REEMPLAZA ESTOS VALORES CON LOS TUYOS)
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

// 2. Conexion con Arduino (REEMPLAZA "COM5" POR TU PUERTO REAL)
// En Windows suele ser COM3, COM4, etc. En Mac/Linux suele ser /dev/ttyUSB0 o similar.
const port = new SerialPort({ path: "COM5", baudRate: 9600 });
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

    // Si la conversion fue exitosa y son numeros validos
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
  console.error('Error en el puerto serie. Comprueba que el puerto es correcto y que el Monitor Serie de Arduino IDE esta cerrado. Detalle:', err.message);
});
```

---

## 7. Frontend y Control de Versiones (GitHub)

El codigo de la interfaz web (frontend) esta construido con Next.js, React y Tailwind CSS. 

1. Asegurate de tener todo el codigo del frontend en una carpeta en tu ordenador.
2. Abre el programa GitHub Desktop.
3. Ve a "File" > "Add Local Repository" y selecciona la carpeta del frontend.
4. Haz clic en "Publish Repository" para subir el codigo a tu cuenta de GitHub. Mantenlo como repositorio privado o publico segun prefieras.

---

## 8. Despliegue en Vercel (Puesta en Produccion)

Vercel es la plataforma que alojara nuestra pagina web para que este disponible en internet 24/7.

1. Ve a https://vercel.com/ y registrate usando tu cuenta de GitHub.
2. En el panel principal, haz clic en "Add New..." y selecciona "Project".
3. Aparecera una lista con tus repositorios de GitHub. Busca el que acabas de subir y haz clic en "Import".
4. Antes de hacer clic en Deploy, despliega la seccion "Environment Variables" (Variables de entorno).
5. Aqui debes anadir todas las credenciales para que la web pueda conectarse a Firebase y a EmailJS. Anade una por una las siguientes variables (el nombre exacto a la izquierda, y tu valor a la derecha):

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
5. Prueba el sistema: Aplica calor o aliento al sensor fisico DHT11. Veras como la grafica sube en tiempo real. Si supera los umbrales de peligro, la pantalla parpadeara en rojo, sonara la alarma y recibiras un correo electronico.

---

## 10. Solucion de Problemas Comunes

* Error "Access to the port is denied" al ejecutar server.js: Esto ocurre porque otro programa esta usando el puerto del Arduino. Normalmente es el "Monitor Serie" del propio Arduino IDE. Cierra el Monitor Serie o cierra el Arduino IDE por completo y vuelve a ejecutar `node server.js`.
* El script server.js dice "Error al convertir a numero": Significa que el Arduino esta enviando texto basura o el formato no es exactamente `T:25.00,H:60.00`. Revisa el codigo subido al Arduino.
* La pagina web carga pero no muestra datos: Revisa las variables de entorno en Vercel. Si te equivocaste al copiar la API Key de Firebase, la web no podra conectarse a la base de datos.
* Los correos no llegan: Verifica que las variables de EmailJS en Vercel son correctas. Comprueba tambien en el panel de EmailJS si has agotado el limite gratuito mensual de correos.
* Error de permisos en Firebase: Si la consola del navegador muestra un error de "Missing or insufficient permissions", significa que no guardaste correctamente las reglas de seguridad en el paso 4.3.

---

## 11. Estructura del Proyecto Frontend

Para referencia, esta es la organizacion de los archivos del codigo de la pagina web (Next.js):

```text
/
├── app/                  # Configuracion de rutas de Next.js
│   ├── globals.css       # Estilos generales y configuracion de Tailwind
│   ├── layout.tsx        # Estructura base del documento HTML
│   └── page.tsx          # Pagina principal donde se ensambla el dashboard
├── components/           # Componentes visuales e interactivos
│   ├── LiveMetrics.tsx   # Graficos, lectura de Firebase y logica de alertas
│   ├── GestureAuth.tsx   # Sistema de desbloqueo de alarma mediante camara
│   └── ui/               # Componentes basicos de interfaz
├── lib/                  # Archivos de configuracion
│   └── firebase.ts       # Inicializacion del cliente de Firebase
├── store/                # Gestion del estado global de la aplicacion
├── public/               # Imagenes, iconos y recursos estaticos
├── package.json          # Lista de dependencias y librerias del proyecto
└── tailwind.config.ts    # Configuracion del sistema de diseno
```
