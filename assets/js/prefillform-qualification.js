// prefillform-qualification.js - Version simplifiée pour le formulaire de qualification

(function() {
  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du script de pré-remplissage pour le formulaire de qualification");
    prefillQualificationForm();
  });

  // Fonction principale de pré-remplissage
  function prefillQualificationForm() {
    try {
      // Récupérer les paramètres de l'URL
      const params = getUrlParams();
      console.log("Paramètres URL pour qualification:", params);

      // Remplir les champs cachés
      fillField('prospecteur_id', params.pid);
      fillField('entreprise', params.eid || params.id);

      // Remplir les champs visibles
      if (params.nom) {
        fillField('entreprise_display', params.nom, true);
      }
      
      // Remplir la commune en lecture seule
      if (params.commune) {
        fillField('commune_entreprise', params.commune, true);
      }
      
      // Noter que l'interlocuteur reste éditable - c'est la personne de l'entreprise
      if (params.interlocuteur) {
        fillField('interlocuteur', params.interlocuteur, true);
      }
      
      // Remplir les champs de contact avec les informations de l'entreprise
      if (params.email) {
        fillField('email_contact', params.email, true);
      }
      
      if (params.telephone) {
        fillField('telephone_contact', params.telephone, true);
      }
      
      // Définir la date du jour pour le contact
      const today = new Date().toISOString().split('T')[0];
      fillField('date_contact', today);
      
      // Si le format et le mois sont spécifiés, activer la section correspondante
      if (params.format || params.mois) {
        setTimeout(() => {
          console.log("Activation du niveau d'intérêt et sélection du format/mois");
          // Sélectionner "Très intéressé" 
          const interestOption = document.querySelector('.interest-level[data-value="Très intéressé"]');
          if (interestOption) {
            interestOption.click(); // Utiliser click() pour déclencher aussi les événements
          }
          
          // Sélectionner le format si spécifié
          if (params.format) {
            setTimeout(() => {
              const formatOption = document.querySelector(`.format-option[data-format="${params.format}"]`);
              if (formatOption) {
                formatOption.click();
              }
            }, 200);
          }
          
          // Sélectionner le mois si spécifié
          if (params.mois) {
            setTimeout(() => {
              const monthButton = document.querySelector(`.month-btn[data-month="${safeDecodeURIComponent(params.mois)}"]`);
              if (monthButton) {
                monthButton.click();
              }
            }, 400);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors du pré-remplissage du formulaire de qualification:", error);
    }
  }

  // Fonction utilitaire pour obtenir les paramètres d'URL
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Récupération des paramètres avec nettoyage
    params.pid = urlParams.get('pid') || '';
    params.eid = urlParams.get('eid') || '';
    params.id = urlParams.get('id') || params.eid; // Fallback sur eid
    params.nom = urlParams.get('nom') || '';
    params.interlocuteur = urlParams.get('interlocuteur') || '';
    params.email = urlParams.get('email') || '';
    params.telephone = urlParams.get('telephone') || '';
    params.format = urlParams.get('format') || '';
    params.mois = urlParams.get('mois') || '';
    params.commune = urlParams.get('commune') || '';
    
    return params;
  }

  // Fonction sécurisée pour décoder l'URI
  function safeDecodeURIComponent(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(value);
    } catch (e) {
      console.warn(`Erreur de décodage pour: ${value}`, e);
      return value;
    }
  }

  // Fonction utilitaire pour remplir un champ avec traçabilité
  function fillField(id, value, decode = false) {
    const field = document.getElementById(id);
    if (field) {
      const finalValue = decode ? safeDecodeURIComponent(value) : value;
      field.value = finalValue;
      console.log(`Champ ${id} rempli avec:`, finalValue);
      return true;
    } else {
      console.warn(`Champ ${id} introuvable dans le DOM`);
      return false;
    }
  }
})();