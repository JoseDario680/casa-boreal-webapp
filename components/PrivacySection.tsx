import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';

const privacyConfig = [
  { id: 'show_name', title: 'Mostrar mi nombre en lista de participantes', description: 'Permite que otros vean tu nombre en las listas de clase.' },
  { id: 'allow_contact', title: 'Permitir que instructores me contacten', description: 'Los instructores podrán enviarte mensajes relacionados con tus clases.' },
  { id: 'share_stats', title: 'Compartir estadísticas anónimas', description: 'Tus estadísticas se compartirán de forma anónima para mejorar el servicio.' },
];

const PrivacySection = () => {
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const response = await fetch('/api/user/privacy');
        if (!response.ok) throw new Error('Error al cargar configuraciones de privacidad');
        const data = await response.json();
        console.log(data); // Aquí puedes manejar las configuraciones de privacidad
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Error desconocido');
        }
      }
    };
    fetchPrivacySettings();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Privacidad</h2>
      <ul>
        {privacyConfig.map(({ id, title, description }) => (
          <li key={id} className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button
              className="w-10 h-6 rounded-full bg-gray-300"
              onClick={() => alert(`Toggle ${id}`)}
            >
              <span className="block w-4 h-4 bg-white rounded-full transform transition-transform"></span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <button className="bg-casaOlive text-white px-4 py-2 rounded-lg">
          Descargar mi información
        </button>
        <a href="/privacy-policy" className="text-blue-500 ml-4 hover:underline">
          Política de privacidad
        </a>
      </div>
    </div>
  );
};

export default PrivacySection;