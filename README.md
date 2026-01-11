# DiabCare Backend

Backend API pour l'application DiabCare - Une application de gestion du diabète.

## Installation

```bash
npm install
```

## Configuration

Le fichier `.env` contient déjà la configuration MongoDB et JWT.

## Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

## Déploiement sur Render

1. Créer un nouveau Web Service sur Render.com
2. Connecter votre repository GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Ajouter les variables d'environnement du fichier .env

## API Endpoints

### Authentification
- POST /api/auth/register - Inscription
- POST /api/auth/login - Connexion
- GET /api/auth/me - Utilisateur actuel

### Glucose
- POST /api/glucose - Ajouter un relevé
- GET /api/glucose - Obtenir tous les relevés
- GET /api/glucose/stats - Obtenir les statistiques
- PUT /api/glucose/:id - Modifier un relevé
- DELETE /api/glucose/:id - Supprimer un relevé

### Médicaments
- POST /api/medications - Ajouter un médicament
- GET /api/medications - Obtenir tous les médicaments
- PUT /api/medications/:id - Modifier un médicament
- DELETE /api/medications/:id - Supprimer un médicament

### Rendez-vous
- POST /api/appointments - Ajouter un rendez-vous
- GET /api/appointments - Obtenir tous les rendez-vous
- GET /api/appointments/upcoming/all - Rendez-vous à venir
- PUT /api/appointments/:id - Modifier un rendez-vous
- DELETE /api/appointments/:id - Supprimer un rendez-vous

### Profil
- GET /api/profile - Obtenir le profil
- PUT /api/profile - Modifier le profil
- PUT /api/profile/password - Changer le mot de passe
