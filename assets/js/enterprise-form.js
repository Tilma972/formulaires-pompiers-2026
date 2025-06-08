// ✅ CORRECTION DOUBLE SOUMISSION - Modifier la fonction setupFormSubmission()

function setupFormSubmission() {
  const form = document.getElementById('enterprise-form');
  if (!form) return;
  
  // ✅ VARIABLE POUR EMPÊCHER DOUBLE SOUMISSION
  let isSubmitting = false;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation(); // ✅ Empêcher propagation
    
    // ✅ PROTECTION CONTRE DOUBLE SOUMISSION
    if (isSubmitting) {
      console.log('⚠️ Soumission déjà en cours, ignorée');
      return;
    }
    
    console.log('📤 Début soumission formulaire');
    
    // Validation finale
    if (!selectedPayment) {
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
    
    // ✅ MARQUER COMME EN COURS
    isSubmitting = true;
    
    // Désactiver le bouton et TOUS les boutons du formulaire
    const submitButton = document.querySelector('button[type="submit"]');
    const allButtons = document.querySelectorAll('button');
    
    allButtons.forEach(btn => btn.disabled = true);
    
    if (submitButton) {
      submitButton.innerHTML = '<span class="loading"></span> Traitement en cours...';
    }
    
    // ✅ DÉSACTIVER LE FORMULAIRE COMPLET
    const formInputs = form.querySelectorAll('input, select, textarea, button');
    formInputs.forEach(input => input.disabled = true);
    
    // Construction du payload
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
      selected_format: selectedFormat,
      format_price: formatPrice,
      
      // Mois sélectionnés
      selected_months: selectedMonths.join(','),
      nombre_parutions: isAnnualOffer ? 12 : selectedMonths.length,
      is_annual_offer: isAnnualOffer,
      
      // Paiement
      selected_payment: selectedPayment,
      payment_details: document.querySelector('.payment-card.selected')?.getAttribute('data-details') || '',
      rdv_preference: document.getElementById('rdv_preference')?.value || '',
      
      // Calculs
      prixTotal: window.calculatedTotal || 0,
      
      // Métadonnées
      orderNumber: 'CMD-2026-' + Math.floor(100000 + Math.random() * 900000),
      commentaires: document.getElementById('commentaires').value || '',
      terms_accepted: termsAccepted,
      
      // ID entreprise depuis URL
      entrepriseId: window.entrepriseId || null,
      
      // Tracking
      user_agent: navigator.userAgent,      
    };
    
    console.log('📤 Envoi payload JSON vers Gateway:', payload);
    
    // ✅ ENVOI AVEC TIMEOUT ET ABORT CONTROLLER
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Form-Source': 'enterprise-form'
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
      console.log('✅ Réponse Gateway:', data);
      console.log('✅ Soumission réussie, affichage confirmation');
      
      // ✅ SUCCÈS - NE PAS RÉACTIVER LE FORMULAIRE
      showConfirmation(payload, data);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'envoi:', error);
      
      // ✅ ERREUR - RÉACTIVER UNIQUEMENT EN CAS D'ÉCHEC
      isSubmitting = false;
      
      // Réactiver le formulaire
      formInputs.forEach(input => input.disabled = false);
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'CONFIRMER MA COMMANDE';
      }
      
      alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
    });
  });
  
  // ✅ EMPÊCHER SOUMISSION PAR ENTER KEY (protection supplémentaire)
  form.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && isSubmitting) {
      e.preventDefault();
      e.stopPropagation();
      console.log('⚠️ Enter bloqué pendant soumission');
    }
  });
}

// ✅ MODIFICATION DE showConfirmation pour ne PAS réactiver le formulaire
function showConfirmation(formData, gatewayResponse) {
  console.log('📋 Affichage confirmation finale');
  
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
  
  console.log('✅ Confirmation affichée, formulaire désactivé définitivement');
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
