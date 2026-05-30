# Quittus — Générateur de quittances de loyer

Application web statique pour générer des quittances de loyer conformes au format légal français, exportables en PDF.

## Fonctionnalités

- Formulaire bailleur / locataire avec aperçu en temps réel
- Import de signature par clic ou glisser-déposer (image)
- Génération sur une plage de mois (1 quittance par mois, jusqu'à 12)
- Export PDF multi-pages via html2canvas + jsPDF
- Sauvegarde automatique du formulaire et de la signature dans le `localStorage`
- Aucun serveur requis — fonctionne entièrement dans le navigateur

## Structure

```
quittus/
├── index.html   # Interface (formulaire + aperçu)
├── style.css    # Mise en forme (thème sombre + style quittance)
└── script.js    # Logique : mise à jour aperçu, validation, export PDF
```

## Utilisation

Ouvrir `index.html` dans un navigateur. Aucune installation ni dépendance locale.

Les bibliothèques **html2canvas** et **jsPDF** sont chargées depuis un CDN.

### Étapes

1. Renseigner les informations du bailleur et du locataire
2. Téléverser la signature (optionnel)
3. Choisir la période (mois de début → mois de fin)
4. Cliquer sur **Télécharger le PDF**

Le fichier est nommé automatiquement : `quittance_<locataire>_<periode>.pdf`.

## Conformité légale

La quittance inclut la mention obligatoire issue de l'article 21 de la loi n° 89-462 du 6 juillet 1989 :

> *La quittance est remise gratuitement au locataire qui en fait la demande.*
