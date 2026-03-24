import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Casa Boreal - Barre en Puebla',
  description: 'Transforma tu cuerpo y mente con clases de Barre en Puebla...',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}