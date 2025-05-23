
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
            // Note: Pseudo-elements cannot have direct event listeners.
            // We listen on the results container and check the click position relative to the pseudo-element.
            resultsContainer.addEventListener('click', (e) => {
               // Check if the click was on the pseudo-element area
               const rect = resultsContainer.getBoundingClientRect();
               const closeButtonX = rect.right - 15 - 40; // right edge - padding - width
               const closeButtonY = rect.top - 40; // top edge - height
               if (e.clientX >= closeButtonX && e.clientX <= closeButtonX + 40 &&
                   e.clientY >= closeButtonY && e.clientY <= closeButtonY + 40) {
                 resultsContainer.classList.remove('active');
                 overlay.classList.remove('active');
               }
            });
            
            // Fermer en cliquant sur une option
            resultsContainer.addEventListener('click', (e) => {
              // Use closest to handle clicks inside the option details
              const option = e.target.closest('.select-option');
              if (option && !option.classList.contains('already-assigned')) {
                overlay.classList.remove('active');
              }
            });
          }
          
          // Améliorer l'interaction touch pour les chips de commune
          const communeChips = document.querySelectorAll('.commune-chip');
          communeChips.forEach(chip => {
            chip.addEventListener('touchstart', function(e) { // Prevent default scroll on touch
              e.preventDefault(); 
              this.classList.add('touch-active');
            }, { passive: false }); // Need passive: false to preventDefault
            
            chip.addEventListener('touchend', function() {
              this.classList.remove('touch-active');
              // Trigger click after touch interaction for selection logic
              this.click(); 
            });
          });
          
          // Ajouter des styles pour l'interaction touch
          const touchStyles = document.createElement('style');
          touchStyles.textContent = `
            .commune-chip.touch-active {
              background-color: #c0c0c0; /* Darker grey for touch feedback */
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
        
        // Grouper les entreprises par commune et par statut
        const groupedEnterprises = {};
        
        // Ajouter des styles CSS pour les entreprises déjà attribuées
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
            .select-results {
              max-height: 250px;
            }
            
            .select-option {
              padding: 12px 15px;
            }
            
            .select-option.already-assigned::after {
              display: block;
              position: static;
              margin-top: 3px;
            }
          }
        `;
        document.head.appendChild(styles);
        
        // Traiter les entreprises pour l'affichage
        enterprises.forEach(enterprise => {
          // Déterminer si l'entreprise est déjà attribuée
          const isAssigned = enterprise.statut_2026 === 'En Cours de Prospection';
          
          // Extraire la commune
          const commune = typeof enterprise.commune === 'object' && enterprise.commune !== null 
            ? enterprise.commune.value || 'Autre' 
            : enterprise.commune || 'Autre';
          
          // Créer ou récupérer le groupe de commune
          if (!groupedEnterprises[commune]) {
            groupedEnterprises[commune] = {
              available: [],
              assigned: []
            };
          }
          
          // Ajouter l'entreprise au groupe approprié
          if (isAssigned) {
            groupedEnterprises[commune].assigned.push(enterprise);
          } else {
            groupedEnterprises[commune].available.push(enterprise);
          }
        });
        
        // Fonction pour mettre en évidence les termes de recherche
        function highlightMatches(text, searchTerm) {
          if (!searchTerm) return text;
          
          const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
          return text.replace(regex, '<span class="highlight">$1</span>');
        }
        
        // Fonction pour afficher les résultats filtrés avec autocomplétion
        function displayResults(searchTerm = '') {
          resultsContainer.innerHTML = '';
          
          // Ajouter un texte d'aide
          if (searchTerm.length > 0 && searchTerm.length < 3) {
            const helpText = document.createElement('div');
            helpText.className = 'select-help-text';
            helpText.textContent = 'Continuez à taper pour affiner les résultats...';
            resultsContainer.appendChild(helpText);
          }
          
          // Afficher les résultats seulement si la recherche est assez longue
          if (searchTerm.length < 2) {
            if (searchTerm.length === 0) {
              // Si aucun terme de recherche, montrer les communes principales
              const sortedCommunes = Object.keys(groupedEnterprises)
                .filter(commune => ['CLERMONT-L\'HÉRAULT', 'BRIGNAC', 'CANET', 'CEYRAS', 'NÉBIAN', 'PAULHAN'].includes(commune))
                .sort();
              
              sortedCommunes.forEach(commune => {
                addCommuneGroup(commune, groupedEnterprises[commune], searchTerm);
              });
              
              // Ajouter un message pour encourager la recherche
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
          
          // Trier les communes alphabétiquement
          const sortedCommunes = Object.keys(groupedEnterprises).sort();
          
          sortedCommunes.forEach(commune => {
            const communeResults = addCommuneGroup(commune, groupedEnterprises[commune], searchTerm);
            if (communeResults > 0) hasResults = true;
          });
          
          // Afficher un message si aucun résultat
          if (!hasResults) {
            const noResults = document.createElement('div');
            noResults.className = 'select-no-results';
            noResults.innerHTML = `Aucun résultat pour <strong>"${searchTerm}"</strong>`;
            resultsContainer.appendChild(noResults);
          }
          
          resultsContainer.classList.add('active');
        }
        
        // Fonction pour ajouter un groupe de commune avec ses entreprises
        function addCommuneGroup(commune, enterpriseGroups, searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          let addedCount = 0;
          
          // Filtrer les entreprises disponibles qui correspondent à la recherche
          const matchingAvailable = enterpriseGroups.available.filter(
            enterprise => enterprise.nom_entreprise.toLowerCase().includes(searchLower) ||
                         (enterprise.activitée && enterprise.activitée.toLowerCase().includes(searchLower))
          );
          
          // Filtrer les entreprises attribuées qui correspondent à la recherche
          const matchingAssigned = enterpriseGroups.assigned.filter(
            enterprise => enterprise.nom_entreprise.toLowerCase().includes(searchLower) ||
                          (enterprise.activitée && enterprise.activitée.toLowerCase().includes(searchLower))
          );
          
          // S'il n'y a pas de correspondances, ne pas afficher ce groupe
          if (matchingAvailable.length === 0 && matchingAssigned.length === 0) {
            return 0;
          }
          
          // Créer l'en-tête de groupe (commune)
          const groupHeader = document.createElement('div');
          groupHeader.className = 'select-group-header';
          groupHeader.textContent = commune;
          resultsContainer.appendChild(groupHeader);
          
          // Ajouter d'abord les entreprises disponibles
          matchingAvailable.forEach(enterprise => {
            addEnterpriseOption(enterprise, searchTerm, false);
            addedCount++;
          });
          
          // Puis ajouter les entreprises déjà attribuées
          matchingAssigned.forEach(enterprise => {
            addEnterpriseOption(enterprise, searchTerm, true);
            addedCount++;
          });
          
          return addedCount;
        }
        
        // Fonction pour ajouter une option d'entreprise
        function addEnterpriseOption(enterprise, searchTerm, isAssigned) {
          const option = document.createElement('div');
          option.className = 'select-option';
          if (isAssigned) option.className += ' already-assigned';
          
          // Mettre en évidence les termes de recherche dans le nom
          const highlightedName = highlightMatches(enterprise.nom_entreprise, searchTerm);
          
          // Ajouter des détails supplémentaires
          const addressDetails = enterprise.adresse ? `<span class="enterprise-details">${enterprise.adresse}</span>` : '';
          const activityDetails = enterprise.activitée ? `<span class="enterprise-details">${enterprise.activitée}</span>` : '';
          
          option.innerHTML = `${highlightedName}${addressDetails}${activityDetails}`;
          option.dataset.id = enterprise.id;
          
          // Ajouter l'événement de clic seulement pour les entreprises disponibles
          if (!isAssigned) {
            option.addEventListener('click', () => {
              hiddenInput.value = enterprise.id;
              searchInput.value = enterprise.nom_entreprise;
              resultsContainer.classList.remove('active');
              
              // Déclencher un événement de changement pour le champ caché
              const changeEvent = new Event('change', { bubbles: true });
              hiddenInput.dispatchEvent(changeEvent);
              
              // Masquer le message d'erreur s'il est affiché
              const errorElement = document.getElementById('entreprise-error');
              if (errorElement) errorElement.style.display = 'none';
            });
          } else {
            // Pour les entreprises déjà attribuées, ajouter un titre explicatif
            option.title = "Cette entreprise est déjà attribuée à un prospecteur";
          }
          
          resultsContainer.appendChild(option);
        }
        
        // Événements pour le champ de recherche
        searchInput.addEventListener('focus', () => {
          displayResults(searchInput.value);
        });
        
        searchInput.addEventListener('input', () => {
          displayResults(searchInput.value);
        });
        
        // Ajouter un événement keydown pour la navigation au clavier
        searchInput.addEventListener('keydown', (e) => {
          const options = resultsContainer.querySelectorAll('.select-option:not(.already-assigned)');
          const currentIndex = Array.from(options).findIndex(option => option.classList.contains('keyboard-focus'));
          
          // Naviguer avec les flèches
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
        
        // Fonction pour naviguer entre les options avec le clavier
        function navigateOptions(newIndex, options) {
          // Supprimer le focus précédent
          const previousFocus = resultsContainer.querySelector('.select-option.keyboard-focus');
          if (previousFocus) previousFocus.classList.remove('keyboard-focus');
          
          // Appliquer le nouveau focus
          if (options.length > 0) {
            const adjustedIndex = ((newIndex % options.length) + options.length) % options.length;
            options[adjustedIndex].classList.add('keyboard-focus');
            options[adjustedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        
        // Fermer le menu quand on clique ailleurs
        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.remove('active');
          }
        });
        
        // Ajouter des styles pour la navigation au clavier
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
        const champEntreprise = document.getElementById('entreprise');
        
        checkboxNouvelleEntreprise.addEventListener('change', function() {
          if (this.checked) {
            sectionNouvelleEntreprise.style.display = 'block';
            champEntreprise.required = false;
            document.getElementById('nom_entreprise').required = true;
            document.getElementById('adresse_entreprise').required = true;
            document.getElementById('commune_entreprise').required = true;
          } else {
            sectionNouvelleEntreprise.style.display = 'none';
            champEntreprise.required = true;
            document.getElementById('nom_entreprise').required = false;
            document.getElementById('adresse_entreprise').required = false;
            document.getElementById('commune_entreprise').required = false;
          }
        });
      };
      
      // Gestion de la soumission du formulaire
function setupFormSubmission() {
  const form = document.getElementById('prospecteur-form');
  
  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Désactiver le bouton de soumission et afficher l'indicateur de chargement
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loader"></span> Traitement en cours...';
    
    try {
      // Collecter les données du formulaire de base
      const formData = new FormData(this);
      const formObject = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });
      
      // Ajouter des métadonnées utiles
      formObject.source = 'formulaire_web';
      formObject.timestamp = Date.now();
      formObject.user_agent = navigator.userAgent;
      formObject.page_url = window.location.href;
      
      // Vérifier si c'est une nouvelle entreprise
      const isNewEnterprise = formObject.nouvelle_entreprise === 'on';
      
      // Données de l'entreprise sélectionnée
      if (!isNewEnterprise && formObject.entreprise) {
        const enterpriseId = formObject.entreprise;
        const selectedEnterprise = window.loadedEnterprises?.find(e => 
          String(e.id) === String(enterpriseId)
        );
        
        if (selectedEnterprise) {
          // Extraire la commune (peut être un objet ou une chaîne)
          const commune = typeof selectedEnterprise.commune === 'object' && selectedEnterprise.commune !== null 
            ? selectedEnterprise.commune.value || '' 
            : selectedEnterprise.commune || '';
          
          // Format exact attendu par le workflow n8n
          formObject.nom_entreprise = selectedEnterprise.nom_entreprise || '';
          formObject.commune_entreprise = commune;
          formObject.adresse_entreprise = selectedEnterprise.adresse || '';
          formObject.telephone_entreprise = selectedEnterprise.telephone || selectedEnterprise.portable || '';
          formObject.email_entreprise = selectedEnterprise.email || '';
        }
      }
      
      console.log("Données prêtes à envoyer vers n8n Gateway:", formObject);
      
      // ✨ NOUVEAU : Envoyer vers le Gateway n8n au lieu de Netlify
      const response = await fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Form-Source': 'prospecteur-form',
          'X-User-Agent': navigator.userAgent
        },
        body: JSON.stringify({
          body: {
            form_name: 'prospecteur-form',
            ...formObject  // Spread des données du formulaire
          },
          headers: {
            'user-agent': navigator.userAgent,
            'referer': window.location.href
          },
          source: 'html_form'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de l'envoi du formulaire: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Réponse du Gateway n8n:", responseData);
      
      // Vérifier si la réponse indique un succès
      if (responseData.success !== false) {
        // Afficher la page de confirmation enrichie
        showEnhancedConfirmation(formObject, responseData);
      } else {
        throw new Error(responseData.error || responseData.message || 'Erreur de traitement');
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      
      // Réactiver le bouton et indiquer l'erreur
      submitButton.disabled = false;
      submitButton.innerHTML = 'CONFIRMER MA PARTICIPATION';
      
      // Afficher un message d'erreur à l'utilisateur
      showErrorMessage(`Une erreur est survenue: ${error.message}. Tentative de fallback...`);
      
      // Fallback : tentative d'envoi via Netlify Forms si le Gateway échoue
      tryNetlifyFormSubmission(formObject);
    }
  });
}

// Fonction pour afficher un message d'erreur (à ajouter si pas déjà présente)
function showErrorMessage(message) {
  // Vérifier si un message d'erreur existe déjà
  let errorElement = document.getElementById('form-error-message');
  
  if (!errorElement) {
    // Créer un nouvel élément pour le message d'erreur
    errorElement = document.createElement('div');
    errorElement.id = 'form-error-message';
    errorElement.className = 'error-message-global';
    errorElement.style.color = '#e63946';
    errorElement.style.backgroundColor = 'rgba(230, 57, 70, 0.1)';
    errorElement.style.padding = '15px';
    errorElement.style.borderRadius = '5px';
    errorElement.style.marginBottom = '20px';
    errorElement.style.borderLeft = '4px solid #e63946';
    errorElement.style.fontWeight = 'bold';
    
    // Insérer au début du formulaire
    const form = document.getElementById('prospecteur-form');
    form.insertBefore(errorElement, form.firstChild);
  }
  
  // Mettre à jour le message
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Faire défiler jusqu'au message d'erreur
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Fallback vers Netlify Forms (garder comme sécurité)
function tryNetlifyFormSubmission(formData) {
  console.log("Tentative de soumission via Netlify Forms (fallback)...");
  
  const netlifyForm = document.createElement('form');
  netlifyForm.method = 'POST';
  netlifyForm.action = '/';
  netlifyForm.setAttribute('data-netlify', 'true');
  netlifyForm.setAttribute('name', 'prospecteur-form');
  
  // Ajouter chaque champ au formulaire Netlify
  Object.keys(formData).forEach(key => {
    if (key !== 'form-name' && key !== 'bot-field') {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = formData[key];
      netlifyForm.appendChild(input);
    }
  });
  
  // Ajouter le champ form-name pour Netlify
  const formNameInput = document.createElement('input');
  formNameInput.type = 'hidden';
  formNameInput.name = 'form-name';
  formNameInput.value = 'prospecteur-form';
  netlifyForm.appendChild(formNameInput);
  
  // Ajouter et soumettre le formulaire
  document.body.appendChild(netlifyForm);
  netlifyForm.submit();
}

      // Afficher une confirmation enrichie
      function showEnhancedConfirmation(formData, responseData) {
        // Masquer le formulaire
        document.getElementById('prospecteur-form').style.display = 'none';
        
        // Récupérer et afficher la confirmation
        const confirmation = document.getElementById('confirmation');
        
        // Enrichir le contenu de la confirmation
        const enterpriseName = formData.entreprise_nom || 'l\'entreprise sélectionnée';
        const prospecteurName = formData.nom_prenom;
        
        // Créer le contenu enrichi
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
              <li>Préparez votre appel en lisant notre guide</li>
              <li>Contactez l'entreprise dans le délai choisi</li>
              <li>Transmettez-nous les résultats via le formulaire de qualification</li>
            </ol>
          </div>
          
          <div class="social-share">
            <p>Encouragez vos amis à participer:</p>
            <div class="share-buttons">
              <a href="https://www.facebook.com/sharer/sharer.php?u=https://formulaire.pompiers34800.com" target="_blank" class="share-button facebook">Partager sur Facebook</a>
              <a href="https://twitter.com/intent/tweet?text=Je%20viens%20de%20devenir%20prospecteur%20pour%20le%20calendrier%20des%20Sapeurs-Pompiers%20de%20Clermont%20l%27Hérault.%20Rejoignez-moi%20!&url=https://formulaire.pompiers34800.com" target="_blank" class="share-button twitter">Partager sur Twitter</a>
            </div>
          </div>
        `;
        
        confirmation.innerHTML = confirmationContent;
        confirmation.style.display = 'block';
        
        // Ajouter des styles pour les nouvelles sections
        const styles = document.createElement('style');
        styles.textContent = `
          .countdown-container {
            background-color: rgba(29, 53, 87, 0.1);
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            text-align: center;
          }
          
          .countdown {
            font-size: 36px;
            font-weight: bold;
            color: #1d3557;
            margin: 10px 0;
          }
          
          .countdown-info {
            font-style: italic;
            color: #666;
            font-size: 14px;
          }
          
          .next-actions {
            background-color: #f1faee;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            border-left: 4px solid #457b9d;
          }
          
          .next-actions h3 {
            margin-top: 0;
            color: #457b9d;
          }
          
          .next-actions ol {
            margin-bottom: 0;
            padding-left: 20px;
          }
          
          .social-share {
            margin-top: 25px;
          }
          
          .share-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
          }
          
          .share-button {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          
          .facebook {
            background-color: #3b5998;
          }
          
          .twitter {
            background-color: #1da1f2;
          }
          
          .share-button:hover {
            opacity: 0.9;
          }
        `;
        document.head.appendChild(styles);
        
        // Faire défiler vers la confirmation
        confirmation.scrollIntoView({ behavior: 'smooth' });
        
        // Initialiser le compte à rebours
        startCountdown();
      }

      // Fonction de compte à rebours
      function startCountdown() {
        let minutes = 2;
        let seconds = 0;
        
        const countdownElement = document.getElementById('email-countdown');
        
        const interval = setInterval(() => {
          if (seconds === 0) {
            if (minutes === 0) {
              clearInterval(interval);
              countdownElement.textContent = "L'email a été envoyé !";
              countdownElement.style.color = "#4CAF50";
              return;
            }
            minutes--;
            seconds = 59;
          } else {
            seconds--;
          }
          
          // Mettre à jour l'affichage
          countdownElement.textContent = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
      }
      
    // Amélioration de l'expérience mobile

      // Appel de la fonction d'amélioration mobile
      enhanceMobileExperience();
      
      // Ajouter des améliorations d'accessibilité
      enhanceAccessibility();
    
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
