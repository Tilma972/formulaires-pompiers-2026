// 🔐 SIGNATURE-VALIDATION.JS - Version 1.0
// Script complet de gestion de la signature électronique
// Compatible avec le formulaire enterprise-form

(function() {
  'use strict';
  
  console.log('🔐 Chargement du module signature électronique...');
  
  // =====================================================
  // 📋 CONFIGURATION ET CONSTANTS
  // =====================================================
  
  const SIGNATURE_CONFIG = {
    minPasswordLength: 6,
    validationIdPrefix: 'SIGN-2026',
    ipServiceUrl: 'https://api.ipify.org?format=json',
    ipFallback: 'Non disponible',
    hashAlgorithm: 'simple', // 'simple' ou 'crypto' (si crypto.subtle disponible)
    enableRealTimeValidation: true,
    debugMode: false
  };
  
  // =====================================================
  // 🔧 FONCTIONS UTILITAIRES
  // =====================================================
  
  /**
   * Logger avec niveau de debug
   */
  function debugLog(message, data = null) {
    if (SIGNATURE_CONFIG.debugMode) {
      console.log(`🔐 [Signature] ${message}`, data || '');
    }
  }
  
  /**
   * Génération d'un ID de validation unique et sécurisé
   */
  function generateValidationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12);
    const sessionId = Math.random().toString(36).substr(2, 6);
    return `${SIGNATURE_CONFIG.validationIdPrefix}-${timestamp}-${random}-${sessionId}`.toUpperCase();
  }
  
  /**
   * Récupération de l'IP publique avec fallback
   */
  async function getUserIP() {
    try {
      debugLog('Récupération IP publique...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(SIGNATURE_CONFIG.ipServiceUrl, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      debugLog('IP récupérée:', data.ip);
      return data.ip;
    } catch (error) {
      debugLog('Erreur récupération IP:', error.message);
      return SIGNATURE_CONFIG.ipFallback;
    }
  }
  
  /**
   * Génération d'un hash de validation
   */
  async function generateValidationHash(data) {
    const dataString = JSON.stringify(data);
    
    // Si crypto.subtle est disponible, utiliser SHA-256
    if (SIGNATURE_CONFIG.hashAlgorithm === 'crypto' && window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      } catch (error) {
        debugLog('Erreur crypto.subtle, fallback vers hash simple:', error);
      }
    }
    
    // Hash simple (fallback)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }
  
  /**
   * Normalisation et comparaison de noms
   */
  function compareNames(name1, name2) {
    if (!name1 || !name2) return false;
    
    const normalize = (str) => str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim()
      .toLowerCase();
    
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    // Comparaison exacte
    if (normalized1 === normalized2) return true;
    
    // Comparaison par mots (ordre différent accepté)
    const words1 = normalized1.split(' ').sort().join(' ');
    const words2 = normalized2.split(' ').sort().join(' ');
    
    return words1 === words2;
  }
  
  /**
   * Validation d'email
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // =====================================================
  // 🎯 FONCTIONS PRINCIPALES DE SIGNATURE
  // =====================================================
  
  /**
   * Initialisation complète du système de signature
   */
  async function initializeDigitalSignature() {
    debugLog('Initialisation du système de signature électronique...');
    
    try {
      // 1. Générer l'ID de validation
      const validationId = generateValidationId();
      const timestampISO = new Date().toISOString();
      const timestampFormatted = new Date().toLocaleString('fr-FR');
      
      // 2. Remplir les champs cachés
      safeSetValue('validation_id', validationId);
      safeSetValue('validation_timestamp', timestampISO);
      safeSetValue('user_agent', navigator.userAgent);
      
      // 3. Afficher les informations de traçabilité
      safeSetText('trace-timestamp', timestampFormatted);
      safeSetText('trace-validation-id', validationId);
      safeSetText('trace-ip', 'Récupération...');
      
      // 4. Récupérer l'IP (asynchrone)
      const userIP = await getUserIP();
      safeSetValue('user_ip', userIP);
      safeSetText('trace-ip', userIP);
      
      // 5. Générer le hash de validation
      const hashData = {
        validationId: validationId,
        timestamp: timestampISO,
        userAgent: navigator.userAgent,
        ip: userIP,
        url: window.location.href
      };
      
      const validationHash = await generateValidationHash(hashData);
      safeSetValue('validation_hash', validationHash);
      
      // 6. Peupler le récapitulatif verrouillé
      populateLockedSummary();
      
      // 7. Attacher les écouteurs d'événements
      attachSignatureEventListeners();
      
      // 8. Animation de sécurité
      addSecurityAnimation();
      
      debugLog('Initialisation signature complétée:', {
        validationId: validationId,
        hash: validationHash,
        ip: userIP
      });
      
      return {
        success: true,
        validationId: validationId,
        hash: validationHash
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Peuplement du récapitulatif verrouillé
   */
  function populateLockedSummary() {
    debugLog('Peuplement du récapitulatif verrouillé...');
    
    // Entreprise
    const entrepriseName = safeGetValue('entreprise_name') || 'Non spécifié';
    safeSetText('locked-entreprise', entrepriseName);
    
    // Contact
    const contactName = safeGetValue('contact_name') || 'Non spécifié';
    safeSetText('locked-contact', contactName);
    
    // Format (depuis les variables globales)
    const format = window.selectedFormat || 'Non sélectionné';
    safeSetText('locked-format', format);
    
    // Mois
    let monthsText = '-';
    if (window.isAnnualOffer) {
      monthsText = 'Tous les mois (12 mois)';
    } else if (window.selectedMonths && window.selectedMonths.length > 0) {
      monthsText = window.selectedMonths.join(', ');
    }
    safeSetText('locked-months', monthsText);
    
    // Mode de paiement
    const paymentLabels = {
      'Virement': 'Virement bancaire',
      'Cheque_Remise': 'Chèque - Remise main propre',
      'Cheque_Poste': 'Chèque - Envoi postal',
      'Cheque_Caserne': 'Chèque - Dépôt caserne'
    };
    const paymentText = paymentLabels[window.selectedPayment] || window.selectedPayment || 'Non sélectionné';
    safeSetText('locked-payment', paymentText);
    
    // Prix total
    const total = calculateTotalPrice();
    safeSetText('locked-total', total + ' €');
    
    // Mettre à jour les champs du contrat
    safeSetText('agreement-contact-name', contactName);
    safeSetText('agreement-company-name', entrepriseName);
    safeSetText('agreement-total', total);
    
    debugLog('Récapitulatif peuplé:', {
      entreprise: entrepriseName,
      contact: contactName,
      format: format,
      total: total
    });
  }
  
  /**
   * Calcul du prix total
   */
  function calculateTotalPrice() {
    if (!window.selectedFormat || !window.formatPrice) {
      debugLog('Données de prix manquantes, utilisation de 0');
      return 0;
    }
    
    let total = 0;
    
    if (window.isAnnualOffer) {
      total = window.formatPrice; // Prix forfaitaire annuel
    } else {
      const nombreMois = window.selectedMonths?.length || 1;
      total = window.formatPrice * nombreMois;
    }
    
    debugLog('Prix calculé:', { 
      format: window.selectedFormat, 
      price: window.formatPrice, 
      months: window.selectedMonths?.length || 1, 
      total: total 
    });
    
    return total;
  }
  
  /**
   * Validation complète de la signature numérique
   */
  function validateDigitalSignature() {
    debugLog('Validation de la signature numérique...');
    
    const errors = [];
    
    // 1. Vérifier l'accord contractuel
    const agreement = safeGetChecked('contractual_agreement');
    if (!agreement) {
      errors.push('Vous devez accepter les conditions contractuelles');
    }
    
    // 2. Vérifier le nom de signature
    const signatureName = safeGetValue('signature_name')?.trim();
    if (!signatureName) {
      errors.push('Veuillez saisir votre nom complet');
    } else {
      // Vérifier la correspondance avec le contact
      const contactName = safeGetValue('contact_name')?.trim();
      if (contactName && !compareNames(contactName, signatureName)) {
        errors.push(`Le nom saisi "${signatureName}" ne correspond pas au contact principal "${contactName}"`);
      }
    }
    
    // 3. Vérifier le mot de passe
    const signaturePassword = safeGetValue('signature_password');
    if (!signaturePassword || signaturePassword.length < SIGNATURE_CONFIG.minPasswordLength) {
      errors.push(`Le mot de passe doit contenir au moins ${SIGNATURE_CONFIG.minPasswordLength} caractères`);
    }
    
    // 4. Vérifier les données techniques
    const validationId = safeGetValue('validation_id');
    if (!validationId) {
      errors.push('ID de validation manquant (erreur technique)');
    }
    
    const validationHash = safeGetValue('validation_hash');
    if (!validationHash) {
      errors.push('Hash de validation manquant (erreur technique)');
    }
    
    // 5. Afficher les erreurs ou valider
    if (errors.length > 0) {
      alert('⚠️ Erreur(s) de validation :\n\n' + errors.map(e => '• ' + e).join('\n'));
      debugLog('Validation échouée:', errors);
      return false;
    }
    
    debugLog('Validation réussie:', {
      agreement: agreement,
      signatureName: signatureName,
      validationId: validationId
    });
    
    return true;
  }
  
  // =====================================================
  // 🎨 VALIDATION EN TEMPS RÉEL
  // =====================================================
  
  /**
   * Validation en temps réel du nom
   */
  function validateSignatureNameRealTime(input) {
    if (!SIGNATURE_CONFIG.enableRealTimeValidation) return;
    
    const signatureName = input.value.trim();
    const contactName = safeGetValue('contact_name')?.trim();
    
    // Reset classes
    input.classList.remove('valid', 'invalid');
    
    if (!signatureName) {
      hideError('signature-name-error');
      return;
    }
    
    if (contactName && compareNames(contactName, signatureName)) {
      input.classList.add('valid');
      hideError('signature-name-error');
    } else {
      input.classList.add('invalid');
      if (contactName) {
        showError('signature-name-error', `Le nom doit correspondre à "${contactName}"`);
      }
    }
  }
  
  /**
   * Validation en temps réel du mot de passe
   */
  function validateSignaturePasswordRealTime(input) {
    if (!SIGNATURE_CONFIG.enableRealTimeValidation) return;
    
    const password = input.value;
    
    // Reset classes
    input.classList.remove('valid', 'invalid');
    
    if (password.length >= SIGNATURE_CONFIG.minPasswordLength) {
      input.classList.add('valid');
      hideError('password-error');
    } else if (password.length > 0) {
      input.classList.add('invalid');
      showError('password-error', `Minimum ${SIGNATURE_CONFIG.minPasswordLength} caractères requis`);
    } else {
      hideError('password-error');
    }
  }
  
  /**
   * Validation de l'accord contractuel
   */
  function validateContractualAgreementRealTime(checkbox) {
    if (checkbox.checked) {
      hideError('agreement-error');
    }
  }
  
  // =====================================================
  // 🔗 GESTIONNAIRES D'ÉVÉNEMENTS
  // =====================================================
  
  /**
   * Attacher tous les écouteurs d'événements de signature
   */
  function attachSignatureEventListeners() {
    debugLog('Attachement des écouteurs d\'événements...');
    
    // Validation en temps réel du nom
    const signatureNameInput = document.getElementById('signature_name');
    if (signatureNameInput) {
      signatureNameInput.addEventListener('input', function() {
        validateSignatureNameRealTime(this);
      });
      
      signatureNameInput.addEventListener('blur', function() {
        validateSignatureNameRealTime(this);
      });
    }
    
    // Validation en temps réel du mot de passe
    const signaturePasswordInput = document.getElementById('signature_password');
    if (signaturePasswordInput) {
      signaturePasswordInput.addEventListener('input', function() {
        validateSignaturePasswordRealTime(this);
      });
    }
    
    // Checkbox contractuel
    const contractualAgreement = document.getElementById('contractual_agreement');
    if (contractualAgreement) {
      contractualAgreement.addEventListener('change', function() {
        validateContractualAgreementRealTime(this);
      });
    }
    
    debugLog('Écouteurs d\'événements attachés');
  }
  
  // =====================================================
  // 🎭 ANIMATIONS ET EFFETS VISUELS
  // =====================================================
  
  /**
   * Animation de sécurité pour la section signature
   */
  function addSecurityAnimation() {
    const signatureSection = document.querySelector('.signature-validation-section');
    if (signatureSection) {
      signatureSection.classList.add('validated');
      setTimeout(() => {
        signatureSection.classList.remove('validated');
      }, 600);
    }
  }
  
  // =====================================================
  // 🛠️ FONCTIONS UTILITAIRES DOM
  // =====================================================
  
  function safeGetValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : null;
  }
  
  function safeSetValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || '';
    }
  }
  
  function safeGetChecked(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
  }
  
  function safeSetText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text || '';
    }
  }
  
  function showError(id, message) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }
  
  function hideError(id) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  }
  
  // =====================================================
  // 🔧 FONCTIONS DE DEBUG ET DIAGNOSTIQUE
  // =====================================================
  
  /**
   * Fonction de debug pour diagnostiquer l'état de la signature
   */
  function debugSignatureState() {
    const state = {
      currentStep: window.currentStep,
      validationId: safeGetValue('validation_id'),
      signatureName: safeGetValue('signature_name'),
      agreement: safeGetChecked('contractual_agreement'),
      elements: {
        agreement: !!document.getElementById('contractual_agreement'),
        name: !!document.getElementById('signature_name'),
        password: !!document.getElementById('signature_password'),
        validationId: !!document.getElementById('validation_id'),
        validationHash: !!document.getElementById('validation_hash')
      },
      formData: {
        entreprise: safeGetValue('entreprise_name'),
        contact: safeGetValue('contact_name'),
        selectedFormat: window.selectedFormat,
        selectedPayment: window.selectedPayment
      }
    };
    
    console.table(state);
    return state;
  }
  
  /**
   * Test de validation (sans soumission)
   */
  function testSignatureValidation() {
    console.log('🧪 Test de validation signature...');
    const result = validateDigitalSignature();
    console.log('Résultat:', result ? '✅ Valide' : '❌ Invalide');
    return result;
  }
  
  // =====================================================
  // 🌐 EXPOSITION DES FONCTIONS PUBLIQUES
  // =====================================================
  
  // Exposer les fonctions principales à l'objet window
  window.initializeDigitalSignature = initializeDigitalSignature;
  window.validateDigitalSignature = validateDigitalSignature;
  window.populateLockedSummary = populateLockedSummary;
  window.calculateTotalPrice = calculateTotalPrice;
  
  // Fonctions de debug (disponibles en global)
  window.debugSignatureState = debugSignatureState;
  window.testSignatureValidation = testSignatureValidation;
  
  // Configuration globale
  window.SIGNATURE_CONFIG = SIGNATURE_CONFIG;
  
  // =====================================================
  // 🚀 INITIALISATION AUTOMATIQUE
  // =====================================================
  
  // Initialisation automatique si on est déjà à l'étape 4
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      if (window.currentStep === 4) {
        debugLog('Auto-initialisation détectée pour étape 4');
        initializeDigitalSignature();
      }
    }, 100);
  });
  
  console.log('✅ Module signature électronique chargé avec succès');
  
})();

// =====================================================
// 📋 GUIDE D'UTILISATION
// =====================================================

/*

🔐 SIGNATURE-VALIDATION.JS - GUIDE D'UTILISATION

1. CHARGEMENT :
   <script src="../assets/js/signature-validation.js" defer></script>

2. INITIALISATION :
   await initializeDigitalSignature(); // Dans showStep(4)

3. VALIDATION :
   const isValid = validateDigitalSignature(); // Avant soumission

4. DEBUG :
   debugSignatureState(); // Voir l'état complet
   testSignatureValidation(); // Tester la validation

5. CONFIGURATION :
   window.SIGNATURE_CONFIG.debugMode = true; // Mode debug
   window.SIGNATURE_CONFIG.minPasswordLength = 8; // Longueur mot de passe

6. ÉVÉNEMENTS :
   Le script attache automatiquement les événements de validation temps réel

7. SÉCURITÉ :
   - Hash de validation avec crypto.subtle si disponible
   - Validation côté client + serveur recommandée
   - IP récupérée avec fallback

*/