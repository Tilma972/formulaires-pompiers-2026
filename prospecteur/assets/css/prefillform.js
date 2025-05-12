// prefillform.js - version corrigée
(function() {
  // Définir une fonction de secours si loadEnterprises n'existe pas
  if (typeof window.loadEnterprises !== 'function') {
    window.loadEnterprises = async function() {
      console.log('Utilisation de la fonction loadEnterprises de secours');
      
      // Si enterprises est déjà défini, l'utiliser
      if (window.enterprises && window.enterprises.length > 0) {
        return window.enterprises;
      }
      
      // Sinon, faire une tentative de chargement
      try {
        const response = await fetch('https://n8n.dsolution-ia.fr/webhook/get-enterprises');
        if (!response.ok) throw new Error('Erreur lors du chargement des entreprises');
        
        const data = await response.json();
        
        // Traitement selon le format
        let enterprises = [];
        if (Array.isArray(data)) {
          enterprises = data;
        } else if (data.enterprises && Array.isArray(data.enterprises)) {
          enterprises = data.enterprises;
        } else {
          enterprises = [];
        }
        
        // Stocker les données
        window.enterprises = enterprises;
        window.loadedEnterprises = enterprises;
        
        return enterprises;
      } catch (error) {
        console.error('Fallback: Erreur lors du chargement des entreprises:', error);
        window.enterprises = [];
        window.loadedEnterprises = [];
        return [];
      }
    };
  }
  
  // Variables pour limiter les tentatives
  let prefillAttempts = 0;
  const MAX_ATTEMPTS = 10;

  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    // Délai initial pour laisser main.js s'initialiser
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
      
      // Vérifier si les données d'entreprises sont disponibles
      const enterprisesAvailable = window.enterprises && window.enterprises.length > 0;
      const loadFunctionAvailable = typeof window.loadEnterprises === 'function';
      
      if (!enterprisesAvailable && !loadFunctionAvailable) {
        prefillAttempts++;
        
        if (prefillAttempts < MAX_ATTEMPTS) {
          console.warn(`La fonction loadEnterprises et les données d'entreprises ne sont pas disponibles - nouvelle tentative (${prefillAttempts}/${MAX_ATTEMPTS})`);
          setTimeout(prefillFormFromURL, 500);
          return;
        } else {
          console.error(`Abandon après ${MAX_ATTEMPTS} tentatives - aucune donnée d'entreprise disponible`);
        }
      }
      
      // Remplir les champs avec les valeurs des paramètres
      fillField('entreprise', params.id);
      fillField('entreprise-search', params.nom, true);
      fillField('interlocuteur', params.interlocuteur, true);
      fillField('email_contact', params.email, true);
      fillField('telephone_contact', params.telephone, true);
      
      // Gérer le champ de commune
      if (params.commune) {
        selectCommune(params.commune);
      }
      
      // Préparation de données liées aux entreprises
      handleEnterpriseData(params);
    } catch (error) {
      console.error('Erreur lors du pré-remplissage du formulaire:', error);
    }
  }
  
  // Gestion des données d'entreprise
  async function handleEnterpriseData(params) {
    if (!params.id && !params.nom) return;
    
    // Vérifier si les entreprises sont chargées
    if (!window.enterprises || window.enterprises.length === 0) {
      if (typeof window.loadEnterprises === 'function') {
        console.log('Chargement manuel des entreprises');
        try {
          const enterprises = await window.loadEnterprises();
          if (enterprises && enterprises.length > 0) {
            if (params.id) selectEnterpriseById(params.id);
            else if (params.nom) selectEnterpriseByName(params.nom);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des entreprises:', error);
        }
      }
    } else {
      // Si les entreprises sont déjà chargées
      if (params.id) selectEnterpriseById(params.id);
      else if (params.nom) selectEnterpriseByName(params.nom);
    }
  }
  
  // Fonction utilitaire pour remplir un champ avec traçage
  function fillField(id, value, decode = false) {
    const field = document.getElementById(id);
    if (field) {
      const finalValue = decode ? safeDecodeURIComponent(value) : value;
      field.value = finalValue;
      console.log(`Champ ${id} rempli avec:`, finalValue);
      
      // Déclencher un événement input pour activer les validations et comportements JS
      const inputEvent = new Event('input', { bubbles: true });
      field.dispatchEvent(inputEvent);
      
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
    
    // Fonction pour faire la sélection
    const selectCommuneValue = () => {
      // Si le select contient déjà des options
      if (communeSelect.options.length > 1) {
        // Recherche de correspondance
        let found = false;
        for (let i = 0; i < communeSelect.options.length; i++) {
          const optionValue = communeSelect.options[i].value;
          if (optionValue.toUpperCase() === decodedCommune.toUpperCase() ||
              optionValue.toUpperCase().includes(decodedCommune.toUpperCase()) ||
              decodedCommune.toUpperCase().includes(optionValue.toUpperCase())) {
            communeSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        
        if (found) {
          // Déclencher l'événement change
          const changeEvent = new Event('change', { bubbles: true });
          communeSelect.dispatchEvent(changeEvent);
          console.log('Commune sélectionnée dans le select');
        } else {
          console.warn(`Commune '${decodedCommune}' non trouvée dans les options du select`);
        }
      } else {
        // Attendre si les options ne sont pas encore chargées
        console.log('Options de commune pas encore chargées, tentative dans 300ms');
        setTimeout(selectCommuneValue, 300);
      }
    };
    
    // Démarrer la tentative
    selectCommuneValue();
  }
  
  // Fonction pour sélectionner une entreprise par ID
  function selectEnterpriseById(enterpriseId) {
    if (!enterpriseId) return;
    
    const hiddenInput = document.getElementById('entreprise');
    const searchInput = document.getElementById('entreprise-search');
    
    if (!hiddenInput || !searchInput) {
      console.warn('Éléments du sélecteur d\'entreprise introuvables');
      return false;
    }
    
    // Chercher l'entreprise dans la liste
    const enterprise = window.enterprises.find(e => String(e.id) === String(enterpriseId));
    
    if (enterprise) {
      // Remplir les champs
      hiddenInput.value = enterpriseId;
      searchInput.value = enterprise.nom_entreprise || '';
      console.log('Entreprise sélectionnée par ID:', enterprise.nom_entreprise);
      
      // Déclencher les événements appropriés
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);
      
      const inputEvent = new Event('input', { bubbles: true });
      searchInput.dispatchEvent(inputEvent);
      
      return true;
    } else {
      console.warn(`Entreprise avec ID '${enterpriseId}' non trouvée`);
      return false;
    }
  }
  
  // Fonction pour sélectionner une entreprise par nom
  function selectEnterpriseByName(enterpriseName) {
    if (!enterpriseName) return;
    
    const decodedName = safeDecodeURIComponent(enterpriseName);
    const searchInput = document.getElementById('entreprise-search');
    
    if (!searchInput) {
      console.warn('Champ de recherche d\'entreprise introuvable');
      return false;
    }
    
    // Remplir le champ de recherche
    searchInput.value = decodedName;
    console.log('Recherche d\'entreprise par nom:', decodedName);
    
    // Déclencher un événement input pour activer la recherche
    const inputEvent = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(inputEvent);
    
    // Focaliser le champ pour afficher les résultats
    const focusEvent = new Event('focus', { bubbles: true });
    searchInput.dispatchEvent(focusEvent);
    
    return true;
  }
})();