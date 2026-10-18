# Yoga Studio - qualite et tests full-stack

Application de reservation de seances de yoga : Angular dans `front`, API
Spring Boot dans `back`.

Depot du projet : <https://github.com/github-ash/P04-Yoga-Tests-FullStack>.

## Prerequis

- Node.js 22 LTS et npm (Angular 19).
- JDK 21.
- Maven 3.9 ou le wrapper Maven fourni dans `back`.
- Docker Desktop avec son moteur demarre pour la base MySQL de l'application.

Ne pas confondre le JDK utilise par Maven avec celui de l'editeur : verifier
`java -version` et `mvn -version` avant de commencer.

## Installation et lancement

1. Cloner ce depot et ouvrir deux terminaux a sa racine :

   ```powershell
   git clone https://github.com/github-ash/P04-Yoga-Tests-FullStack.git
   cd P04-Yoga-Tests-FullStack
   ```
2. Dans `back`, copier `.env.example` en `.env`. Renseigner `DB_PASSWORD`
   et `TOKEN_SECRET` avec deux valeurs aleatoires differentes, generees
   localement, par exemple avec :

   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```

   `.env` reste local et n'est pas suivi par Git. Spring charge ce fichier
   relativement au repertoire courant : lancer le back depuis `back`.
   Compose cree la base et l'utilisateur MySQL limites au schema choisi.
   Le mot de passe root est genere par MySQL et n'est pas utilise par l'API.
   Ne jamais publier de vrais identifiants ou de cle JWT dans Git.
   Voir aussi [le guide du back](back/README.md).
3. Dans le premier terminal :

   ```powershell
   cd back
   .\mvnw.cmd spring-boot:run
   ```

4. Au premier lancement, Hibernate cree les tables. Executer ensuite
   `back/src/main/resources/sql/insert_user.sql` dans MySQL pour ajouter
   l'administrateur de demonstration (`yoga@studio.com` / `test!1234`).
   Ce compte est uniquement destine a un environnement local de demonstration.
   Ajouter au moins un professeur pour pouvoir creer une seance :

   ```sql
   INSERT INTO teachers (first_name, last_name, created_at, updated_at)
   VALUES ('Jane', 'Doe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
   ```

   Utiliser, depuis `back`, `docker compose exec mysql mysql -u yoga_app -p yoga`
   (adapter le nom d'utilisateur et de base aux valeurs de `.env`).
   Ne pas supprimer de volume Docker existant pour reinitialiser des identifiants :
   un volume deja initialise conserve les anciens comptes et mots de passe.

5. Dans le second terminal :

   ```powershell
   cd front
   npm ci
   npm start
   ```

6. Ouvrir <http://localhost:4200>. Le serveur Angular transmet les requetes
   `/api` au back sur le port 8080.

L'application permet l'inscription, la connexion, la consultation des seances,
la participation et l'annulation de participation, la consultation du compte
et sa suppression. Un administrateur peut creer, modifier et supprimer des
seances.

## Tests et couvertures

Les tests ne doivent pas utiliser les donnees de la base MySQL de production.
Les scenarios Cypress utilisent des reponses HTTP interceptees : ils verifient
les parcours dans un vrai navigateur, pas la connexion a MySQL. Les tests
d'integration du back verifient separement l'API et la persistance.

### Back : JUnit, Mockito et Spring

```powershell
cd back
.\mvnw.cmd clean verify
```

Rapport JaCoCo : `back/target/site/jacoco/index.html`.
Rapports de tests : `back/target/surefire-reports`.
Le package DTO est exclu, conformement a l'enonce.

### Front : Jest

```powershell
cd front
npm ci
npm run test:coverage
npm run build
```

Rapport : `front/coverage/jest/lcov-report/index.html`.
Les tests couvrent les services HTTP, l'authentification, les composants
et leurs interactions avec les services.

### Parcours navigateur : Cypress

```powershell
cd front
npm run e2e:ci
npm run e2e:coverage
```

Le premier script lance automatiquement un serveur Angular instrumente
sur le port 4307 (distinct du port 4200 de developpement), puis
les scenarios en mode headless. Aucun serveur back n'est requis pour ces tests.
Le second produit et controle la couverture collectee par le navigateur.
Rapport : `front/coverage/e2e/index.html`.

Les controles doivent atteindre au moins 80 % pour les instructions,
les branches, les lignes et les fonctions/methodes ; JaCoCo controle aussi
les classes. Un rapport absent ou un echec de commande ne vaut pas validation.
La fiche d'autoevaluation demande aussi au moins 30 % de tests d'integration,
separement dans les suites Jest et JUnit. Le classement doit correspondre
a des interactions reelles entre composants ou couches, pas a un simple
renommage de tests unitaires.

## Plan de verification fonctionnelle

Le [plan fourni par OpenClassrooms](https://course.oc-static.com/projects/4080_Testez+et+am%C3%A9liorez+une+application+Full-Stack/Testing+plan+-+P4+DFSJA.pdf)
demande notamment :

| Fonction | Verification |
| --- | --- |
| Connexion | Succes, mauvais identifiants, champs obligatoires |
| Inscription | Succes et champs obligatoires |
| Liste des seances | Contenu, actions selon le role |
| Detail | Informations, suppression reservee a l'administrateur |
| Creation/modification | Enregistrement et validation des champs |
| Suppression | Retrait de la seance et retour a la liste |
| Compte | Informations de l'utilisateur |
| Deconnexion | Retour a la navigation publique |

Consulter aussi [le guide du front](front/README.md) et
[le guide du back](back/README.md).

## Resultats verifies et rapports livres

| Suite | Tests reussis | Instructions | Branches | Lignes | Fonctions / methodes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Jest | 38 | 100 % | 100 % | 100 % | 100 % |
| Cypress | 12 | 97,10 % | 90,75 % | 97,02 % | 96,21 % |
| JUnit / Mockito / Spring | 90 | 99,64 % | 100 % | 99,40 % | 98,96 % |

JaCoCo mesure egalement 100 % des classes et 99,28 % de complexite.
Les suites Jest et JUnit comptent respectivement 30/38 (78,9 %) et
58/90 (64,44 %) tests d'integration. Aucun test n'est ignore.

Les rapports HTML complets sont livres dans des archives autonomes :

- [Jest](reports/frontend-coverage.zip) : extraire puis ouvrir
  `lcov-report/index.html`.
- [Cypress](reports/e2e-coverage.zip) : extraire puis ouvrir `index.html`.
- [JaCoCo](reports/backend-coverage.zip) : extraire puis ouvrir `index.html`.
- [Synthese des mesures](reports/verification.json).

Jest mesure les fichiers executables de `src/app`, hors interfaces sans code
executable et module statique de regroupement des imports Material.
Le bootstrap et les polyfills sont hors de ce perimetre. Cote Java,
seul le package DTO est exclu ; les elements Lombok generes sont filtres
normalement par JaCoCo.

Le lint et le build Angular de production sont passes. Le build conserve
un avertissement de budget : environ 810 ko pour un budget d'avertissement
de 500 ko, en dessous de la limite d'erreur de 1 Mo.

**Limite de validation de l'environnement :** la configuration Compose a ete
validee, mais le moteur Docker local ne repondait pas aux commandes de
connexion. Le lancement de la base MySQL n'a donc pas pu etre confirme.
Les tests d'integration Spring/H2 et un appel HTTP reel au serveur embarque
ont bien ete executes ; ils ne sont pas presentes comme un test MySQL.

## Remise du projet

1. Publier le code et les tests sur un depot GitHub personnel.
2. Regenerer les trois rapports de couverture et conserver leurs resultats.
3. Placer le lien du depot dans `Nom_Prenom_1_repo_mmaaaa.txt`.
4. Mettre ce fichier dans l'archive `Titre_du_projet_nom_prenom.zip`.

Le nom, le prenom, la date de demarrage et l'URL du depot personnel doivent
etre renseignes par l'auteur, et ne sont pas inventes par ce projet.
