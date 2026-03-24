'use client';

import { motion } from 'motion/react';
import { Terminal, Cpu, Usb, Server, AlertTriangle, Code2, Info, CheckCircle2 } from 'lucide-react';
import firebaseConfig from '../firebase-applet-config.json';

export function ProjectDocumentation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  return (
    <section className="relative z-20 bg-zinc-950 border-t border-zinc-800 text-zinc-300 py-16 px-6 md:px-12 lg:px-24 font-sans overflow-hidden">
      <motion.div 
        className="max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        
        {/* Encabezado */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Info size={16} />
            <span>Documentación del Proyecto</span>
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            PROYECTO: MONITORIZACIÓN CRÍTICA DE CPD
          </h2>
          <p className="text-xl text-zinc-400 leading-relaxed max-w-4xl border-l-4 border-blue-500 pl-6 py-2">
            Bienvenidos a la presentación de este sistema IoT avanzado. Nuestra misión es garantizar la integridad física de los servidores mediante el control térmico en tiempo real, utilizando una arquitectura híbrida de hardware y nube.
          </p>
        </motion.div>

        {/* 1. El Problema y la Solución */}
        <motion.div variants={itemVariants} className="mb-24">
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <AlertTriangle className="text-red-500" />
            Fase 1: Gestión de Riesgos y Alertas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-900 transition-all">
              <div className="text-red-500 font-mono text-xs mb-4 uppercase tracking-widest">Umbral Crítico</div>
              <h4 className="text-white text-xl font-bold mb-3">Protección Térmica</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                El hardware de red es extremadamente sensible. Hemos definido un límite de <strong>28°C</strong>. Al superarse, el sistema entra en estado de emergencia visual y sonora.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-900 transition-all">
              <div className="text-blue-500 font-mono text-xs mb-4 uppercase tracking-widest">Notificación</div>
              <h4 className="text-white text-xl font-bold mb-3">Alerta Remota</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Utilizando el protocolo <strong>EmailJS</strong>, el sistema despacha un informe técnico inmediato a <strong>gerardmp2008@gmail.com</strong>, permitiendo una respuesta remota instantánea.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-900 transition-all">
              <div className="text-green-500 font-mono text-xs mb-4 uppercase tracking-widest">Continuidad</div>
              <h4 className="text-white text-xl font-bold mb-3">Rango Operativo</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                El sistema monitoriza un rango óptimo de <strong>15°C a 29°C</strong>, asegurando que el CPD opere siempre en condiciones de máxima eficiencia energética.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 1. Hardware */}
        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Cpu className="text-blue-400" />
            1. Conexiones Físicas (Hardware)
          </h3>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 hover:border-zinc-700 transition-colors duration-300">
            <p className="mb-6 text-zinc-400">
              Utilizamos un <strong>Arduino Uno</strong> y un sensor de temperatura y humedad <strong>DHT11</strong>. Solo necesitamos 3 cables para conectarlo:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div whileHover={{ y: -5 }} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:border-green-500/30">
                <div className="w-4 h-4 rounded-full bg-green-500 mb-3 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <strong className="text-white mb-1">Cable Verde (Datos)</strong>
                <span className="text-sm text-zinc-500">Del pin DATA del sensor al <strong>Pin 2</strong> del Arduino.</span>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-500/30">
                <div className="w-4 h-4 rounded-full bg-blue-500 mb-3 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <strong className="text-white mb-1">Cable Azul (VCC)</strong>
                <span className="text-sm text-zinc-500">Del pin VCC del sensor al pin <strong>5V</strong> del Arduino (Energía).</span>
              </motion.div>
              
              <motion.div whileHover={{ y: -5 }} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(113,113,122,0.1)] hover:border-zinc-500/30">
                <div className="w-4 h-4 rounded-full bg-zinc-500 mb-3 shadow-[0_0_10px_rgba(113,113,122,0.5)]" />
                <strong className="text-white mb-1">Cable Negro (GND)</strong>
                <span className="text-sm text-zinc-500">Del pin GND del sensor al pin <strong>GND</strong> del Arduino (Masa/Tierra).</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 2. Software */}
        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Code2 className="text-green-400" />
            2. El Código (Software)
          </h3>
          <p className="mb-6 text-zinc-400">
            El sistema funciona en 3 partes: El Arduino lee el sensor, el servidor Node.js recoge esos datos del USB, y la página web los muestra.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Arduino Code */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-zinc-700 hover:shadow-xl">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Terminal size={16} className="text-zinc-400" />
                <span className="text-sm font-mono text-zinc-300">sensor.ino (Arduino / C++)</span>
              </div>
              <div className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
                <pre>
