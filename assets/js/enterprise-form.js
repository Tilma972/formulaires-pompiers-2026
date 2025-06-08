// enterprise-form.js - VERSION COMPLÈTE AVEC PRÉ-REMPLISSAGE URL

// Variables globales du formulaire
let currentStep = 1;
let selectedFormat = '';
let formatPrice = 0;
let selectedMonths = [];
let isAnnualOffer = false;
let selectedPayment = '';
let startTime = Date.now();

// ✅ PRÉ-REMPLISSAGE AU CHARGEMENT DE LA PAGE
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Initialisation enterprise-form avec pré-remplissage URL');
  
  // ✅ LECTURE DES PARAMÈTRES URL
  const urlParams = new URLSearchParams(window.location.search);
  
  console.log('📋 Paramètres URL détectés:');
  console.log('URL complète:', window.location.href);
  console.log('Search string:', window.location.search);
  
  for (const [key, value] of urlParams.entries()) {
    console.log(`  - ${key}: ${value}`);
  }
  
  // ✅ PRÉ-REMPLISSAGE DES CHAMPS
  
  // ID entreprise (pour l'envoi)
  const entrepriseId = urlParams.get('id');
  if (entrepriseId) {
    console.log('✅ ID entreprise:', entrepriseId);
    window.entrepriseId = entrepriseId; // Stocker globalement
  }
  
  // Nom entreprise 
  const nomEntreprise = urlParams.get('nom');
  if (nomEntreprise) {
    const field = document.getElementById('entreprise_name');
    if (field) {
      field.value = decodeURIComponent(nomEntreprise);
      // Supprimer readonly pour permettre l'édition si nécessaire
      field.removeAttribute('readonly');
      field.style.backgroundColor = '#f8f9fa';
      console.log('✅ Nom entreprise pré-rempli:', field.value);
    }
  }
  
  // Adresse
  const adresse = urlParams.get('adresse');
  if (adresse) {
    const field = document.getElementById('adresse');
    if (field) {
      field.value = decodeURIComponent(adresse);
      field.removeAttribute('readonly');
      field.style.backgroundColor = '#f8f9fa';
      console.log('✅ Adresse pré-remplie:', field.value);
    }
  }
  
  // Contact
  const contact = urlParams.get('contact');
  if (contact) {
    const field = document.getElementById('contact_name');
    if (field) {
      field.value = decodeURIComponent(contact);
      console.log('✅ Contact pré-rempli:', field.value);
    }
  }
  
  // Email
  const email = urlParams.get('email');
  if (email) {
    const field = document.getElementById('email');
    if (field) {
      field.value = decodeURIComponent(email);
      console.log('✅ Email pré-rempli:', field.value);
    }
  }
  
  // Téléphone
  const tel = urlParams.get('tel');
  if (tel) {
    const field = document.getElementById('telephone');
    if (field) {
      field.value = decodeURIComponent(tel);
      console.log('✅ Téléphone pré-rempli:', field.value);
    }
  }
  
  console.log('✅ Pré-remplissage terminé');
  
  // Initialiser le formulaire multi-étapes
  initializeFormSteps();
});

// ✅ INITIALISATION DU FORMULAIRE MULTI-ÉTAPES
function initializeFormSteps() {
  // Mise à jour de la barre de progression
  updateProgressBar(1);
  
  // Navigation étape 1
  const nextStep1 = document.getElementById('next-step-1');
  if (nextStep1) {
    nextStep1.addEventListener('click', function() {
      if (validateStep1()) {
        showStep(2);
      }
    });
  }
  
  // Navigation étape 2
  const prevStep2 = document.getElementById('prev-step-2');
  const nextStep2 = document.getElementById('next-step-2');
  
  if (prevStep2) prevStep2.addEventListener('click', () => showStep(1));
  if (nextStep2) {
    nextStep2.addEventListener('click', function() {
      if (validateStep2()) {
        configureStep3();
        showStep(3);
      }
    });
  }
  
  // Navigation étape 3
  const prevStep3 = document.getElementById('prev-step-3');
  const nextStep3 = document.getElementById('next-step-3');
  
  if (prevStep3) prevStep3.addEventListener('click', () => showStep(2));
  if (nextStep3) {
    nextStep3.addEventListener('click', function() {
      if (validateStep3()) {
        updateSummary();
        showStep(4);
      }
    });
  }
  
  // Navigation étape 4
  const prevStep4 = document.getElementById('prev-step-4');
  if (prevStep4) prevStep4.addEventListener('click', () => showStep(3));
  
  // Gestion sélection format
  setupFormatSelection();
  
  // Gestion sélection mois
  setupMonthSelection();
  
  // Gestion sélection paiement
  setupPaymentSelection();
  
  // Soumission du formulaire
  setupFormSubmission();
  
  // Afficher la première étape
  showStep(1);
}

