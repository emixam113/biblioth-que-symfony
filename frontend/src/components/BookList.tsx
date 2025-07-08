import { useEffect, useState } from "react";
import { FaBookOpen, FaUser, FaTag, FaCalendarAlt } from "react-icons/fa";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { fetchWithAuth } from "../utils/api";

interface Book {
  id: number;
  title: string;
  author: string;
  published_date: string;
  is_available: boolean;
  category: string;
}

interface BookListProps {
  onBookDeleted?: () => void;
}

export default function BookList({ onBookDeleted }: BookListProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const deleteBook = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      return;
    }

    setIsDeleting(id);
    try {
      await fetchWithAuth(`/books/${id}`, {
        method: 'DELETE',
      });

      // Mettre à jour la liste des livres localement
      const updatedBooks = books.filter(book => book.id !== id);
      setBooks(updatedBooks);
      
      // Notifier le composant parent du changement
      if (onBookDeleted) {
        onBookDeleted();
      }
      
      // Pas besoin d'afficher de notification ici, elle sera gérée par le WebSocket
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression du livre');
    } finally {
      setIsDeleting(null);
    }
  };

  const fetchBooks = async () => {
    try {
      const data = await fetchWithAuth("/books");
      setBooks(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des livres", error);
      if ((error as any).status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    fetchBooks();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      // Annuler les requêtes en cours si nécessaire
    };
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <FaBookOpen className="text-3xl text-white" />
        <h2 className="text-3xl font-bold text-white">Liste des livres</h2>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {books.map((book) => (
          <li
            key={book.id}
            className="card bg-base-100 shadow-md border border-base-200 rounded-lg p-5"
          >
            <h3 className="card-title flex items-center gap-2">
              <FaBookOpen className="text-white" />
              {book.title}
            </h3>
            <p className="flex items-center gap-2 text-sm text-white mt-2">
              <FaUser /> {book.author}
            </p>
            <p className="flex items-center gap-2 text-sm text-white">
              <FaTag /> {book.category}
            </p>
            <div className="flex items-center gap-2 text-sm text-white">
              {book.is_available ? (
                <div className="flex items-center gap-2">
                  <MdCheckCircle className="text-green-500" />
                  <span>Disponible</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBook(book.id);
                    }}
                    disabled={isDeleting === book.id}
                    className="ml-2 px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center gap-1"
                    title="Supprimer le livre"
                  >
                    {isDeleting === book.id ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        Suppression...
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <MdCancel className="text-red-600" /> Indisponible
                </>
              )}
            </div>
            <p className="flex items-center gap-2 text-sm text-white mt-1">
              <FaCalendarAlt /> 
              {book.published_date 
                ? new Date(book.published_date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Date non spécifiée'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}