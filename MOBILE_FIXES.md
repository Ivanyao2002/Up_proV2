# Mobile — Problemes a corriger (app client)

**Date :** 2026-06-22
**Destinataire :** Dev React Native — app client uniquement (chauffeur : phase ulterieure)
**Ecrans concernes :** "Sur quel sujet avez-vous besoin d'aide ?", "Nouveau litige" et l'ecran de conversation (chat support / litige)

---

## Ecran 1 — "Sur quel sujet avez-vous besoin d'aide ?"

### Probleme 1.1 — Tickets soumis sans categorie ni trip_id

**Constat :** Quand l'utilisateur tape sur la bulle de chat d'une course (section "COURSES ET COMMANDES"), un ticket est cree. Ce ticket arrive sur le backoffice avec `category: null` et sans `trip_id`. L'agent ne peut ni filtrer la reclamation ni identifier le chauffeur concerne.

**Cause :** Le tap sur la bulle cree directement le ticket sans collecter la categorie ni passer le `trip_id` de la course.

**Ce qui est attendu :** Quand l'utilisateur tape la bulle d'une course, le ticket doit etre cree directement sans ecran intermediaire. La categorie par defaut `"service"` est appliquee automatiquement cote app — l'utilisateur n'a pas a choisir. Le `trip_id` de la course est passe automatiquement dans le body.

Body a envoyer :
```json
{
  "category": "service",
  "subject": "Reclamation liee a une course",
  "trip_id": "<id de la course tappee>"
}
```

Le `trip_id` est ce qui permet a l'agent d'identifier le chauffeur et d'appliquer une sanction si necessaire.

**Endpoint :** `POST /v1/support/tickets`
**Champs manquants :** `category` + `trip_id`

---

### Probleme 1.2 — Pas d'option "Autre" dans les sujets frequents

**Constat :** La section "SUJETS FREQUENTS" liste des sujets predefinis (ex. "Comment annuler une course ?", "Objet oublie dans un vehicule", "Probleme de paiement", "Contester un montant"). Si le probleme de l'utilisateur ne correspond a aucun de ces sujets, il n'a aucun moyen d'ouvrir une reclamation libre depuis cette section.

**Ce qui est attendu :** Ajouter un element "Autre sujet" en bas de la liste "SUJETS FREQUENTS". Cet element ouvre un formulaire libre ou l'utilisateur saisit son objet manuellement. Le ticket doit etre cree avec `category: "other"` et le texte saisi comme `subject`.

---

### Probleme 1.3 — Messages de l'agent jamais recus en temps reel

**Constat :** Quand l'agent support repond dans une conversation, le message n'apparait jamais cote client (ni en temps reel, ni apres avoir quitte et rouvert la conversation).

**Ce qui est attendu :**
- Connexion Socket.IO etablie au login, maintenue en arriere-plan
- L'utilisateur voit les nouveaux messages apparaitre sans recharger l'ecran
- A l'ouverture d'une conversation, l'historique complet est charge depuis l'API

---

## Ecran 2 — "Nouveau litige" (bottom sheet)

### Probleme 2.1 — Categories incompletes et mapping incorrect

