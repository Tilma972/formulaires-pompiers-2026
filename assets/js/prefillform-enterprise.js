// prefillform-enterprise.js - Version Non-Intrusive
// Cette version ne modifie PAS les gestionnaires d'événements existants

(function() {
  // Attendre que le DOM soit chargé ET que le script principal soit initialisé
  document.addEventListener('DOMContentLoaded', function() {
    console.log("🏢 Initialisation du pré-remplissage formulaire entreprise");
    
    // Attendre un peu que enterprise-form.js soit complètement chargé
    setTimeout(() => {
      prefillEnterpriseForm();
    }, 100);
  });

  // Fonction principale de pré-remplissage
  function prefillEnterpriseForm() {
    try {
      // Récupérer les paramètres de l'URL
      const params = getUrlParams();
      console.log("📋 Paramètres URL détectés:", params);

      // Si aucun paramètre, ne rien faire
      if (Object.keys(params).length === 0) {
        console.log("ℹ️ Aucun paramètre URL détecté, pré-remplissage ignoré");
        return;
      }

      // 🔒 Remplir les champs en lecture seule (informations entreprise)
      fillFieldReadonly('entreprise_name', params.nom, true);
      fillFieldReadonly('adresse', params.adresse, true);
      
      // 📝 Remplir les champs éditables (contact)
      fillField('contact_name', params.contact, true);
      fillField('email', params.email, true);
      fillField('telephone', params.tel || params.telephone, true);
      
      // 🆔 Stocker l'ID entreprise pour le traitement
      if (params.id) {
        addHiddenField('entreprise_id', params.id);
        console.log("🆔 ID entreprise stocké:", params.id);
      }
      
      // 🎯 Pré-sélection format/mois si spécifiés (après navigation vers étapes suivantes)
      if (params.format || params.mois) {
        setupFormatMonthPreselection(params);
      }

      // ✅ Marquer le formulaire comme pré-rempli
      const form = document.getElementById('enterprise-form');
      if (form) {
        form.setAttribute('data-prefilled', 'true');
        addPrefillIndicator(params);
      }

      // 🔧 AMÉLIORATION : Validation custom SANS remplacer les gestionnaires existants
      enhanceValidationForReadonlyFields();

    } catch (error) {
      console.error("❌ Erreur lors du pré-remplissage:", error);
    }
  }

  // 🔧 NOUVELLE APPROCHE : Améliorer la validation sans remplacer les gestionnaires
  function enhanceValidationForReadonlyFields() {
    // Surveiller les tentatives de validation du formulaire
    const form = document.getElementById('enterprise-form');
    if (!form) return;

    // Intercepter la soumission pour s'assurer que les champs readonly sont valides
    form.addEventListener('submit', function(e) {
      const entrepriseName = document.getElementById('entreprise_name').value.trim();
      const adresse = document.getElementById('adresse').value.trim();
      
      if (!entrepriseName || !adresse) {
        e.preventDefault();
        showCustomError('Informations entreprise manquantes. Veuillez utiliser le lien personnalisé fourni.');
        return false;
      }
    }, true); // true = capture phase

    // Ajouter des validations personnalisées aux champs readonly
    const entrepriseField = document.getElementById('entreprise_name');
    const adresseField = document.getElementById('adresse');
    
    if (entrepriseField) {
      entrepriseField.addEventListener('invalid', function(e) {
        if (this.readOnly && this.value.trim()) {
          e.preventDefault(); // Empêcher l'affichage de l'erreur par défaut
        }
      });
    }
    
    if (adresseField) {
      adresseField.addEventListener('invalid', function(e) {
        if (this.readOnly && this.value.trim()) {
          e.preventDefault(); // Empêcher l'affichage de l'erreur par défaut
        }
      });
    }

    console.log("✅ Validation améliorée pour les champs readonly (mode non-intrusif)");
  }

  // Fonction pour ajouter un champ caché
  function addHiddenField(name, value) {
    // Vérifier si le champ existe déjà
    let existingField = document.getElementById(name);
    if (existingField) {
      existingField.value = value;
      return;
    }

    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.id = name;
    hiddenField.name = name;
    hiddenField.value = value;
    
    const form = document.getElementById('enterprise-form');
    if (form) {
      form.appendChild(hiddenField);
    }
  }

  // Fonction pour gérer la pré-sélection format/mois
  function setupFormatMonthPreselection(params) {
    // Écouter les changements d'étapes pour déclencher la pré-sélection au bon moment
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          
          // Si on arrive à l'étape 2 (formats)
          if (target.id === 'step-2' && target.classList.contains('active') && params.format) {
            setTimeout(() => preselectFormat(params.format), 200);
          }
          
          // Si on arrive à l'étape 3 (mois)
          if (target.id === 'step-3' && target.classList.contains('active') && params.mois) {
            setTimeout(() => preselectMonth(safeDecodeURIComponent(params.mois)), 200);
          }
        }
      });
    });

    // Observer les changements sur les sections d'étapes
    const sections = document.querySelectorAll('.form-section');
    sections.forEach(section => {
      observer.observe(section, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // Fonction utilitaire pour obtenir les paramètres d'URL
  function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Mapping des paramètres URL vers les champs du formulaire
    const paramMapping = {
      'id': 'id',
      'nom': 'nom',
      'contact': 'contact',
      'email': 'email', 
      'tel': 'tel',
      'telephone': 'telephone', // Fallback
      'adresse': 'adresse',
      'format': 'format',
      'mois': 'mois',
      'commune': 'commune'
    };

    Object.entries(paramMapping).forEach(([urlParam, internalParam]) => {
      const value = urlParams.get(urlParam);
      if (value) {
        params[internalParam] = value;
      }
    });
    
    return params;
  }

  // Fonction sécurisée pour décoder l'URI
  function safeDecodeURIComponent(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(value);
    } catch (e) {
      console.warn(`⚠️ Erreur de décodage pour: ${value}`, e);
      return value;
    }
  }

  // Fonction pour remplir un champ normal
  function fillField(id, value, decode = false) {
    const field = document.getElementById(id);
    if (field && value) {
      const finalValue = decode ? safeDecodeURIComponent(value) : value;
      field.value = finalValue;
      console.log(`✅ Champ ${id} rempli avec:`, finalValue);
      
      // Déclencher l'événement change pour la validation
      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        field.dispatchEvent(event);
      });
      
      // Ajouter une classe pour l'animation
      field.classList.add('just-prefilled');
      setTimeout(() => field.classList.remove('just-prefilled'), 600);
      
      return true;
    } else if (!field) {
      console.warn(`⚠️ Champ ${id} introuvable`);
    }
    return false;
  }

  // Fonction pour remplir un champ et le rendre readonly
  function fillFieldReadonly(id, value, decode = false) {
    const field = document.getElementById(id);
    if (field && value) {
      const finalValue = decode ? safeDecodeURIComponent(value) : value;
      field.value = finalValue;
      field.readOnly = true;
      field.style.backgroundColor = '#f5f5f5';
      field.style.cursor = 'not-allowed';
      field.style.color = '#555';
      field.style.border = '1px solid #ddd';
      
      // Ajouter un attribut pour identifier les champs pré-remplis
      field.setAttribute('data-prefilled', 'true');
      
      // Déclencher les événements pour la validation
      const events = ['input', 'change', 'blur'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        field.dispatchEvent(event);
      });
      
      // Ajouter une classe pour l'animation
      field.classList.add('just-prefilled');
      setTimeout(() => field.classList.remove('just-prefilled'), 600);
      
      console.log(`🔒 Champ ${id} rempli en lecture seule:`, finalValue);
      return true;
    }
    return false;
  }

  // Fonction pour pré-sélectionner un format
  function preselectFormat(format) {
    const formatCard = document.querySelector(`.format-card[data-format="${format}"]`);
    if (formatCard && !formatCard.classList.contains('selected')) {
      // Simuler un clic pour déclencher la logique existante
      formatCard.click();
      formatCard.classList.add('pre-selected');
      console.log(`🎨 Format ${format} pré-sélectionné`);
    } else if (!formatCard) {
      console.warn(`⚠️ Format card pour ${format} non trouvée`);
    }
  }

  // Fonction pour pré-sélectionner un mois
  function preselectMonth(mois) {
    const monthCard = document.querySelector(`.month-card[data-month="${mois}"]`);
    if (monthCard && !monthCard.classList.contains('selected')) {
      // Simuler un clic pour déclencher la logique existante
      monthCard.click();
      monthCard.classList.add('pre-selected');
      console.log(`📅 Mois ${mois} pré-sélectionné`);
    } else if (!monthCard) {
      console.warn(`⚠️ Month card pour ${mois} non trouvée`);
    }
  }

  // Fonction pour ajouter un indicateur visuel de pré-remplissage
  function addPrefillIndicator(params) {
    const header = document.querySelector('header');
    if (header && params.nom) {
      const indicator = document.createElement('div');
      indicator.className = 'prefill-indicator';
      indicator.style.cssText = `
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 15px 0;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        border-left: 4px solid #2E7D32;
      `;
      
      indicator.innerHTML = `
        <span style="font-size: 20px; flex-shrink: 0;">✨</span>
        <div style="flex-grow: 1;">
          <strong style="display: block; margin-bottom: 3px;">Formulaire pré-rempli pour ${safeDecodeURIComponent(params.nom)}</strong>
          <small style="opacity: 0.9; font-size: 12px;">Vérifiez et complétez les informations ci-dessous</small>
        </div>
      `;
      
      header.insertAdjacentElement('afterend', indicator);
    }
  }

  // Fonction pour afficher une erreur personnalisée
  function showCustomError(message) {
    // Créer ou récupérer un élément d'erreur global
    let errorElement = document.getElementById('custom-error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'custom-error-message';
      errorElement.style.cssText = `
        color: #e63946;
        background-color: rgba(230, 57, 70, 0.1);
        padding: 12px 15px;
        border-radius: 5px;
        margin-bottom: 15px;
        border-left: 4px solid #e63946;
        font-weight: bold;
        display: block;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        max-width: 90%;
        text-align: center;
      `;
      
      document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  // 🔧 Fonction utilitaire pour déboguer
  window.debugPrefill = function() {
    const params = getUrlParams();
    console.log("🔍 Debug Prefill:");
    console.log("URL actuelle:", window.location.href);
    console.log("Paramètres extraits:", params);
    
    // Vérifier l'état des champs
    const fields = ['entreprise_name', 'adresse', 'contact_name', 'email', 'telephone'];
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        console.log(`Champ ${fieldId}:`, {
          value: field.value,
          readonly: field.readOnly,
          required: field.required,
          prefilled: field.getAttribute('data-prefilled'),
          style: field.style.backgroundColor
        });
      } else {
        console.log(`Champ ${fieldId}: INTROUVABLE`);
      }
    });
    
    // Vérifier si le formulaire est marqué comme pré-rempli
    const form = document.getElementById('enterprise-form');
    console.log("Formulaire pré-rempli:", form?.getAttribute('data-prefilled'));
    
    // Vérifier les gestionnaires d'événements
    const nextStep1 = document.getElementById('next-step-1');
    const nextStep2 = document.getElementById('next-step-2');
    const prevStep2 = document.getElementById('prev-step-2');
    
    console.log("Boutons étape 1:", {
      nextStep1: !!nextStep1,
      hasOnclick: !!nextStep1?.onclick,
      hasEventListeners: !!nextStep1?.addEventListener
    });
    
    console.log("Boutons étape 2:", {
      nextStep2: !!nextStep2,
      prevStep2: !!prevStep2,
      nextHasOnclick: !!nextStep2?.onclick,
      prevHasOnclick: !!prevStep2?.onclick
    });
  };

  // Fonction pour vérifier que les scripts ne se marchent pas dessus
  window.checkScriptConflict = function() {
    console.log("🔍 Vérification des conflits de scripts:");
    
    // Vérifier si enterprise-form.js a chargé ses variables
    console.log("Variables globales détectées:", {
      currentStep: typeof currentStep !== 'undefined' ? currentStep : 'undefined',
      selectedFormat: typeof selectedFormat !== 'undefined' ? selectedFormat : 'undefined',
      showStep: typeof showStep !== 'undefined' ? 'function exists' : 'undefined'
    });
    
    // Vérifier l'ordre de chargement des scripts
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    console.log("Scripts chargés dans l'ordre:", scripts);
  };

})();