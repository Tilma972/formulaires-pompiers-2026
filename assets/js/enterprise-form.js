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
      completion_time_seconds: Math.round((Date.now() - startTime) / 1000)
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