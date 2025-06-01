// JavaScript pour le formulaire enterprise-form
document.addEventListener('DOMContentLoaded', function() {
  // Récupération des paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  
  // Pré-remplissage des champs avec les paramètres de l'URL
  document.getElementById('entrepriseName').value = urlParams.get('nom') || '';
  document.getElementById('adresse').value = urlParams.get('adresse') || '';
  document.getElementById('contactName').value = urlParams.get('contact') || '';
  document.getElementById('email').value = urlParams.get('email') || '';
  document.getElementById('telephone').value = urlParams.get('tel') || '';
  
  // Gestion de la navigation entre les étapes
  const progressBar = document.getElementById('progressBar');
  
  // Variables pour stocker les sélections
  let selectedFormat = '';
  let formatPrice = 0;
  let selectedMonths = [];
  let isAnnualOffer = false;
  let selectedPayment = '';
  
  // Fonction pour mettre à jour la barre de progression
  function updateProgressBar(step) {
    const progress = (step - 1) * 33.33;
    progressBar.style.width = progress + '%';
  }
  
  // Fonction pour afficher une étape
  function showStep(step) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');
    updateProgressBar(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Validation Étape 1
  document.getElementById('nextToStep2').addEventListener('click', function() {
    const contactName = document.getElementById('contactName').value;
    const email = document.getElementById('email').value;
    const telephone = document.getElementById('telephone').value;
    let isValid = true;
    
    if (!contactName) {
      document.getElementById('contactNameError').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('contactNameError').style.display = 'none';
    }
    
    // Validation simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      document.getElementById('emailError').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('emailError').style.display = 'none';
    }
    
    // Validation simple du téléphone
    if (!telephone || telephone.length < 10) {
      document.getElementById('telephoneError').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('telephoneError').style.display = 'none';
    }
    
    if (isValid) {
      showStep(2);
    }
  });
  
  // Navigation Étape 2 vers Étape 1
  document.getElementById('prevToStep1').addEventListener('click', function() {
    showStep(1);
  });
  
  // Sélection du format
  document.querySelectorAll('.format-option').forEach(option => {
    option.addEventListener('click', function() {
      // Désélectionner tous les formats
      document.querySelectorAll('.format-option').forEach(o => o.classList.remove('selected'));
      
      // Sélectionner le format cliqué
      this.classList.add('selected');
      
      // Stocker les informations du format
      selectedFormat = this.getAttribute('data-format');
      formatPrice = parseInt(this.getAttribute('data-price'));
      isAnnualOffer = this.getAttribute('data-annual') === 'true';
      
      // Mettre à jour les champs cachés
      document.getElementById('selectedFormat').value = selectedFormat;
      document.getElementById('formatPrice').value = formatPrice;
      
      // Mettre à jour le récapitulatif
      document.getElementById('summaryFormat').textContent = selectedFormat;
      
      // Masquer le message d'erreur
      document.getElementById('formatError').style.display = 'none';
      
      // Mettre à jour le prix total
      updateTotalPrice();
    });
  });
  
  // Validation Étape 2
  document.getElementById('nextToStep3').addEventListener('click', function() {
    if (!selectedFormat) {
      document.getElementById('formatError').style.display = 'block';
      return;
    }
    
    // Configurer l'affichage de l'étape 3 selon le type d'offre
    if (isAnnualOffer) {
      document.getElementById('monthSelectionText').style.display = 'none';
      document.getElementById('annualText').style.display = 'block';
      document.getElementById('monthSelector').style.display = 'none';
      document.getElementById('nombreParutions').value = 12;
      document.getElementById('nombreParutions').disabled = true;
      document.querySelector('.multiple-months').style.display = 'none';
      
      // Sélectionner tous les mois pour l'offre annuelle
      selectedMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      document.getElementById('selectedMonths').value = selectedMonths.join(',');
      document.getElementById('summaryMonths').textContent = 'Tous les mois';
      document.getElementById('summaryParutions').textContent = '12';
    } else {
      document.getElementById('monthSelectionText').style.display = 'block';
      document.getElementById('annualText').style.display = 'none';
      document.getElementById('monthSelector').style.display = 'block';
      document.getElementById('nombreParutions').value = 1;
      document.getElementById('nombreParutions').disabled = false;
      document.querySelector('.multiple-months').style.display = 'block';
      
      // Réinitialiser la sélection des mois
      selectedMonths = [];
      document.getElementById('selectedMonths').value = '';
      document.getElementById('summaryMonths').textContent = '-';
      document.getElementById('summaryParutions').textContent = '1';
      
      // Désélectionner tous les mois
      document.querySelectorAll('.month-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.classList.remove('unavailable');
      });
      
      // Marquer certains mois comme indisponibles
      const unavailableMonths = ['Février', 'Juillet'];
      unavailableMonths.forEach(month => {
        const monthBtn = document.querySelector(`.month-btn[data-month="${month}"]`);
        if (monthBtn) {
          monthBtn.classList.add('unavailable');
        }
      });
    }
    
    showStep(3);
  });
  
  // Navigation Étape 3 vers Étape 2
  document.getElementById('prevToStep2').addEventListener('click', function() {
    showStep(2);
  });
  
  // Sélection des mois
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Ne rien faire si le mois est indisponible
      if (this.classList.contains('unavailable')) {
        return;
      }
      
      const month = this.getAttribute('data-month');
      const nombreParutions = parseInt(document.getElementById('nombreParutions').value);
      
      if (this.classList.contains('selected')) {
        // Désélectionner le mois
        this.classList.remove('selected');
        selectedMonths = selectedMonths.filter(m => m !== month);
      } else {
        // Vérifier si on a atteint le nombre max de mois
        if (selectedMonths.length < nombreParutions) {
          // Sélectionner le mois
          this.classList.add('selected');
          selectedMonths.push(month);
        } else {
          alert(`Vous ne pouvez sélectionner que ${nombreParutions} mois. Pour en sélectionner plus, augmentez le nombre de parutions.`);
        }
      }
      
      // Mettre à jour le champ caché et le récapitulatif
      document.getElementById('selectedMonths').value = selectedMonths.join(',');
      document.getElementById('summaryMonths').textContent = selectedMonths.length > 0 ? selectedMonths.join(', ') : '-';
      
      // Masquer le message d'erreur
      document.getElementById('monthError').style.display = 'none';
      
      // Mettre à jour le prix total
      updateTotalPrice();
    });
  });
  
  // Gestion du nombre de parutions
  document.getElementById('nombreParutions').addEventListener('change', function() {
    const nombreParutions = parseInt(this.value);
    
    // Limiter entre 1 et 12
    if (nombreParutions < 1) this.value = 1;
    if (nombreParutions > 12) this.value = 12;
    
    const actualNombreParutions = parseInt(this.value);
    document.getElementById('summaryParutions').textContent = actualNombreParutions;
    
    // Si le nombre de parutions a diminué et qu'il y a plus de mois sélectionnés
    if (selectedMonths.length > actualNombreParutions) {
      // Garder uniquement les premiers mois
      const excessMonths = selectedMonths.length - actualNombreParutions;
      for (let i = 0; i < excessMonths; i++) {
        const monthToRemove = selectedMonths.pop();
        const monthBtn = document.querySelector(`.month-btn[data-month="${monthToRemove}"]`);
        if (monthBtn) {
          monthBtn.classList.remove('selected');
        }
      }
      
      // Mettre à jour le champ caché et le récapitulatif
      document.getElementById('selectedMonths').value = selectedMonths.join(',');
      document.getElementById('summaryMonths').textContent = selectedMonths.length > 0 ? selectedMonths.join(', ') : '-';
    }
    
    // Mettre à jour le prix total
    updateTotalPrice();
  });
  
  // Validation Étape 3
  document.getElementById('nextToStep4').addEventListener('click', function() {
    if (!isAnnualOffer && selectedMonths.length === 0) {
      document.getElementById('monthError').style.display = 'block';
      return;
    }
    
    showStep(4);
  });
  
  // Navigation Étape 4 vers Étape 3
  document.getElementById('prevToStep3').addEventListener('click', function() {
    showStep(3);
  });
  
  // Sélection du mode de paiement
  document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function() {
      // Désélectionner tous les modes de paiement
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      
      // Sélectionner le mode de paiement cliqué
      this.classList.add('selected');
      
      // Stocker le mode de paiement
      selectedPayment = this.getAttribute('data-payment');
      const paymentDetails = this.getAttribute('data-details');
      
      document.getElementById('selectedPayment').value = selectedPayment;
      document.getElementById('paymentDetails').value = paymentDetails || '';
      
      // Masquer toutes les sections de détails
      document.querySelectorAll('.payment-details').forEach(detail => {
        detail.style.display = 'none';
      });
      
      // Afficher la section de détails correspondante
      if (paymentDetails) {
        const detailSection = document.getElementById(paymentDetails + '-details');
        if (detailSection) {
          detailSection.style.display = 'block';
        }
      }
      
      // Masquer le message d'erreur
      document.getElementById('paymentError').style.display = 'none';
    });
  });
  
  // Fonction pour mettre à jour le prix total
  function updateTotalPrice() {
    if (!formatPrice) return;
    
    let total = 0;
    
    if (isAnnualOffer) {
      // Prix forfaitaire pour l'offre annuelle
      total = formatPrice;
    } else {
      // Prix unitaire * nombre de parutions
      const nombreParutions = parseInt(document.getElementById('nombreParutions').value) || 1;
      total = formatPrice * nombreParutions;
    }
    
    document.getElementById('summaryTotal').textContent = total + ' €';
    document.getElementById('confirmationTotal').textContent = total + ' €';
  }
  
  // Soumission du formulaire
  document.getElementById('adForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validation finale
    let isValid = true;
    
    if (!selectedPayment) {
      document.getElementById('paymentError').style.display = 'block';
      isValid = false;
    }
    
    const termsAccepted = document.getElementById('termsAccepted').checked;
    if (!termsAccepted) {
      document.getElementById('termsError').style.display = 'block';
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Collecter toutes les données du formulaire
    const formData = new FormData(this);
    
    // Ajouter l'ID entreprise depuis l'URL
    const entrepriseId = urlParams.get('id');
    if (entrepriseId) {
      formData.append('entrepriseId', entrepriseId);
    }
    
    // Ajouter une référence unique pour la commande
    const orderNumber = 'CMD-2026-' + Math.floor(100000 + Math.random() * 900000);
    formData.append('orderNumber', orderNumber);
    document.getElementById('confirmationOrderNumber').textContent = orderNumber;
    
    // Mettre à jour les informations de confirmation
    const paymentLabels = {
      'Virement': 'Virement bancaire',
      'Cheque_Remise': 'Chèque - Remise en main propre',
      'Cheque_Poste': 'Chèque - Envoi postal', 
      'Cheque_Caserne': 'Chèque - Dépôt caserne'
    };
    
    document.getElementById('confirmationFormat').textContent = selectedFormat;
    document.getElementById('confirmationMonths').textContent = isAnnualOffer ? 'Tous les mois' : selectedMonths.join(', ');
    document.getElementById('confirmationPayment').textContent = paymentLabels[selectedPayment] || selectedPayment;
    
    // Afficher l'étape de confirmation
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('confirmation').classList.add('active');
    document.querySelector('.confirmation-banner').style.display = 'block';
    progressBar.style.width = '100%';
    
    // Envoi des données au serveur via fetch
    fetch('https://n8n.dsolution-ia.fr/webhook/entreprise-commande', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du formulaire');
      }
      return response.json();
    })
    .then(data => {
      console.log('Réponse du serveur:', data);
    })
    .catch(error => {
      console.error('Erreur:', error);
      // En cas d'erreur, le formulaire sera quand même soumis via Netlify
    });
  });
  
  // Initialiser l'interface
  updateProgressBar(1);
});