<span className="text-pink-400">#include</span> <span className="text-green-300">&lt;DHT.h&gt;</span>{'\n\n'}
<span className="text-zinc-500">{'// Definimos el pin y el tipo de sensor'}</span>{'\n'}
<span className="text-pink-400">#define</span> DHTPIN 2{'\n'}
<span className="text-pink-400">#define</span> DHTTYPE DHT11{'\n\n'}
<span className="text-blue-400">DHT</span> dht(DHTPIN, DHTTYPE);{'\n\n'}
<span className="text-blue-400">void</span> <span className="text-yellow-200">setup</span>() {'{'}{'\n'}
{'  '}<span className="text-zinc-500">{'// Iniciamos el puerto serie a 9600 baudios'}</span>{'\n'}
{'  '}Serial.<span className="text-yellow-200">begin</span>(9600);{'\n'}
{'  '}dht.<span className="text-yellow-200">begin</span>();{'\n'}
{'}'}{'\n\n'}
<span className="text-blue-400">void</span> <span className="text-yellow-200">loop</span>() {'{'}{'\n'}
{'  '}<span className="text-zinc-500">{'// Leemos temperatura y humedad'}</span>{'\n'}
{'  '}<span className="text-blue-400">float</span> temp = dht.<span className="text-yellow-200">readTemperature</span>();{'\n'}
{'  '}<span className="text-blue-400">float</span> hum = dht.<span className="text-yellow-200">readHumidity</span>();{'\n\n'}
{'  '}<span className="text-zinc-500">{'// Si la lectura es correcta, la enviamos por USB'}</span>{'\n'}
{'  '}<span className="text-pink-400">if</span> (!<span className="text-yellow-200">isnan</span>(temp) && !<span className="text-yellow-200">isnan</span>(hum)) {'{'}{'\n'}
{'    '}Serial.<span className="text-yellow-200">print</span>(temp);{'\n'}
{'    '}Serial.<span className="text-yellow-200">print</span>(<span className="text-green-300">&quot;,&quot;</span>);{'\n'}
{'    '}Serial.<span className="text-yellow-200">println</span>(hum);{'\n'}
{'  '}{'}'}{'\n'}
{'  '}<span className="text-yellow-200">delay</span>(2000); <span className="text-zinc-500">{'// Esperamos 2 segundos'}</span>{'\n'}
{'}'}
                </pre>
              </div>
            </motion.div>

            {/* Node.js Code */}
            <motion.div whileHover={{ scale: 1.01 }} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-zinc-700 hover:shadow-xl">
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Server size={16} className="text-zinc-400" />
                <span className="text-sm font-mono text-zinc-300">server.js (PC Gateway / Firebase)</span>
              </div>
              <div className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
                <pre>
