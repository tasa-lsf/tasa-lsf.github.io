// ==========================================================================
// TASA-LSF — fiche d'un terme
// Charge data/termes.json + data/glossaire.json, retrouve le terme via ?t=slug,
// et construit la fiche fidèlement au prototype (définition simplifiée + attestée,
// source, contresens, exemple, réseau, parcours, vidéo LSF, images FALC).
// Infobulles de glossaire et agrandissement des images repris du prototype.
// ==========================================================================

(function () {
  var GLOSSAIRE = [];
  var declencheurAgrandir = null;

  function echap(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function slugDemande() {
    var p = new URLSearchParams(window.location.search);
    return p.get('t') || '';
  }
  function echapRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Enrobe le premier occurrence de chaque mot du glossaire par un bouton-infobulle.
  // Repris du prototype : recherche insensible à la casse, sur mot entier, hors balise.
  function glossifier(texte) {
    if (!texte) return '';
    var out = echap(texte);
    for (var i = 0; i < GLOSSAIRE.length; i++) {
      var g = GLOSSAIRE[i];
      var mot = echap(g.mot);
      var re;
      try {
        re = new RegExp('(?<![\\p{L}\\p{N}])' + echapRegex(mot) + '(?![\\p{L}\\p{N}])(?![^<]*>)', 'iu');
      } catch (e) {
        re = new RegExp('\\b' + echapRegex(mot) + '\\b(?![^<]*>)', 'i');
      }
      out = out.replace(re, function (m) {
        var img = g.image ? ' data-image="' + echap(g.image) + '"' : '';
        return "<button type='button' class='gloss' onclick='montrerBulle(this)' data-explication=\""
          + echap(g.explication) + "\"" + img + ">" + m + "</button>";
      });
    }
    return out;
  }

  function trouver(termes, slug) {
    for (var i = 0; i < termes.length; i++) { if (termes[i].slug === slug) return termes[i]; }
    return null;
  }

  function rendre(t) {
    var h = '';

    // ---- Haut de la fiche : flèches, nom, catégorie grammaticale, domaine, illustration ----
    h += '<div class="fiche-titre">';
    h += '<div class="fiche-titre-g">';
    h += '<div class="fiche-fleches">';
    h += '<button class="btn-retour" type="button" onclick="retourFiche()" aria-label="Page précédente"></button>';
    h += '<button class="btn-accueil" type="button" onclick="location.href=\'index.html\'" aria-label="Retour à l\'accueil"></button>';
    h += '</div>';
    h += '<div class="terme-nom"><span class="nom">' + echap(t.forme) + '</span>';
    if (t.grammaire && t.grammaire.libelle) { h += ' <span class="gram">' + echap(t.grammaire.libelle) + '</span>'; }
    if (t.marque_usage) { h += ' <span class="marque">' + echap(t.marque_usage) + '</span>'; }
    h += '</div>';
    if (t.domaine) { h += '<span class="dom">' + echap(t.domaine) + '</span>'; }
    h += '</div>';
    if (t.image) {
      h += '<img class="terme-illu" src="' + echap(t.image) + '" data-src="' + echap(t.image)
        + '" onclick="agrandirImage(this)" alt="" title="Cliquer pour agrandir">';
    }
    h += '</div>';

    // ---- Corps : deux colonnes ----
    h += '<div class="fiche">';

    // Colonne gauche (bleu) : vidéo LSF puis FALC
    h += '<div class="fiche-g">';
    h += '<div class="bloc-video">';
    if (t.lsf && t.lsf.src) {
      var src = t.lsf.src;
      if (src.slice(-4).toLowerCase() === '.mp4') {
        h += '<video class="lsf-video" controls preload="metadata" src="' + echap(src) + '"></video>';
      } else {
        h += '<a class="lsf-lien" href="' + echap(src) + '" target="_blank" rel="noopener">Voir la vidéo en langue des signes française</a>';
      }
    } else {
      h += '<div class="lsf-vide">Vidéo en langue des signes française à venir</div>';
    }
    h += '</div>';

    if (t.falc && t.falc.length > 0) {
      h += '<div class="bloc-falc"><div class="lbl">FALC</div><div class="imgs">';
      t.falc.forEach(function (f) {
        var legende = echap(f.texte).replace(/\n/g, '<br>');
        h += '<div class="falc-item">';
        h += '<p class="falc-txt">' + legende + '</p>';
        h += '<img class="falc-img" src="' + echap(f.src) + '" data-src="' + echap(f.src)
          + '" onclick="agrandirImage(this)" alt="" title="Cliquer pour agrandir">';
        h += '</div>';
      });
      h += '</div></div>';
    }
    h += '</div>';

    // Colonne droite : définition, exemple, réseau, parcours
    h += '<div class="fiche-d">';

    // Définition : texte simplifié (sans infobulles) + texte attesté (avec infobulles) + source + contresens
    h += '<div class="champ">';
    h += '<h3>Texte simplifié</h3>';
    h += '<p class="txt txt-simple">' + echap(t.def_simple) + '</p>';
    if (t.def_attestee) {
      h += '<h3>Texte attesté</h3>';
      h += '<p class="txt">' + glossifier(t.def_attestee) + '</p>';
    }
    if (t.def_source) {
      h += '<span class="source">Source : ' + echap(t.def_source) + '</span>';
    }
    if (t.contresens) {
      h += '<div class="contresens"><b>&#9888; Attention, contresens possible :</b> ' + echap(t.contresens) + '</div>';
    }
    h += '</div>';

    // Exemple d'usage
    if (t.exemple) {
      h += '<div class="champ">';
      h += '<h2>Exemple d\'usage</h2>';
      h += '<p class="usage" data-source="' + echap(t.exemple_source || '') + '">&laquo; ' + echap(t.exemple) + ' &raquo;</p>';
      h += '</div>';
    }

    // Réseau terminologique
    if (t.reseau && t.reseau.length > 0) {
      h += '<div class="champ">';
      h += '<h2>Réseau terminologique</h2>';
      h += '<div class="reseau">';
      t.reseau.forEach(function (v) {
        var type = v.relation;
        if (type === 'generique') { type = 'générique'; }
        else if (type === 'specifique') { type = 'spécifique'; }
        var attr = v.slug ? ' onclick="location.href=\'fiche.html?t=' + encodeURIComponent(v.slug) + '\'"' : ' disabled';
        h += '<button type="button" class="chip"' + attr + '>' + echap(v.forme) + ' <small>&middot; ' + echap(type) + '</small></button>';
      });
      h += '</div>';
      h += '</div>';
    }

    // Parcours de soins
    if (t.parcours && t.parcours.length > 0) {
      h += '<div class="champ">';
      h += '<h2>Parcours de soins</h2>';
      h += '<div class="parcours">';
      t.parcours.forEach(function (e) {
        h += '<div class="etape">';
        h += '<span class="img">' + echap(e.ordre) + '</span>';
        h += '<div class="txt"><b>' + echap(e.label) + '</b>';
        if (e.description) { h += '<span>' + glossifier(e.description) + '</span>'; }
        h += '</div>';
        h += '</div>';
      });
      h += '</div>';
      h += '</div>';
    }

    h += '</div>';   // fiche-d
    h += '</div>';   // fiche

    document.getElementById('ficheContenu').innerHTML = h;
    document.title = 'TASA-LSF, ' + t.forme;
  }

  // ---- Infobulle d'un mot de glossaire ----
  window.montrerBulle = function (element) {
    var bulle = document.getElementById('bulle');
    var image = element.getAttribute('data-image');
    var contenu = image ? "<img src='" + image + "' alt=''>" : '';
    contenu += echap(element.getAttribute('data-explication'));
    bulle.innerHTML = contenu;
    bulle.style.display = 'block';
    var r = element.getBoundingClientRect();
    bulle.style.top = (window.scrollY + r.bottom + 6) + 'px';
    bulle.style.left = (window.scrollX + r.left) + 'px';
  };
  function fermerBulle() { var b = document.getElementById('bulle'); if (b) b.style.display = 'none'; }
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.gloss') && !ev.target.closest('#bulle')) fermerBulle();
  });

  // ---- Agrandissement d'une image ----
  window.agrandirImage = function (bouton) {
    declencheurAgrandir = bouton;
    var src = bouton.getAttribute('data-src');
    document.getElementById('agrandir-contenu').innerHTML = "<img src='" + src + "' alt=''>";
    document.getElementById('agrandir-overlay').removeAttribute('hidden');
  };
  window.fermerAgrandir = function () {
    document.getElementById('agrandir-overlay').setAttribute('hidden', '');
    document.getElementById('agrandir-contenu').innerHTML = '';
    if (declencheurAgrandir) { declencheurAgrandir.focus(); declencheurAgrandir = null; }
  };
  document.getElementById('agrandir-overlay').addEventListener('click', function (ev) {
    if (ev.target === this) fermerAgrandir();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { fermerAgrandir(); fermerBulle(); }
  });

  // Bouton « page précédente » : revient d'où l'on vient (sinon l'entrée par le corps).
  window.retourFiche = function () {
    if (document.referrer && history.length > 1) { history.back(); }
    else { window.location.href = 'corps.html'; }
  };

  // ---- Chargement des données ----
  Promise.all([
    fetch('data/termes.json').then(function (r) { return r.json(); }),
    fetch('data/glossaire.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    var termes = res[0]; GLOSSAIRE = res[1] || [];
    var t = trouver(termes, slugDemande());
    if (!t) {
      document.getElementById('ficheContenu').innerHTML =
        '<div class="titre-ligne"><button class="btn-retour" type="button" onclick="location.href=\'corps.html\'" aria-label="Retour"></button>'
        + '<h1 class="view-title">Terme introuvable</h1></div>';
      return;
    }
    rendre(t);
  }).catch(function (e) {
    console.error('Chargement des données impossible :', e);
  });
})();
