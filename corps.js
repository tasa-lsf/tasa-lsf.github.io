// ==========================================================================
// TASA-LSF — entrée par le corps
// Charge data/corps.json, pose les ronds numérotés (positions en %),
// construit la liste des zones, gère le survol croisé et l'ouverture des tuiles.
// ==========================================================================

(function () {
  var corpsData = null;

  fetch('data/corps.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { corpsData = data; rendre(data); })
    .catch(function (e) { console.error('Chargement de corps.json impossible :', e); });

  function echap(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function zonePar(id) {
    for (var i = 0; i < corpsData.zones.length; i++) { if (corpsData.zones[i].id === id) return corpsData.zones[i]; }
    return null;
  }

  // Survol / focus : allume les ronds partageant l'id ET la ligne de la liste (dans les deux sens)
  function surligner(id, on) {
    var dots = document.querySelectorAll('.dot[data-partie="' + id + '"]');
    for (var i = 0; i < dots.length; i++) { dots[i].classList.toggle('actif', on); }
    var rows = document.querySelectorAll('.zi[data-partie="' + id + '"]');
    for (var j = 0; j < rows.length; j++) { rows[j].classList.toggle('survol', on); }
  }

  function branche(el, id) {
    el.addEventListener('click', function () { ouvrirZone(id); });
    el.addEventListener('mouseenter', function () { surligner(id, true); });
    el.addEventListener('mouseleave', function () { surligner(id, false); });
    el.addEventListener('focus', function () { surligner(id, true); });
    el.addEventListener('blur', function () { surligner(id, false); });
  }

  function rendre(data) {
    // Ronds numérotés sur l'image du corps
    var inner = document.getElementById('bodyInner');
    data.points.forEach(function (pt) {
      var zone = zonePar(pt.idPartie);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dot';
      b.dataset.partie = pt.idPartie;
      b.style.left = pt.left + '%';
      b.style.top = pt.top + '%';
      b.textContent = pt.idPartie;
      b.setAttribute('aria-label', zone ? zone.label : ('Zone ' + pt.idPartie));
      branche(b, pt.idPartie);
      inner.appendChild(b);
    });

    // Liste des zones (numéro, nom, badge H/F, nombre de termes, chevron)
    var liste = document.getElementById('listeZones');
    data.zones.forEach(function (z) {
      var badge = z.sexe === 'F' ? '<span class="badge">Femme</span>'
                : z.sexe === 'H' ? '<span class="badge">Homme</span>' : '';
      var n = z.termes.length;
      var mot = n > 1 ? ' termes' : ' terme';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zi';
      b.dataset.partie = z.id;
      b.innerHTML =
        '<span class="num">' + z.id + '</span>' +
        '<span class="nom">' +
          '<span class="lbl">' + echap(z.label) + '</span>' + badge +
          '<span class="count">' + n + mot + '</span>' +
          '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>' +
        '</span>';
      branche(b, z.id);
      liste.appendChild(b);
    });
  }

  function ouvrirZone(id) {
    var z = zonePar(id);
    if (!z) return;
    document.getElementById('corpsLayout').hidden = true;
    var sec = document.getElementById('zoneTuiles');
    sec.hidden = false;
    document.getElementById('zoneTitre').textContent = z.label;
    var grille = document.getElementById('grilleTermes');
    grille.innerHTML = '';
    z.termes.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.slug = t.slug;
      b.innerHTML = '<span class="box"><img src="' + t.image + '" alt=""></span>' +
                    '<span class="nom">' + echap(t.forme) + '</span>';
      b.addEventListener('click', function () { ouvrirFiche(t.slug); });
      grille.appendChild(b);
    });
    window.scrollTo(0, 0);
    var retour = document.querySelector('#zoneTuiles .btn-retour');
    if (retour) retour.focus();
  }

  window.retourCorps = function () {
    document.getElementById('zoneTuiles').hidden = true;
    document.getElementById('corpsLayout').hidden = false;
    window.scrollTo(0, 0);
  };

  function ouvrirFiche(slug) {
    window.location.href = 'fiche.html?t=' + encodeURIComponent(slug);
  }
})();
