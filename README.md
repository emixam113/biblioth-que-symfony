# Application de Gestion de Bibliothèque Symfony

Une application de gestion de bibliothèque développée avec Symfony.

## Prérequis

- PHP 8.1 ou supérieur
- Composer
- Symfony CLI
- Base de données (MySQL/PostgreSQL/SQLite)

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/emixam113/biblioth-que-symfony.git
   cd bibliotheque-symfony
   ```

2. Installer les dépendances :
   ```bash
   composer install
   ```

3. Configurer la base de données dans le fichier `.env`

4. Créer la base de données et exécuter les migrations :
   ```bash
   php bin/console doctrine:database:create
   php bin/console doctrine:migrations:migrate
   ```

5. Lancer le serveur de développement :
   ```bash
   symfony server:start
   ```

## Utilisation

Accédez à l'application à l'adresse : http://localhost:8000
