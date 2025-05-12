// prefillform-prospecteur.js - Script spécifique pour le formulaire d'inscription des prospecteurs

(function() {
    // Attendre que le DOM soit complètement chargé
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Initialisation du script de pré-remplissage pour le formulaire prospecteur");
      setTimeout(prefillProspecteurForm, 300); // Légère temporisation pour s'assurer que tout est chargé
    });
  
    // Fonction principale de pré-remplissage
    function prefillProspecteurForm() {
      try {
        console.log('Début du pré-remplissage du formulaire prospecteur');
        const params = getUrlParams();
        console.log('Paramètres URL extraits:', params);
        
        // Pré-remplir les champs avec les valeurs des paramètres
        fillField('nom_prenom', params.nom_prenom, true);
        fillField('email', params.email, true);
        fillField('telephone', params.telephone, true);
        
        // Gérer les champs d'entreprise 
        if (params.id || params.eid || params.entreprise) {
          const entrepriseId = params.id || params.eid || params.entreprise;
          fillField('entreprise', entrepriseId);
          
          // Si un nom d'entreprise est aussi fourni, l'utiliser pour l'affichage
          if (params.nom_entreprise || params.nom) {
            const nom = params.nom_entreprise || params.nom;
            const searchInput = document.getElementById('entreprise-search');
            if (searchInput) {
              searchInput.value = safeDecodeURIComponent(nom);
              console.log('Champ entreprise-search rempli avec:', safeDecodeURIComponent(nom));
              
              // Simuler un événement input pour déclencher la recherche
              const inputEvent = new Event('input', { bubbles: true });
              searchInput.dispatchEvent(inputEvent);
            }
          }
        }
        
        // Gérer le cas de nouvelle entreprise
        if (params.nouvelle_entreprise === 'true' || params.nouvelle_entreprise === 'on') {
          const checkboxNouvelleEntreprise = document.getElementById('nouvelle_entreprise');
          if (checkboxNouvelleEntreprise) {
            checkboxNouvelleEntreprise.checked = true;
            
            // Déclencher l'événement change pour afficher la section correspondante
            const changeEvent = new Event('change', { bubbles: true });
            checkboxNouvelleEntreprise.dispatchEvent(changeEvent);
            
            // Remplir les champs de nouvelle entreprise
            fillField('nom_entreprise', params.nom_entreprise, true);
            fillField('adresse_entreprise', params.adresse_entreprise, true);
            fillField('telephone_entreprise', params.telephone_entreprise, true);
            fillField('email_entreprise', params.email_entreprise, true);
            
            // La commune sera sélectionnée automatiquement par le formulaire
          }
        }
        
        // Sélectionner le délai si spécifié
        if (params.delai) {
          const delaiSelect = document.getElementById('delai');
          if (delaiSelect) {
            // Chercher l'option qui correspond ou qui contient la valeur du délai
            const delaiValue = safeDecodeURIComponent(params.delai);
            const options = Array.from(delaiSelect.options);
            
            const matchingOption = options.find(opt => 
              opt.value === delaiValue || 
              opt.value.includes(delaiValue) || 
              delaiValue.includes(opt.value)
            );
            
            if (matchingOption) {
              delaiSelect.value = matchingOption.value;
              console.log('Délai sélectionné:', matchingOption.value);
            }
          }
        }
        
      } catch (error) {
        console.error('Erreur lors du pré-remplissage du formulaire prospecteur:', error);
      }
    }
    
    // Fonction pour obtenir les paramètres d'URL
    function getUrlParams() {
      const params = {};
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      
      // Récupération des paramètres courants
      params.id = urlParams.get('id') || '';
      params.eid = urlParams.get('eid') || '';
      params.entreprise = urlParams.get('entreprise') || '';
      params.nom = urlParams.get('nom') || '';
      params.nom_entreprise = urlParams.get('nom_entreprise') || params.nom;
      params.nom_prenom = urlParams.get('nom_prenom') || '';
      params.email = urlParams.get('email') || '';
      params.telephone = urlParams.get('telephone') || '';
      params.adresse_entreprise = urlParams.get('adresse_entreprise') || '';
      params.commune_entreprise = urlParams.get('commune_entreprise') || urlParams.get('commune') || '';
      params.telephone_entreprise = urlParams.get('telephone_entreprise') || '';
      params.email_entreprise = urlParams.get('email_entreprise') || '';
      params.delai = urlParams.get('delai') || '';
      params.nouvelle_entreprise = urlParams.get('nouvelle_entreprise') || '';
      
      return params;
    }
    
    // Fonction pour gérer le décodage en toute sécurité
    function safeDecodeURIComponent(value) {
      if (!value) return '';
      try {
        return decodeURIComponent(value);
      } catch (e) {
        console.warn(`Erreur de décodage URL pour '${value}':`, e);
        return value;
      }
    }
    
    // Fonction utilitaire pour remplir un champ
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
