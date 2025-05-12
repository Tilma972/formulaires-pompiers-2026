// prefillform.js
(function() {
  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    // Attendre un court délai pour s'assurer que main.js a eu le temps de s'initialiser
    setTimeout(prefillFormFromURL, 300);
  });

  // Fonction pour obtenir les paramètres d'URL
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Récupération des paramètres avec valeurs par défaut
    params.id = urlParams.get('id') || '';
    params.format = urlParams.get('format') || '6X4';
    params.mois = urlParams.get('mois') || 'Janvier';
    params.nom = urlParams.get('nom') || '';
    params.interlocuteur = urlParams.get('interlocuteur') || '';
    params.email = urlParams.get('email') || '';
    params.telephone = urlParams.get('telephone') || '';
    params.commune = urlParams.get('commune') || '';
    
    console.log('Paramètres extraits de l\'URL :', params);
    return params;
  }

  // Fonction pour gérer le décodage des paramètres URL en toute sécurité
  function safeDecodeURIComponent(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(value);
    } catch (e) {
      console.error('Erreur de décodage URL:', e);
      return value; // Retourne la valeur non décodée en cas d'erreur
    }
  }
  
  // Fonction principale pour pré-remplir le formulaire
  function prefillFormFromURL() {
    try {
      console.log('Début du pré-remplissage du formulaire');
      const params = getUrlParams();
      
      // S'assurer que les fonctions globales sont disponibles
      if (typeof window.loadEnterprises !== 'function') {
        console.warn('La fonction loadEnterprises n\'est pas disponible - attendons un peu plus');
        // Réessayer après un délai plus long
        setTimeout(prefillFormFromURL, 500);
        return;
      }
      
      // Remplir les champs avec les valeurs des paramètres
      fillField('entrepriseId', params.id);
      fillField('nom_entreprise', params.nom, true);
      fillField('interlocuteur', params.interlocuteur, true);
      fillField('email', params.email, true);
      fillField('telephone', params.telephone, true);
      
      // Pré-remplir le champ de recherche d'entreprise si un nom est fourni
      if (params.nom) {
        const searchInput = document.getElementById('entreprise-search');
        if (searchInput) {
          searchInput.value = safeDecodeURIComponent(params.nom);
          // Simuler un événement input pour déclencher la recherche
          const inputEvent = new Event('input', { bubbles: true });
          searchInput.dispatchEvent(inputEvent);
        }
      }
      
      // Gérer le champ de commune
      if (params.commune) {
        selectCommune(params.commune);
      }
      
      // Appel explicite au chargement des entreprises si elles ne sont pas déjà chargées
      if (!window.enterprises || window.enterprises.length === 0) {
        console.log('Chargement manuel des entreprises');
        window.loadEnterprises().then(() => {
          console.log('Entreprises chargées, tentative de sélection');
          if (params.id) selectEnterpriseById(params.id);
        }).catch(error => {
          console.error('Erreur lors du chargement des entreprises:', error);
        });
      } else if (params.id) {
        // Si les entreprises sont déjà chargées, sélectionner directement
        selectEnterpriseById(params.id);
      }
    } catch (error) {
      console.error('Erreur lors du pré-remplissage du formulaire:', error);
    }
  }
  
  // Fonction utilitaire pour remplir un champ avec traçage
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
  
  // Fonction pour sélectionner une commune
  function selectCommune(communeValue) {
    if (!communeValue) return;
    
    const communeSelect = document.getElementById('commune_entreprise');
    if (!communeSelect) return;
    
    const decodedCommune = safeDecodeURIComponent(communeValue);
    console.log('Tentative de sélection de la commune:', decodedCommune);
    
    // Attendre que les communes soient chargées
    const checkCommunesLoaded = () => {
      if (window.availableCommunes && window.availableCommunes.length > 0) {
        // Chercher la commune dans la liste
        const matchedCommune = window.availableCommunes.find(c => 
          c.toUpperCase() === decodedCommune.toUpperCase() || 
          c.toUpperCase().includes(decodedCommune.toUpperCase()) || 
          decodedCommune.toUpperCase().includes(c.toUpperCase())
        );
        
        if (matchedCommune) {
          communeSelect.value = matchedCommune;
          console.log('Commune sélectionnée:', matchedCommune);
          
          // Déclencher l'événement change pour mettre à jour les chips
          const changeEvent = new Event('change', { bubbles: true });
          communeSelect.dispatchEvent(changeEvent);
        } else {
          console.warn(`Commune '${decodedCommune}' non trouvée dans la liste`);
        }
      } else {
        // Réessayer après un délai
        console.log('Liste des communes pas encore chargée, nouvelle tentative...');
        setTimeout(checkCommunesLoaded, 200);
      }
    };
    
    checkCommunesLoaded();
  }
  
  // Fonction pour sélectionner une entreprise par ID
  function selectEnterpriseById(enterpriseId) {
    if (!enterpriseId) return;
    
    const hiddenInput = document.getElementById('entreprise');
    const searchInput = document.getElementById('entreprise-search');
    
    if (!hiddenInput || !searchInput) {
      console.warn('Éléments du sélecteur d\'entreprise introuvables');
      return;
    }
    
    // Chercher l'entreprise dans la liste globale
    if (window.enterprises && window.enterprises.length > 0) {
      const enterprise = window.enterprises.find(e => String(e.id) === String(enterpriseId));
      
      if (enterprise) {
        // Remplir les champs
        hiddenInput.value = enterpriseId;
        searchInput.value = enterprise.nom_entreprise || '';
        console.log('Entreprise sélectionnée:', enterprise.nom_entreprise);
        
        // Déclencher l'événement change pour mettre à jour l'affichage
        const changeEvent = new Event('change', { bubbles: true });
        hiddenInput.dispatchEvent(changeEvent);
        
        return true;
      } else {
        console.warn(`Entreprise avec ID '${enterpriseId}' non trouvée`);
      }
    } else {
      console.warn('Liste des entreprises non disponible');
    }
    
    return false;
  }
})();