// ✅ CORRECTION DOUBLE SOUMISSION - Modifier la fonction setupFormSubmission()

function setupFormSubmission() {
  const form = document.getElementById('enterprise-form');
  if (!form) return;
  
  let isSubmitting = false;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) {
      console.log('⚠️ Soumission déjà en cours, ignorée');
      return;
    }
    
    // ✅ AJOUT : Validation signature avant soumission
    if (window.currentStep === 4 && !window.validateDigitalSignature()) {
      console.log('❌ Validation signature échouée');
      return;
    }
    
    console.log('📤 Début soumission formulaire avec signature');
    
    // Validation finale existante...
    if (!window.selectedPayment) {
      const errorEl = document.getElementById('payment-error');
      if (errorEl) errorEl.style.display = 'block';
      return;
    }
    
    const termsAccepted = document.getElementById('terms_accepted').checked;
    if (!termsAccepted) {
      const errorEl = document.getElementById('terms-error');
      if (errorEl) errorEl.style.display = 'block';
      return;
    }
    
    isSubmitting = true;
    
    // Désactiver tous les boutons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);
    
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.innerHTML = '<span class="loading"></span> Finalisation signature...';
    }
    
    // ✅ AJOUT : Inclure les données de signature dans le payload
    const payload = {
      form_name: "enterprise-form",
      source: "formulaire_web_direct",
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      
      // Informations entreprise
      entreprise_name: document.getElementById('entreprise_name').value,
      adresse: document.getElementById('adresse').value,
      contact_name: document.getElementById('contact_name').value,
      email: document.getElementById('email').value,
      telephone: document.getElementById('telephone').value,
      
      // Format et prix
      selected_format: window.selectedFormat,
      format_price: window.formatPrice,
      
      // Mois sélectionnés
      selected_months: window.selectedMonths ? window.selectedMonths.join(',') : '',
      nombre_parutions: window.isAnnualOffer ? 12 : (window.selectedMonths?.length || 1),
      is_annual_offer: window.isAnnualOffer || false,
      
      // Paiement
      selected_payment: window.selectedPayment,
      payment_details: document.querySelector('.payment-card.selected')?.getAttribute('data-details') || '',
      rdv_preference: document.getElementById('rdv_preference')?.value || '',      
          
      // ✅ NOUVEAUX CHAMPS : Données de signature électronique
      contractual_agreement: document.getElementById('contractual_agreement')?.checked || false,
      signature_name: document.getElementById('signature_name')?.value || '',
      signature_password: document.getElementById('signature_password')?.value || '',
      validation_timestamp: document.getElementById('validation_timestamp')?.value || '',
      validation_id: document.getElementById('validation_id')?.value || '',
      validation_hash: document.getElementById('validation_hash')?.value || '',
      user_ip: document.getElementById('user_ip')?.value || '',
      user_agent: document.getElementById('user_agent')?.value || navigator.userAgent,
      prixTotal: (() => {
        if (!window.selectedFormat || !window.formatPrice) return 0;
        if (window.isAnnualOffer) return window.formatPrice;
        return window.formatPrice * (window.selectedMonths?.length || 1);
      })(),

      // Métadonnées
      orderNumber: 'CMD-2026-' + Math.floor(100000 + Math.random() * 900000),
      commentaires: document.getElementById('commentaires').value || '',
      terms_accepted: termsAccepted,
      entrepriseId: getEnterpriseIdFromURL(),
      user_agent: navigator.userAgent,
      
      // ✅ NOUVEAU : Marquer comme signé électroniquement
      is_electronically_signed: true,
      signature_method: 'Validation électronique renforcée'
    };
    
    console.log('📤 Envoi payload avec signature:', {
      validation_id: payload.validation_id,
      signature_name: payload.signature_name,
      is_signed: payload.is_electronically_signed
    });
    
    // Envoi vers le gateway (code existant)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Form-Source': 'enterprise-form-signed'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Erreur serveur: ${response.status} - ${response.statusText}`);
    })
    .then(data => {
      console.log('✅ Réponse Gateway avec signature:', data);
      showConfirmation(payload, data);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'envoi:', error);
      
      isSubmitting = false;
      
      // Réactiver le formulaire
      const formInputs = form.querySelectorAll('input, select, textarea, button');
      formInputs.forEach(input => input.disabled = false);
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'CONFIRMER MA COMMANDE';
      }
      
      alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
    });
  });
}

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
    window.updateProgressBar = function(step) {
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
    window.showStep = function(step) {
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
    window.updateSummary = function() {
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
    window.toggleMonth = function(element) {
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
      nextStep1.onclick = function() {
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
      nextStep2.onclick = function() {
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
      nextStep3.onclick = function() {
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
      card.onclick = function() {
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
      card.onclick = function() {
        window.toggleMonth(this);
      };
    });
    
    // === GESTION NOMBRE DE PARUTIONS ===
    const nombreParutionsInput = document.getElementById('nombre_parutions');
    if (nombreParutionsInput) {
      nombreParutionsInput.onchange = function() {
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
      card.onclick = function() {
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
document.addEventListener('DOMContentLoaded', function() {
  // Attendre que l'initialisation soit terminée
  setTimeout(() => {
    setupFormSubmission();
    console.log("✅ setupFormSubmission() appelée");
  }, 1500);
});

// ✅ MODIFICATION 4 : Assurer que les scripts de signature sont chargés
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier que le script de signature est bien chargé
  if (typeof window.initializeDigitalSignature !== 'function') {
    console.warn('⚠️ Script de signature électronique non chargé');
  } else {
    console.log('✅ Intégration signature électronique chargée');
  }
});

// ✅ NOUVELLE FONCTION : Debug pour tester la signature
window.debugSignatureIntegration = function() {
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

window.calculateTotalPrice = function() {
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

window.updateSummary = function() {
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

window.showStep = function(step) {
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

window.fixStep4Now = function() {
  console.log('🔧 Correction manuelle étape 4 déclenchée');
  initializeStep4Complete();
};

window.debugStep4Fixed = function() {
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
document.addEventListener('click', function(e) {
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