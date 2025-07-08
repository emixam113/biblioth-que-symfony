import { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
} from 'chart.js';
import { FaSpinner } from 'react-icons/fa';

// Enregistrement des composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Définition des types
type Book = {
  id: number;
  title: string;
  author: string;
  is_available: boolean;
  category?: string;
  published_date?: string;
};

type ChartDataType = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
};

const AvailableChart = () => {
  const [chartData, setChartData] = useState<ChartDataType>({ 
    labels: [], 
    datasets: [] 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    console.log('Début du chargement des données...');
    try {
      const token = localStorage.getItem('token');
      console.log('Token présent dans le localStorage:', !!token);
      
      console.log('Appel à fetchWithAuth...');
      const response = await fetch('http://localhost:8000/api/books', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse du serveur:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur de l\'API:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la récupération des données');
      }
      
      const data = await response.json();
      console.log('Données reçues de l\'API:', data);
      
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data);
        throw new Error('Les données reçues ne sont pas un tableau');
      }
      
      updateChartData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      if ((error as any).status === 401) {
        console.log('Non authentifié, redirection vers la page de connexion');
        window.location.href = '/login';
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Détails de l\'erreur:', error);
        setError(`Impossible de charger les données des livres: ${errorMessage}`);
      }
    } finally {
      console.log('Chargement terminé');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Connexion WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;
    let isMounted = true; // Pour éviter les mises à jour d'état après le démontage

    const connectWebSocket = () => {
      try {
        console.log("🔌 Tentative de connexion WebSocket...");
        socket = new WebSocket("ws://localhost:8081");

        socket.onopen = () => {
          console.log("✅ Connexion WebSocket établie avec succès");
          reconnectAttempts = 0; // Réinitialiser le compteur de reconnexion
          if (isMounted) {
            setError(null); // Effacer les erreurs précédentes
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📢 Notification WebSocket reçue:", data);
            
            // Rafraîchir les données à chaque notification
            fetchBooks();
            
            // Afficher une notification à l'utilisateur
            if (data.type === 'book_update') {
              const message = data.available 
                ? `Le livre "${data.title}" est maintenant disponible`
                : `Le livre "${data.title}" a été emprunté`;
              
              // Utiliser la notification système du navigateur si disponible
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Mise à jour de la bibliothèque', {
                  body: message,
                  icon: '/logo192.png'
                });
              }
              
              // Afficher aussi dans la console pour le débogage
              console.log(`📚 ${message}`);
            }
          } catch (err) {
            console.error("Erreur lors du traitement du message WebSocket:", err);
          }
        };

        socket.onerror = (event: Event) => {
          const errorMessage = '❌ Erreur WebSocket: ' + 
            (event instanceof ErrorEvent ? event.message : 'Erreur inconnue');
          console.error(errorMessage, event);          
          if (isMounted) {
            setError("Erreur de connexion en temps réel");
          }
          
          // Tenter de se reconnecter
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Backoff exponentiel
            console.log(`⏳ Tentative de reconnexion ${reconnectAttempts + 1}/${maxReconnectAttempts} dans ${delay/1000} secondes...`);
            reconnectTimeout = setTimeout(connectWebSocket, delay);
            reconnectAttempts++;
          } else {
            console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
          }
        };

        socket.onclose = (event) => {
          console.log(`🚪 Connexion WebSocket fermée (${event.reason || 'Raison inconnue'})`);
          
          // Ne tenter de se reconnecter que si la fermeture était inattendue
          if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Tentative de reconnexion dans ${delay/1000} secondes...`);
            reconnectTimeout = setTimeout(connectWebSocket, delay);
            reconnectAttempts++;
          }
        };

      } catch (err) {
        console.error("❌ Erreur lors de l'initialisation de la connexion WebSocket:", err);
        setError("Impossible de se connecter au service de mise à jour en temps réel");
      }
    };

    // Démarrer la connexion
    connectWebSocket();

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('🧹 Nettoyage de la connexion WebSocket...');
      isMounted = false;
      
      if (socket) {
        // Désactiver les gestionnaires d'événements
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Déconnexion normale');
        }
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [fetchBooks]);

  const updateChartData = (books: Book[]) => {
    console.log('Mise à jour des données du graphique avec', books.length, 'livres');
    // Compter le nombre de livres disponibles et non disponibles
    const availableCount = books.filter(book => book.is_available).length;
    const unavailableCount = books.length - availableCount;
    console.log('Disponibles:', availableCount, 'Indisponibles:', unavailableCount);

    setChartData({
      labels: ['Disponibles', 'Empruntés'],
      datasets: [
        {
          label: 'Nombre de livres',
          data: [availableCount, unavailableCount],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Disponibilité des livres',
        color: '#ffffff',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#ffffff',
          stepSize: 1
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl mb-2 text-white" />
        <p className="text-white">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur : </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  console.log('Chart Data:', chartData);
  console.log('Options:', options);
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Statut des livres</h2>
      <div className="h-64">
        {chartData.labels.length > 0 ? (
          <Bar 
            data={chartData} 
            options={options} 
            redraw
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white">Aucune donnée disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableChart;