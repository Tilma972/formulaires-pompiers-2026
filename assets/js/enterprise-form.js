// ✅ CORRECTION DOUBLE SOUMISSION - Modifier la fonction setupFormSubmission()

function setupFormSubmission() {
  const form = document.getElementById('enterprise-form');
  if (!form) return;
  
  // ✅ PROTECTION 1 : Variable globale de verrouillage
  if (window.formSubmissionInProgress) {
    console.log('⚠️ setupFormSubmission déjà configurée, ignorée');
    return;
  }
  window.formSubmissionInProgress = false;
  
  // ✅ PROTECTION 2 : Retirer tous les anciens listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  let isSubmitting = false;
  let submitButton = null;
  
  newForm.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // ✅ PROTECTION 3 : Arrêt immédiat
    
    console.log('📤 Tentative soumission, isSubmitting:', isSubmitting);
    
    // ✅ PROTECTION 4 : Vérification double soumission
    if (isSubmitting) {
      console.log('❌ Soumission déjà en cours, BLOQUÉE');
      return false;
    }
    
    if (window.formSubmissionInProgress) {
      console.log('❌ Soumission globale en cours, BLOQUÉE');
      return false;
    }
    
    // ✅ PROTECTION 5 : Validation signature avant soumission
    if (window.currentStep === 4 && !window.validateDigitalSignature()) {
      console.log('❌ Validation signature échouée');
      isSubmitting = false;
      return false;
    }
    
    console.log('✅ Début soumission formulaire UNIQUE');
    
    // ✅ VERROUILLAGE IMMÉDIAT
    isSubmitting = true;
    window.formSubmissionInProgress = true;
    
    // ✅ PROTECTION 6 : Désactiver IMMÉDIATEMENT tous les boutons
    submitButton = document.querySelector('button[type="submit"]');
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.6';
    });
    
    // ✅ PROTECTION 7 : Désactiver le formulaire entier
    const allInputs = newForm.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => input.disabled = true);
    
    // ✅ PROTECTION 8 : Indicateur visuel
    if (submitButton) {
      submitButton.innerHTML = '<span class="loading"></span> 🔒 Traitement en cours...';
      submitButton.style.cursor = 'not-allowed';
    }
    
    // ✅ PROTECTION 9 : Validation finale des champs requis
    if (!window.selectedPayment) {
      const errorEl = document.getElementById('payment-error');
      if (errorEl) errorEl.style.display = 'block';
      resetSubmissionState();
      return false;
    }
    
    const termsAccepted = document.getElementById('terms_accepted')?.checked;
    if (!termsAccepted) {
      const errorEl = document.getElementById('terms-error');
      if (errorEl) errorEl.style.display = 'block';
      resetSubmissionState();
      return false;
    }
    
    // ✅ CONSTRUCTION PAYLOAD SÉCURISÉE
    const payload = {
      form_name: "enterprise-form",
      source: "formulaire_web_direct",
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      submission_id: `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ✅ ID unique
      
      // Informations entreprise (sécurisées avec ?.)
      entreprise_name: document.getElementById('entreprise_name')?.value || '',
      adresse: document.getElementById('adresse')?.value || '',
      contact_name: document.getElementById('contact_name')?.value || '',
      email: document.getElementById('email')?.value || '',
      telephone: document.getElementById('telephone')?.value || '',
      
      // Format et prix
      selected_format: window.selectedFormat || '',
      format_price: window.formatPrice || 0,
      
      // Mois sélectionnés
      selected_months: window.selectedMonths ? window.selectedMonths.join(',') : '',
      nombre_parutions: window.isAnnualOffer ? 12 : (window.selectedMonths?.length || 1),
      is_annual_offer: window.isAnnualOffer || false,
      
      // Paiement
      selected_payment: window.selectedPayment || '',
      payment_details: document.querySelector('.payment-card.selected')?.getAttribute('data-details') || '',
      rdv_preference: document.getElementById('rdv_preference')?.value || '',
      
      // Signature électronique (toutes sécurisées)
      signature_method: document.querySelector('input[name="signature_method"]:checked')?.value || 'electronic',
      contractual_agreement: document.getElementById('contractual_agreement')?.checked || false,
      signature_name: document.getElementById('signature_name')?.value || '',
      signature_password: document.getElementById('signature_password')?.value || '',
      validation_timestamp: document.getElementById('validation_timestamp')?.value || '',
      validation_id: document.getElementById('validation_id')?.value || '',
      validation_hash: document.getElementById('validation_hash')?.value || '',
      user_ip: document.getElementById('user_ip')?.value || '',
      user_agent: document.getElementById('user_agent')?.value || navigator.userAgent,
      
      // Calculs
      prixTotal: (() => {
        if (!window.selectedFormat || !window.formatPrice) return 0;
        if (window.isAnnualOffer) return window.formatPrice;
        return window.formatPrice * (window.selectedMonths?.length || 1);
      })(),
      
      // Métadonnées
      orderNumber: 'CMD-2026-' + Math.floor(100000 + Math.random() * 900000),
      commentaires: document.getElementById('commentaires')?.value || '',
      terms_accepted: termsAccepted,
      entrepriseId: getEnterpriseIdFromURL(),
      
      // Signature status
      is_electronically_signed: (document.querySelector('input[name="signature_method"]:checked')?.value === 'electronic') && 
                                (document.getElementById('contractual_agreement')?.checked || false)
    };
    
    console.log('📤 Payload unique préparé:', {
      submission_id: payload.submission_id,
      entreprise: payload.entreprise_name,
      timestamp: payload.timestamp
    });
    
    // ✅ ENVOI AVEC TIMEOUT ET RETRY
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Form-Source': 'enterprise-form-unique',
        'X-Submission-ID': payload.submission_id // ✅ Header unique
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      console.log('📡 Réponse reçue:', response.status);
      
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Erreur serveur: ${response.status} - ${response.statusText}`);
    })
    .then(data => {
      console.log('✅ Succès soumission unique:', data);
      showConfirmation(payload, data);
      
      // ✅ NE PAS réactiver le formulaire après succès
      
    })
    .catch(error => {
      console.error('❌ Erreur soumission:', error);
      resetSubmissionState();
      alert('Une erreur est survenue. Veuillez réessayer.');
    });
  });
  
  // ✅ FONCTION DE RESET EN CAS D'ERREUR SEULEMENT
  function resetSubmissionState() {
    console.log('🔄 Reset état soumission (erreur uniquement)');
    isSubmitting = false;
    window.formSubmissionInProgress = false;
    
    const allButtons = document.querySelectorAll('button');
    const allInputs = document.querySelectorAll('input, select, textarea');
    
    allButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    });
    
    allInputs.forEach(input => input.disabled = false);
    
    if (submitButton) {
      submitButton.innerHTML = 'CONFIRMER MA COMMANDE';
      submitButton.style.cursor = '';
    }
  }
  
  console.log('✅ setupFormSubmission configurée avec protection double soumission');
}

// ✅ PROTECTION GLOBALE : Empêcher multiple appels
(function() {
  let setupCalled = false;
  const originalSetup = window.setupFormSubmission;
  
  window.setupFormSubmission = function() {
    if (setupCalled) {
      console.log('⚠️ setupFormSubmission déjà appelée, ignorée');
      return;
    }
    setupCalled = true;
    return originalSetup ? originalSetup() : setupFormSubmission();
  };
})();

// ✅ DEBUG POUR DETECTER DOUBLES LISTENERS
window.debugFormListeners = function() {
  const form = document.getElementById('enterprise-form');
  if (form) {
    console.log('🔍 Formulaire trouvé');
    console.log('- Listeners submit:', form.getEventListeners ? form.getEventListeners('submit') : 'Non détectable');
    console.log('- formSubmissionInProgress:', window.formSubmissionInProgress);
  }
};

// 🆔 FONCTION UTILITAIRE pour récupérer l'ID entreprise depuis l'URL
function getEnterpriseIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id') || urlParams.get('eid') || null;
}

// ✅ MODIFICATION 2 : Mettre à jour showConfirmation pour inclure les infos de signature
function showConfirmation(formData, gatewayResponse) {
  console.log('📋 Affichage confirmation avec signature');

  // Mettre à jour la confirmation avec les données
  const elements = {
    'confirmation-order-number': formData.orderNumber,
    'confirmation-format': formData.selected_format,
    'confirmation-months': formData.selected_months.replace(/,/g, ', '),
    'confirmation-total': formData.prixTotal + ' €'
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const paymentLabels = {
    'Virement': 'Virement bancaire',
    'Cheque_Remise': 'Chèque - Remise en main propre',
    'Cheque_Poste': 'Chèque - Envoi postal',
    'Cheque_Caserne': 'Chèque - Dépôt caserne'
  };

  const confirmationPayment = document.getElementById('confirmation-payment');
  if (confirmationPayment) {
    confirmationPayment.textContent = paymentLabels[formData.selected_payment] || formData.selected_payment;
  }

  // ✅ AJOUT : Message de signature dans la confirmation
  const confirmationDiv = document.getElementById('confirmation');
  if (confirmationDiv && formData.is_electronically_signed) {
    // Ajouter une section signature dans la confirmation
    const signatureConfirmation = document.createElement('div');
    signatureConfirmation.className = 'signature-confirmation';
    signatureConfirmation.style.cssText = `
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border: 2px solid #28a745;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    `;

    signatureConfirmation.innerHTML = `
      <h3 style="color: #155724; margin-top: 0;">🔐 Signature Électronique Confirmée</h3>
      <p><strong>Signataire :</strong> ${formData.signature_name}</p>
      <p><strong>ID de validation :</strong> <code>${formData.validation_id}</code></p>
      <p style="font-size: 12px; color: #155724; margin-bottom: 0;">
        Cette commande a été signée électroniquement et possède une valeur juridique.
        <br><a href="https://formulaire.pompiers34800.com/verify/${formData.validation_id}" target="_blank" style="color: #155724;">
          🔍 Vérifier cette signature
        </a>
      </p>
    `;

    // Insérer après le récapitulatif
    const summarySection = confirmationDiv.querySelector('.summary-section');
    if (summarySection) {
      summarySection.insertAdjacentElement('afterend', signatureConfirmation);
    } else {
      confirmationDiv.appendChild(signatureConfirmation);
    }
  }

  // ✅ MASQUER DÉFINITIVEMENT LE FORMULAIRE
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none'; // ✅ Forcer le masquage
  });

  const confirmation = document.getElementById('confirmation');
  if (confirmation) {
    confirmation.style.display = 'block';
    confirmation.scrollIntoView({ behavior: 'smooth' });
  }

  // Mettre la barre de progression à 100%
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.add('completed');
    step.classList.remove('active');
  });

  // ✅ MASQUER AUSSI LA BARRE DE PROGRESSION
  const progressContainer = document.querySelector('.progress-container');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  console.log('✅ Confirmation affichée avec signature, formulaire désactivé définitivement');
}
// Fix pour enterprise-form.js - Ajout à la fin du fichier enterprise-form.js existant

// 🔧 CORRECTION : Force l'initialisation si les variables ne sont pas définies
(function forceEnterpriseFormInitialization() {
  // Vérifier si l'initialisation a échoué
  const checkInitialization = () => {
    const isMainScriptLoaded =
      typeof currentStep !== 'undefined' &&
      typeof selectedFormat !== 'undefined' &&
      typeof showStep === 'function';

    if (!isMainScriptLoaded) {
      console.warn("⚠️ enterprise-form.js non initialisé, initialisation forcée...");
      initializeEnterpriseFormManually();
    } else {
      console.log("✅ enterprise-form.js déjà initialisé correctement");
    }
  };

  // Attendre et vérifier plusieurs fois
  setTimeout(checkInitialization, 100);
  setTimeout(checkInitialization, 500);
  setTimeout(checkInitialization, 1000);

  function initializeEnterpriseFormManually() {
    console.log("🔧 Initialisation manuelle d'enterprise-form...");

    // Redéclarer les variables globales manquantes
    window.currentStep = 1;
    window.selectedFormat = '';
    window.formatPrice = 0;
    window.selectedMonths = [];
    window.isAnnualOffer = false;
    window.selectedPayment = '';

    // Fonction pour mettre à jour la barre de progression
    window.updateProgressBar = function (step) {
      document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        const stepNumber = index + 1;
        if (stepNumber < step) {
          stepEl.classList.add('completed');
          stepEl.classList.remove('active');
        } else if (stepNumber === step) {
          stepEl.classList.add('active');
          stepEl.classList.remove('completed');
        } else {
          stepEl.classList.remove('active', 'completed');
        }
      });
    };

    // Fonction pour afficher une étape
    window.showStep = function (step) {
      // Masquer toutes les sections
      document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
      });

      // Afficher la section demandée
      const targetSection = document.getElementById(`step-${step}`);
      if (targetSection) {
        targetSection.classList.add('active');
        window.currentStep = step;
        window.updateProgressBar(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ✅ AJOUT : Si on arrive à l'étape 4, initialiser la signature
        if (step === 4) {
          setTimeout(async () => {
            if (typeof window.initializeDigitalSignature === 'function') {
              await window.initializeDigitalSignature();
            }
          }, 500);
        }
      }
    };

    // Fonction pour mettre à jour le récapitulatif
    window.updateSummary = function () {
      if (!window.selectedFormat) return;

      // Format
      const summaryFormat = document.getElementById('summary-format');
      if (summaryFormat) summaryFormat.textContent = window.selectedFormat;

      // Mois
      const monthsText = window.isAnnualOffer ? 'Tous les mois' :
        window.selectedMonths.length > 0 ? window.selectedMonths.join(', ') : '-';
      const summaryMonths = document.getElementById('summary-months');
      if (summaryMonths) summaryMonths.textContent = monthsText;

      // Parutions
      const nombreParutions = window.isAnnualOffer ? 12 : parseInt(document.getElementById('nombre_parutions')?.value) || 1;
      const summaryParutions = document.getElementById('summary-parutions');
      if (summaryParutions) summaryParutions.textContent = nombreParutions;

      // Prix total
      let total = 0;
      if (window.isAnnualOffer) {
        total = window.formatPrice; // Prix forfaitaire
      } else {
        total = window.formatPrice * nombreParutions;
      }

      const summaryTotal = document.getElementById('summary-total');
      if (summaryTotal) summaryTotal.textContent = total + ' €';
    };

    // Fonction pour basculer un mois
    window.toggleMonth = function (element) {
      if (element.classList.contains('unavailable')) return;

      const month = element.getAttribute('data-month');
      const maxParutions = parseInt(document.getElementById('nombre_parutions')?.value) || 1;

      if (element.classList.contains('selected')) {
        // Désélectionner
        element.classList.remove('selected');
        window.selectedMonths = window.selectedMonths.filter(m => m !== month);
      } else {
        // Sélectionner si possible
        if (window.selectedMonths.length < maxParutions) {
          element.classList.add('selected');
          window.selectedMonths.push(month);
        } else {
          alert(`Vous ne pouvez sélectionner que ${maxParutions} mois. Augmentez le nombre de parutions si nécessaire.`);
          return;
        }
      }

      const selectedMonthsInput = document.getElementById('selected_months');
      if (selectedMonthsInput) {
        selectedMonthsInput.value = window.selectedMonths.join(',');
      }

      const monthError = document.getElementById('month-error');
      if (monthError) monthError.style.display = 'none';

      window.updateSummary();
    };

    // Réattacher tous les gestionnaires d'événements
    attachAllEventHandlers();

    console.log("✅ Initialisation manuelle terminée");
  }

  function attachAllEventHandlers() {
    console.log("🔗 Attachement des gestionnaires d'événements...");

    // === ÉTAPE 1 ===
    const nextStep1 = document.getElementById('next-step-1');
    if (nextStep1) {
      nextStep1.onclick = function () {
        if (validateStep1()) {
          window.showStep(2);
        }
      };
    }

    // === ÉTAPE 2 ===
    const prevStep2 = document.getElementById('prev-step-2');
    const nextStep2 = document.getElementById('next-step-2');

    if (prevStep2) {
      prevStep2.onclick = () => window.showStep(1);
    }

    if (nextStep2) {
      nextStep2.onclick = function () {
        if (!window.selectedFormat) {
          const formatError = document.getElementById('format-error');
          if (formatError) formatError.style.display = 'block';
          return;
        }

        configureStep3();
        window.updateSummary();
        window.showStep(3);
      };
    }

    // === ÉTAPE 3 ===
    const prevStep3 = document.getElementById('prev-step-3');
    const nextStep3 = document.getElementById('next-step-3');

    if (prevStep3) {
      prevStep3.onclick = () => window.showStep(2);
    }

    if (nextStep3) {
      nextStep3.onclick = function () {
        if (!window.isAnnualOffer && window.selectedMonths.length === 0) {
          const monthError = document.getElementById('month-error');
          if (monthError) monthError.style.display = 'block';
          return;
        }
        window.showStep(4);
      };
    }

    // === ÉTAPE 4 ===
    const prevStep4 = document.getElementById('prev-step-4');
    if (prevStep4) {
      prevStep4.onclick = () => window.showStep(3);
    }

    // === GESTION VALIDATION ÉLECTRONIQUE ===
    if (typeof window.setupSignatureValidation === 'function') {
      window.setupSignatureValidation();
    }

    // === GESTION SÉLECTION FORMAT ===
    document.querySelectorAll('.format-card').forEach(card => {
      card.onclick = function () {
        // Désélectionner tous les formats
        document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));

        // Sélectionner le format cliqué
        this.classList.add('selected');

        // Stocker les informations
        window.selectedFormat = this.getAttribute('data-format');
        window.formatPrice = parseInt(this.getAttribute('data-price'));
        window.isAnnualOffer = this.getAttribute('data-annual') === 'true';

        // Mettre à jour les champs cachés
        const selectedFormatInput = document.getElementById('selected_format');
        const formatPriceInput = document.getElementById('format_price');
        if (selectedFormatInput) selectedFormatInput.value = window.selectedFormat;
        if (formatPriceInput) formatPriceInput.value = window.formatPrice;

        // Mettre à jour le récapitulatif
        window.updateSummary();

        // Masquer l'erreur
        const formatError = document.getElementById('format-error');
        if (formatError) formatError.style.display = 'none';
      };
    });

    // === GESTION SÉLECTION MOIS ===
    document.querySelectorAll('.month-card').forEach(card => {
      card.onclick = function () {
        window.toggleMonth(this);
      };
    });

    // === GESTION NOMBRE DE PARUTIONS ===
    const nombreParutionsInput = document.getElementById('nombre_parutions');
    if (nombreParutionsInput) {
      nombreParutionsInput.onchange = function () {
        const nombreParutions = parseInt(this.value) || 1;

        // Limiter entre 1 et 12
        if (nombreParutions < 1) this.value = 1;
        if (nombreParutions > 12) this.value = 12;

        // Si trop de mois sélectionnés, désélectionner les derniers
        const actualNombre = parseInt(this.value);
        if (window.selectedMonths.length > actualNombre) {
          const excessMonths = window.selectedMonths.length - actualNombre;
          for (let i = 0; i < excessMonths; i++) {
            const monthToRemove = window.selectedMonths.pop();
            const monthCard = document.querySelector(`.month-card[data-month="${monthToRemove}"]`);
            if (monthCard) {
              monthCard.classList.remove('selected');
            }
          }
          const selectedMonthsInput = document.getElementById('selected_months');
          if (selectedMonthsInput) {
            selectedMonthsInput.value = window.selectedMonths.join(',');
          }
        }

        window.updateSummary();
      };
    }

    // === GESTION PAIEMENT ===
    document.querySelectorAll('.payment-card').forEach(card => {
      card.onclick = function () {
        // Désélectionner tous les modes
        document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));

        // Sélectionner le mode cliqué
        this.classList.add('selected');

        // Stocker les informations
        window.selectedPayment = this.getAttribute('data-payment');
        const paymentDetails = this.getAttribute('data-details');

        const selectedPaymentInput = document.getElementById('selected_payment');
        const paymentDetailsInput = document.getElementById('payment_details');
        if (selectedPaymentInput) selectedPaymentInput.value = window.selectedPayment;
        if (paymentDetailsInput) paymentDetailsInput.value = paymentDetails || '';

        // Masquer toutes les sections de détails
        document.querySelectorAll('.payment-details').forEach(detail => {
          detail.style.display = 'none';
        });

        // Afficher la section correspondante
        if (paymentDetails) {
          const detailSection = document.getElementById(paymentDetails + '-details');
          if (detailSection) {
            detailSection.style.display = 'block';
          }
        }

        const paymentError = document.getElementById('payment-error');
        if (paymentError) paymentError.style.display = 'none';
      };
    });

    console.log("✅ Tous les gestionnaires d'événements attachés");
  }

  function validateStep1() {
    const contactName = document.getElementById('contact_name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const telephone = document.getElementById('telephone')?.value.trim();
    const entrepriseName = document.getElementById('entreprise_name')?.value.trim();
    const adresse = document.getElementById('adresse')?.value.trim();

    let isValid = true;

    // Masquer toutes les erreurs
    document.querySelectorAll('.error-message').forEach(err => err.style.display = 'none');

    if (!contactName) {
      const contactError = document.getElementById('contact-error');
      if (contactError) contactError.style.display = 'block';
      isValid = false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const emailError = document.getElementById('email-error');
      if (emailError) emailError.style.display = 'block';
      isValid = false;
    }

    // Validation téléphone
    if (!telephone || telephone.length < 10) {
      const telephoneError = document.getElementById('telephone-error');
      if (telephoneError) telephoneError.style.display = 'block';
      isValid = false;
    }

    if (!entrepriseName || !adresse) {
      alert('Les informations entreprise sont requises. Utilisez le lien personnalisé fourni.');
      isValid = false;
    }

    return isValid;
  }

  function configureStep3() {
    if (window.isAnnualOffer) {
      const monthSelectionText = document.getElementById('month-selection-text');
      const annualText = document.getElementById('annual-text');
      const monthSelector = document.getElementById('month-selector');
      const parutionsRow = document.getElementById('parutions-row');

      if (monthSelectionText) monthSelectionText.style.display = 'none';
      if (annualText) annualText.style.display = 'block';
      if (monthSelector) monthSelector.style.display = 'none';
      if (parutionsRow) parutionsRow.style.display = 'none';

      // Sélectionner tous les mois
      window.selectedMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const selectedMonthsInput = document.getElementById('selected_months');
      const nombreParutionsInput = document.getElementById('nombre_parutions');
      if (selectedMonthsInput) selectedMonthsInput.value = window.selectedMonths.join(',');
      if (nombreParutionsInput) nombreParutionsInput.value = 12;
    } else {
      const monthSelectionText = document.getElementById('month-selection-text');
      const annualText = document.getElementById('annual-text');
      const monthSelector = document.getElementById('month-selector');
      const parutionsRow = document.getElementById('parutions-row');

      if (monthSelectionText) monthSelectionText.style.display = 'block';
      if (annualText) annualText.style.display = 'none';
      if (monthSelector) monthSelector.style.display = 'block';
      if (parutionsRow) parutionsRow.style.display = 'block';

      // Réinitialiser
      window.selectedMonths = [];
      const selectedMonthsInput = document.getElementById('selected_months');
      const nombreParutionsInput = document.getElementById('nombre_parutions');
      if (selectedMonthsInput) selectedMonthsInput.value = '';
      if (nombreParutionsInput) nombreParutionsInput.value = 1;

      // Désélectionner tous les mois
      document.querySelectorAll('.month-card').forEach(card => {
        card.classList.remove('selected', 'unavailable');
      });

      // Marquer certains mois comme indisponibles
      const unavailableMonths = ['Février', 'Juillet'];
      unavailableMonths.forEach(month => {
        const monthCard = document.querySelector(`.month-card[data-month="${month}"]`);
        if (monthCard) {
          monthCard.classList.add('unavailable');
        }
      });
    }
  }
})();

// ✅ APPEL DE LA FONCTION DE SOUMISSION - À AJOUTER À LA FIN
document.addEventListener('DOMContentLoaded', function () {
  // Attendre que l'initialisation soit terminée
  setTimeout(() => {
    setupFormSubmission();
    console.log("✅ setupFormSubmission() appelée");
  }, 1500);
});

// ✅ MODIFICATION 4 : Assurer que les scripts de signature sont chargés
document.addEventListener('DOMContentLoaded', function () {
  // Vérifier que le script de signature est bien chargé
  if (typeof window.initializeDigitalSignature !== 'function') {
    console.warn('⚠️ Script de signature électronique non chargé');
  } else {
    console.log('✅ Intégration signature électronique chargée');
  }
});

// ✅ NOUVELLE FONCTION : Debug pour tester la signature
window.debugSignatureIntegration = function () {
  console.log('🔍 Debug Intégration Signature:');
  console.log('- Étape actuelle:', window.currentStep);
  console.log('- Fonction signature disponible:', typeof window.initializeDigitalSignature);
  console.log('- Éléments signature présents:', {
    agreement: !!document.getElementById('contractual_agreement'),
    name: !!document.getElementById('signature_name'),
    password: !!document.getElementById('signature_password'),
    validationId: !!document.getElementById('validation_id')
  });

  // Tester la validation
  if (window.currentStep === 4) {
    console.log('- Test validation signature:', window.validateDigitalSignature());
  }
};

// 🔧 PATCH COMPLET POUR L'ÉTAPE 4 - CORRECTIONS CIBLÉES
// À ajouter à la fin du fichier enterprise-form.js

// =====================================================
// 🔧 CORRECTION 1 : Exposer calculateTotalPrice globalement
// =====================================================

window.calculateTotalPrice = function () {
  if (!window.selectedFormat || !window.formatPrice) {
    console.warn('Données de prix manquantes pour calculateTotalPrice');
    return 0;
  }

  let total = 0;

  if (window.isAnnualOffer) {
    total = window.formatPrice; // Prix forfaitaire annuel
  } else {
    const nombreMois = window.selectedMonths?.length || 1;
    total = window.formatPrice * nombreMois;
  }

  console.log(`💰 Prix calculé: ${total}€ (Format: ${window.selectedFormat}, Annual: ${window.isAnnualOffer})`);
  return total;
};

// =====================================================
// 🔧 CORRECTION 2 : Créer le champ selected_payment manquant
// =====================================================