<span className="text-pink-400">const</span> {'{ SerialPort }'} = <span className="text-yellow-200">require</span>(<span className="text-green-300">&quot;serialport&quot;</span>);{'\n'}
<span className="text-pink-400">const</span> {'{ ReadlineParser }'} = <span className="text-yellow-200">require</span>(<span className="text-green-300">&quot;@serialport/parser-readline&quot;</span>);{'\n'}
<span className="text-pink-400">const</span> {'{ initializeApp }'} = <span className="text-yellow-200">require</span>(<span className="text-green-300">&quot;firebase/app&quot;</span>);{'\n'}
<span className="text-pink-400">const</span> {'{ getFirestore, doc, setDoc }'} = <span className="text-yellow-200">require</span>(<span className="text-green-300">&quot;firebase/firestore&quot;</span>);{'\n\n'}
<span className="text-zinc-500">{'// 1. Configuración de Firebase (Copia la tuya aquí)'}</span>{'\n'}
<span className="text-pink-400">const</span> firebaseConfig = {'{'}{'\n'}
{'  '}apiKey: <span className="text-green-300">&quot;{firebaseConfig.apiKey}&quot;</span>,{'\n'}
{'  '}authDomain: <span className="text-green-300">&quot;{firebaseConfig.authDomain}&quot;</span>,{'\n'}
{'  '}projectId: <span className="text-green-300">&quot;{firebaseConfig.projectId}&quot;</span>,{'\n'}
{'  '}storageBucket: <span className="text-green-300">&quot;{firebaseConfig.storageBucket}&quot;</span>,{'\n'}
{'  '}messagingSenderId: <span className="text-green-300">&quot;{firebaseConfig.messagingSenderId}&quot;</span>,{'\n'}
{'  '}appId: <span className="text-green-300">&quot;{firebaseConfig.appId}&quot;</span>{'\n'}
{'}'};{'\n\n'}
<span className="text-pink-400">const</span> app = <span className="text-yellow-200">initializeApp</span>(firebaseConfig);{'\n'}
<span className="text-pink-400">const</span> db = <span className="text-yellow-200">getFirestore</span>(app);{'\n\n'}
<span className="text-zinc-500">{'// 2. Conexión Serial'}</span>{'\n'}
<span className="text-pink-400">const</span> port = <span className="text-pink-400">new</span> <span className="text-yellow-200">SerialPort</span>({'{'} path: <span className="text-green-300">&quot;COM5&quot;</span>, baudRate: <span className="text-orange-300">9600</span> {'}'});{'\n'}
<span className="text-pink-400">const</span> parser = port.<span className="text-yellow-200">pipe</span>(<span className="text-pink-400">new</span> <span className="text-yellow-200">ReadlineParser</span>({'{'} delimiter: <span className="text-green-300">&quot;\r\n&quot;</span> {'}'}));{'\n\n'}
<span className="text-zinc-500">{'// 3. Subida a la nube en tiempo real'}</span>{'\n'}
parser.<span className="text-yellow-200">on</span>(<span className="text-green-300">&quot;data&quot;</span>, <span className="text-pink-400">async</span> line =&gt; {'{'}{'\n'}
{'  '}<span className="text-pink-400">const</span> [temp, hum] = line.<span className="text-yellow-200">split</span>(<span className="text-green-300">&quot;,&quot;</span>);{'\n'}
{'  '}<span className="text-pink-400">if</span> (temp && hum && temp !== <span className="text-green-300">&quot;nan&quot;</span>) {'{'}{'\n'}
{'    '}<span className="text-pink-400">const</span> data = {'{'}{'\n'}
{'      '}temp: <span className="text-yellow-200">parseFloat</span>(temp),{'\n'}
{'      '}hum: <span className="text-yellow-200">parseFloat</span>(hum),{'\n'}
{'      '}timestamp: <span className="text-blue-400">Date</span>.<span className="text-yellow-200">now</span>(){'\n'}
{'    '}{'}'};{'\n'}
{'    '}<span className="text-pink-400">await</span> <span className="text-yellow-200">setDoc</span>(<span className="text-yellow-200">doc</span>(db, <span className="text-green-300">&quot;telemetry&quot;</span>, <span className="text-green-300">&quot;latest&quot;</span>), data);{'\n'}
{'    '}console.<span className="text-yellow-200">log</span>(<span className="text-green-300">&quot;Nube actualizada:&quot;</span>, data);{'\n'}
{'  '}{'}'}{'\n'}
{'}'});
                </pre>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 3. Instrucciones */}
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-orange-400" />
            3. Pasos para subirlo a Vercel
          </h3>
          
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 md:p-8 hover:border-orange-500/40 transition-colors duration-300">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="text-orange-400 shrink-0 mt-1" />
              <p className="text-orange-200 font-medium">
                Al usar Firebase, tu PC envía los datos a la nube y Vercel los lee desde cualquier parte del mundo.
              </p>
            </div>
            
            <ol className="space-y-4 text-zinc-300 list-decimal list-inside marker:text-orange-400 marker:font-bold">
              <li className="pl-2 transition-colors hover:text-white">
                En tu carpeta <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono">arduino-web</code>, instala Firebase: <br/>
                <code className="inline-block mt-2 bg-black/50 text-green-400 px-3 py-1.5 rounded text-sm font-mono border border-zinc-800">npm install firebase</code>
              </li>
              <li className="pl-2 transition-colors hover:text-white">
                Crea un proyecto en <a href="https://console.firebase.google.com/" className="text-blue-400 hover:underline">Firebase Console</a> y activa <strong>Firestore</strong> en modo prueba.
              </li>
              <li className="pl-2 transition-colors hover:text-white">
                Actualiza tu <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono">server.js</code> con el código de arriba y tus credenciales. Ejecútalo con <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono">node server.js</code>.
              </li>
              <li className="pl-2 transition-colors hover:text-white">
                Sube la carpeta de esta web a <strong>GitHub</strong>.
              </li>
              <li className="pl-2 transition-colors hover:text-white">
                Entra en <a href="https://vercel.com" className="text-blue-400 hover:underline">Vercel.com</a>, importa tu repo de GitHub y dale a <strong>Deploy</strong>. ¡Tu web ya es pública!
              </li>
            </ol>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}
