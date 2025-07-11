import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la connexion');
      }

      // Afficher le texte brut de la réponse pour le débogage
      const responseText = await response.text();
      console.log('Réponse brute de connexion :', responseText);
      
      // Essayer de parser la réponse en JSON
      let data;
        data = JSON.parse(responseText);
        console.log('Réponse JSON parsée :', data);
        
        // Vérifier si on a un token dans la réponse
        if (!data.token) {
          throw new Error('Aucun token reçu dans la réponse de connexion');
        }

        const token = data.token;
        console.log('Token reçu, enregistrement dans le localStorage');
        localStorage.setItem('token', token);

        try {
          // Appel à l'endpoint /api/me pour récupérer les informations utilisateur
          console.log('Récupération des informations utilisateur via /api/me...');
          const userResponse = await fetch('http://localhost:8000/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!userResponse.ok) {
            throw new Error(`Erreur ${userResponse.status} lors de la récupération des informations utilisateur`);
          }

          const userData = await userResponse.json();
          console.log('Informations utilisateur reçues :', userData);

          // Stocker les informations utilisateur dans le localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Informations utilisateur enregistrées avec succès');

        } catch (error) {
          console.error('Erreur lors de la récupération des informations utilisateur :', error);
          // Ne pas échouer la connexion pour cette erreur, on a quand même le token
          // On stocke un objet utilisateur avec tous les champs requis
          localStorage.setItem('user', JSON.stringify({
            firstname: 'Utilisateur',
            lastname: '',
            email: email
          }));
        }

      // Redirection vers le tableau de bord
      // Les informations utilisateur seront chargées par le composant Dashboard
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <form onSubmit={handleSubmit} className="card-body">
          <h2 className="text-2xl font-bold text-center">Connexion</h2>

          {errorMsg && (
            <div className="alert alert-error shadow-sm text-sm">
              {errorMsg}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Adresse email</span>
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="input input-bordered"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Mot de passe</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

              <a href="/ResetPassword" className="text-white  p-2 hover:underline">Mot de passe oublié</a>


          <div className="form-control mt-6">
            <button type="submit" className=" border rounded-full p-2  underline cursor-pointer  btn-primary">
              Se connecter
            </button>
          </div>

          <p className="text-sm text-center mt-2">
            Pas encore de compte ?{' '}
            <a href="/register" className="text-blue-500 hover:underline">
              Créer un compte
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
