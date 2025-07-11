import { useAuth } from "../hooks/useAuth";
import AddBook from "../components/addBook";
import BookList from "../components/BookList";
import AvailableChart from "../components/AvailableChart";

export default function Dashboard() {
    const { user, logout, loading, error } = useAuth();


    if(loading) {
        return <div>Chargement des données utilisateurs...</div>
    }
    if(error) {
        return <div className="text-danger">{error}</div>
    }

    return (
        <div>
            <p className="text-2xl">Bienvenue {user?.firstname || "Utilisateur"}</p>
            <button
                onClick={logout}
                className="underline border-2 rounded-full bg-danger text-black p-2"
                aria-label="Se déconnecter"
            >
                Se déconnecter
            </button>
            <div className='flex flex-col gap-8 p-4'>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Ajouter un livre</h2>
                        <AddBook onBookAdded={() => {}} />

                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <AvailableChart />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Liste des livres</h2>
                    <BookList />
                </div>
            </div>
        </div>
    );
}
