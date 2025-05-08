// js/prefillForm.js
function getUrlParams() {
  const params = {};
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  
  // Récupération des paramètres avec valeurs par défaut
  params.id = urlParams.get('id') || '';
  params.format = urlParams.get('format') || '6X4';
  params.mois = urlParams.get('mois') || 'Janvier';
  params.nom = urlParams.get('nom') || '';
  params.interlocuteur = urlParams.get('interlocuteur') || '';
  params.email = urlParams.get('email') || '';
  params.telephone = urlParams.get('telephone') || '';
  params.commune = urlParams.get('commune') || ''; // Ajouté ici
  
  console.log('Paramètres extraits de l\'URL :', params);
  return params;
}

// Fonction pour gérer le décodage des paramètres URL en toute sécurité
function safeDecodeURIComponent(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch (e) {
    console.error('Erreur de décodage URL:', e);
    return value; // Retourne la valeur non décodée en cas d'erreur
  }
}

function prefillForm() {
  try {
    console.log('Début de la fonction prefillForm');
    const params = getUrlParams();
    
    // Fonction utilitaire pour remplir un champ avec traçage
    function fillField(id, value, decode = false) {
      const field = document.getElementById(id);
      if (field) {
        const finalValue = decode ? safeDecodeURIComponent(value) : value;
        field.value = finalValue;
        console.log(`Champ ${id} rempli avec:`, finalValue);
        return true;
      } else {
        console.warn(`Champ ${id} introuvable dans le DOM`);
        return false;
      }
    }
    
    // Remplir les champs cachés et basiques
    fillField('entrepriseId', params.id);
    fillField('nom_entreprise', params.nom, true);
    fillField('interlocuteur', params.interlocuteur, true);
    fillField('email', params.email, true);
    fillField('telephone', params.telephone, true);
    
    // Ajouter ceci pour gérer le champ commune
    const communeSelect = document.getElementById('commune_entreprise');
    if (communeSelect && params.commune) {
      const communeValue = safeDecodeURIComponent(params.commune);
      console.log('Tentative de sélection de la commune:', communeValue);
      
      // Chercher une option qui correspond exactement ou partiellement
      let found = false;
      Array.from(communeSelect.options).forEach(option => {
        if (option.value.toUpperCase() === communeValue.toUpperCase() || 
            option.value.toUpperCase().includes(communeValue.toUpperCase()) || 
            communeValue.toUpperCase().includes(option.value.toUpperCase())) {
          option.selected = true;
          found = true;
          console.log('Commune sélectionnée:', option.value);
        }
      });
      
      if (!found) {
        console.warn(`Commune "${communeValue}" non trouvée dans les options disponibles`);
      }
    } else {
      console.log('Champ commune_entreprise non trouvé ou paramètre commune non fourni');
    }
    
    // Méthode alternative pour récupérer les éléments format et mois
    // Essayer d'abord avec les id spécifiques s'ils existent
    let formatDisplayFound = false;
    let moisDisplayFound = false;
    
    const formatDisplayById = document.getElementById('format-precedent');
    if (formatDisplayById) {
      formatDisplayById.innerText = params.format;
      console.log('format_precedent (par ID) rempli avec:', params.format);
      formatDisplayFound = true;
    }
    
    const moisDisplayById = document.getElementById('mois-precedent');
    if (moisDisplayById) {
      moisDisplayById.innerText = params.mois;
      console.log('mois_precedent (par ID) rempli avec:', params.mois);
      moisDisplayFound = true;
    }
    
    // Si on n'a pas trouvé par ID, essayer avec les sélecteurs CSS
    if (!formatDisplayFound) {
      // Essayer plusieurs stratégies de sélection
      let formatDisplay = document.querySelector('p strong:nth-child(1)');
      if (!formatDisplay) {
        formatDisplay = document.querySelector('.previous-choice strong:first-child');
      }
      if (formatDisplay) {
        formatDisplay.innerText = params.format;
        console.log('format_precedent (par sélecteur) rempli avec:', params.format);
      } else {
        console.warn('Élément format_precedent introuvable avec aucune méthode');
      }
    }
    
    if (!moisDisplayFound) {
      // Essayer plusieurs stratégies de sélection
      let moisDisplay = document.querySelector('p strong:nth-child(2)');
      if (!moisDisplay) {
        moisDisplay = document.querySelector('.previous-choice strong:last-child');
      }
      if (moisDisplay) {
        moisDisplay.innerText = params.mois;
        console.log('mois_precedent (par sélecteur) rempli avec:', params.mois);
      } else {
        console.warn('Élément mois_precedent introuvable avec aucune méthode');
      }
    }
    
    // Ajouter un petit délai avant de sélectionner format et mois
    // pour s'assurer que le DOM est complètement rendu
    setTimeout(() => {
      // Pré-sélectionner format et mois
      console.log('Appel de selectFormat et selectMonth après délai');
      if (params.format) selectFormat(params.format);
      if (params.mois) selectMonth(params.mois);
    }, 100);
    
  } catch (error) {
    console.error('Erreur lors du pré-remplissage du formulaire:', error);
  }
}

function selectFormat(format) {
  try {
    if (!format) {
      console.error('Format non défini');
      return;
    }
    
    const normalizedFormat = format.trim().toUpperCase();
    console.log('Sélection du format:', normalizedFormat);
    
    const priceOptions = document.querySelectorAll('.price-option');
    console.log('Nombre d\'options de format trouvées:', priceOptions.length);
    
    if (priceOptions.length === 0) {
      console.warn('Aucune option de format trouvée dans le DOM. Les sélecteurs CSS pourraient ne pas correspondre.');
    }
    
    priceOptions.forEach(option => {
      if (option && option.classList) {
        option.classList.remove('selected');
      } else {
        console.error('Option de format invalide:', option);
      }
    });
    
    const formatOption = document.querySelector(`.price-option[data-format="${normalizedFormat}"]`);
    if (formatOption) {
      formatOption.classList.add('selected');
      const formatEncartField = document.getElementById('format_encart');
      if (formatEncartField) {
        formatEncartField.value = normalizedFormat;
        console.log('Champ format_encart rempli avec:', normalizedFormat);
      } else {
        console.warn('Champ format_encart introuvable');
      }
      const formatError = document.getElementById('format-error');
      if (formatError) {
        formatError.style.display = 'none';
      }
    } else {
      console.error(`Format ${normalizedFormat} introuvable dans les options`);
    }
  } catch (error) {
    console.error('Erreur dans selectFormat:', error);
  }
}

function selectMonth(month) {
  try {
    if (!month) {
      console.error('Mois non défini');
      return;
    }
    
    const normalizedMonth = month.trim().charAt(0).toUpperCase() + month.trim().slice(1).toLowerCase();
    console.log('Sélection du mois:', normalizedMonth);
    
    const monthButtons = document.querySelectorAll('.month-btn');
    console.log('Nombre de boutons de mois trouvés:', monthButtons.length);
    
    if (monthButtons.length === 0) {
      console.warn('Aucun bouton de mois trouvé dans le DOM. Les sélecteurs CSS pourraient ne pas correspondre.');
    }
    
    monthButtons.forEach(btn => {
      if (btn && btn.classList) {
        btn.classList.remove('selected');
      } else {
        console.error('Bouton de mois invalide:', btn);
      }
    });
    
    const monthBtn = document.querySelector(`.month-btn[data-month="${normalizedMonth}"]`);
    if (monthBtn) {
      monthBtn.classList.add('selected');
      const moisParutionField = document.getElementById('mois_parution');
      if (moisParutionField) {
        moisParutionField.value = normalizedMonth;
        console.log('Champ mois_parution rempli avec:', normalizedMonth);
      } else {
        console.warn('Champ mois_parution introuvable');
      }
      const monthError = document.getElementById('month-error');
      if (monthError) {
        monthError.style.display = 'none';
      }
    } else {
      console.error(`Mois ${normalizedMonth} introuvable dans les options`);
    }
  } catch (error) {
    console.error('Erreur dans selectMonth:', error);
  }
}

// Exécuter le pré-remplissage dès que possible
console.log('Script de pré-remplissage chargé');

// Première exécution immédiate
prefillForm();

// Deuxième exécution après DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM chargé, lancement de prefillForm');
  prefillForm();
});

// Tentatives supplémentaires après délais
setTimeout(() => {
  console.log('Réessai de pré-remplissage après 500ms');
  prefillForm();
}, 500);

setTimeout(() => {
  console.log('Réessai de pré-remplissage après 1.5 secondes');
  prefillForm();
}, 1500);
