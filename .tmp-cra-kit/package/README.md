# Create React Vite App Kit

![npm](https://img.shields.io/npm/v/create-react-vite-app-kit)
![license](https://img.shields.io/npm/l/create-react-vite-app-kit)
![downloads](https://img.shields.io/npm/dm/create-react-vite-app-kit)

Un générateur de projets React + Vite permettant de créer rapidement une application avec une architecture prête pour la production.

## 🎯 Objectif

Ce projet a pour objectif de standardiser la structure des applications React au sein de mes projets afin de :

- Gagner du temps lors du démarrage d'un nouveau projet.
- Éviter de recréer la même architecture à chaque fois.
- Garantir une organisation cohérente du code.
- Faciliter la maintenance et l'évolutivité des applications.
- Fournir une base solide pour les projets professionnels.

## 🚀 Fonctionnalités

- Génération automatique d'un projet React + Vite.
- Architecture Feature-Based.
- Structure prête pour la montée en charge.
- Configuration initiale du routage.
- Initialisation de RTK Query
- Axios avec gestion des intercepteurs et refresh token automatique
- Organisation claire des composants, pages, hooks et services.
- Installation automatique des dépendances.

## 📁 Structure générée

```text
src/
├── assets/
├── core/
├── features/
├── shared/
└── main.jsx
```

## 📦 Installation

Utilisation directe avec npx :

```bash
npx create-react-vite-app-kit mon-projet
```

Ou après installation globale :

```bash
npm install -g create-react-vite-app-kit
```

Puis :

```bash
create-my-react-app mon-projet
```

## ⚙️ Utilisation

Créer un nouveau projet :

```bash
create-my-react-app mon-application
```

Accéder au projet :

```bash
cd mon-application
```

Lancer le serveur de développement :

```bash
npm run dev
```

## 🛠️ Technologies

- React
- Vite
- JavaScript
- Node.js

## 📌 Cas d'utilisation

Ce générateur est particulièrement adapté pour :

- Applications métier
- Tableaux de bord administratifs
- ERP
- CRM
- Applications SaaS
- E-commerce
- Applications de gestion

## 🤝 Contribution

Les contributions, suggestions et retours sont les bienvenus.

## 📄 Licence

MIT License
