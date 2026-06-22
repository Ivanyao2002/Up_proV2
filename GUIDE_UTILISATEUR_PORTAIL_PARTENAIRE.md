# Guide Utilisateur - Portail Partenaire UpJunoo

## Table des matières

1. [Introduction](#introduction)
2. [Connexion et accès](#connexion-et-accès)
3. [Tableau de bord](#tableau-de-bord)
4. [Gestion de la flotte](#gestion-de-la-flotte)
   - [Liste des véhicules](#liste-des-véhicules)
   - [Détail d'un véhicule](#détail-dun-véhicule)
   - [Ajouter un véhicule](#ajouter-un-véhicule)
   - [Assigner un chauffeur](#assigner-un-chauffeur)
5. [Gestion des chauffeurs](#gestion-des-chauffeurs)
   - [Liste des chauffeurs](#liste-des-chauffeurs)
   - [Détail d'un chauffeur](#détail-dun-chauffeur)
   - [KYC et documents](#kyc-et-documents)
6. [Carte live](#carte-live)
7. [Réservations](#réservations)
8. [Courses](#courses)
9. [Performance](#performance)
10. [Fret](#fret)
    - [Expéditions](#expéditions)
    - [Suivi des colis](#suivi-des-colis)
    - [Tarifs fret](#tarifs-fret)
11. [Location](#location)
    - [Véhicules disponibles](#véhicules-disponibles)
    - [Réservations location](#réservations-location)
    - [Contrats et facturation](#contrats-et-facturation)
12. [Glossaire](#glossaire)

---

## Introduction

Le **Portail Partenaire UpJunoo** vous permet de gérer votre flotte de véhicules, vos chauffeurs, suivre les courses en temps réel et consulter vos performances.

### Rôles et accès

| Rôle | Accès |
|------|-------|
| **Administrateur Partenaire** | Accès complet à tous les modules |
| **Gestionnaire de flotte** | Gestion des véhicules et chauffeurs |
| **Opérateur** | Consultation des courses et réservations |

---

## Connexion et accès

1. Accédez à l'URL : `https://pro.upjunoo.com`
2. Saisissez votre **email** et **mot de passe**
3. Cliquez sur **"Se connecter"**

> **Note** : En cas d'oubli de mot de passe, utilisez le lien **"Mot de passe oublié"** pour le réinitialiser.

---

## Tableau de bord

Le tableau de bord affiche un résumé de votre activité :

- **Nombre de véhicules** actifs
- **Nombre de chauffeurs** en ligne
- **Courses aujourd'hui**
- **Chiffre d'affaires** du jour
- **Alertes** (véhicules à valider, documents expirants)

---

## Gestion de la flotte

### Liste des véhicules

Accédez via le menu : **Ma Flotte → Véhicules**

La liste affiche :
- **Immatriculation** : Numéro de plaque
- **Marque/Modèle** : Ex: Toyota Corolla
- **Chauffeur affecté** : Nom du chauffeur assigné ou "Non assigné"
- **Année** : Année de fabrication
- **Couleur** : Couleur du véhicule
- **Type & Service** : Catégorie (Taxi, Economique...)
- **Statut** : Approuvé, En validation, Rejeté, Brouillon

#### Filtres disponibles
- **Période** : Tout, Aujourd'hui, Hier, 3 jours, 7 jours
- **Statut** : Approuvés, En validation, Rejetés, Brouillons
- **Recherche** : Marque, plaque, chauffeur...

#### Actions
- **Exporter** : CSV ou Excel
- **Pagination** : 25, 50 ou 100 lignes par page

### Détail d'un véhicule

Cliquez sur un véhicule dans la liste pour voir :

#### Informations générales
- **Plaque** : Numéro d'immatriculation
- **Type & Service** : Catégorie de véhicule
- **Année · Couleur** : Détails du véhicule
- **Places** : Nombre de passagers
- **Chauffeur** : Nom du chauffeur ou "Non assigné"
- **Créé le** : Date d'ajout
- **Approuvé le** : Date d'approbation (si applicable)

#### Statut d'approbation
Un badge indique le statut :
- **🟢 Approuvé** : Le véhicule peut prendre des courses
- **🟠 En validation** : En attente de validation par UpJunoo
- **🔴 Rejeté** : Documents non conformes, à corriger
- **⚪ Brouillon** : Création en cours, non soumise

#### Carte grise
La section **"Carte grise"** permet de :
- **Visualiser** le document déjà téléversé
- **Téléverser** une nouvelle carte grise (JPG, PNG, PDF - max 5 Mo)
- **Voir le statut** : Approuvé, En attente, Rejeté

> **Important** : Le véhicule doit avoir une carte grise **approuvée** pour être opérationnel.

### Ajouter un véhicule

1. Dans la liste des véhicules, cliquez sur **"Ajouter un véhicule"**
2. Remplissez le formulaire :
   - **Marque** : Sélectionnez dans la liste
   - **Modèle** : Dépend de la marque choisie
   - **Année** : Année de fabrication
   - **Couleur** : Couleur du véhicule
   - **Immatriculation** : Numéro de plaque
   - **Type de service** : Taxi, Economique...
3. Téléversez la **carte grise**
4. (Optionnel) Ajoutez un **chauffeur** et ses documents
5. Cliquez sur **"Créer le véhicule"**

### Assigner un chauffeur

Si un véhicule est **approuvé** mais **sans chauffeur**, un message apparaît :

> *"Ce véhicule peut être assigné à un chauffeur et prendre des courses."*

**Pour assigner un chauffeur :**
1. Cliquez sur le bouton **"Assigner un chauffeur"**
2. Sélectionnez un chauffeur dans la liste
3. Cliquez sur **"Assigner"**

> **Note** : Seuls les chauffeurs avec statut KYC "Approuvé" peuvent être assignés.

---

## Gestion des chauffeurs

### Liste des chauffeurs

Accédez via : **Ma Flotte → Chauffeurs**

Informations affichées :
- **Nom** : Prénom et nom
- **Code** : Code chauffeur unique
- **Téléphone** : Numéro de contact
- **Véhicule** : Véhicule assigné
- **Statut KYC** : Approuvé, En validation, Rejeté
- **Disponibilité** : En ligne, Hors ligne, En course

### Détail d'un chauffeur

La page détail affiche :

#### Informations
- **Nom complet**
- **Code chauffeur**
- **Téléphone**
- **Email**
- **Zone d'activité**
- **Véhicule assigné**

#### Portefeuille mobile
- **Solde total**
- **Montant retirable** : Peut être transféré
- **Montant non-retirable** : Bonus et promotions

#### Performance
- **Courses totales**
- **Note moyenne**
- **Revenus générés**

#### Documents KYC
Liste des documents du chauffeur :
- **CNI** (Carte Nationale d'Identité)
- **Permis de conduire**
- **Photo selfie**
- **Assurance** (si applicable)

### KYC et documents

#### Statuts KYC
- **✅ Approuvé** : Le chauffeur peut prendre des courses
- **⏳ En validation** : Documents en cours de vérification
- **❌ Rejeté** : Documents non conformes

#### Mise à jour des documents
1. Allez sur la fiche du chauffeur
2. Section **"Documents"**
3. Cliquez sur le document à mettre à jour
4. Téléversez le nouveau fichier

---

## Carte live

Accédez via : **Ma Flotte → Carte live**

Visualisez en temps réel :
- **Position des chauffeurs** en ligne
- **Courses en cours**
- **Zones de couverture**

#### Légende
- 🟢 **Vert** : Chauffeur disponible
- 🔵 **Bleu** : Chauffeur en course
- 🟠 **Orange** : Chauffeur en attente d'affectation
- ⚫ **Gris** : Chauffeur hors ligne

#### Actions
- **Zoom** : Sur une zone spécifique
- **Filtrer** : Par statut de disponibilité
- **Suivre** : Cliquez sur un chauffeur pour voir ses détails

---

## Réservations

Accédez via : **Ma Flotte → Réservations**

Gérez les courses programmées par vos clients :

#### Informations
- **Date et heure** de prise en charge
- **Client** : Nom et contact
- **Trajet** : Départ → Arrivée
- **Véhicule assigné**
- **Chauffeur assigné**
- **Statut** : Confirmée, En attente, Terminée, Annulée

#### Actions
- **Créer** une nouvelle réservation
- **Modifier** une réservation existante
- **Annuler** une réservation
- **Affecter** un chauffeur spécifique

---

## Courses

Accédez via : **Ma Flotte → Courses**

Historique de toutes les courses :

#### Filtres
- **Période** : Date de début/fin
- **Statut** : Terminée, Annulée, En cours
- **Chauffeur** : Filtrer par chauffeur
- **Véhicule** : Filtrer par véhicule

#### Informations par course
- **ID de course**
- **Date/heure**
- **Client**
- **Départ → Arrivée**
- **Chauffeur**
- **Montant**
- **Statut**

---

## Performance

Accédez via : **Ma Flotte → Performance**

Tableau de bord analytique :

#### Indicateurs clés
- **Nombre de courses** (période sélectionnée)
- **Chiffre d'affaires total**
- **Panier moyen** par course
- **Taux de conversion**
- **Satisfaction client** (notes moyennes)

#### Graphiques
- **Évolution des courses** (courbe temporelle)
- **Répartition par type de service**
- **Performance par chauffeur**
- **Performance par véhicule**

#### Export
Téléchargez les rapports en **PDF** ou **Excel**.

---

## Fret

Accédez via : **Ma Flotte → Fret**

Gérez vos services de transport de marchandises.

### Expéditions

Liste de toutes les expéditions fret :

| Information | Description |
|-------------|-------------|
| **N° expédition** | Identifiant unique de l'envoi |
| **Expéditeur** | Nom et contact de l'expéditeur |
| **Destinataire** | Nom et contact du destinataire |
| **Origine** | Lieu de prise en charge |
| **Destination** | Lieu de livraison |
| **Poids/Volume** | Caractéristiques du colis |
| **Véhicule assigné** | Camionnette, Pick-up, etc. |
| **Chauffeur** | Livreur assigné |
| **Statut** | En attente, En cours, Livré, Annulé |

#### Créer une expédition
1. Cliquez sur **"Nouvelle expédition"**
2. Renseignez :
   - **Coordonnées expéditeur** (nom, téléphone, adresse)
   - **Coordonnées destinataire** (nom, téléphone, adresse)
   - **Détails du colis** (type, poids, dimensions, valeur déclarée)
   - **Options** : Livraison express, fragile, etc.
3. Sélectionnez un **véhicule disponible**
4. Confirmez et générez le **bon de transport**

### Suivi des colis

Suivez vos expéditions en temps réel :

- **Localisation GPS** du véhicule
- **Statut de livraison** mis à jour automatiquement
- **Notifications** au destinataire (SMS/WhatsApp)
- **Preuve de livraison** (signature, photo)

#### Statuts de livraison
- **📦 En attente** : Expédition créée, en attente de ramassage
- **🚚 En cours de ramassage** : Chauffeur en route vers l'expéditeur
- **🔄 En transit** : Colis en route vers la destination
- **📍 Arrivé** : Véhicule arrivé au point de livraison
- **✅ Livré** : Colis remis au destinataire
- **❌ Échec** : Livraison impossible (destinataire absent, adresse erronée)
- **↩️ Retour** : Colis retourné à l'expéditeur

### Tarifs fret

Consultez et configurez vos tarifs :

#### Types de tarification
- **Au poids** : Tarif par kg
- **Au volume** : Tarif par m³
- **À la distance** : Tarif au km
- **Forfaitaire** : Prix fixe par zone

#### Zones de livraison
- **Zone 1** : Abidjan intra-muros
- **Zone 2** : Grand Abidjan
- **Zone 3** : Intérieur du pays
- **Zone 4** : Internationale (UEMOA)

> **Astuce** : Activez le **tarif dynamique** pour ajuster automatiquement les prix selon la demande.

---

## Location

Accédez via : **Ma Flotte → Location**

Gérez la location de vos véhicules avec chauffeur (VTC et berlines).

### Véhicules disponibles

Visualisez votre parc de véhicules disponibles pour la location :

| Information | Description |
|-------------|-------------|
| **Véhicule** | Marque, modèle, année |
| **Catégorie** | Économique, Confort, Premium, Luxe |
| **Type location** | Journée, Semaine, Mois |
| **Tarif journalier** | Prix par jour |
| **Disponibilité** | Disponible, Réservé, En maintenance |
| **Options** | WiFi, siège bébé, boissons |

#### Types de location
- **Location avec chauffeur** : Chauffeur UpJunoo inclus
- **Location longue durée** : Contrat mensuel ou annuel
- **Location événementielle** : Mariages, séminaires, VIP

### Réservations location

Gérez les demandes de location :

#### Informations client
- **Nom et contact**
- **Date et heure** début/fin
- **Lieu de prise en charge**
- **Itinéraire prévu** (optionnel)
- **Besoins spéciaux**

#### Statuts de réservation
- **🟡 En attente** : Demande reçue, en attente de confirmation
- **🟢 Confirmée** : Réservation validée, véhicule assigné
- **🔵 En cours** : Location active
- **⚫ Terminée** : Véhicule restitué
- **🔴 Annulée** : Réservation annulée par le client ou vous

#### Actions disponibles
- **Confirmer** une demande
- **Assigner** un chauffeur spécifique
- **Modifier** dates ou véhicule
- **Annuler** avec motif
- **Facturer** les extras (kilométrage excédentaire, etc.)

### Contrats et facturation

#### Génération de contrat
Pour chaque location, un contrat est généré automatiquement avec :
- **Conditions générales** de location
- **État des lieux** (entrée/sortie)
- **Assurance** et franchises
- **Responsabilités** des parties

#### Facturation
- **Acompte** : 30% à la réservation
- **Solde** : À la prise en charge ou fin de location
- **Extras** : Carburant, péages, nettoyage
- **Pénalités** : Retard de restitution, dommages

#### Paiement
Modes de paiement acceptés :
- **Mobile Money** : Orange Money, MTN MoMo, Wave
- **Carte bancaire** : Visa, Mastercard
- **Virement** : Pour les comptes entreprises
- **Espèces** : Directement au chauffeur (avec reçu)

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **KYC** | "Know Your Customer" - Processus de vérification d'identité |
| **Carte grise** | Document d'immatriculation du véhicule |
| **Assignation** | Association d'un chauffeur à un véhicule |
| **Statut "Approuvé"** | Véhicule/chauffeur validé et opérationnel |
| **Statut "En validation"** | En attente de vérification par UpJunoo |
| **Portefeuille mobile** | Solde crédité sur l'app chauffeur |
| **Montant retirable** | Solde transferable vers le compte bancaire |
| **Montant non-retirable** | Bonus et promotions (usage interne) |
| **Course** | Trajet effectué pour un client |
| **Réservation** | Course programmée à l'avance |
| **Zone d'activité** | Secteur géographique d'opération du chauffeur |
| **Code chauffeur** | Identifiant unique du chauffeur |
| **Type de service** | Catégorie : Taxi, Economique, Premium... |
| **Statut de disponibilité** | En ligne, Hors ligne, En course |
| **Expédition fret** | Envoi de marchandises via le service de livraison |
| **Bon de transport** | Document officiel de prise en charge d'un colis |
| **Livraison express** | Service de livraison rapide (sous 2h) |
| **Colis** | Marchandise à transporter |
| **Preuve de livraison** | Signature ou photo confirmant la remise du colis |
| **Location avec chauffeur** | Service de location de véhicule incluant le chauffeur |
| **VTC** | Voiture de Transport avec Chauffeur (service premium) |
| **Acompte** | Paiement partiel à la réservation |
| **Franchise** | Montant à charge du locataire en cas de sinistre |
| **État des lieux** | Document décrivant l'état du véhicule avant/après location |
| **Tarif dynamique** | Prix ajusté automatiquement selon la demande |

---

## Support et assistance

### Besoin d'aide ?

- **Email** : support@upjunoo.com
- **Téléphone** : +225 XX XX XX XX
- **Chat en direct** : Disponible dans le portail (icône 💬 en bas à droite)

### Horaires du support
- **Lundi-Vendredi** : 8h00 - 18h00
- **Samedi** : 9h00 - 13h00
- **Dimanche** : Fermé

---

## Mises à jour

Ce guide est régulièrement mis à jour. Dernière mise à jour : **Juin 2026**.

Pour toute suggestion d'amélioration du guide, contactez-nous à documentation@upjunoo.com

---

*© 2026 UpJunoo - Tous droits réservés*
