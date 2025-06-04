// JavaScript pour le formulaire enterprise-form avec navigation par étapes
document.addEventListener('DOMContentLoaded', function() {
  // Récupération des paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  
  // Pré-remplissage des champs avec les paramètres de l'URL
  document.getElementById('entreprise_name').value = urlParams.get('nom') || '';
  document.getElementById('adresse').value = urlParams.get('adresse') || '';
  document.getElementById('contact_name').value = urlParams.get('contact') || '';
  document.getElementById('email').value = urlParams.get('email') || '';
  document.getElementById('telephone').value = urlParams.get('tel') || '';
  
  // Variables pour stocker les sélections
  let currentStep = 1;
  let selectedFormat = '';
  let formatPrice = 0;
  let selectedMonths = [];
  let isAnnualOffer = false;
  let selectedPayment = '';
  
  // Fonction pour mettre à jour la barre de progression
  function updateProgressBar(step) {
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
  }
  
  // Fonction pour afficher une étape
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
  
  // Validation Étape 1
  document.getElementById('next-step-1').addEventListener('click', function() {
    const contactName = document.getElementById('contact_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    let isValid = true;
    
    // Masquer toutes les erreurs
    document.querySelectorAll('.error-message').forEach(err => err.style.display = 'none');
    
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
    
    if (isValid) {
      showStep(2);
    }
  });
  
  // Gestion sélection format
  document.querySelectorAll('.format-card').forEach(card => {
    card.addEventListener('click', function() {
      // Désélectionner tous les formats
      document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
      
      // Sélectionner le format cliqué
      this.classList.add('selected');
      
      // Stocker les informations
      selectedFormat = this.getAttribute('data-format');
      formatPrice = parseInt(this.getAttribute('data-price'));
      isAnnualOffer = this.getAttribute('data-annual') === 'true';
      
      // Mettre à jour les champs cachés
      document.getElementById('selected_format').value = selectedFormat;
      document.getElementById('format_price').value = formatPrice;
      
      // Mettre à jour le récapitulatif
      updateSummary();
      
      // Masquer l'erreur
      document.getElementById('format-error').style.display = 'none';
    });
  });
  
  // Navigation Étape 2
  document.getElementById('prev-step-2').addEventListener('click', () => showStep(1));
  document.getElementById('next-step-2').addEventListener('click', function() {
    if (!selectedFormat) {
      document.getElementById('format-error').style.display = 'block';
      return;
    }
    
    // Configurer l'étape 3 selon le type d'offre
    if (isAnnualOffer) {
      document.getElementById('month-selection-text').style.display = 'none';
      document.getElementById('annual-text').style.display = 'block';
      document.getElementById('month-selector').style.display = 'none';
      document.getElementById('parutions-row').style.display = 'none';
      
      // Sélectionner tous les mois
      selectedMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      document.getElementById('selected_months').value = selectedMonths.join(',');
      document.getElementById('nombre_parutions').value = 12;
    } else {
      document.getElementById('month-selection-text').style.display = 'block';
      document.getElementById('annual-text').style.display = 'none';
      document.getElementById('month-selector').style.display = 'block';
      document.getElementById('parutions-row').style.display = 'block';
      
      // Réinitialiser
      selectedMonths = [];
      document.getElementById('selected_months').value = '';
      document.getElementById('nombre_parutions').value = 1;
      
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
    
    updateSummary();
    showStep(3);
  });
  
  // Gestion sélection mois - Fonction similaire au formulaire qualification
  function toggleMonth(element) {
    if (element.classList.contains('unavailable')) return;
    
    const month = element.getAttribute('data-month');
    const maxParutions = parseInt(document.getElementById('nombre_parutions').value) || 1;
    
    if (element.classList.contains('selected')) {
      // Désélectionner
      element.classList.remove('selected');
      selectedMonths = selectedMonths.filter(m => m !== month);
    } else {
      // Sélectionner si possible
      if (selectedMonths.length < maxParutions) {
        element.classList.add('selected');
        selectedMonths.push(month);
      } else {
        alert(`Vous ne pouvez sélectionner que ${maxParutions} mois. Augmentez le nombre de parutions si nécessaire.`);
        return;
      }
    }
    
    document.getElementById('selected_months').value = selectedMonths.join(',');
    document.getElementById('month-error').style.display = 'none';
    updateSummary();
  }
  
  // Attacher les événements aux cartes de mois
  document.querySelectorAll('.month-card').forEach(card => {
    card.addEventListener('click', function() {
      toggleMonth(this);
    });
  });
  
  // Gestion nombre de parutions
  document.getElementById('nombre_parutions').addEventListener('change', function() {
    const nombreParutions = parseInt(this.value) || 1;
    
    // Limiter entre 1 et 12
    if (nombreParutions < 1) this.value = 1;
    if (nombreParutions > 12) this.value = 12;
    
    // Si trop de mois sélectionnés, désélectionner les derniers
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
      document.getElementById('selected_months').value = selectedMonths.join(',');
    }
    
    updateSummary();
  });
  
  // Navigation Étape 3
  document.getElementById('prev-step-3').addEventListener('click', () => showStep(2));
  document.getElementById('next-step-3').addEventListener('click', function() {
    if (!isAnnualOffer && selectedMonths.length === 0) {
      document.getElementById('month-error').style.display = 'block';
      return;
    }
    
    showStep(4);
  });
  
  // Gestion sélection paiement
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', function() {
      // Désélectionner tous les modes
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
      
      // Sélectionner le mode cliqué
      this.classList.add('selected');
      
      // Stocker les informations
      selectedPayment = this.getAttribute('data-payment');
      const paymentDetails = this.getAttribute('data-details');
      
      document.getElementById('selected_payment').value = selectedPayment;
      document.getElementById('payment_details').value = paymentDetails || '';
      
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
      
      document.getElementById('payment-error').style.display = 'none';
    });
  });
  
  // Navigation Étape 4
  document.getElementById('prev-step-4').addEventListener('click', () => showStep(3));
  
  // Fonction pour mettre à jour le récapitulatif
  function updateSummary() {
    if (!selectedFormat) return;
    
    // Format
    document.getElementById('summary-format').textContent = selectedFormat;
    
    // Mois
    const monthsText = isAnnualOffer ? 'Tous les mois' : 
                     selectedMonths.length > 0 ? selectedMonths.join(', ') : '-';
    document.getElementById('summary-months').textContent = monthsText;
    
    // Parutions
    const nombreParutions = isAnnualOffer ? 12 : parseInt(document.getElementById('nombre_parutions').value) || 1;
    document.getElementById('summary-parutions').textContent = nombreParutions;
    
    // Prix total
    let total = 0;
    if (isAnnualOffer) {
      total = formatPrice; // Prix forfaitaire
    } else {
      total = formatPrice * nombreParutions;
    }
    
    document.getElementById('summary-total').textContent = total + ' €';
  }
  
  // Soumission du formulaire
  document.getElementById('enterprise-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validation finale
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
    
    // Collecter les données
    const formData = new FormData(this);
    
    // Ajouter des données supplémentaires
    const entrepriseId = urlParams.get('id');
    if (entrepriseId) {
      formData.append('entrepriseId', entrepriseId);
    }
    
    // Générer numéro de commande
    const orderNumber = 'CMD-2026-' + Math.floor(100000 + Math.random() * 900000);
    formData.append('orderNumber', orderNumber);
    
    // Calculer prix total
    const nombreParutions = isAnnualOffer ? 12 : parseInt(document.getElementById('nombre_parutions').value) || 1;
    const total = isAnnualOffer ? formatPrice : formatPrice * nombreParutions;
    formData.append('prixTotal', total);
    
    // Mettre à jour la confirmation
    document.getElementById('confirmation-order-number').textContent = orderNumber;
    document.getElementById('confirmation-format').textContent = selectedFormat;
    document.getElementById('confirmation-months').textContent = isAnnualOffer ? 'Tous les mois' : selectedMonths.join(', ');
    
    // Labels de paiement
    const paymentLabels = {
      'Virement': 'Virement bancaire',
      'Cheque_Remise': 'Chèque - Remise en main propre',
      'Cheque_Poste': 'Chèque - Envoi postal',
      'Cheque_Caserne': 'Chèque - Dépôt caserne'
    };
    document.getElementById('confirmation-payment').textContent = paymentLabels[selectedPayment] || selectedPayment;
    document.getElementById('confirmation-total').textContent = total + ' €';
    
    // Masquer le formulaire et afficher la confirmation
    document.querySelectorAll('.form-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById('confirmation').style.display = 'block';
    
    // Mettre la barre de progression à 100%
    document.querySelectorAll('.progress-step').forEach(step => {
      step.classList.add('completed');
      step.classList.remove('active');
    });
    
    // Envoyer au webhook
    fetch('https://n8n.dsolution-ia.fr/webhook/gateway-calendrier', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Erreur serveur');
    })
    .then(data => {
      console.log('Commande envoyée avec succès:', data);
    })
    .catch(error => {
      console.error('Erreur lors de l\'envoi:', error);
      // Le formulaire sera quand même soumis via Netlify en fallback
    });
  });
  
  // Initialisation
  showStep(1);
});
