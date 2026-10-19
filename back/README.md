# Yoga App — backend

API Spring Boot 3.5.5, Java 21, JPA/MySQL, Spring Security/JWT et MapStruct.
Exécuter les commandes ci-dessous depuis `back`.

## Prérequis et démarrage

- JDK **21** (`JAVA_HOME` doit désigner ce JDK, notamment si Java 26 est installé).
- Le wrapper télécharge Maven **3.9.11** depuis Maven Central au premier lancement.
  Une connexion réseau est nécessaire pour ce téléchargement et les dépendances.
- Docker Desktop et Docker Compose pour le démarrage MySQL de développement.

PowerShell :

```powershell
Copy-Item .env.example .env
# Renseigner DB_PASSWORD, DB_ROOT_PASSWORD et TOKEN_SECRET dans .env.
# Generer trois valeurs differentes avec cette commande (ne pas les versionner) :
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
$env:JAVA_HOME = 'C:\chemin\vers\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd --version
.\mvnw.cmd spring-boot:run
```

Linux/macOS : `sh mvnw spring-boot:run` avec `JAVA_HOME` configuré.
L'application écoute sur `http://localhost:8080`. Spring Boot utilise
`compose.yaml` pour démarrer MySQL. Configurer les variables `DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` et `TOKEN_SECRET` dans
l'environnement ou un fichier local `.env` (facultatif, ignoré par Git).
Ne jamais publier ce fichier ou ses valeurs. `TOKEN_SECRET` doit être une clé
encodée en Base64, d'au moins 64 octets décodés pour HS512.
Configurer egalement `DB_ROOT_PASSWORD` dans `.env` pour Compose.
L'application utilise uniquement l'utilisateur du schema configure.
Un volume deja initialise conserve ses anciens identifiants.

Le script `src/main/resources/sql/insert_user.sql` permet d'initialiser le
compte de démonstration dans la base de développement. Ne pas l'exécuter sur
une base de production. La collection API est disponible dans
`postman/yoga.postman_collection.json`.

Le script ajoute aussi un professeur, sans doublon en cas de reexecution :

```powershell
Get-Content .\src\main\resources\sql\insert_user.sql -Raw |
    docker compose exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_PASSWORD exec mysql -u$MYSQL_USER $MYSQL_DATABASE'
```

Verification MySQL reussie le 19 octobre 2026 : schema, connexion administrateur,
lecture des professeurs et cycle de creation/lecture/modification/suppression
d'une seance via HTTP reel. La seance de verification a ete supprimee.

## Tests et couverture

```powershell
# Tests unitaires JUnit 5 / Mockito
.\mvnw.cmd test

# Reconstruction, tests unitaires, intégration Spring et contrôle JaCoCo
.\mvnw.cmd clean verify
```

Les tests n'exigent **ni Docker, ni MySQL, ni `.env`, ni secret réel**.
Le profil `test`, exclusivement dans `src/test/resources`, configure H2 en
mode MySQL, un schéma recréé et une clé JWT publique réservée aux tests.
La configuration MySQL de production reste inchangée.

- Surefire exécute `*Test` : services isolés avec Mockito, mappers réels,
  JWT (valide, expiré, malformé, non signé, mauvaise signature), filtre et
  identité utilisateur.
- Failsafe exécute `*IT` pendant `integration-test` puis valide à `verify`.
  `ApiIT` charge **tout le contexte Spring**, la véritable chaîne de sécurité,
  les mappers, services et repositories H2. MockMvc teste les routes sans
  mocks de service ou repository ; un appel HTTP sur le port aléatoire
  vérifie également le serveur embarqué réellement démarré.
- Les scénarios couvrent connexion membre/admin, identifiants incorrects,
  validations, inscription/doublon et hachage, listes/détails, création,
  modification, suppression, participation/retrait, compte et propriété de
  sa suppression, absence de ressources, identifiants invalides, requêtes
  anonymes et tokens invalides.
- Les tests d'intégration sont transactionnels : chaque cas est isolé par
  rollback. Ils ne manipulent pas la base de développement.

JaCoCo **0.8.13** agrège unitaires et intégration dans
`target/site/jacoco/index.html` (formats XML et CSV également disponibles).
`verify` échoue si l'un des six compteurs globaux **instructions, branches,
lignes, méthodes, classes ou complexité** est inférieur à **80 %**.
La **seule exclusion de package est `dto`** ; Lombok marque son code généré
avec `@Generated`, filtré normalement par JaCoCo. Les implémentations
MapStruct, contrôleurs, services, sécurité, configuration et exceptions ne
sont pas exclus.

Résultat de référence : **32 tests unitaires et 58 tests d'intégration**,
soit **64,44 %** de tests d'intégration (minimum demandé : 30 %), sans échec
ni test ignoré. Les compteurs exacts du dernier lancement sont à lire dans
le rapport JaCoCo généré ; les rapports JUnit sont dans
`target/surefire-reports` et `target/failsafe-reports`.

H2 valide les interactions JPA et les parcours API mais ne remplace pas un
smoke test MySQL : le démarrage MySQL nécessite un moteur Docker accessible.

## Améliorations conservant le contrat API

- Gestion centralisée des identifiants invalides par `@RestControllerAdvice` :
  aucun `try/catch` répété dans les contrôleurs.
- Authentification/inscription et suppression de son propre compte déléguées
  aux services ; aucun contrôleur n'accède directement à un repository.
- Statuts et formats des réponses existants conservés (200, 400, 401, 404).
  La suppression d'un compte reste réservée à son propriétaire.
- Relation session/professeur corrigée en `ManyToOne` : plusieurs sessions
  peuvent être associées au même professeur.
- Rôle admin propagé dans le principal authentifié ; contrat `equals` /
  `hashCode` cohérent pour `UserDetailsImpl`.
- Plugin Spring Boot dédupliqué, wrapper Maven versionné et contrôle de
  couverture exécuté après les tests d'intégration.
