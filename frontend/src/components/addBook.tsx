import { useState } from "react";

interface AddBookProps {
  onBookAdded: () => void;
}

export default function AddBook({ onBookAdded }: AddBookProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [category, setCategory] = useState("");

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setPublishedDate("");
    setIsAvailable(true);
    setCategory("");
  };

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8000/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          author,
          published_date: publishedDate,
          is_available: isAvailable,
          category,
        }),
      });

      if (response.ok) {
        resetForm();
        if (onBookAdded) {
          onBookAdded();
        }
      }
      // Pas de notification ici, conforme à ta demande
    } catch (err) {
      // Pour l’instant, ne rien faire en cas d’erreur (selon ta demande)
    }
  };

  return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-[var(--color-accent)]">
          Ajouter un livre dans la bibliothèque
        </h2>
        <form onSubmit={addBook} className="space-y-4 text-black">
          <div>
            <label htmlFor="title" className="block  font-medium">
              Titre
            </label>
            <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border-black text-black rounded"
                placeholder="Titre"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-black font-medium">
              Auteur
            </label>
            <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="w-full p-2 border border-black rounded"
                placeholder="Auteur"
            />
          </div>

          <div>
            <label htmlFor="publishedDate" className="block text-black font-medium">
              Date de publication
            </label>
            <input
                id="publishedDate"
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                required
                className="w-full p-2 border border-black text-black rounded"
            />
          </div>

          <div>
            <label htmlFor="isAvailable" className="block text-black font-medium">
              Disponibilité
            </label>
            <select
                id="isAvailable"
                value={isAvailable ? "true" : "false"}
                onChange={(e) => setIsAvailable(e.target.value === "true")}
                className="w-full p-2 border border-black rounded"
            >
              <option value="true">Disponible</option>
              <option value="false">Indisponible</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-black font-medium">
              Catégorie
            </label>
            <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-2 border border-black rounded"
                placeholder="Catégorie"
            />
          </div>

          <div className="flex justify-between">
            <button
                type="submit"
                className="text-white underline rounded-full bg-wood px-4 py-2 rounde cursor-pointer"
            >
              Ajouter dans la bibliothèque
            </button>
            <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
  );
}