// CORRECTION enterprise-form.js - ENVOI JSON COMME PROSPECTEUR
// Remplacer la section de soumission du formulaire

document.getElementById('enterprise-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Validation finale (garder l'existant...)
  let isValid = true;
  
  if (!selectedPayment) {
    document.getElementById('payment-error').style.display = 'block';
    isValid = false;
  }
  
  const termsAccepted = document.getElementById('terms_accepted').checked;
  if (!termsAccepted) {
    document.getElementById('terms-error').style.display = 'block';
    isValid = false;
  }
  
  if (!isValid) return;
  
  // Désactiver le bouton de soumission
  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="loading"></span> Traitement en cours...';
  
  // ✅ CONSTRUCTION DU PAYLOAD JSON (comme prospecteur)
  const payload = {
    // ✅ IMPORTANT : form_name (PAS form-name)
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
    nombre_parutions: isAnnualOffer ? 12 : parseInt(document.getElementById('nombre_parutions').value) || 1,
    is_annual_offer: isAnnualOffer,
    
    // Paiement
    selected_payment: selectedPayment,
    payment_details: document.querySelector('.payment-card.selected')?.getAttribute('data-details') || '',
    rdv_preference: document.getElementById('rdv_preference')?.value || '',
    
    // Calculs
    prixTotal: total,
    
    // Métadonnées
    orderNumber: orderNumber,
    commentaires: document.getElementById('commentaires').value || '',
    terms_accepted: termsAccepted,
    
    // Depuis URL
    entrepriseId: urlParams.get('id') || null,
    
    // Tracking
    user_agent: navigator.userAgent,
    completion_time_seconds: Math.round((Date.now() - startTime) / 1000)
  };
  
  console.log('📤 Envoi payload JSON vers Gateway:', payload);
  
  // ✅ ENVOI JSON (COMME PROSPECTEUR)
  fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',  // ✅ JSON PUR
      'X-Form-Source': 'enterprise-form'
    },
    body: JSON.stringify(payload)  // ✅ JSON.stringify
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
    submitButton.disabled = false;
    submitButton.innerHTML = 'CONFIRMER MA COMMANDE';
    
    // Afficher l'erreur à l'utilisateur
    alert('Une erreur est survenue lors de l\'envoi du formulaire. Veuillez réessayer.');
  });
});

// ✅ FONCTION DE CONFIRMATION (garder l'existante)
function showConfirmation(formData, gatewayResponse) {
  // Mettre à jour la confirmation avec les données
  document.getElementById('confirmation-order-number').textContent = formData.orderNumber;
  document.getElementById('confirmation-format').textContent = formData.selected_format;
  document.getElementById('confirmation-months').textContent = formData.selected_months.replace(/,/g, ', ');
  
  const paymentLabels = {
    'Virement': 'Virement bancaire',
    'Cheque_Remise': 'Chèque - Remise en main propre',
    'Cheque_Poste': 'Chèque - Envoi postal',
    'Cheque_Caserne': 'Chèque - Dépôt caserne'
  };
  document.getElementById('confirmation-payment').textContent = paymentLabels[formData.selected_payment] || formData.selected_payment;
  document.getElementById('confirmation-total').textContent = formData.prixTotal + ' €';
  
  // Masquer le formulaire et afficher la confirmation
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById('confirmation').style.display = 'block';
  
  // Scroll vers la confirmation
  document.getElementById('confirmation').scrollIntoView({ behavior: 'smooth' });
  
  // Mettre la barre de progression à 100%
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.add('completed');
    step.classList.remove('active');
  });
}

// ✅ VARIABLE POUR TRACKING DU TEMPS (ajouter en haut du fichier)
let startTime = Date.now();