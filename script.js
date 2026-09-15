// ==========================================================================
// TASA-LSF — panneau d'accessibilité
// Réglages appliqués sur <html> par des attributs (data-mode, data-taille,
// data-police) et deux variables CSS (--interligne, --lettres).
// Le choix du visiteur est mémorisé dans le navigateur (localStorage).
// ==========================================================================

var R = document.documentElement;
var S = R.style;
var inter = 1.6;
var lettres = 0;

// Enregistre une préférence (sans planter si le stockage est indisponible)
function garder(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch (e) {}
}

// Met le bouton choisi en "actif" et retire l'état des autres
function actif(ids, idActif) {
  for (var i = 0; i < ids.length; i++) {
    var b = document.getElementById(ids[i]);
    if (b) { b.classList.remove('actif'); }
  }
  var a = document.getElementById(idActif);
  if (a) { a.classList.add('actif'); }
}

function setMode(v) {
  R.setAttribute('data-mode', v);
  garder('tasa-mode', v);
  actif(['mClair', 'mSombre', 'mNb'], v === 'dark' ? 'mSombre' : v === 'nb' ? 'mNb' : 'mClair');
}

function setTaille(v) {
  R.setAttribute('data-taille', v);
  garder('tasa-taille', v);
  actif(['tPetit', 'tNormal', 'tGrand'], v === 'petit' ? 'tPetit' : v === 'grand' ? 'tGrand' : 'tNormal');
}

function setPolice(v) {
  R.setAttribute('data-police', v);
  garder('tasa-police', v);
  actif(['pStd', 'pDys'], v === 'dys' ? 'pDys' : 'pStd');
}

// Interligne et espacement des lettres : boutons − / +
function pas(quoi, d) {
  if (quoi === 'interligne') {
    inter = Math.min(2.4, Math.max(1.4, Math.round((inter + d * 0.2) * 10) / 10));
    S.setProperty('--interligne', inter);
    document.getElementById('vInter').textContent = inter.toFixed(1);
    garder('tasa-inter', inter);
  } else {
    lettres = Math.min(0.24, Math.max(0, Math.round((lettres + d * 0.06) * 100) / 100));
    S.setProperty('--lettres', lettres + 'em');
    document.getElementById('vLettres').textContent = lettres.toFixed(2);
    garder('tasa-lettres', lettres);
  }
}

function reinitialiser() {
  R.removeAttribute('data-mode');
  R.removeAttribute('data-taille');
  R.removeAttribute('data-police');
  inter = 1.6; lettres = 0;
  S.setProperty('--interligne', 1.6);
  S.setProperty('--lettres', '0em');
  document.getElementById('vInter').textContent = '1.6';
  document.getElementById('vLettres').textContent = '0';
  try {
    localStorage.removeItem('tasa-mode');
    localStorage.removeItem('tasa-taille');
    localStorage.removeItem('tasa-police');
    localStorage.removeItem('tasa-inter');
    localStorage.removeItem('tasa-lettres');
  } catch (e) {}
  setMode('clair'); setTaille('normal'); setPolice('standard');
}

// Ouvre / ferme le panneau
function basculerPanneau() {
  var p = document.getElementById('accPanneau');
  var f = document.getElementById('accFab');
  var ouvert = p.classList.toggle('ouvert');
  f.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
}

// Fermer le panneau avec la touche Échap
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var p = document.getElementById('accPanneau');
    if (p.classList.contains('ouvert')) { basculerPanneau(); }
  }
});

// Au chargement : on restaure les préférences mémorisées
(function restaurer() {
  try {
    var m = localStorage.getItem('tasa-mode');   if (m) { setMode(m); }
    var t = localStorage.getItem('tasa-taille');  if (t) { setTaille(t); }
    var p = localStorage.getItem('tasa-police');  if (p) { setPolice(p); }
    var li = localStorage.getItem('tasa-inter');
    if (li) { inter = parseFloat(li); S.setProperty('--interligne', inter); document.getElementById('vInter').textContent = inter.toFixed(1); }
    var le = localStorage.getItem('tasa-lettres');
    if (le) { lettres = parseFloat(le); S.setProperty('--lettres', lettres + 'em'); document.getElementById('vLettres').textContent = lettres.toFixed(2); }
  } catch (e) {}
})();
