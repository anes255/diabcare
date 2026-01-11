# DiabCare Backend

Backend API pour l'application DiabCare - Gestion du diabète

## Installation

```bash
npm install
```

## Configuration

Le backend est déjà configuré pour se connecter à MongoDB Atlas avec l'URL fournie.

## Démarrage

```bash
npm start
```

Le serveur démarre sur le port 5000.

## Déploiement sur Render

1. Créez un compte sur Render.com
2. Créez un nouveau Web Service
3. Connectez votre repository GitHub
4. Utilisez ces paramètres:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

## Endpoints API

### Auth
- POST `/api/auth/register` - Créer un compte
- POST `/api/auth/login` - Se connecter

### Glucose
- GET `/api/glucose` - Obtenir toutes les mesures
- GET `/api/glucose/recent` - Obtenir les mesures des 30 derniers jours
- POST `/api/glucose` - Ajouter une mesure
- DELETE `/api/glucose/:id` - Supprimer une mesure

### Médicaments
- GET `/api/medication` - Obtenir tous les médicaments
- POST `/api/medication` - Ajouter un médicament
- PUT `/api/medication/:id` - Modifier un médicament
- DELETE `/api/medication/:id` - Supprimer un médicament

### Rendez-vous
- GET `/api/appointment` - Obtenir tous les rendez-vous
- GET `/api/appointment/upcoming` - Obtenir les rendez-vous à venir
- POST `/api/appointment` - Ajouter un rendez-vous
- PUT `/api/appointment/:id` - Modifier un rendez-vous
- DELETE `/api/appointment/:id` - Supprimer un rendez-vous
