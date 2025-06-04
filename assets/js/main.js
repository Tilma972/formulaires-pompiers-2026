// main.js

// Amélioration de l'accessibilité générale
function enhanceAccessibility() {
  // Ajouter des attributs ARIA
  document.querySelectorAll('label').forEach(label => {
    const forAttr = label.getAttribute('for');
    if (forAttr) {
      const input = document.getElementById(forAttr);
      if (input) {
        input.setAttribute('aria-required', input.required ? 'true' : 'false');
        
        // Associer les messages d'erreur aux champs
        const error = document.querySelector(`.error-message[id="${forAttr}-error"]`);
        if (error) {
          input.setAttribute('aria-describedby', `${forAttr}-error`);
          error.setAttribute('role', 'alert');
          error.setAttribute('aria-live', 'polite');
        }
      }
    }
  });
  
  // Améliorer l'accessibilité du formulaire
  const form = document.getElementById('prospecteur-form');
  if (form) {
    form.setAttribute('role', 'form');
    form.setAttribute('aria-labelledby', 'form-title');
    
    // Ajouter un titre invisible pour les lecteurs d'écran
    if (!document.getElementById('form-title')) {
      const formTitle = document.createElement('h2');
      formTitle.id = 'form-title';
      formTitle.className = 'sr-only';
      formTitle.textContent = "Formulaire d'inscription de prospecteur";
      form.prepend(formTitle);
    }
  }
  
  // Styles pour éléments invisibles pour les lecteurs d'écran
  const a11yStyles = document.createElement('style');
  a11yStyles.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    *:focus-visible {
      outline: 3px solid #457b9d;
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(a11yStyles);
}

// Amélioration de l'expérience mobile
function enhanceMobileExperience() {
    // Détecter si l'appareil est mobile
    const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Ajouter des classes spécifiques pour mobile
      document.body.classList.add('mobile-device');
      
      // Styles spécifiques pour mobile
      const mobileStyles = document.createElement('style');
      mobileStyles.textContent = `
        .mobile-device .container {
          padding: 15px;
          border-radius: 0;
        }
        
        .mobile-device .form-section {
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .mobile-device .section-title {
          font-size: 14px;
          padding: 6px 12px;
        }
        
        .mobile-device .form-row {
          margin-bottom: 12px;
        }
        
        .mobile-device input[type="text"],
        .mobile-device input[type="email"],
        .mobile-device input[type="tel"],
        .mobile-device select,
        .mobile-device textarea,
        .mobile-device .select-search-input {
          padding: 12px;
          font-size: 16px; /* Empêche le zoom sur iOS */
        }
        
        .mobile-device .commune-chip {
          padding: 6px 12px;
          font-size: 13px;
        }
        
        .mobile-device .submit-btn {
          padding: 15px;
        }
        
        .mobile-device .select-results {
          max-height: 60vh;
        }
        
        /* Amélioration pour la sélection d'entreprise sur mobile */
        .mobile-device .select-search-container {
          position: static;
        }
        
        .mobile-device .select-results.active {
          position: fixed;
          top: 20%;
          left: 5%;
          right: 5%;
          max-height: 60vh;
          z-index: 1000;
          box-shadow: 0 5px 25px rgba(0,0,0,0.2);
        }
        
        .mobile-device .select-results::before {
          content: "×";
          position: absolute;
          top: -40px;
          right: 10px;
          font-size: 30px;
          color: white;
          background: rgba(0,0,0,0.5);
          width: 40px;
          height: 40px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer; /* Added cursor pointer */
        }
        
        .mobile-device .overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        
        .mobile-device .overlay.active {
          display: block;
        }
      `;
      document.head.appendChild(mobileStyles);
      
      // Créer un overlay pour le fond sombre
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      document.body.appendChild(overlay);
      
      // Gérer l'affichage de l'overlay quand le sélecteur d'entreprise est actif
      const resultsContainer = document.getElementById('entreprise-results');
      const searchInput = document.getElementById('entreprise-search');
      
      if (searchInput && resultsContainer) {
        // Ouvrir avec overlay
        searchInput.addEventListener('focus', () => {
          if (document.body.classList.contains('mobile-device')) { // Check if mobile
            overlay.classList.add('active');
          }
        });
        
        // Fermer en cliquant sur l'overlay
        overlay.addEventListener('click', () => {
          resultsContainer.classList.remove('active');
          overlay.classList.remove('active');
        });

        // Fermer en cliquant sur le bouton 'x' (::before pseudo-element)
        resultsContainer.addEventListener('click', (e) => {
           const rect = resultsContainer.getBoundingClientRect();
           const closeButtonX = rect.right - 15 - 40; 
           const closeButtonY = rect.top - 40; 
           if (e.clientX >= closeButtonX && e.clientX <= closeButtonX + 40 &&
               e.clientY >= closeButtonY && e.clientY <= closeButtonY + 40) {
             resultsContainer.classList.remove('active');
             overlay.classList.remove('active');
           }
        });
        
        // Fermer en cliquant sur une option
        resultsContainer.addEventListener('click', (e) => {
          const option = e.target.closest('.select-option');
          if (option && !option.classList.contains('already-assigned')) {
            overlay.classList.remove('active');
          }
        });
      }
      
      // Améliorer l'interaction touch pour les chips de commune
      const communeChips = document.querySelectorAll('.commune-chip');
      communeChips.forEach(chip => {
        chip.addEventListener('touchstart', function(e) { 
          e.preventDefault(); 
          this.classList.add('touch-active');
        }, { passive: false }); 
        
        chip.addEventListener('touchend', function() {
          this.classList.remove('touch-active');
          this.click(); 
        });
      });
      
      // Ajouter des styles pour l'interaction touch
      const touchStyles = document.createElement('style');
      touchStyles.textContent = `
        .commune-chip.touch-active {
          background-color: #c0c0c0; 
          transform: scale(0.95);
        }
      `;
      document.head.appendChild(touchStyles);
    }
  }

