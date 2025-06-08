// prefillform-enterprise.js - Version corrigée pour la validation

(function() {
  // Attendre que le DOM soit chargé
  document.addEventListener('DOMContentLoaded', function() {
    console.log("🏢 Initialisation du pré-remplissage formulaire entreprise");
    prefillEnterpriseForm();
  });

  // Fonction principale de pré-remplissage
  function prefillEnterpriseForm() {
    try {
      // Récupérer les paramètres de l'URL
      const params = getUrlParams();
      console.log("📋 Paramètres URL détectés:", params);

      // 🔒 Remplir les champs en lecture seule (informations entreprise)
      fillFieldReadonly('entreprise_name', params.nom, true);
      fillFieldReadonly('adresse', params.adresse, true);
      
      // 📝 Remplir les champs éditables (contact)
      fillField('contact_name', params.contact, true);
      fillField('email', params.email, true);
      fillField('telephone', params.tel || params.telephone, true);
      
      // 🆔 Stocker l'ID entreprise pour le traitement
      if (params.id) {
        // Créer un champ caché pour l'ID entreprise
        const hiddenIdField = document.createElement('input');
        hiddenIdField.type = 'hidden';
        hiddenIdField.id = 'entreprise_id';
        hiddenIdField.name = 'entreprise_id';
        hiddenIdField.value = params.id;
        
        const form = document.getElementById('enterprise-form');
        if (form) {
          form.appendChild(hiddenIdField);
          console.log("🆔 ID entreprise stocké:", params.id);
        }
      }
      
      // 🎯 Pré-sélection format/mois si spécifiés
      if (params.format || params.mois) {
        setTimeout(() => {
          console.log("🎨 Pré-sélection format/mois détectée");
          
          if (params.format) {
            preselectFormat(params.format);
          }
          
          if (params.mois) {
            preselectMonth(safeDecodeURIComponent(params.mois));
          }
        }, 1000); // Attendre que les événements soient attachés
      }

      // ✅ Marquer le formulaire comme pré-rempli
      const form = document.getElementById('enterprise-form');
      if (form) {
        form.setAttribute('data-prefilled', 'true');
        
        // Ajouter un indicateur visuel
        addPrefillIndicator(params);
      }

      // 🔧 CORRECTION : Modifier la validation pour ignorer les champs readonly
      setTimeout(() => {
        patchValidationForReadonlyFields();
      }, 500);

    } catch (error) {
      console.error("❌ Erreur lors du pré-remplissage:", error);
    }
  }

  // 🔧 NOUVELLE FONCTION : Patcher la validation pour les champs readonly
  function patchValidationForReadonlyFields() {
    const nextButton = document.getElementById('next-step-1');
    if (!nextButton) return;

    // Sauvegarder l'ancien gestionnaire d'événements
    const oldHandler = nextButton.onclick;
    
    // Remplacer par une validation modifiée
    nextButton.onclick = function(e) {
      e.preventDefault();
      
      const contactName = document.getElementById('contact_name').value.trim();
      const email = document.getElementById('email').value.trim();
      const telephone = document.getElementById('telephone').value.trim();
      
      // Récupérer les champs entreprise (readonly ou non)
      const entrepriseName = document.getElementById('entreprise_name').value.trim();
      const adresse = document.getElementById('adresse').value.trim();
      
      let isValid = true;
      
      // Masquer toutes les erreurs
      document.querySelectorAll('.error-message').forEach(err => err.style.display = 'none');
      
      // Validation champs contact (toujours requis)
      if (!contactName) {
        document.getElementById('contact-error').style.display = 'block';
        isValid = false;
      }
      
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        document.getElementById('email-error').style.display = 'block';
        isValid = false;
      }
      
      // Validation téléphone
      if (!telephone || telephone.length < 10) {
        document.getElementById('telephone-error').style.display = 'block';
        isValid = false;
      }
      
      // Validation champs entreprise (requis même si readonly)
      if (!entrepriseName) {
        showCustomError('Le nom de l\'entreprise est requis');
        isValid = false;
      }
      
      if (!adresse) {
        showCustomError('L\'adresse de l\'entreprise est requise');
        isValid = false;
      }
      
      if (isValid) {
        // Appeler la fonction showStep du script principal
        if (typeof showStep === 'function') {
          showStep(2);
        } else {
          // Fallback : déclencher manuellement le passage à l'étape 2
          document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
          });
          const step2 = document.getElementById('step-2');
          if (step2) {
            step2.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }
    };
    
    console.log("✅ Validation patchée pour les champs readonly");
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
      `;
      
      const step1 = document.getElementById('step-1');
      if (step1) {
        step1.insertBefore(errorElement, step1.querySelector('.form-row'));
      }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
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
      const changeEvent = new Event('change', { bubbles: true });
      field.dispatchEvent(changeEvent);
      
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
    // Attendre que le JavaScript principal soit chargé
    const checkFormatCards = () => {
      const formatCard = document.querySelector(`.format-card[data-format="${format}"]`);
      if (formatCard) {
        formatCard.click();
        formatCard.classList.add('pre-selected');
        console.log(`🎨 Format ${format} pré-sélectionné`);
      } else {
        console.warn(`⚠️ Format card pour ${format} non trouvée`);
      }
    };

    // Essayer maintenant, puis réessayer si nécessaire
    checkFormatCards();
    setTimeout(checkFormatCards, 500);
    setTimeout(checkFormatCards, 1500);
  }

  // Fonction pour pré-sélectionner un mois
  function preselectMonth(mois) {
    const checkMonthCards = () => {
      const monthCard = document.querySelector(`.month-card[data-month="${mois}"]`);
      if (monthCard) {
        monthCard.click();
        monthCard.classList.add('pre-selected');
        console.log(`📅 Mois ${mois} pré-sélectionné`);
      } else {
        console.warn(`⚠️ Month card pour ${mois} non trouvée`);
      }
    };

    // Essayer maintenant, puis réessayer si nécessaire
    checkMonthCards();
    setTimeout(checkMonthCards, 500);
    setTimeout(checkMonthCards, 1500);
  }

  // Fonction pour ajouter un indicateur visuel de pré-remplissage
  function addPrefillIndicator(params) {
    const header = document.querySelector('header');
    if (header && params.nom) {
      const indicator = document.createElement('div');
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
          style: field.style.backgroundColor
        });
      } else {
        console.log(`Champ ${fieldId}: INTROUVABLE`);
      }
    });
    
    // Vérifier si le formulaire est marqué comme pré-rempli
    const form = document.getElementById('enterprise-form');
    console.log("Formulaire pré-rempli:", form?.getAttribute('data-prefilled'));
  };

})();