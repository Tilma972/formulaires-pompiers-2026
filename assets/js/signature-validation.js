// 🔐 SIGNATURE-VALIDATION.JS - Version 2.0 (Updated with signature choice)
// Script complet de gestion de la signature électronique et physique
// Compatible avec le formulaire enterprise-form

(function() {
  'use strict';
  
  console.log('🔐 Chargement du module signature électronique et physique...');
  
  // =====================================================
  // 📋 VARIABLES GLOBALES
  // =====================================================
  
  let signatureMethod = 'electronic'; // Par défaut : électronique
  let validationData = {
    timestamp: null,
    validationId: null,
    hash: null,
    userIP: null,
    userAgent: null,
    isValid: false
  };
  
  // =====================================================
  // 🔧 FONCTIONS UTILITAIRES
  // =====================================================
  
  /**
   * Utilitaire : Libellé du mode de paiement
   */
  function getPaymentLabel(paymentMode) {
    const labels = {
      'Virement': 'Virement bancaire',
      'Cheque_Remise': 'Chèque - Remise main propre',
      'Cheque_Poste': 'Chèque - Envoi postal',
      'Cheque_Caserne': 'Chèque - Dépôt caserne'
    };
    return labels[paymentMode] || paymentMode || 'Non défini';
  }
  
  /**
   * Comparaison flexible des noms
   */
  function compareNames(original, typed) {
    // Normaliser les chaînes (supprimer accents, espaces multiples, etc.)
    const normalize = (str) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();
    
    const normalizedOriginal = normalize(original);
    const normalizedTyped = normalize(typed);
    
    // Comparaison exacte
    if (normalizedOriginal === normalizedTyped) return true;
    
    // Comparaison par mots (ordre différent accepté)
    const originalWords = normalizedOriginal.split(' ').sort();
    const typedWords = normalizedTyped.split(' ').sort();
    
    return originalWords.join(' ') === typedWords.join(' ');
  }
  
  /**
   * Calcul du prix total (réintroduit pour la compatibilité)
   */
  function calculateTotalPrice() {
    if (!window.selectedFormat || !window.formatPrice) {
      console.warn('Données de prix manquantes pour calculateTotalPrice, utilisation de 0');
      return 0;
    }
    
    let total = 0;
    
    if (window.isAnnualOffer) {
      total = window.formatPrice; // Prix forfaitaire annuel
    } else {
      const nombreMois = window.selectedMonths?.length || 1;
      total = window.formatPrice * nombreMois;
    }
    
    return total;
  }
  
  // =====================================================
  // 🎯 FONCTIONS PRINCIPALES DE SIGNATURE
  // =====================================================
  
  /**
   * Initialisation du choix de signature à l'étape 4
   */
  function initializeSignatureChoice() {
    console.log('🔐 Initialisation choix de signature');
    
    // Attacher les événements de choix
    const signatureRadios = document.querySelectorAll('input[name="signature_method"]');
    signatureRadios.forEach(radio => {
      radio.addEventListener('change', handleSignatureMethodChange);
    });
    
    // Initialiser avec la méthode par défaut (ou celle déjà sélectionnée si retour arrière)
    const currentSelectedMethod = document.querySelector('input[name="signature_method"]:checked')?.value || 'electronic';
    handleSignatureMethodChange({ target: { value: currentSelectedMethod } });
    
    // Mettre à jour le récapitulatif
    updateLockedSummary();
    
    // Initialiser la signature électronique si sélectionnée
    if (signatureMethod === 'electronic') {
      initializeDigitalSignature();
    }
    
    console.log('✅ Choix de signature initialisé');
  }
  
  /**
   * Gestion du changement de méthode de signature
   */
  function handleSignatureMethodChange(event) {
    signatureMethod = event.target.value;
    
    console.log('🔄 Changement méthode signature:', signatureMethod);
    
    const electronicSection = document.getElementById('electronic-signature-section');
    const physicalSection = document.getElementById('physical-signature-section');
    const submitButton = document.getElementById('submit-button');
    const submitText = document.getElementById('submit-text');
    
    if (signatureMethod === 'electronic') {
      // Afficher section électronique
      if (electronicSection) electronicSection.style.display = 'block';
      if (physicalSection) physicalSection.style.display = 'none';
      
      // Mettre à jour le bouton
      if (submitButton) submitButton.className = 'btn btn-primary electronic-mode';
      if (submitText) submitText.textContent = '🔐 SIGNER ÉLECTRONIQUEMENT';
      
      // Initialiser la signature électronique
      setTimeout(() => {
        initializeDigitalSignature();
      }, 300);
      
    } else if (signatureMethod === 'physical') {
      // Afficher section physique
      if (electronicSection) electronicSection.style.display = 'none';
      if (physicalSection) physicalSection.style.display = 'block';
      
      // Mettre à jour le bouton
      if (submitButton) submitButton.className = 'btn btn-primary physical-mode';
      if (submitText) submitText.textContent = '📄 GÉNÉRER DOCUMENT À SIGNER';
      
      // Réinitialiser les données de signature électronique
      resetDigitalSignatureData();
    }
    
    // Mettre à jour la validation du formulaire
    updateFormValidation();
  }
  
  /**
   * Initialisation de la signature électronique
   */
  function initializeDigitalSignature() {
    console.log('🔐 Initialisation signature électronique');
    
    // Générer les données de traçabilité
    generateTraceabilityData();
    
    // Mettre à jour le récapitulatif verrouillé
    updateLockedSummary();
    
    // Attacher les événements de validation
    attachSignatureEvents();
    
    // Récupérer l'IP utilisateur
    fetchUserIP();
  }
  
  /**
   * Génération des données de traçabilité
   */
  function generateTraceabilityData() {
    const now = new Date();
    
    validationData.timestamp = now.toISOString();
    validationData.validationId = `VAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    validationData.userAgent = navigator.userAgent;
    
    // Afficher dans l'interface
    const traceTimestampEl = document.getElementById('trace-timestamp');
    if (traceTimestampEl) traceTimestampEl.textContent = now.toLocaleString('fr-FR');
    
    const traceValidationIdEl = document.getElementById('trace-validation-id');
    if (traceValidationIdEl) traceValidationIdEl.textContent = validationData.validationId;
    
    // Remplir les champs cachés
    const validationTimestampEl = document.getElementById('validation_timestamp');
    if (validationTimestampEl) validationTimestampEl.value = validationData.timestamp;
    
    const validationIdEl = document.getElementById('validation_id');
    if (validationIdEl) validationIdEl.value = validationData.validationId;
    
    const userAgentEl = document.getElementById('user_agent');
    if (userAgentEl) userAgentEl.value = validationData.userAgent;
    
    console.log('📊 Données de traçabilité générées:', validationData.validationId);
  }
  
  /**
   * Récupération de l'IP utilisateur
   */
  async function fetchUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      validationData.userIP = data.ip;
      
      const traceIpEl = document.getElementById('trace-ip');
      if (traceIpEl) traceIpEl.textContent = data.ip;
      
      const userIpEl = document.getElementById('user_ip');
      if (userIpEl) userIpEl.value = data.ip;
      
      console.log('🌐 IP utilisateur récupérée:', data.ip);
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer l\'IP:', error);
      validationData.userIP = 'Non disponible';
      const traceIpEl = document.getElementById('trace-ip');
      if (traceIpEl) traceIpEl.textContent = 'Non disponible';
    }
  }
  
  /**
   * Mise à jour du récapitulatif verrouillé
   */
  function updateLockedSummary() {
    const entrepriseName = document.getElementById('entreprise_name')?.value || 'Non défini';
    const contactName = document.getElementById('contact_name')?.value || 'Non défini';
    const selectedFormat = window.selectedFormat || 'Non défini';
    const selectedMonths = window.isAnnualOffer ? 'Tous les mois (12 mois)' : (window.selectedMonths ? window.selectedMonths.join(', ') : 'Non défini');
    const selectedPayment = getPaymentLabel(window.selectedPayment);
    const totalPrice = window.calculateTotalPrice ? window.calculateTotalPrice() : 0; // Use global calculateTotalPrice
    
    // Mettre à jour l'affichage dans les deux récapitulatifs
    ['summary-', 'locked-'].forEach(prefix => {
      const entrepriseEl = document.getElementById(prefix + 'entreprise');
      const contactEl = document.getElementById(prefix + 'contact');
      const formatEl = document.getElementById(prefix + 'format');
      const monthsEl = document.getElementById(prefix + 'months');
      const paymentEl = document.getElementById(prefix + 'payment');
      const totalEl = document.getElementById(prefix + 'total');
      
      if (entrepriseEl) entrepriseEl.textContent = entrepriseName;
      if (contactEl) contactEl.textContent = contactName;
      if (formatEl) formatEl.textContent = selectedFormat;
      if (monthsEl) monthsEl.textContent = selectedMonths;
      if (paymentEl) paymentEl.textContent = selectedPayment;
      if (totalEl) totalEl.textContent = totalPrice + ' €';
    });
    
    // Mettre à jour les zones d'accord pour signature électronique
    const agreementContactEl = document.getElementById('agreement-contact-name');
    const agreementCompanyEl = document.getElementById('agreement-company-name');
    const agreementTotalEl = document.getElementById('agreement-total');
    
    if (agreementContactEl) agreementContactEl.textContent = contactName;
    if (agreementCompanyEl) agreementCompanyEl.textContent = entrepriseName;
    if (agreementTotalEl) agreementTotalEl.textContent = totalPrice;
    
    console.log('📋 Récapitulatif mis à jour');
  }
  
  /**
   * Attacher les événements de validation signature électronique
   */
  function attachSignatureEvents() {
    const agreementCheckbox = document.getElementById('contractual_agreement');
    const signatureName = document.getElementById('signature_name');
    const signaturePassword = document.getElementById('signature_password');
    
    if (!agreementCheckbox || !signatureName || !signaturePassword) {
      console.warn('⚠️ Éléments de signature non trouvés');
      return;
    }
    
    // Validation en temps réel
    agreementCheckbox.addEventListener('change', validateSignatureStep);
    signatureName.addEventListener('input', validateSignatureStep);
    signaturePassword.addEventListener('input', validateSignatureStep);
    
    // Validation du nom en temps réel
    signatureName.addEventListener('input', function() {
      validateNameMatch(this.value);
    });
    
    console.log('🔗 Événements de signature attachés');
  }
  
  /**
   * Validation du nom saisi
   */
  function validateNameMatch(typedName) {
    const contactName = document.getElementById('contact_name')?.value?.trim().toLowerCase() || '';
    const typedNameLower = typedName.trim().toLowerCase();
    const nameInput = document.getElementById('signature_name');
    const errorElement = document.getElementById('signature-name-error');
    
    if (!nameInput || !errorElement) return false;
    
    // Fonction de comparaison flexible
    const isMatch = compareNames(contactName, typedNameLower);
    
    if (typedName.length > 3) { // Commencer la validation après 3 caractères
      if (isMatch) {
        nameInput.classList.remove('invalid');
        nameInput.classList.add('valid');
        errorElement.style.display = 'none';
      } else {
        nameInput.classList.remove('valid');
        nameInput.classList.add('invalid');
        errorElement.style.display = 'block';
        errorElement.textContent = `Le nom doit correspondre à "${document.getElementById('contact_name')?.value || 'contact principal'}"`;
      }
    } else {
      nameInput.classList.remove('valid', 'invalid');
      errorElement.style.display = 'none';
    }
    
    return isMatch;
  }
  
  /**
   * Validation globale de l'étape signature électronique
   */
  function validateSignatureStep() {
    if (signatureMethod !== 'electronic') return true;
    
    const agreement = document.getElementById('contractual_agreement')?.checked || false;
    const nameValid = validateNameMatch(document.getElementById('signature_name')?.value || '');
    const passwordValid = (document.getElementById('signature_password')?.value?.length || 0) >= 6;
    
    // Mettre à jour l'état de validation
    validationData.isValid = agreement && nameValid && passwordValid;
    
    // Générer le hash si tout est valide
    if (validationData.isValid) {
      generateValidationHash();
      
      // Animation de succès
      const section = document.querySelector('.signature-validation-section');
      if (section) {
        section.classList.add('validated');
        setTimeout(() => section.classList.remove('validated'), 600);
      }
    } else {
      // Remove validated class if not valid
      const section = document.querySelector('.signature-validation-section');
      if (section) {
        section.classList.remove('validated');
      }
    }
    
    // Mettre à jour le bouton de soumission
    updateSubmitButton();
    
    console.log('✅ Validation signature:', validationData.isValid);
    return validationData.isValid;
  }
  
  /**
   * Génération du hash de validation
   */
  function generateValidationHash() {
    const hashData = {
      timestamp: validationData.timestamp,
      validationId: validationData.validationId,
      entreprise: document.getElementById('entreprise_name')?.value || '',
      contact: document.getElementById('contact_name')?.value || '',
      format: window.selectedFormat || '',
      months: window.selectedMonths ? window.selectedMonths.join(',') : '',
      total: window.calculateTotalPrice ? window.calculateTotalPrice() : 0,
      userAgent: validationData.userAgent,
      ip: validationData.userIP
    };
    
    // Créer une empreinte simple (pour un vrai hash, utiliser crypto-js)
    const hashString = JSON.stringify(hashData);
    validationData.hash = btoa(hashString); // Base64 simple
    
    const hashInput = document.getElementById('validation_hash');
    if (hashInput) hashInput.value = validationData.hash;
    
    console.log('🔑 Hash de validation généré');
  }
  
  /**
   * Réinitialiser les données de signature électronique
   */
  function resetDigitalSignatureData() {
    validationData = {
      timestamp: null,
      validationId: null,
      hash: null,
      userIP: null,
      userAgent: null,
      isValid: false
    };
    
    // Réinitialiser les champs cachés
    ['validation_timestamp', 'validation_id', 'validation_hash', 'user_ip', 'user_agent'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    
    // Réinitialiser les champs de signature
    ['contractual_agreement', 'signature_name', 'signature_password'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = false;
        } else {
          element.value = '';
          element.classList.remove('valid', 'invalid');
        }
      }
    });
    
    // Cacher les messages d'erreur
    ['agreement-error', 'signature-name-error', 'password-error'].forEach(id => {
      const errorElement = document.getElementById(id);
      if (errorElement) errorElement.style.display = 'none';
    });
    
    // Réinitialiser l'affichage de traçabilité
    const traceTimestampEl = document.getElementById('trace-timestamp');
    if (traceTimestampEl) traceTimestampEl.textContent = '-';
    const traceValidationIdEl = document.getElementById('trace-validation-id');
    if (traceValidationIdEl) traceValidationIdEl.textContent = '-';
    const traceIpEl = document.getElementById('trace-ip');
    if (traceIpEl) traceIpEl.textContent = '-';
    
    // Remove validated class
    const section = document.querySelector('.signature-validation-section');
    if (section) {
      section.classList.remove('validated');
    }
    
    console.log('🔄 Données de signature réinitialisées');
  }
  
  /**
   * Mise à jour du bouton de soumission
   */
  function updateSubmitButton() {
    const submitButton = document.getElementById('submit-button');
    const submitText = document.getElementById('submit-text');
    if (!submitButton || !submitText) return;
    
    let isValid = true;
    let buttonText = '';
    
    if (signatureMethod === 'electronic') {
      isValid = validationData.isValid;
      buttonText = isValid ? '🔐 SIGNER ÉLECTRONIQUEMENT' : 'VEUILLEZ COMPLÉTER LA SIGNATURE';
    } else {
      // Pour signature physique, vérifier seulement les conditions générales
      const termsAccepted = document.getElementById('terms_accepted')?.checked || false;
      isValid = termsAccepted;
      buttonText = isValid ? '📄 GÉNÉRER DOCUMENT À SIGNER' : 'VEUILLEZ ACCEPTER LES CONDITIONS';
    }
    
    submitButton.disabled = !isValid;
    submitText.textContent = buttonText;
    
    if (isValid) {
      submitButton.style.backgroundColor = signatureMethod === 'electronic' ? 'var(--primary)' : 'var(--accent)';
    } else {
      submitButton.style.backgroundColor = '#ccc';
    }
  }
  
  /**
   * Mise à jour de la validation globale du formulaire
   */
  function updateFormValidation() {
    setTimeout(() => {
      if (signatureMethod === 'electronic') {
        validateSignatureStep();
      } else {
        updateSubmitButton();
      }
    }, 100);
  }
  
  /**
   * Validation avant soumission finale
   */
  function validateBeforeSubmit() {
    console.log('🔍 Validation avant soumission, méthode:', signatureMethod);
    
    if (signatureMethod === 'electronic') {
      if (!validationData.isValid) {
        alert('⚠️ Veuillez compléter la signature électronique avant de soumettre votre commande.');
        
        // Scroll vers la section signature
        const signatureSection = document.querySelector('.electronic-signature-section');
        if (signatureSection) {
          signatureSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        
        return false;
      }
    } else {
      // Pour signature physique, vérifier les conditions générales
      const termsAccepted = document.getElementById('terms_accepted')?.checked || false;
      if (!termsAccepted) {
        alert('⚠️ Veuillez accepter les conditions générales pour continuer.');
        return false;
      }
    }
    
    console.log('✅ Validation signature OK - Prêt pour soumission');
    return true;
  }
  
  // =====================================================
  // 🌐 EXPOSITION DES FONCTIONS PUBLIQUES
  // =====================================================
  
  // Exposer les fonctions principales à l'objet window
  window.initializeSignatureChoice = initializeSignatureChoice;
  window.validateDigitalSignature = validateBeforeSubmit; // Renommé pour la compatibilité
  window.updateLockedSummary = updateLockedSummary; // Exposer la nouvelle fonction
  
  // Fonctions de debug (disponibles en global)
  window.debugSignature = function() {
    console.log('🔍 Debug Signature:', {
      method: signatureMethod,
      validationData,
      isValid: validationData.isValid,
      hash: validationData.hash
    });
  };
  
  // =====================================================
  // 🚀 INITIALISATION AUTOMATIQUE
  // =====================================================
  
  // Modification de la fonction showStep existante pour intégrer le choix de signature
  const originalShowStep = window.showStep;
  window.showStep = function(step) {
    // Appeler la fonction originale si elle existe
    if (originalShowStep) {
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
        if (window.updateProgressBar) window.updateProgressBar(step); // Ensure updateProgressBar exists
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    // Si on arrive à l'étape 4, initialiser le choix de signature
    if (step === 4) {
      setTimeout(() => {
        initializeSignatureChoice();
      }, 500);
    }
  };
  
  // Modification de la validation du formulaire existante
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('enterprise-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        // Ajouter la validation signature à la validation existante
        if (!validateBeforeSubmit()) {
          e.preventDefault();
          return false;
        }
      });
    }
    
    // Attacher les événements de conditions générales
    const termsCheckbox = document.getElementById('terms_accepted');
    if (termsCheckbox) {
      termsCheckbox.addEventListener('change', updateFormValidation);
    }
  });
  
  console.log('✅ Module signature électronique et physique chargé avec succès');
  
})();
