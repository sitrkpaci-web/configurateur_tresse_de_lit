// ============================================================================
// MOTEUR DU CONFIGURATEUR — ce fichier n'a JAMAIS besoin d'être modifié pour
// changer une photo, ajouter une couleur ou ajouter une matière. Toutes les
// données (matières, couleurs, photos) vivent dans config/tissus.json.
// Voir LISEZ-MOI.txt pour le mode d'emploi.
// ============================================================================

const LIEN_PRODUIT_SUMUP = "https://aucoeurdesbebes.fr/product/tresse-sur-mesure";
const OMBRAGE_GLOBAL = { 3: "images/technique/ombrage-3-brins.png", 4: "images/technique/ombrage-4-brins.png" };

let CONFIG = null;
let brinsActuels = 3;

function chargerConfig() {
  const el = document.getElementById('config-tissus');
  CONFIG = JSON.parse(el.textContent);
}

function trouverMatiere(id) {
  return CONFIG.matieres.find(m => m.id === id);
}

function init() {
  chargerConfig();
  changerBrins(3, document.querySelector('.btn-option.active'));
}

function changerBrins(nombre, element) {
  brinsActuels = nombre;
  document.querySelectorAll('.grid-options .btn-option').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  const conteneur = document.getElementById('conteneur-brins');
  conteneur.innerHTML = '';
  for (let i=1;i<=nombre;i++) {
    const div = document.createElement('div'); div.className='brin-selector';
    div.innerHTML = `<div class="brin-header">Brin ${i}</div><div class="select-group"><select id="mat-${i}"><option value="">-- Matière --</option></select><select id="coul-${i}" disabled><option value="">-- Couleur / motif --</option></select></div><div class="swatch" id="swatch-${i}"></div>`;
    conteneur.appendChild(div);
    const mat = div.querySelector(`#mat-${i}`), coul = div.querySelector(`#coul-${i}`);
    CONFIG.matieres.forEach(m => mat.add(new Option(m.nom, m.id)));
    mat.addEventListener('change', () => {
      coul.innerHTML='<option value="">-- Couleur / motif --</option>'; coul.disabled=!mat.value;
      if(mat.value) trouverMatiere(mat.value).couleurs.forEach(c => coul.add(new Option(c.nom, c.nom)));
      mettreAJourVisuel(i);
    });
    coul.addEventListener('change', () => mettreAJourVisuel(i));
  }
  actualiserPreview();
}

function mettreAJourVisuel(i) {
  const matId = document.getElementById(`mat-${i}`).value;
  const coulNom = document.getElementById(`coul-${i}`).value;
  const swatch = document.getElementById(`swatch-${i}`);
  if (matId && coulNom) {
    const matiere = trouverMatiere(matId);
    const couleur = matiere.couleurs.find(c => c.nom === coulNom);
    swatch.style.backgroundImage = `url("${matiere.dossierPhotos}/${couleur.photo}")`;
    swatch.style.display = 'block';
  } else {
    swatch.style.backgroundImage = 'none';
    swatch.style.display = 'none';
  }
  actualiserPreview();
}

function actualiserPreview() {
  const stage = document.getElementById('braid-stage');
  const overlay = document.getElementById('braid-overlay');
  overlay.src = OMBRAGE_GLOBAL[brinsActuels];
  let any = false;
  const ids = brinsActuels === 4 ? ['preview-4-1','preview-4-2','preview-4-3','preview-4-4'] : ['preview-1','preview-2','preview-3'];

  // On efface tous les calques de brins (3 et 4) avant de redessiner ceux actifs.
  for (let i=1;i<=4;i++) {
    ['preview-'+i, 'preview-4-'+i].forEach(id => {
      const old = document.getElementById(id);
      if (old) { old.style.opacity='0'; old.style.display='none'; old.style.backgroundImage='none'; old.style.maskImage='none'; old.style.webkitMaskImage='none'; }
    });
  }

  ids.forEach((id, index) => {
    const box = document.getElementById(id); if (!box) return;
    const i = index+1;
    const matId = document.getElementById(`mat-${i}`)?.value;
    const coulNom = document.getElementById(`coul-${i}`)?.value;
    if (!(matId && coulNom)) return;
    const matiere = trouverMatiere(matId);
    const couleur = matiere.couleurs.find(c => c.nom === coulNom);
    const gabarit = (brinsActuels === 4 ? matiere.gabarit4 : matiere.gabarit3)[index];
    const photo = `${matiere.dossierPhotos}/${couleur.photo}`;

    box.style.display = 'block';
    box.style.opacity = '1';
    // Le gabarit (forme du brin découpée + ombrée) borne TOUJOURS le rendu à la
    // tresse, quelle que soit la matière : sans lui la couleur/texture déborde.
    box.style.maskImage = `url("${gabarit}")`;
    box.style.webkitMaskImage = `url("${gabarit}")`;
    box.style.backgroundColor = 'transparent';

    if (matiere.ombrage) {
      // Tissus unis/texturés : la photo réelle est combinée (multiply) avec
      // l'ombrage du brin pour un rendu de volume réaliste.
      box.style.backgroundImage = `url("${gabarit}"), url("${photo}")`;
      box.style.backgroundSize = '100% 100%, 220% auto';
      box.style.backgroundPosition = 'center, 10% 10%';
    } else {
      // Motifs imprimés (Fantaisies) : affichés tels quels, sans ombrage
      // superposé (qui ternirait/brouillerait le motif).
      box.style.backgroundImage = `url("${photo}")`;
      box.style.backgroundSize = '220% auto';
      box.style.backgroundPosition = '10% 10%';
    }
    any = true;
  });

  document.getElementById('placeholder').style.display = any ? 'none' : 'flex';
  document.getElementById('zone-visuel').classList.toggle('a-config', any);
  stage.style.display = any ? 'block' : 'none';
}

async function copierTexte(texte) {
  if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texte);
  const t=document.createElement('textarea'); t.value=texte; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
}

async function envoyerCommande() {
  const longueur=document.getElementById('select-longueur').value;
  if(!longueur) return alert('Veuillez sélectionner la longueur de la tresse.');
  const resume=[`Modèle: ${brinsActuels} brins`,`Longueur: ${longueur}`]; let complet=true;
  for(let i=1;i<=brinsActuels;i++) {
    const matId=document.getElementById(`mat-${i}`).value;
    const coul=document.getElementById(`coul-${i}`).value;
    if(matId && coul) resume.push(`Brin ${i}: ${trouverMatiere(matId).nom} (${coul})`);
    else complet=false;
  }
  if(!complet) return alert('Veuillez choisir la matière et la couleur pour chaque brin.');
  const texteConfig=resume.join(' | '); try{await copierTexte(texteConfig)}catch(e){}
  alert('Configuration copiée !\n\n'+texteConfig+'\n\nVous allez être redirigée vers la boutique. Pensez à coller ce résumé dans le champ Note/Message.');
  window.location.href=LIEN_PRODUIT_SUMUP;
}

document.addEventListener('DOMContentLoaded', init);