**Constat :** Le formulaire "Nouveau litige" affiche des chips de categorie : "Facturation" et "Comportement du chauffeur" (2 visibles, potentiellement d'autres hors ecran). Le probleme est que la valeur envoyee au backend est probablement le libelle affiche ("Facturation") et non la valeur technique attendue.

**Ce qui est attendu :** Chaque chip doit envoyer la valeur technique correspondante :

| Label affiche dans l'app | Valeur a envoyer (`category`) |
|--------------------------|-------------------------------|
| Facturation | `payment` |
| Comportement du chauffeur | `behavior` |
| Probleme de service | `service` |
| Probleme de livraison | `logistics` |
| Bug dans l'app | `app` |
| Autre | `other` |

**Ne jamais envoyer le libelle francais comme valeur de `category`.**

---

### Probleme 2.2 — Champ "Autre" manquant dans les categories du litige

**Constat :** Si aucune des categories proposees ne correspond au probleme de l'utilisateur, il n'existe pas de categorie "Autre" dans le formulaire "Nouveau litige".

**Ce qui est attendu :** Ajouter un chip "Autre" en dernier. Quand il est selectionne, afficher un champ texte supplementaire pour que l'utilisateur decrive son probleme librement. Le ticket est cree avec `category: "other"` et le texte saisi comme `subject`.


---

## Litiges — API separee (a creer)

Les litiges ne passent PAS par l'API support tickets. Ils ont leur propre endpoint dedie pour pouvoir etre geres separement dans le backoffice.

**Endpoint mobile pour creer un litige :**
```
POST /v1/disputes
```

**Body :**
```json
{
  "category": "payment",
  "subject": "Double debit",
  "description": "Decrivez le probleme...",
  "trip_id": "trip_xxx"
}
```

| Champ | Requis | Note |
|-------|--------|------|
| `category` | Oui | Valeur technique — voir tableau probleme 2.1 |
| `subject` | Oui | Texte saisi dans le champ "Objet" |
| `description` | Non | Texte du champ "Decrivez le probleme" |
| `trip_id` | Non | Absent si le litige ne concerne pas une course specifique |

> Voir `BACKEND_SUPPORT_API.md` — section "Litiges (disputes)" pour le contrat complet backend.

---

## Ecran 3 — Conversation : assistant IA avant prise en charge (nouvelle feature)

Quand un client ouvre un litige ou une reclamation, un **assistant IA** repond automatiquement tant qu'aucun agent humain n'a pris la main. Le mobile doit afficher ces messages de maniere distincte et gerer le passage a l'humain.

### Probleme 3.1 — Distinguer visuellement les messages de l'IA

**Constat :** Les messages auront un nouveau champ `sender: "ai"` (en plus de `user`, `agent`, `system`). S'ils sont affiches comme des messages d'agent normaux, le client croira parler a un humain.

**Ce qui est attendu :**
- Bulle IA avec un visuel distinct : icone robot + libelle **« Assistant IA »** et sous-titre **« Reponse automatique »**.
- Un bandeau discret en haut de la conversation tant que l'IA repond : _« Un assistant automatique vous repond en attendant qu'un agent prenne en charge votre demande. »_
- Ne pas afficher l'avatar/photo d'un agent humain pour un message `sender: "ai"`.

### Probleme 3.2 — Transition vers l'agent humain

**Constat :** Des qu'un agent s'assigne le litige, l'IA s'arrete et un **message d'accueil de l'agent arrive automatiquement** (envoye par le backend). Le mobile doit refleter ce changement.

**Sequence cote client :**
1. Messages `sender: "ai"` pendant l'attente (robot).
2. L'agent s'assigne → le backend pousse :
   - un message `sender: "system"` : _« {agent} a pris en charge votre demande. »_
   - puis un message `sender: "agent"` : _« Bonjour {nom}, je suis {agent} de l'equipe support... »_ (accueil automatique).
3. A partir de la, c'est l'humain qui repond.

**Ce qui est attendu cote mobile :**
- Quand le message `sender: "agent"` (ou `system` de prise en charge) arrive, **masquer le bandeau « assistant automatique »**.
- Afficher l'avatar/identite de l'agent sur ses messages.
- Aucune logique a coder : ces messages arrivent via le socket / l'API, le mobile se contente de les afficher.

### Probleme 3.3 — Bouton « Parler a un agent »

**Ce qui est attendu :** Pendant que l'IA repond, proposer un bouton **« Parler a un agent »**. Au tap, le client signale qu'il veut un humain — l'app envoie simplement un message normal (l'agent verra la demande dans la file). Pas de nouvel endpoint cote mobile.

### Champs du message a gerer

| Champ | Type | Note |
|-------|------|------|
| `sender` | string | Nouvelle valeur possible : `"ai"` |
| `sender_name` | string | « Assistant IA » |
| `content` | string | Texte de la reponse |
| `created_at` | string | ISO 8601 |

> Le mobile n'a **rien** a calculer pour l'IA : il se contente d'afficher les messages `sender: "ai"` renvoyes par l'API / le socket. Toute la logique RAG est cote backend (voir `BACKEND_SUPPORT_API.md` #8).

### Events Socket.IO a ecouter (litiges)

Le contrat backend a ete complete avec les noms d'events exacts. **Convention alignee sur le chat support existant.**

| Event | Payload | Contenu |
|-------|---------|---------|
| `dispute:message` | `{ disputeId, message }` | Tout nouveau message (`user` / `agent` / `ai` / `system`) |
| `dispute:updated` | `{ disputeId, status, assignedToId, ... }` | Changement de statut / assignation |

- Join a la connexion : `socket.emit("join", userId)` (room `user:{userId}`).
- **Pas besoin de `dispute:ai-reply`** : la reponse IA arrive via `dispute:message` avec `message.sender === "ai"`. Tu peux retirer cet ecouteur.
- Garde le **polling 3 s en filet** tant que la fiabilite socket n'est pas confirmee en prod — c'est la bonne approche.
- Source de verite : `BACKEND_SUPPORT_API.md` § "Temps reel — Socket.IO (litiges)".