function createMissingPaymentField() {
  // Vérifier si le champ existe déjà
  if (document.getElementById('selected_payment')) {
    return;
  }

  // Créer le champ hidden
  const paymentField = document.createElement('input');
  paymentField.type = 'hidden';
  paymentField.id = 'selected_payment';
  paymentField.name = 'selected_payment';
  paymentField.value = window.selectedPayment || '';

  // L'ajouter au formulaire
  const form = document.getElementById('enterprise-form');
  if (form) {
    form.appendChild(paymentField);
    console.log('✅ Champ selected_payment créé');
  }
}

// =====================================================
// 🔧 CORRECTION 3 : Améliorer updateSummary pour l'étape 4
// =====================================================

// Redéfinir updateSummary pour qu'elle gère mieux l'étape 4
const originalUpdateSummary = window.updateSummary;

window.updateSummary = function () {
  // Appeler la fonction originale si elle existe
  if (originalUpdateSummary && typeof originalUpdateSummary === 'function') {
    originalUpdateSummary();
  }

  // Améliorations spécifiques pour l'étape 4
  if (window.currentStep === 4) {
    updateStep4Summary();
  }
};

function updateStep4Summary() {
  console.log('🔄 Mise à jour récapitulatif étape 4');

  // Récupérer les données depuis les champs ET les variables globales
  const entrepriseName = document.getElementById('entreprise_name')?.value || 'Non défini';
  const contactName = document.getElementById('contact_name')?.value || 'Non défini';
  const email = document.getElementById('email')?.value || '';
  const telephone = document.getElementById('telephone')?.value || '';

  const selectedFormat = window.selectedFormat || 'Non défini';
  const selectedMonths = window.isAnnualOffer
    ? 'Tous les mois (12 mois)'
    : (window.selectedMonths ? window.selectedMonths.join(', ') : 'Non défini');

  const selectedPayment = getPaymentLabel(window.selectedPayment || '');
  const totalPrice = window.calculateTotalPrice();

  // Mettre à jour le récapitulatif standard
  updateElement('summary-entreprise', entrepriseName);
  updateElement('summary-contact', contactName);
  updateElement('summary-format', selectedFormat);
  updateElement('summary-months', selectedMonths);
  updateElement('summary-payment', selectedPayment);
  updateElement('summary-total', totalPrice + ' €');

  // Mettre à jour le récapitulatif sécurisé (locked)
  updateElement('locked-entreprise', entrepriseName);
  updateElement('locked-contact', contactName);
  updateElement('locked-format', selectedFormat);
  updateElement('locked-months', selectedMonths);
  updateElement('locked-payment', selectedPayment);
  updateElement('locked-total', totalPrice + ' €');

  // Mettre à jour les placeholders de signature
  updateElement('agreement-contact-name', contactName);
  updateElement('agreement-company-name', entrepriseName);
  updateElement('agreement-total', totalPrice.toString());

  console.log('✅ Récapitulatif étape 4 mis à jour', {
    entreprise: entrepriseName,
    contact: contactName,
    format: selectedFormat,
    total: totalPrice
  });
}

// =====================================================
// 🔧 CORRECTION 4 : Fonction utilitaire pour libellés paiement
// =====================================================

function getPaymentLabel(paymentMode) {
  const labels = {
    'Virement': 'Virement bancaire',
    'Cheque_Remise': 'Chèque - Remise main propre',
    'Cheque_Poste': 'Chèque - Envoi postal',
    'Cheque_Caserne': 'Chèque - Dépôt caserne'
  };
  return labels[paymentMode] || paymentMode || 'À définir';
}

// =====================================================
// 🔧 CORRECTION 5 : Fonction utilitaire de mise à jour DOM
// =====================================================

function updateElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
    return true;
  } else {
    console.warn(`⚠️ Élément ${elementId} non trouvé`);
    return false;
  }
}

// =====================================================
// 🔧 CORRECTION 6 : Améliorer l'initialisation signature
// =====================================================

// Redéfinir la fonction showStep pour déclencher les mises à jour à l'étape 4
const originalShowStep = window.showStep;