// ✅ FONCTIONS DE NAVIGATION
function showStep(step) {
  // Masquer toutes les sections
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Afficher la section demandée
  const targetSection = document.getElementById(`step-${step}`);
  if (targetSection) {
    targetSection.classList.add('active');
    currentStep = step;
    updateProgressBar(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateProgressBar(step) {
  document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
    const stepNumber = index + 1;
    stepEl.classList.remove('active', 'completed');
    
    if (stepNumber < step) {
      stepEl.classList.add('completed');
    } else if (stepNumber === step) {
      stepEl.classList.add('active');
    }
  });
}

// ✅ VALIDATION DES ÉTAPES
function validateStep1() {
  const contactName = document.getElementById('contact_name').value.trim();
  const email = document.getElementById('email').value.trim();
  const telephone = document.getElementById('telephone').value.trim();
  
  let isValid = true;
  
  // Masquer toutes les erreurs
  document.querySelectorAll('.error-message').forEach(err => err.style.display = 'none');
  
  if (!contactName) {
    const errorEl = document.getElementById('contact-error');
    if (errorEl) errorEl.style.display = 'block';
    isValid = false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    const errorEl = document.getElementById('email-error');
    if (errorEl) errorEl.style.display = 'block';
    isValid = false;
  }
  
  if (!telephone || telephone.length < 10) {
    const errorEl = document.getElementById('telephone-error');
    if (errorEl) errorEl.style.display = 'block';
    isValid = false;
  }
  
  return isValid;
}

function validateStep2() {
  if (!selectedFormat) {
    const errorEl = document.getElementById('format-error');
    if (errorEl) errorEl.style.display = 'block';
    return false;
  }
  return true;
}

function validateStep3() {
  if (!isAnnualOffer && selectedMonths.length === 0) {
    const errorEl = document.getElementById('month-error');
    if (errorEl) errorEl.style.display = 'block';
    return false;
  }
  return true;
}

// ✅ GESTION SÉLECTION FORMAT
function setupFormatSelection() {
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', function() {
      // Désélectionner tous les formats
      document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
      
      // Sélectionner le format cliqué
      this.classList.add('selected');
      
      selectedFormat = this.getAttribute('data-format');
      formatPrice = parseInt(this.getAttribute('data-price'));
      isAnnualOffer = this.getAttribute('data-annual') === 'true';
      
      const errorEl = document.getElementById('format-error');
      if (errorEl) errorEl.style.display = 'none';
      
      console.log('Format sélectionné:', selectedFormat, formatPrice);
    });
  });
}

// ✅ CONFIGURATION ÉTAPE 3 SELON FORMAT
function configureStep3() {
  if (isAnnualOffer) {
    document.getElementById('month-selection-text').style.display = 'none';
    document.getElementById('annual-text').style.display = 'block';
    document.getElementById('month-selector').style.display = 'none';
    document.getElementById('parutions-row').style.display = 'none';
    
    // Sélectionner tous les mois automatiquement
    selectedMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  } else {
    document.getElementById('month-selection-text').style.display = 'block';
    document.getElementById('annual-text').style.display = 'none';
    document.getElementById('month-selector').style.display = 'block';
    document.getElementById('parutions-row').style.display = 'block';
    
    selectedMonths = [];
    document.querySelectorAll('.month-card').forEach(card => {
      card.classList.remove('selected');
    });
  }
}

// ✅ GESTION SÉLECTION MOIS
function setupMonthSelection() {
  document.querySelectorAll('.month-card').forEach(card => {
    card.addEventListener('click', function() {
      if (isAnnualOffer) return; // Pas de sélection manuelle pour l'offre annuelle
      
      const month = this.getAttribute('data-month');
      const maxParutions = parseInt(document.getElementById('nombre_parutions').value) || 1;
      
      if (this.classList.contains('selected')) {
        this.classList.remove('selected');
        selectedMonths = selectedMonths.filter(m => m !== month);
      } else {
        if (selectedMonths.length < maxParutions) {
          this.classList.add('selected');
          selectedMonths.push(month);
        } else {
          alert(`Vous ne pouvez sélectionner que ${maxParutions} mois.`);
          return;
        }
      }
      
      const errorEl = document.getElementById('month-error');
      if (errorEl && selectedMonths.length > 0) {
        errorEl.style.display = 'none';
      }
      
      console.log('Mois sélectionnés:', selectedMonths);
    });
  });
  
  // Gestion nombre de parutions
  const nombreParutionsInput = document.getElementById('nombre_parutions');
  if (nombreParutionsInput) {
    nombreParutionsInput.addEventListener('change', function() {
      const nombreParutions = parseInt(this.value) || 1;
      
      if (nombreParutions < 1) this.value = 1;
      if (nombreParutions > 12) this.value = 12;
      
      // Ajuster les mois sélectionnés si nécessaire
      const actualNombre = parseInt(this.value);
      if (selectedMonths.length > actualNombre) {
        const excessMonths = selectedMonths.length - actualNombre;
        for (let i = 0; i < excessMonths; i++) {
          const monthToRemove = selectedMonths.pop();
          const monthCard = document.querySelector(`.month-card[data-month="${monthToRemove}"]`);
          if (monthCard) {
            monthCard.classList.remove('selected');
          }
        }
      }
    });
  }
}

// ✅ GESTION SÉLECTION PAIEMENT
function setupPaymentSelection() {
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', function() {
      // Désélectionner tous les modes
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
      
      // Sélectionner le mode cliqué
      this.classList.add('selected');
      
      selectedPayment = this.getAttribute('data-payment');
      const paymentDetails = this.getAttribute('data-details');
      
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
      
      const errorEl = document.getElementById('payment-error');
      if (errorEl) errorEl.style.display = 'none';
    });
  });
}

// ✅ MISE À JOUR DU RÉCAPITULATIF
function updateSummary() {
  const summaryFormat = document.getElementById('summary-format');
  const summaryMonths = document.getElementById('summary-months');
  const summaryParutions = document.getElementById('summary-parutions');
  const summaryTotal = document.getElementById('summary-total');
  
  if (summaryFormat) summaryFormat.textContent = selectedFormat;
  
  const monthsText = isAnnualOffer ? 'Tous les mois' : 
                   selectedMonths.length > 0 ? selectedMonths.join(', ') : '-';
  if (summaryMonths) summaryMonths.textContent = monthsText;
  
  const nombreParutions = isAnnualOffer ? 12 : selectedMonths.length;
  if (summaryParutions) summaryParutions.textContent = nombreParutions;
  
  let total = 0;
  if (isAnnualOffer) {
    total = formatPrice; // Prix forfaitaire
  } else {
    total = formatPrice * nombreParutions;
  }
  
  if (summaryTotal) summaryTotal.textContent = total + ' €';
  
  // Stocker le total pour l'envoi
  window.calculatedTotal = total;
}

// ✅ SOUMISSION DU FORMULAIRE
function setupFormSubmission() {
  const form = document.getElementById('enterprise-form');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
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
    
    // Désactiver le bouton de soumission
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading"></span> Traitement en cours...';
    }
    
    // ✅ CONSTRUCTION DU PAYLOAD JSON
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
      completion_time_seconds: Math.round((Date.now() - startTime) / 1000)
    };
    
    console.log('📤 Envoi payload JSON vers Gateway:', payload);
    
    // ✅ ENVOI JSON VERS LE GATEWAY
    fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Form-Source': 'enterprise-form'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Erreur serveur: ${response.status}`);
    })
    .then(data => {
      console.log('✅ Réponse Gateway:', data);
      showConfirmation(payload, data);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'envoi:', error);
      
      // Réactiver le bouton en cas d'erreur
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'CONFIRMER MA COMMANDE';
      }
      
      alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
    });
  });
}

// ✅ AFFICHAGE DE LA CONFIRMATION
function showConfirmation(formData, gatewayResponse) {
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
  
  // Masquer le formulaire et afficher la confirmation
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
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
}