// Document Ready Function
document.addEventListener('DOMContentLoaded', function() {
  // Charger les entreprises et configurer le sélecteur d'entreprises
  loadEnterprises()
    .then((enterprises) => {
      setupEnterpriseSelector();
      console.log(`${enterprises.length} entreprises chargées avec succès`);
    })
    .catch(error => {
      console.error('Erreur lors du chargement des entreprises:', error);
      showErrorMessage("Impossible de charger la liste des entreprises. Veuillez rafraîchir la page ou réessayer plus tard.");
    });
  
  // Configurer l'affichage conditionnel pour nouvelle entreprise
  setupConditionalDisplay();
  
  // Configurer la soumission du formulaire
  setupFormSubmission();
  
  // Optimiser pour mobile
  enhanceMobileExperience();
  
  // Ajouter des améliorations d'accessibilité
  enhanceAccessibility();
});


// Chargement des entreprises depuis l'API
async function loadEnterprises() {
  const loadingIndicator = document.getElementById('loading-enterprises');
  
  try {
    // Afficher l'indicateur de chargement
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Appel à l'API avec gestion des erreurs et timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout après 10s
    
    const response = await fetch('https://n8n.dsolution-ia.fr/webhook/get-enterprises', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Traiter la réponse selon son format
    let enterprises = [];
    
    if (Array.isArray(data)) {
      enterprises = data;
    } else if (data.enterprises && Array.isArray(data.enterprises)) {
      enterprises = data.enterprises;
    } else if (data.json && Array.isArray(data.json)) {
      enterprises = data.json;
    } else if (data.data && Array.isArray(data.data)) {
      enterprises = data.data;
    } else {
      console.warn("Format de données d'entreprises non reconnu:", data);
      enterprises = [];
    }
    
    // Stocker pour accès global
    window.enterprises = enterprises;
    window.loadedEnterprises = enterprises;
    
    return enterprises;
    
  } catch (error) {
    console.error('Erreur lors du chargement des entreprises:', error);
    
    // En cas d'erreur, créer un jeu de données minimaliste pour permettre le fonctionnement
    const mockEnterprises = [{
      id: 'demo-1',
      nom_entreprise: "DEMO - Entreprise Test",
      commune: "CLERMONT-L'HÉRAULT",
      adresse: "1 rue de l'exemple",
      telephone: "0400000000",
      email: "exemple@test.com"
    }];
    
    window.enterprises = mockEnterprises;
    window.loadedEnterprises = mockEnterprises;
    
    throw error;
  } finally {
    // Masquer l'indicateur de chargement
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

// Configuration du sélecteur d'entreprises amélioré
function setupEnterpriseSelector() {
    const searchInput = document.getElementById('entreprise-search');
    const resultsContainer = document.getElementById('entreprise-results');
    const hiddenInput = document.getElementById('entreprise');
    
    if (!searchInput || !resultsContainer || !hiddenInput) {
      console.error("Éléments du sélecteur d'entreprises non trouvés");
      return;
    }
    
    const groupedEnterprises = {};
    
    const styles = document.createElement('style');
    styles.textContent = `
      .select-option.already-assigned {
        background-color: rgba(230, 57, 70, 0.1);
        color: #999;
        position: relative;
      }
      .select-option.already-assigned::after {
        content: "Déjà attribuée";
        position: absolute;
        right: 15px;
        font-size: 12px;
        color: #e63946;
        font-style: italic;
      }
      .select-option.already-assigned:hover {
        background-color: rgba(230, 57, 70, 0.15);
        cursor: not-allowed;
      }
      .select-option .enterprise-details {
        display: block;
        font-size: 12px;
        color: #666;
        margin-top: 3px;
      }
      .select-option .highlight {
        background-color: rgba(69, 123, 157, 0.2);
        font-weight: bold;
      }
      .select-no-results {
        padding: 15px;
        text-align: center;
        color: #666;
        font-style: italic;
      }
      .select-help-text {
        padding: 10px 15px;
        font-size: 13px;
        color: #457b9d;
        background-color: rgba(69, 123, 157, 0.1);
        border-bottom: 1px solid #eee;
      }
      @media (max-width: 768px) {
        .select-results { max-height: 250px; }
        .select-option { padding: 12px 15px; }
        .select-option.already-assigned::after { display: block; position: static; margin-top: 3px; }
      }
    `;
    document.head.appendChild(styles);
    
    (window.enterprises || []).forEach(enterprise => {
      const isAssigned = enterprise.statut_2026 === 'En Cours de Prospection';
      const commune = typeof enterprise.commune === 'object' && enterprise.commune !== null 
        ? enterprise.commune.value || 'Autre' 
        : enterprise.commune || 'Autre';
      
      if (!groupedEnterprises[commune]) {
        groupedEnterprises[commune] = { available: [], assigned: [] };
      }
      
      if (isAssigned) {
        groupedEnterprises[commune].assigned.push(enterprise);
      } else {
        groupedEnterprises[commune].available.push(enterprise);
      }
    });
    
    function highlightMatches(text, searchTerm) {
      if (!searchTerm || !text) return text || '';
      const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    function displayResults(searchTerm = '') {
      resultsContainer.innerHTML = '';
      
      if (searchTerm.length > 0 && searchTerm.length < 2) {
        const helpText = document.createElement('div');
        helpText.className = 'select-help-text';
        helpText.textContent = 'Continuez à taper pour affiner les résultats...';
        resultsContainer.appendChild(helpText);
      }
      
      if (searchTerm.length < 2) {
        if (searchTerm.length === 0) {
          const sortedCommunes = Object.keys(groupedEnterprises)
            .filter(commune => ['CLERMONT-L\'HÉRAULT', 'BRIGNAC', 'CANET', 'CEYRAS', 'NÉBIAN', 'PAULHAN'].includes(commune))
            .sort();
          
          sortedCommunes.forEach(commune => {
            addCommuneGroup(commune, groupedEnterprises[commune], searchTerm);
          });
          
          if (sortedCommunes.length > 0) {
            const helpText = document.createElement('div');
            helpText.className = 'select-help-text';
            helpText.textContent = 'Tapez pour rechercher d\'autres entreprises...';
            resultsContainer.appendChild(helpText);
          }
        }
        resultsContainer.classList.add('active');
        return;
      }
      
      const searchLower = searchTerm.toLowerCase();
      let hasResults = false;
      const sortedCommunes = Object.keys(groupedEnterprises).sort();
      
      sortedCommunes.forEach(commune => {
        const communeResults = addCommuneGroup(commune, groupedEnterprises[commune], searchTerm);
        if (communeResults > 0) hasResults = true;
      });
      
      if (!hasResults) {
        const noResults = document.createElement('div');
        noResults.className = 'select-no-results';
        noResults.innerHTML = `Aucun résultat pour <strong>"${searchTerm}"</strong>`;
        resultsContainer.appendChild(noResults);
      }
      resultsContainer.classList.add('active');
    }
    
    function addCommuneGroup(commune, enterpriseGroups, searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      let addedCount = 0;
      
      const matchingAvailable = (enterpriseGroups.available || []).filter(
        enterprise => (enterprise.nom_entreprise && enterprise.nom_entreprise.toLowerCase().includes(searchLower)) ||
                     (enterprise.activitée && enterprise.activitée.toLowerCase().includes(searchLower))
      );
      
      const matchingAssigned = (enterpriseGroups.assigned || []).filter(
        enterprise => (enterprise.nom_entreprise && enterprise.nom_entreprise.toLowerCase().includes(searchLower)) ||
                      (enterprise.activitée && enterprise.activitée.toLowerCase().includes(searchLower))
      );
      
      if (matchingAvailable.length === 0 && matchingAssigned.length === 0) {
        return 0;
      }
      
      const groupHeader = document.createElement('div');
      groupHeader.className = 'select-group-header';
      groupHeader.textContent = commune;
      resultsContainer.appendChild(groupHeader);
      
      matchingAvailable.forEach(enterprise => {
        addEnterpriseOption(enterprise, searchTerm, false);
        addedCount++;
      });
      
      matchingAssigned.forEach(enterprise => {
        addEnterpriseOption(enterprise, searchTerm, true);
        addedCount++;
      });
      return addedCount;
    }
    
    function addEnterpriseOption(enterprise, searchTerm, isAssigned) {
      const option = document.createElement('div');
      option.className = 'select-option';
      if (isAssigned) option.className += ' already-assigned';
      
      const highlightedName = highlightMatches(enterprise.nom_entreprise, searchTerm);
      const addressDetails = enterprise.adresse ? `<span class="enterprise-details">${enterprise.adresse}</span>` : '';
      const activityDetails = enterprise.activitée ? `<span class="enterprise-details">${enterprise.activitée}</span>` : '';
      
      option.innerHTML = `${highlightedName}${addressDetails}${activityDetails}`;
      option.dataset.id = enterprise.id;
      
      if (!isAssigned) {
        option.addEventListener('click', () => {
          hiddenInput.value = enterprise.id;
          searchInput.value = enterprise.nom_entreprise;
          resultsContainer.classList.remove('active');
          const changeEvent = new Event('change', { bubbles: true });
          hiddenInput.dispatchEvent(changeEvent);
          const errorElement = document.getElementById('entreprise-error');
          if (errorElement) errorElement.style.display = 'none';
        });
      } else {
        option.title = "Cette entreprise est déjà attribuée à un prospecteur";
      }
      resultsContainer.appendChild(option);
    }
    
    searchInput.addEventListener('focus', () => displayResults(searchInput.value));
    searchInput.addEventListener('input', () => displayResults(searchInput.value));
    
    searchInput.addEventListener('keydown', (e) => {
      const options = resultsContainer.querySelectorAll('.select-option:not(.already-assigned)');
      const currentIndex = Array.from(options).findIndex(option => option.classList.contains('keyboard-focus'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateOptions(currentIndex + 1, options);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateOptions(currentIndex - 1, options);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const focusedOption = resultsContainer.querySelector('.select-option.keyboard-focus');
        if (focusedOption) focusedOption.click();
      } else if (e.key === 'Escape') {
        resultsContainer.classList.remove('active');
      }
    });
    
    function navigateOptions(newIndex, options) {
      const previousFocus = resultsContainer.querySelector('.select-option.keyboard-focus');
      if (previousFocus) previousFocus.classList.remove('keyboard-focus');
      
      if (options.length > 0) {
        const adjustedIndex = ((newIndex % options.length) + options.length) % options.length;
        options[adjustedIndex].classList.add('keyboard-focus');
        options[adjustedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('active');
      }
    });
    
    const keyboardStyles = document.createElement('style');
    keyboardStyles.textContent = `
      .select-option.keyboard-focus {
        background-color: rgba(69, 123, 157, 0.2);
        border-left: 3px solid #457b9d;
      }
    `;
    document.head.appendChild(keyboardStyles);
}
  
// Gestion de l'affichage conditionnel
const setupConditionalDisplay = () => {
    const checkboxNouvelleEntreprise = document.getElementById('nouvelle_entreprise');
    const sectionNouvelleEntreprise = document.getElementById('nouvelle-entreprise-section');
    const champEntrepriseSelect = document.getElementById('entreprise'); // Le select
    const champEntrepriseSearch = document.getElementById('entreprise-search'); // Le champ de recherche visible
    
    if (checkboxNouvelleEntreprise && sectionNouvelleEntreprise && champEntrepriseSelect && champEntrepriseSearch) {
        checkboxNouvelleEntreprise.addEventListener('change', function() {
            if (this.checked) {
                sectionNouvelleEntreprise.style.display = 'block';
                champEntrepriseSelect.required = false; 
                champEntrepriseSearch.disabled = true; // Désactiver le champ de recherche
                // Rendre les champs de la nouvelle entreprise obligatoires
                document.getElementById('nom_entreprise').required = true;
                document.getElementById('adresse_entreprise').required = true;
                document.getElementById('commune_entreprise').required = true;
            } else {
                sectionNouvelleEntreprise.style.display = 'none';
                champEntrepriseSelect.required = true;
                champEntrepriseSearch.disabled = false; // Réactiver le champ de recherche
                // Rendre les champs de la nouvelle entreprise non obligatoires
                document.getElementById('nom_entreprise').required = false;
                document.getElementById('adresse_entreprise').required = false;
                document.getElementById('commune_entreprise').required = false;
            }
        });
    } else {
        console.error("Un ou plusieurs éléments pour l'affichage conditionnel sont manquants.");
    }
};
  
// 🔧 AMÉLIORATION : Validation avant soumission
function validateFormBeforeSubmit() {
  const isNewEnterprise = document.getElementById('nouvelle_entreprise').checked;
  const selectedEnterprise = document.getElementById('entreprise').value; // ID de l'entreprise sélectionnée (champ caché)
  
  // Valider les champs du prospecteur (toujours requis)
  const nomProspecteur = document.getElementById('nom_prenom').value;
  const emailProspecteur = document.getElementById('email').value;
  const delai = document.getElementById('delai').value;

  if (!nomProspecteur) {
    showErrorMessage('Veuillez indiquer votre Nom et Prénom.');
    document.getElementById('nom_prenom').focus();
    return false;
  }
  if (!emailProspecteur) {
    showErrorMessage('Veuillez indiquer votre Adresse Email.');
    document.getElementById('email').focus();
    return false;
  }
  // Simple validation de format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailProspecteur)) {
    showErrorMessage('Veuillez indiquer une Adresse Email valide.');
    document.getElementById('email').focus();
    return false;
  }
  if (!delai) {
    showErrorMessage('Veuillez sélectionner un délai de prospection.');
    document.getElementById('delai').focus();
    return false;
  }


  if (!isNewEnterprise && !selectedEnterprise) {
    showErrorMessage('Veuillez sélectionner une entreprise dans la liste OU cocher "L\'entreprise que je souhaite contacter n\'est pas dans la liste" et remplir les détails.');
    document.getElementById('entreprise-search').focus(); // Mettre le focus sur le champ de recherche visible
    return false;
  }
  
  if (isNewEnterprise) {
    const nomEntreprise = document.getElementById('nom_entreprise').value;
    const adresseEntreprise = document.getElementById('adresse_entreprise').value;
    const communeEntreprise = document.getElementById('commune_entreprise').value; // Champ de texte pour la nouvelle commune
    
    if (!nomEntreprise) {
      showErrorMessage('Veuillez indiquer le Nom de la nouvelle entreprise.');
      document.getElementById('nom_entreprise').focus();
      return false;
    }
    if (!adresseEntreprise) {
      showErrorMessage('Veuillez indiquer l\'Adresse de la nouvelle entreprise.');
      document.getElementById('adresse_entreprise').focus();
      return false;
    }
    if (!communeEntreprise) {
      showErrorMessage('Veuillez indiquer la Commune de la nouvelle entreprise.');
      document.getElementById('commune_entreprise').focus();
      return false;
    }
  }
  
  // Si tout est OK, masquer un éventuel message d'erreur précédent
  const errorElement = document.getElementById('form-error-message');
  if (errorElement) errorElement.style.display = 'none';
  
  return true;
}

// Gestion de la soumission du formulaire - VERSION CORRIGÉE
function setupFormSubmission() {
  const form = document.getElementById('prospecteur-form');
  
  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // ✨ AJOUT : Validation avant de continuer
    if (!validateFormBeforeSubmit()) {
        const submitButton = document.getElementById('submit-button');
        if (submitButton) { // Vérifier si le bouton existe
            submitButton.disabled = false;
            submitButton.innerHTML = 'CONFIRMER MA PARTICIPATION';
        }
        return;
    }

    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loader"></span> Traitement en cours...';
    
    let formObject = {}; // Déclaré ici pour être accessible dans le catch

    try {
      const formData = new FormData(this);
      formData.forEach((value, key) => {
        formObject[key] = value;
      });
      
      formObject.source = 'formulaire_web';
      formObject.timestamp = Date.now();
      formObject.user_agent = navigator.userAgent;
      formObject.page_url = window.location.href;
      
      const isNewEnterprise = document.getElementById('nouvelle_entreprise').checked;
      
      console.log('Debug - isNewEnterprise:', isNewEnterprise);
      console.log('Debug - formObject.entreprise (ID sélectionné):', formObject.entreprise);
      console.log('Debug - window.loadedEnterprises:', window.loadedEnterprises?.length || 'non chargées');
      
      if (!isNewEnterprise) {
        const enterpriseId = formObject.entreprise;
        
        if (enterpriseId && window.loadedEnterprises) {
          const selectedEnterprise = window.loadedEnterprises.find(e => 
            String(e.id) === String(enterpriseId)
          );
          
          if (selectedEnterprise) {
            console.log('Debug - Entreprise trouvée:', selectedEnterprise);
            
            const commune = typeof selectedEnterprise.commune === 'object' && selectedEnterprise.commune !== null 
              ? selectedEnterprise.commune.value || '' 
              : selectedEnterprise.commune || '';
            
            formObject.nom_entreprise_selectionnee = selectedEnterprise.nom_entreprise || '';
            formObject.commune_entreprise_selectionnee = commune;
            formObject.adresse_entreprise_selectionnee = selectedEnterprise.adresse || '';
            formObject.telephone_entreprise_selectionnee = selectedEnterprise.telephone || selectedEnterprise.portable || '';
            formObject.email_entreprise_selectionnee = selectedEnterprise.email || '';
            formObject.activite_entreprise_selectionnee = selectedEnterprise.activitée || selectedEnterprise.activite || '';
            
            console.log('Debug - Données entreprise sélectionnée ajoutées:', {
              nom: formObject.nom_entreprise_selectionnee,
              commune: formObject.commune_entreprise_selectionnee,
              adresse: formObject.adresse_entreprise_selectionnee
            });
          } else {
            console.error('Entreprise non trouvée avec ID:', enterpriseId);
            // Ne pas lancer d'erreur ici, la validation a déjà eu lieu
            // Mais on peut loguer un avertissement si on s'attendait à la trouver
          }
        } else if (enterpriseId && !window.loadedEnterprises) {
            console.warn('Entreprises non chargées, mais un ID entreprise est présent. Peut-être un problème de chargement initial.');
        }
         // Si !enterpriseId, la validation l'a déjà géré
      } else {
        // Nouvelle entreprise - les données sont déjà dans formObject sous nom_entreprise, commune_entreprise etc.
        console.log('Debug - Nouvelle entreprise, données:', {
          nom: formObject.nom_entreprise,
          commune: formObject.commune_entreprise,
          adresse: formObject.adresse_entreprise
        });
      }
      
      console.log("✅ Données prêtes à envoyer vers n8n Gateway:", formObject);
      
      const response = await fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Form-Source': 'prospecteur-form', // Ajout pour identification côté Gateway
        },
        body: JSON.stringify({ // Le Gateway s'attend à un objet avec `body`, `headers`, `source`
          body: { 
            form_name: 'prospecteur-form', // Nom explicite du formulaire
            ...formObject 
          },
          headers: { // Quelques headers utiles pour le contexte
            'user-agent': navigator.userAgent,
            'referer': window.location.href
          },
          source: 'html_form_prospecteur' // Source plus spécifique
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l'envoi du formulaire: ${response.status} ${response.statusText}. Détail: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log("✅ Réponse du Gateway n8n:", responseData);
      
      if (responseData.success !== false) {
        showEnhancedConfirmation(formObject, responseData);
      } else {
        throw new Error(responseData.error || responseData.message || 'Erreur de traitement signalée par le serveur.');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      
      submitButton.disabled = false;
      submitButton.innerHTML = 'CONFIRMER MA PARTICIPATION';
      
      showErrorMessage(`Une erreur est survenue: ${error.message}.`);
      
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) { // Plus précis pour les erreurs réseau
        console.log('📧 Tentative de fallback vers Netlify Forms...');
        tryNetlifyFormSubmission(formObject); // S'assurer que formObject est défini et contient les bonnes données
      }
    }
  });
}

// 🔧 AMÉLIORATION : Fonction pour afficher les erreurs
function showErrorMessage(message) {
  let errorElement = document.getElementById('form-error-message');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'form-error-message';
    errorElement.className = 'error-message-global'; // S'assurer que cette classe est stylée dans le CSS
    // Appliquer les styles directement si la classe n'est pas suffisante ou pour forcer
    errorElement.style.cssText = `
      color: #e63946; /* var(--primary) */
      background-color: rgba(230, 57, 70, 0.1); /* var(--primary) avec opacité */
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #e63946; /* var(--primary) */
      font-weight: bold;
      display: block; /* S'assurer qu'il est visible */
    `;
    
    const form = document.getElementById('prospecteur-form');
    // Insérer avant le premier enfant du formulaire, ou à la fin si pas d'enfants (peu probable)
    form.insertBefore(errorElement, form.firstChild);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block'; // Rendre visible au cas où il aurait été masqué
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 'center' peut être mieux pour la visibilité
}

// Fallback vers Netlify Forms
function tryNetlifyFormSubmission(formDataObject) { // Renommé pour clarté
  console.log("Tentative de soumission via Netlify Forms (fallback)...");
  
  const netlifyForm = document.createElement('form');
  netlifyForm.method = 'POST';
  netlifyForm.action = '/prospecteur/'; // Action par défaut pour Netlify sur le même site
  netlifyForm.setAttribute('data-netlify', 'true');
  netlifyForm.setAttribute('name', 'prospecteur-form-fallback'); // Nom différent pour éviter conflits potentiels
  netlifyForm.style.display = 'none'; // Masquer ce formulaire de fallback

  // Ajouter chaque champ au formulaire Netlify
  for (const key in formDataObject) {
    if (formDataObject.hasOwnProperty(key)) {
      // Éviter les champs spécifiques à la logique interne ou déjà gérés par Netlify
      if (key !== 'form-name' && key !== 'bot-field' && key !== 'source' && key !== 'timestamp' && key !== 'user_agent' && key !== 'page_url') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = formDataObject[key];
        netlifyForm.appendChild(input);
      }
    }
  }
  
  // Ajouter le champ form-name requis par Netlify
  const formNameInput = document.createElement('input');
  formNameInput.type = 'hidden';
  formNameInput.name = 'form-name';
  formNameInput.value = 'prospecteur-form-fallback'; // Doit correspondre au nom du formulaire Netlify
  netlifyForm.appendChild(formNameInput);
  
  document.body.appendChild(netlifyForm);
  netlifyForm.submit();
  // Après la soumission, on peut informer l'utilisateur, bien que la page va probablement recharger.
  showErrorMessage("Le formulaire a été envoyé via un mode alternatif. Nous vous contacterons bientôt.");
}

// Afficher une confirmation enrichie
function showEnhancedConfirmation(formData, responseData) {
  document.getElementById('prospecteur-form').style.display = 'none';
  const confirmation = document.getElementById('confirmation');
  
  const enterpriseName = formData.nom_entreprise_selectionnee || formData.nom_entreprise || 'l\'entreprise désignée';
  const prospecteurName = formData.nom_prenom;
  
  let confirmationContent = `
    <div class="confirmation-icon">✓</div>
    <h2>Participation confirmée !</h2>
    <p>Merci <strong>${prospecteurName}</strong> pour votre engagement auprès des Sapeurs-Pompiers de Clermont l'Hérault.</p>
    <p>Votre mission de prospection pour <strong>${enterpriseName}</strong> a été enregistrée avec succès.</p>
    
    <div class="countdown-container">
      <p>Vous allez recevoir un email dans:</p>
      <div class="countdown" id="email-countdown">00:02:00</div>
      <p class="countdown-info">L'email contiendra toutes les informations nécessaires pour contacter l'entreprise.</p>
    </div>
    
    <div class="next-actions">
      <h3>Prochaines étapes:</h3>
      <ol>
        <li>Consultez votre boîte email</li>
        <li>Préparez votre appel en lisant notre guide (qui sera dans l'email)</li>
        <li>Contactez l'entreprise dans le délai choisi</li>
        <li>Transmettez-nous les résultats via le formulaire de qualification (lien dans l'email)</li>
      </ol>
    </div>
    
    <div class="social-share">
      <p>Encouragez vos amis à participer:</p>
      <div class="share-buttons">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href.split('?')[0])}" target="_blank" class="share-button facebook">Partager sur Facebook</a>
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Je viens de devenir prospecteur pour le calendrier des Sapeurs-Pompiers de Clermont l'Hérault. Rejoignez-moi !`)}&url=${encodeURIComponent(window.location.href.split('?')[0])}" target="_blank" class="share-button twitter">Partager sur Twitter</a>
      </div>
    </div>
  `;
  
  confirmation.innerHTML = confirmationContent;
  confirmation.style.display = 'block';
  
  const styles = document.createElement('style');
  styles.textContent = `
    .countdown-container { background-color: rgba(29, 53, 87, 0.1); border-radius: 8px; padding: 15px; margin: 25px 0; text-align: center; }
    .countdown { font-size: 36px; font-weight: bold; color: #1d3557; margin: 10px 0; }
    .countdown-info { font-style: italic; color: #666; font-size: 14px; }
    .next-actions { background-color: #f1faee; border-radius: 8px; padding: 15px; margin: 25px 0; border-left: 4px solid #457b9d; }
    .next-actions h3 { margin-top: 0; color: #457b9d; }
    .next-actions ol { margin-bottom: 0; padding-left: 20px; }
    .social-share { margin-top: 25px; text-align: center; } /* Centrer le texte */
    .share-buttons { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; justify-content: center; } /* Centrer les boutons */
    .share-button { display: inline-block; padding: 8px 16px; border-radius: 20px; text-decoration: none; color: white; font-weight: bold; font-size: 14px; }
    .facebook { background-color: #3b5998; }
    .twitter { background-color: #1da1f2; }
    .share-button:hover { opacity: 0.9; }
  `;
  document.head.appendChild(styles);
  
  confirmation.scrollIntoView({ behavior: 'smooth' });
  startCountdown();
}

// Fonction de compte à rebours
function startCountdown() {
  let minutes = 2;
  let seconds = 0;
  const countdownElement = document.getElementById('email-countdown');
  if (!countdownElement) return; // Quitter si l'élément n'existe pas

  const interval = setInterval(() => {
    if (seconds === 0) {
      if (minutes === 0) {
        clearInterval(interval);
        countdownElement.textContent = "L'email devrait être arrivé !";
        countdownElement.style.color = "#4CAF50"; // Vert succès
        return;
      }
      minutes--;
      seconds = 59;
    } else {
      seconds--;
    }
    countdownElement.textContent = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}