window.showStep = function (step) {
  // Appeler la fonction originale
  if (originalShowStep && typeof originalShowStep === 'function') {
    originalShowStep(step);
  } else {
    // Implémentation de base si pas d'originalShowStep
    document.querySelectorAll('.form-section').forEach(section => {
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(`step-${step}`);
    if (targetSection) {
      targetSection.classList.add('active');
      window.currentStep = step;
      if (window.updateProgressBar) window.updateProgressBar(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Actions spécifiques à l'étape 4
  if (step === 4) {
    setTimeout(() => {
      initializeStep4Complete();
    }, 300);
  }
};

// =====================================================
// 🔧 CORRECTION 7 : Initialisation complète étape 4
// =====================================================

function initializeStep4Complete() {
  console.log('🚀 Initialisation complète étape 4');

  try {
    // 1. Créer les champs manquants
    createMissingPaymentField();

    // 2. Mettre à jour tous les récapitulatifs
    updateStep4Summary();

    // 3. Initialiser la signature électronique
    if (typeof window.initializeSignatureChoice === 'function') {
      window.initializeSignatureChoice();
    } else {
      console.warn('⚠️ initializeSignatureChoice non disponible');
    }

    // 4. Forcer l'initialisation de la traçabilité si signature électronique
    const electronicSignature = document.getElementById('signature_electronic');
    if (electronicSignature && electronicSignature.checked) {
      if (typeof window.initializeDigitalSignature === 'function') {
        window.initializeDigitalSignature();
      } else {
        // Initialisation manuelle de la traçabilité
        initializeTraceabilityManual();
      }
    }

    console.log('✅ Étape 4 initialisée avec succès');

  } catch (error) {
    console.error('❌ Erreur initialisation étape 4:', error);
  }
}

// =====================================================
// 🔧 CORRECTION 8 : Initialisation manuelle traçabilité
// =====================================================

function initializeTraceabilityManual() {
  console.log('🔐 Initialisation manuelle traçabilité');

  // Générer les données de traçabilité
  const now = new Date();
  const validationId = `VAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Mettre à jour l'affichage
  updateElement('trace-timestamp', now.toLocaleString('fr-FR'));
  updateElement('trace-validation-id', validationId);

  // Remplir les champs cachés
  const timestampField = document.getElementById('validation_timestamp');
  if (timestampField) timestampField.value = now.toISOString();

  const validationIdField = document.getElementById('validation_id');
  if (validationIdField) validationIdField.value = validationId;

  const userAgentField = document.getElementById('user_agent');
  if (userAgentField) userAgentField.value = navigator.userAgent;

  // Récupérer l'IP utilisateur
  fetchUserIPManual();
}

// =====================================================
// 🔧 CORRECTION 9 : Récupération IP manuelle
// =====================================================

async function fetchUserIPManual() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();

    updateElement('trace-ip', data.ip);

    const userIpField = document.getElementById('user_ip');
    if (userIpField) userIpField.value = data.ip;

    console.log('🌐 IP utilisateur récupérée:', data.ip);
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer l\'IP:', error);
    updateElement('trace-ip', 'Non disponible');
  }
}

// =====================================================
// 🔧 CORRECTION 10 : Auto-correction au chargement
// =====================================================

// Fonction d'auto-correction si on est déjà à l'étape 4
function autoFixStep4() {
  setTimeout(() => {
    const step4 = document.getElementById('step-4');
    if (step4 && step4.classList.contains('active')) {
      console.log('🔧 Auto-correction étape 4 détectée');
      initializeStep4Complete();
    }
  }, 1000);
}

// =====================================================
// 🔧 CORRECTION 11 : Fonction de test et debug
// =====================================================

window.fixStep4Now = function () {
  console.log('🔧 Correction manuelle étape 4 déclenchée');
  initializeStep4Complete();
};

window.debugStep4Fixed = function () {
  console.log('🔍 Debug après corrections:');

  const elements = [
    'summary-entreprise', 'summary-contact', 'summary-total',
    'locked-entreprise', 'locked-contact', 'locked-total',
    'agreement-contact-name', 'agreement-company-name',
    'trace-timestamp', 'trace-ip'
  ];

  elements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`${id}:`, el ? el.textContent : 'NON TROUVÉ');
  });

  console.log('calculateTotalPrice():', typeof window.calculateTotalPrice === 'function' ? window.calculateTotalPrice() : 'MANQUANTE');
};

// =====================================================
// 🚀 INITIALISATION AUTOMATIQUE
// =====================================================

// Lancer l'auto-correction au chargement
document.addEventListener('DOMContentLoaded', autoFixStep4);

// Attacher aux événements de navigation
document.addEventListener('click', function (e) {
  // Si clic sur "suivant" vers étape 4
  if (e.target && (e.target.id === 'next-step-3' || e.target.textContent.includes('SUIVANT'))) {
    setTimeout(() => {
      if (window.currentStep === 4) {
        initializeStep4Complete();
      }
    }, 500);
  }
});

console.log('🔧 Corrections étape 4 chargées. Utilisez fixStep4Now() pour forcer la correction.');

// 💳 GESTION DE LA SÉLECTION DU MODE DE PAIEMENT
// À ajouter dans enterprise-form.js après les autres corrections

// =====================================================
// 🔧 GESTION DES CARTES DE PAIEMENT
// =====================================================

function setupPaymentSelection() {
  console.log('💳 Initialisation sélection mode de paiement');

  // Attacher les événements aux cartes de paiement
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', function () {
      selectPaymentMethod(this);
    });
  });

  // Attacher l'événement au select de RDV pour chèque remise
  const rdvSelect = document.getElementById('rdv_preference');
  if (rdvSelect) {
    rdvSelect.addEventListener('change', function () {
      updateRdvDetails(this.value);
    });
  }

  console.log('✅ Gestion paiement configurée');
}

// =====================================================
// 🔧 SÉLECTION D'UN MODE DE PAIEMENT
// =====================================================

function selectPaymentMethod(selectedCard) {
  // Désélectionner toutes les cartes
  document.querySelectorAll('.payment-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Sélectionner la carte cliquée
  selectedCard.classList.add('selected');

  // Récupérer les informations
  const paymentMethod = selectedCard.getAttribute('data-payment');
  const paymentDetails = selectedCard.getAttribute('data-details');

  // Stocker les informations
  window.selectedPayment = paymentMethod;

  // Mettre à jour les champs cachés
  const selectedPaymentInput = document.getElementById('selected_payment');
  const paymentDetailsInput = document.getElementById('payment_details');

  if (selectedPaymentInput) selectedPaymentInput.value = paymentMethod;
  if (paymentDetailsInput) paymentDetailsInput.value = paymentDetails || '';

  // Masquer toutes les sections de détails
  document.querySelectorAll('.payment-details').forEach(detail => {
    detail.style.display = 'none';
  });

  // Afficher la section correspondante
  if (paymentDetails) {
    const detailSection = document.getElementById(paymentDetails + '-details');
    if (detailSection) {
      detailSection.style.display = 'block';

      // Animation d'apparition
      detailSection.style.opacity = '0';
      detailSection.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        detailSection.style.transition = 'all 0.3s ease';
        detailSection.style.opacity = '1';
        detailSection.style.transform = 'translateY(0)';
      }, 50);
    }
  }

  // Masquer l'erreur de paiement
  const paymentError = document.getElementById('payment-error');
  if (paymentError) paymentError.style.display = 'none';

  // Mettre à jour le récapitulatif
  if (typeof window.updateSummary === 'function') {
    window.updateSummary();
  }

  // Log pour debug
  console.log('💳 Mode de paiement sélectionné:', {
    method: paymentMethod,
    details: paymentDetails,
    globalVar: window.selectedPayment
  });
}

// =====================================================
// 🔧 GESTION DES DÉTAILS RDV
// =====================================================

function updateRdvDetails(rdvType) {
  const paymentDetailsInput = document.getElementById('payment_details');
  if (paymentDetailsInput) {
    // Enrichir les détails avec la préférence RDV
    const baseDetails = paymentDetailsInput.value || 'cheque_remise';
    paymentDetailsInput.value = `${baseDetails}_${rdvType}`;
  }

  console.log('🤝 Préférence RDV mise à jour:', rdvType);
}

// =====================================================
// 🔧 AMÉLIORATION DE updateSummary POUR LE PAIEMENT
// =====================================================

// Étendre la fonction getPaymentLabel pour plus de détails
function getPaymentLabelDetailed(paymentMode) {
  const labels = {
    'Virement': 'Virement bancaire',
    'Cheque_Remise': 'Chèque - Remise en main propre',
    'Cheque_Poste': 'Chèque - Envoi postal',
    'Cheque_Caserne': 'Chèque - Dépôt caserne'
  };
  return labels[paymentMode] || paymentMode || 'À définir';
}

// =====================================================
// 🔧 VALIDATION DU MODE DE PAIEMENT
// =====================================================

function validatePaymentSelection() {
  if (!window.selectedPayment) {
    const paymentError = document.getElementById('payment-error');
    if (paymentError) {
      paymentError.style.display = 'block';
      paymentError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }
  return true;
}

// =====================================================
// 🔧 INTÉGRATION AVEC LA VALIDATION GLOBALE
// =====================================================

// Redéfinir la validation avant soumission pour inclure le paiement
const originalValidateBeforeSubmit = window.validateBeforeSubmit || window.validateDigitalSignature;

window.validateBeforeSubmit = function () {
  // Valider d'abord le mode de paiement
  if (!validatePaymentSelection()) {
    console.log('❌ Validation échouée: Mode de paiement manquant');
    return false;
  }

  // Valider la signature si fonction originale existe
  if (originalValidateBeforeSubmit && typeof originalValidateBeforeSubmit === 'function') {
    return originalValidateBeforeSubmit();
  }

  return true;
};

// =====================================================
// 🔧 MISE À JOUR AUTOMATIQUE DU RÉCAPITULATIF PAIEMENT
// =====================================================

// Étendre updateStep4Summary pour inclure le paiement
const originalUpdateStep4Summary = window.updateStep4Summary;

window.updateStep4Summary = function () {
  // Appeler la fonction originale
  if (originalUpdateStep4Summary && typeof originalUpdateStep4Summary === 'function') {
    originalUpdateStep4Summary();
  }

  // Ajouter la mise à jour spécifique au paiement
  const selectedPayment = getPaymentLabelDetailed(window.selectedPayment || '');

  // Mettre à jour tous les éléments de paiement
  ['summary-payment', 'locked-payment'].forEach(elementId => {
    updateElement(elementId, selectedPayment);
  });

  console.log('💳 Récapitulatif paiement mis à jour:', selectedPayment);
};

// =====================================================
// 🔧 INITIALISATION AUTOMATIQUE À L'ÉTAPE 4
// =====================================================

// Étendre initializeStep4Complete pour inclure le paiement
const originalInitializeStep4Complete = window.initializeStep4Complete;

window.initializeStep4Complete = function () {
  // Appeler la fonction originale
  if (originalInitializeStep4Complete && typeof originalInitializeStep4Complete === 'function') {
    originalInitializeStep4Complete();
  }

  // Configurer la sélection de paiement
  setTimeout(() => {
    setupPaymentSelection();

    // Pré-sélectionner le virement par défaut si aucun choix
    if (!window.selectedPayment) {
      const virementCard = document.querySelector('.payment-card[data-payment="Virement"]');
      if (virementCard) {
        selectPaymentMethod(virementCard);
        console.log('💳 Virement pré-sélectionné par défaut');
      }
    }
  }, 100);
};

// =====================================================
// 🔧 FONCTIONS DE DEBUG PAIEMENT
// =====================================================

window.debugPaymentSelection = function () {
  console.log('💳 Debug Sélection Paiement:');
  console.log('- selectedPayment global:', window.selectedPayment);
  console.log('- Champ selected_payment:', document.getElementById('selected_payment')?.value);
  console.log('- Champ payment_details:', document.getElementById('payment_details')?.value);

  // Vérifier les cartes
  const selectedCard = document.querySelector('.payment-card.selected');
  console.log('- Carte sélectionnée:', selectedCard ? selectedCard.getAttribute('data-payment') : 'AUCUNE');

  // Vérifier les détails visibles
  const visibleDetails = Array.from(document.querySelectorAll('.payment-details')).find(
    detail => detail.style.display !== 'none'
  );
  console.log('- Détails visibles:', visibleDetails ? visibleDetails.id : 'AUCUN');

  // Tester la validation
  console.log('- Validation paiement:', validatePaymentSelection());
};

window.testPaymentSelection = function (paymentType) {
  const card = document.querySelector(`.payment-card[data-payment="${paymentType}"]`);
  if (card) {
    selectPaymentMethod(card);
    console.log(`✅ Test: ${paymentType} sélectionné`);
  } else {
    console.log(`❌ Carte ${paymentType} non trouvée`);
  }
};

// =====================================================
// 🔧 AUTO-INITIALISATION
// =====================================================

// Configurer dès que l'étape 4 est active
document.addEventListener('click', function (e) {
  // Si on navigue vers l'étape 4
  if (e.target && e.target.id === 'next-step-3') {
    setTimeout(() => {
      if (window.currentStep === 4) {
        setupPaymentSelection();
      }
    }, 600);
  }
});

// Initialisation au chargement si déjà à l'étape 4
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    const step4 = document.getElementById('step-4');
    if (step4 && step4.classList.contains('active')) {
      setupPaymentSelection();
    }
  }, 2000);
});

console.log('💳 Module gestion paiement chargé. Utilisez debugPaymentSelection() pour debug.');

// 🔄 CORRECTION : MISE À JOUR TEMPS RÉEL DES RÉCAPITULATIFS PAIEMENT
// À ajouter dans enterprise-form.js APRÈS le code du mode de paiement

// =====================================================
// 🔧 AMÉLIORATION : Mise à jour immédiate des récapitulatifs
// =====================================================

// Redéfinir selectPaymentMethod pour mise à jour temps réel
function selectPaymentMethod(selectedCard) {
  // === CODE EXISTANT (ne pas changer) ===

  // Désélectionner toutes les cartes
  document.querySelectorAll('.payment-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Sélectionner la carte cliquée
  selectedCard.classList.add('selected');

  // Récupérer les informations
  const paymentMethod = selectedCard.getAttribute('data-payment');
  const paymentDetails = selectedCard.getAttribute('data-details');

  // Stocker les informations
  window.selectedPayment = paymentMethod;

  // Mettre à jour les champs cachés
  const selectedPaymentInput = document.getElementById('selected_payment');
  const paymentDetailsInput = document.getElementById('payment_details');

  if (selectedPaymentInput) selectedPaymentInput.value = paymentMethod;
  if (paymentDetailsInput) paymentDetailsInput.value = paymentDetails || '';

  // Masquer toutes les sections de détails
  document.querySelectorAll('.payment-details').forEach(detail => {
    detail.style.display = 'none';
  });

  // Afficher la section correspondante
  if (paymentDetails) {
    const detailSection = document.getElementById(paymentDetails + '-details');
    if (detailSection) {
      detailSection.style.display = 'block';

      // Animation d'apparition
      detailSection.style.opacity = '0';
      detailSection.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        detailSection.style.transition = 'all 0.3s ease';
        detailSection.style.opacity = '1';
        detailSection.style.transform = 'translateY(0)';
      }, 50);
    }
  }

  // Masquer l'erreur de paiement
  const paymentError = document.getElementById('payment-error');
  if (paymentError) paymentError.style.display = 'none';

  // === 🆕 AJOUT : MISE À JOUR IMMÉDIATE DES DEUX RÉCAPITULATIFS ===

  updateBothSummariesWithPayment(paymentMethod);

  // Log pour debug
  console.log('💳 Mode de paiement sélectionné et récapitulatifs mis à jour:', {
    method: paymentMethod,
    details: paymentDetails,
    globalVar: window.selectedPayment
  });
}

// =====================================================
// 🆕 NOUVELLE FONCTION : Mise à jour des deux récapitulatifs
// =====================================================

function updateBothSummariesWithPayment(paymentMethod) {
  console.log('🔄 Mise à jour temps réel des récapitulatifs avec paiement:', paymentMethod);

  // Obtenir le libellé formaté du mode de paiement
  const paymentLabel = getPaymentLabelDetailed(paymentMethod);

  // === 1. RÉCAPITULATIF STANDARD (summary-*) ===
  const summaryPayment = document.getElementById('summary-payment');
  if (summaryPayment) {
    summaryPayment.textContent = paymentLabel;

    // Animation de mise à jour
    summaryPayment.style.transition = 'all 0.3s ease';
    summaryPayment.style.backgroundColor = '#e8f5e8';
    summaryPayment.style.transform = 'scale(1.05)';

    setTimeout(() => {
      summaryPayment.style.backgroundColor = '';
      summaryPayment.style.transform = 'scale(1)';
    }, 600);

    console.log('✅ Récapitulatif standard mis à jour:', paymentLabel);
  } else {
    console.warn('⚠️ Élément summary-payment non trouvé');
  }

  // === 2. RÉCAPITULATIF SÉCURISÉ (locked-*) ===
  const lockedPayment = document.getElementById('locked-payment');
  if (lockedPayment) {
    lockedPayment.textContent = paymentLabel;

    // Animation de mise à jour
    lockedPayment.style.transition = 'all 0.3s ease';
    lockedPayment.style.backgroundColor = '#e8f5e8';
    lockedPayment.style.transform = 'scale(1.05)';

    setTimeout(() => {
      lockedPayment.style.backgroundColor = '';
      lockedPayment.style.transform = 'scale(1)';
    }, 600);

    console.log('✅ Récapitulatif sécurisé mis à jour:', paymentLabel);
  } else {
    console.warn('⚠️ Élément locked-payment non trouvé');
  }

  // === 3. VÉRIFICATION VISUELLE ===

  // Ajouter un indicateur temporaire de mise à jour
  showPaymentUpdateIndicator(paymentLabel);
}

// =====================================================
// 🎨 INDICATEUR VISUEL DE MISE À JOUR
// =====================================================

function showPaymentUpdateIndicator(paymentLabel) {
  // Créer un indicateur temporaire
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    z-index: 10000;
    transform: translateX(300px);
    transition: all 0.3s ease;
  `;

  indicator.innerHTML = `💳 ${paymentLabel} sélectionné`;

  document.body.appendChild(indicator);

  // Animation d'entrée
  setTimeout(() => {
    indicator.style.transform = 'translateX(0)';
  }, 100);

  // Animation de sortie et suppression
  setTimeout(() => {
    indicator.style.transform = 'translateX(300px)';
    indicator.style.opacity = '0';

    setTimeout(() => {
      document.body.removeChild(indicator);
    }, 300);
  }, 2000);
}

// =====================================================
// 🔧 AMÉLIORATION : updateRdvDetails avec mise à jour récapitulatifs
// =====================================================

function updateRdvDetails(rdvType) {
  const paymentDetailsInput = document.getElementById('payment_details');
  if (paymentDetailsInput) {
    // Enrichir les détails avec la préférence RDV
    const baseDetails = paymentDetailsInput.value || 'cheque_remise';
    paymentDetailsInput.value = `${baseDetails}_${rdvType}`;
  }

  // 🆕 MISE À JOUR : Mettre à jour les récapitulatifs quand RDV change
  if (window.selectedPayment) {
    updateBothSummariesWithPayment(window.selectedPayment);
  }

  console.log('🤝 Préférence RDV mise à jour avec récapitulatifs:', rdvType);
}

// =====================================================
// 🧪 FONCTION DE TEST AMÉLIORÉE
// =====================================================

window.testPaymentUpdateRealTime = function () {
  console.log('🧪 Test mise à jour temps réel des récapitulatifs');

  const paymentMethods = ['Virement', 'Cheque_Remise', 'Cheque_Poste', 'Cheque_Caserne'];
  let currentIndex = 0;

  const testSequence = () => {
    if (currentIndex < paymentMethods.length) {
      const method = paymentMethods[currentIndex];
      console.log(`🔄 Test ${currentIndex + 1}/4: ${method}`);

      testPaymentSelection(method);

      // Vérifier que les récapitulatifs ont été mis à jour
      setTimeout(() => {
        const summaryValue = document.getElementById('summary-payment')?.textContent;
        const lockedValue = document.getElementById('locked-payment')?.textContent;

        console.log(`  - Récapitulatif standard: "${summaryValue}"`);
        console.log(`  - Récapitulatif sécurisé: "${lockedValue}"`);

        if (summaryValue === lockedValue && summaryValue !== '-' && summaryValue !== 'À définir') {
          console.log(`  ✅ ${method} - Récapitulatifs synchronisés`);
        } else {
          console.log(`  ❌ ${method} - Problème de synchronisation`);
        }

        currentIndex++;
        setTimeout(testSequence, 1500);
      }, 500);
    } else {
      console.log('✅ Test complet terminé');
    }
  };

  testSequence();
};

// =====================================================
// 🔍 DEBUG AMÉLIORÉ
// =====================================================

window.debugPaymentSummaries = function () {
  console.log('🔍 Debug Récapitulatifs Paiement:');

  // Vérifier les éléments DOM
  const elements = {
    'summary-payment': document.getElementById('summary-payment'),
    'locked-payment': document.getElementById('locked-payment'),
    'selected_payment (champ)': document.getElementById('selected_payment'),
    'payment_details (champ)': document.getElementById('payment_details')
  };

  Object.entries(elements).forEach(([name, element]) => {
    if (element) {
      const value = element.textContent || element.value || '';
      console.log(`- ${name}:`, `"${value}"`);
    } else {
      console.log(`- ${name}: ÉLÉMENT NON TROUVÉ`);
    }
  });

  // Vérifier la cohérence
  const summaryValue = document.getElementById('summary-payment')?.textContent;
  const lockedValue = document.getElementById('locked-payment')?.textContent;

  if (summaryValue === lockedValue) {
    console.log('✅ Récapitulatifs synchronisés');
  } else {
    console.log('❌ Récapitulatifs désynchronisés:', {
      standard: summaryValue,
      sécurisé: lockedValue
    });
  }

  // Vérifier la variable globale
  console.log('- Variable globale selectedPayment:', window.selectedPayment);
  console.log('- Libellé attendu:', getPaymentLabelDetailed(window.selectedPayment));
};

console.log('🔄 Module mise à jour temps réel des récapitulatifs chargé.');
console.log('   Utilisez testPaymentUpdateRealTime() pour test complet');
console.log('   Utilisez debugPaymentSummaries() pour debug récapitulatifs');