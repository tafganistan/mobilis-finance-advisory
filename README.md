# MFA — Plateforme e-learning (Vue 3 + Tailwind CSS 4)

    npm install
    npm run dev

Comptes de démo : prof@mfa.com / prof123 — awa@mfa.com / awa123

- Les données sont simulées (src/store.js, localStorage). Remplacez ces fonctions par vos appels API.
- Hors MVP (priorité 2) : coaching individuel, notifications e-mail/SMS, paiement.
- Illustrations : déposez vos images dans public/images et renseignez-les dans src/config.js (accueil, formateur, inscription).
- Formateur : modifiez nom, titre et bio en haut de src/views/Formateur.vue.

## Notifications e-mail
Chaque événement (inscription, session, devoir, note, message, coaching) crée une notification interne
(cloche en haut) et un e-mail. Pour l'envoi réel, créez `.env` avec `VITE_MAIL_API=https://votre-backend/api/mail`
(le backend reçoit `{ to, sujet, corps }`). Sans cela, les e-mails sont consignés dans l'onglet « E-mails ».

## Sessions et heures restantes
- Rubrique « Sessions » du professeur : chaque cours a deux boutons, « Programmer la session » (choix de l'étudiant, date, heure, durée, mode, lien) et « Voir les sessions » (jours de chaque étudiant pour ce cours).
- Quand le professeur **et** l'étudiant cliquent sur le lien d'une session, sa durée (en heures) est décomptée des heures restantes de l'étudiant (une seule fois par session). Les écrans qui affichent cette donnée se mettent à jour automatiquement, y compris entre onglets du même navigateur.
- La connexion est propre à chaque onglet : vous pouvez être professeur dans un onglet et étudiant dans un autre. Avec un vrai backend, remplacez la synchronisation par WebSocket/polling (voir `synchroniser` dans src/store.js).

## Interface étudiant : sessions, devoirs, messages
- Rubrique « Sessions » : chapitres → cours → deux boutons, « Voir la date de la session » (programme + lien de l'appel) et « Voir les devoirs » (consigne avec visionneur, puis formulaire « Envoyer le devoir »).
- Le professeur associe un devoir à un cours (champ « Cours associé »). Un cours peut avoir autant de devoirs que nécessaire, et l'étudiant peut envoyer plusieurs fois chaque devoir (description + fichier PDF/Word/PowerPoint/image, 2 Mo max car les fichiers sont gardés dans le navigateur).
- Word et PowerPoint ne peuvent pas être affichés dans le navigateur : le visionneur propose alors le téléchargement. PDF et images s'affichent directement.
- Rubrique « Messages » : conversation individuelle avec le professeur, avec pastille de messages non lus.
