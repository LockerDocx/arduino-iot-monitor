import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Environmental Telemetry | Real-Time IoT Sensor Monitor',
  description:
    'Real-time temperature and humidity monitoring dashboard: Arduino + DHT11 sensor, Firebase Firestore and email alerts for data centres, server rooms and greenhouses.',
  keywords: [
    'IoT monitor',
    'temperature and humidity sensor',
    'Arduino DHT11',
    'Firebase Firestore',
    'real-time telemetry dashboard',
    'server room monitoring',
    'data centre monitoring',
  ],
  openGraph: {
    title: 'Environmental Telemetry | Real-Time IoT Sensor Monitor',
    description:
      'Temperature and humidity monitored in real time: Arduino + DHT11, Firebase Firestore and email alerts.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
