# addon-registry
SlimIO - Addon registry

# Description du chantier
Création d'une API http (JSON) pour récupérer les informations sur les addons SlimIO (CPU, Memory etc..). Les informations seront stockées dans une base de données.

Cet API devra permettre l'authentification d'un utilisateur pour publier et télécharger des addons privées (plus tard...).

## (GET) /
La route principale doit retourner les métas data du service. (uptime, etc).

Exemple: https://registry.npmjs.org/

## (GET) /addons
Récupère la liste entière des addons en base. (Uniquement les addons publiques). Une clé sera éventuellement nécessaire pour voir les addons privés.

## (GET) /addon/:addonName
Permet de récupérer les données d'un addon. (nom, description, version, lien git, etc..).
