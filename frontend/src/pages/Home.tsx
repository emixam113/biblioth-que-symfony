import { Link } from "react-router-dom";
import logo from '../assets/logo.png';

export default function Home() {
    return (
        
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="flex items-center justify-center gap-6 mb-6">
                <img src={logo} alt="logo" className="w-16 h-16 md:w-40 md:h-40"/>
                <h1 className="text-4xl md:text-5xl font-bold text-blue-600">Bienvenue sur BookManager</h1>
            </div>
            <p className="text-lg text-gray-600 mb-10">Organiser vos Lecture, suivez vos livre préférés et gérez votre bibliothèque personnelle.</p>
            <div className="flex space-x-4">
                <Link to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg">Se connecter</Link>

                <Link to="/signup"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-lg">S'inscrire</Link>

            </div>
        </main>
    )
}