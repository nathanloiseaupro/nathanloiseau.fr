/* Données de travail de l'agence. Tout est généré de façon déterministe
   à partir d'une graine : les mêmes interventions à chaque chargement. */
(function () {
  'use strict';

  // Lundi 9 novembre 2026, 10 h 40 : l'heure de référence de l'agence.
  const MAINTENANT = new Date(2026, 10, 9, 10, 40);

  const UTILISATRICE = { nom: 'Lucie Marchand', role: 'Planification', initiales: 'LM' };

  const TECHNICIENS = [
    { id: 'kb', nom: 'Karim Benali', initiales: 'KB', metier: 'Chauffage', tel: '06 39 98 41 12' },
    { id: 'jm', nom: 'Julien Morel', initiales: 'JM', metier: 'Climatisation', tel: '06 39 98 41 27' },
    { id: 'sr', nom: 'Sébastien Roux', initiales: 'SR', metier: 'Plomberie', tel: '06 39 98 41 35' },
    { id: 'mf', nom: 'Mélanie Faure', initiales: 'MF', metier: 'Chauffage et ventilation', tel: '06 39 98 41 48' },
    { id: 'tg', nom: 'Thomas Girard', initiales: 'TG', metier: 'Polyvalent', tel: '06 39 98 41 56' }
  ];

  const CLIENTS = [
    { id: 'c01', nom: 'Résidence Les Tilleuls', genre: 'Copropriété, 32 logements', adresse: '14 rue Anatole-France', ville: '69100 Villeurbanne', contact: 'Cabinet Vallin, Mme Estelle Brun', tel: '04 65 71 20 14', contrat: 'Contrat d’entretien chauffage collectif', acces: 'Chaufferie au sous-sol, clé chez la gardienne (loge bât. A).' },
    { id: 'c02', nom: 'Résidence Le Clos Bonnevay', genre: 'Copropriété, 18 logements', adresse: '3 allée des Glycines', ville: '69500 Bron', contact: 'Cabinet Vallin, Mme Estelle Brun', tel: '04 65 71 20 14', contrat: 'Contrat d’entretien VMC et chauffage', acces: 'Badge d’accès à retirer à l’agence.' },
    { id: 'c03', nom: 'Résidence Le Belvédère', genre: 'Copropriété, 45 logements', adresse: '77 cours Tolstoï', ville: '69100 Villeurbanne', contact: 'Gestion Rocher, M. Olivier Lenoir', tel: '04 65 71 33 08', contrat: 'Contrat d’entretien chauffage collectif', acces: 'Code portail 4417B, chaufferie en toiture.' },
    { id: 'c04', nom: 'Boulangerie Ferrand', genre: 'Commerce', adresse: '52 cours Émile-Zola', ville: '69100 Villeurbanne', contact: 'M. Denis Ferrand', tel: '06 39 98 12 40', contrat: null, acces: 'Entrée par la cour, ouvert dès 6 h.' },
    { id: 'c05', nom: 'Cabinet dentaire Rivoire', genre: 'Cabinet de santé', adresse: '8 rue Paul-Bert', ville: '69003 Lyon', contact: 'Dr Anne Rivoire', tel: '04 65 71 48 92', contrat: 'Contrat d’entretien chaudière', acces: 'Intervenir entre deux rendez-vous, prévenir l’accueil.' },
    { id: 'c06', nom: 'Pharmacie Duclos', genre: 'Commerce', adresse: '27 avenue Henri-Barbusse', ville: '69100 Villeurbanne', contact: 'Mme Claire Duclos', tel: '04 65 71 52 61', contrat: 'Contrat d’entretien pompe à chaleur', acces: 'Unité extérieure sur le toit, échelle dans la réserve.' },
    { id: 'c07', nom: 'Micro-crèche Les Lucioles', genre: 'Accueil de jeunes enfants', adresse: '6 rue Jean-Jaurès', ville: '69120 Vaulx-en-Velin', contact: 'Mme Sarah Haddad, directrice', tel: '04 65 71 60 37', contrat: null, acces: 'Sonner, ne jamais laisser la porte ouverte.' },
    { id: 'c08', nom: 'Restaurant Chez Lisette', genre: 'Restauration', adresse: '41 rue de la République', ville: '69002 Lyon', contact: 'Mme Lisette Garnier', tel: '06 39 98 22 75', contrat: null, acces: 'Livraisons par la rue arrière avant 11 h.' },
    { id: 'c09', nom: 'Atelier Brunel, architectes', genre: 'Bureaux', adresse: '112 rue Garibaldi', ville: '69006 Lyon', contact: 'M. Vincent Brunel', tel: '04 65 71 71 19', contrat: 'Contrat d’entretien pompe à chaleur', acces: '3e étage, ascenseur au fond de la cour.' },
    { id: 'c10', nom: 'Hôtel Les Acacias', genre: 'Hôtellerie, 28 chambres', adresse: '9 rue Antoine-Lumière', ville: '69008 Lyon', contact: 'M. Hugo Mercier, gérant', tel: '04 65 71 84 50', contrat: 'Contrat d’entretien climatisation', acces: 'Se présenter à la réception.' },
    { id: 'c11', nom: 'Garage Pelletier', genre: 'Atelier automobile', adresse: '233 route de Genas', ville: '69500 Bron', contact: 'M. Franck Pelletier', tel: '06 39 98 30 64', contrat: 'Contrat d’entretien aérothermes', acces: 'Atelier ouvert de 8 h à 18 h.' },
    { id: 'c12', nom: 'Cabinet Morin et associés', genre: 'Expertise comptable', adresse: '15 rue Servient', ville: '69003 Lyon', contact: 'Mme Nathalie Morin', tel: '04 65 71 91 23', contrat: 'Contrat d’entretien chaudière', acces: '2e étage, interphone « Morin ».' },
    { id: 'c13', nom: 'Fromagerie Bouvier', genre: 'Commerce', adresse: '18 rue Sainte-Hélène', ville: '69002 Lyon', contact: 'M. Rémi Bouvier', tel: '06 39 98 45 81', contrat: null, acces: 'Ballon dans l’arrière-boutique.' },
    { id: 'c14', nom: 'Opticien Lambert', genre: 'Commerce', adresse: '3 place Jules-Grandclément', ville: '69100 Villeurbanne', contact: 'Mme Julie Lambert', tel: '04 65 71 15 70', contrat: null, acces: 'Fermé le lundi matin.' },
    { id: 'c15', nom: 'Cabinet de kinésithérapie Perrin', genre: 'Cabinet de santé', adresse: '60 rue Léon-Blum', ville: '69100 Villeurbanne', contact: 'M. Cédric Perrin', tel: '04 65 71 27 46', contrat: null, acces: 'Salle d’attente au rez-de-chaussée.' },
    { id: 'c16', nom: 'Résidence Les Charmilles', genre: 'Copropriété, 24 logements', adresse: '21 rue du 4-Août-1789', ville: '69100 Villeurbanne', contact: 'Gestion Rocher, M. Olivier Lenoir', tel: '04 65 71 33 08', contrat: 'Contrat d’entretien VMC', acces: 'Code portail 2290, local technique au fond du parking.' },
    { id: 'c17', nom: 'Librairie Le Signet', genre: 'Commerce', adresse: '35 rue Paul-Verlaine', ville: '69100 Villeurbanne', contact: 'Mme Agnès Roche', tel: '04 65 71 38 02', contrat: null, acces: 'Ouvert à partir de 9 h 30.' },
    { id: 'c18', nom: 'Salle Saint-Exupéry, comité des fêtes', genre: 'Salle associative', adresse: '2 rue de la Poudrette', ville: '69100 Villeurbanne', contact: 'M. Bernard Joly, président', tel: '06 39 98 52 17', contrat: null, acces: 'Clé chez le président, appeler la veille.' }
  ];

  // Catalogue des objets de demande, avec le rapport type du technicien.
  const OBJETS = [
    { k: 'secu', type: 'Chauffage', objet: 'Chaudière en sécurité, plus d’eau chaude', desc: 'La chaudière se met en sécurité plusieurs fois par jour depuis ce matin.', rapport: 'Électrode d’allumage encrassée, nettoyée puis remplacée. Pression remontée à 1,5 bar. Trois cycles de démarrage contrôlés sans défaut.', pieces: [['Électrode d’allumage', 38.5]], duree: 1.5, poids: 6, prio: 'urgente' },
    { k: 'froid', type: 'Chauffage', objet: 'Radiateurs froids dans les bureaux', desc: 'Les radiateurs de l’étage restent tièdes alors que la chaudière tourne.', rapport: 'Purge de l’ensemble des radiateurs, robinet thermostatique bloqué remplacé. Températures contrôlées pièce par pièce.', pieces: [['Tête thermostatique', 29.9]], duree: 1.5, poids: 5, prio: 'normale' },
    { k: 'entch', type: 'Chauffage', objet: 'Entretien annuel de la chaudière', desc: 'Visite annuelle prévue au contrat d’entretien.', rapport: 'Nettoyage du corps de chauffe et du brûleur, contrôle de combustion, mesure du monoxyde de carbone conforme. Attestation d’entretien remise sur place.', pieces: [], duree: 1.5, poids: 9, prio: 'contrat' },
    { k: 'fuitech', type: 'Chauffage', objet: 'Fuite sur le circuit de chauffage', desc: 'Traces d’eau sous la chaudière, la pression baisse chaque jour.', rapport: 'Soupape de sécurité défectueuse, remplacée. Remise en pression et contrôle d’étanchéité sur une heure.', pieces: [['Soupape de sécurité 3 bar', 24], ['Joints fibre, lot de 10', 6.5]], duree: 1.5, poids: 4, prio: 'normale' },
    { k: 'circ', type: 'Chauffage', objet: 'Circulateur bruyant en chaufferie', desc: 'Bruit de roulement continu dans la chaufferie, signalé par plusieurs résidents.', rapport: 'Roulement du circulateur usé. Circulateur remplacé par un modèle basse consommation, réglage de la vitesse.', pieces: [['Circulateur basse consommation', 312]], duree: 2.5, poids: 2, prio: 'normale' },
    { k: 'collectif', type: 'Chauffage', objet: 'Plus de chauffage dans plusieurs appartements', desc: 'Plusieurs résidents signalent des radiateurs froids depuis la nuit dernière.', rapport: 'Brûleur en défaut sur la chaudière collective : gicleur obstrué remplacé, réglage de la combustion. Retour à 70 °C au départ en 40 minutes.', pieces: [['Gicleur 0,85 gal/h', 21.5]], duree: 2, poids: 2, prio: 'urgente' },
    { k: 'clim-err', type: 'Climatisation', objet: 'Climatisation en défaut, code erreur affiché', desc: 'L’unité intérieure affiche un code d’erreur et ne souffle plus.', rapport: 'Sonde de température de l’unité extérieure hors tolérance, remplacée. Contrôle des pressions et essais en mode chaud et froid.', pieces: [['Sonde de température', 46]], duree: 1.5, poids: 4, prio: 'urgente' },
    { k: 'entpac', type: 'Climatisation', objet: 'Entretien de la pompe à chaleur', desc: 'Visite prévue au contrat d’entretien.', rapport: 'Nettoyage des filtres et de l’échangeur, contrôle d’étanchéité du circuit frigorifique, relevé des pressions consigné au carnet.', pieces: [], duree: 2, poids: 6, prio: 'contrat' },
    { k: 'clim-bruit', type: 'Climatisation', objet: 'Climatisation bruyante', desc: 'Bruit de vibration sur l’unité extérieure, surtout le soir.', rapport: 'Plots antivibratiles affaissés, remplacés. Ventilateur nettoyé et contrôlé.', pieces: [['Plots antivibratiles, jeu de 4', 32]], duree: 1, poids: 3, prio: 'normale' },
    { k: 'condensats', type: 'Climatisation', objet: 'Écoulement des condensats bouché', desc: 'De l’eau goutte de l’unité intérieure le long du mur.', rapport: 'Bac et tuyau d’évacuation débouchés, pompe de relevage contrôlée et nettoyée.', pieces: [], duree: 1, poids: 3, prio: 'normale' },
    { k: 'evier', type: 'Plomberie', objet: 'Fuite sous l’évier', desc: 'Fuite au niveau du siphon, un seau est posé dessous.', rapport: 'Siphon fissuré remplacé, raccords resserrés. Aucune fuite après quinze minutes d’écoulement.', pieces: [['Siphon 40 mm', 14.9]], duree: 1, poids: 5, prio: 'urgente' },
    { k: 'chasse', type: 'Plomberie', objet: 'Chasse d’eau qui coule en continu', desc: 'La chasse d’eau coule en permanence, le réservoir ne se remplit plus.', rapport: 'Mécanisme de chasse entartré, remplacé. Réglage du flotteur.', pieces: [['Mécanisme de chasse double débit', 34.5]], duree: 1, poids: 4, prio: 'normale' },
    { k: 'ballon', type: 'Plomberie', objet: 'Ballon d’eau chaude en panne', desc: 'Plus d’eau chaude depuis hier soir.', rapport: 'Résistance du chauffe-eau hors service, remplacée. Anode contrôlée, encore en bon état.', pieces: [['Résistance stéatite 2 200 W', 58], ['Joint de bride', 7.9]], duree: 1.5, poids: 4, prio: 'urgente' },
    { k: 'robinet', type: 'Plomberie', objet: 'Robinet qui goutte', desc: 'Le robinet du point d’eau goutte en permanence.', rapport: 'Cartouche céramique remplacée, débit contrôlé.', pieces: [['Cartouche céramique', 22]], duree: 1, poids: 4, prio: 'normale' },
    { k: 'tache', type: 'Plomberie', objet: 'Recherche de fuite, tache au plafond', desc: 'Une tache d’humidité s’étend au plafond du rez-de-chaussée.', rapport: 'Fuite localisée sur l’évacuation de la douche de l’étage, joint refait. Plafond à laisser sécher avant reprise de peinture.', pieces: [['Joint silicone sanitaire', 9.5]], duree: 2, poids: 3, prio: 'normale' },
    { k: 'bouche', type: 'Plomberie', objet: 'Canalisation bouchée', desc: 'L’évacuation des lavabos ne s’écoule presque plus.', rapport: 'Débouchage au furet sur huit mètres, écoulement rétabli. Conseil de nettoyage mensuel donné au client.', pieces: [], duree: 1, poids: 3, prio: 'normale' },
    { k: 'entvmc', type: 'Ventilation', objet: 'Entretien de la VMC collective', desc: 'Visite prévue au contrat d’entretien.', rapport: 'Nettoyage des bouches d’extraction, contrôle des débits sur l’ensemble des logements, courroie du caisson vérifiée.', pieces: [], duree: 2, poids: 4, prio: 'contrat' },
    { k: 'vmcarret', type: 'Ventilation', objet: 'VMC à l’arrêt', desc: 'Plus aucune aspiration dans les salles d’eau.', rapport: 'Moteur du caisson grippé, remplacé. Débits contrôlés à chaque bouche.', pieces: [['Moteur de caisson VMC', 186]], duree: 2, poids: 2, prio: 'urgente' },
    { k: 'aero', type: 'Chauffage', objet: 'Entretien annuel des aérothermes', desc: 'Visite prévue au contrat d’entretien.', rapport: 'Nettoyage des batteries et des hélices, contrôle des thermostats et des sécurités sur les quatre aérothermes.', pieces: [], duree: 3, poids: 1, prio: 'contrat' }
  ];
  const OBJET = Object.fromEntries(OBJETS.map(o => [o.k, o]));

  const TARIF = { deplacement: 49, heure: 62 };

  // Générateur pseudo-aléatoire à graine (mulberry32).
  let graine = 46112026;
  function alea() {
    graine |= 0; graine = graine + 0x6D2B79F5 | 0;
    let t = Math.imul(graine ^ graine >>> 15, 1 | graine);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  const choisir = l => l[Math.floor(alea() * l.length)];
  function choisirPondere(l) {
    const total = l.reduce((s, o) => s + o.poids, 0);
    let r = alea() * total;
    for (const o of l) { r -= o.poids; if (r <= 0) return o; }
    return l[l.length - 1];
  }

  const pad = n => String(n).padStart(2, '0');
  const cleJour = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function date(cle, hhmm) {
    const [a, m, j] = cle.split('-').map(Number);
    const [h, mi] = (hhmm || '00:00').split(':').map(Number);
    return new Date(a, m - 1, j, h, mi);
  }
  function ajouterHeures(d, h) { return new Date(d.getTime() + h * 3600000); }
  function hhmm(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  // Compétences : quels types chaque technicien prend en priorité.
  const COMPETENCES = {
    kb: ['Chauffage'], jm: ['Climatisation'], sr: ['Plomberie'],
    mf: ['Chauffage', 'Ventilation'], tg: ['Chauffage', 'Plomberie', 'Ventilation', 'Climatisation']
  };
  const clientsAvecContrat = CLIENTS.filter(c => c.contrat);

  const compteurs = {};
  function nouvelleRef(recue) {
    const cle = `${String(recue.getFullYear()).slice(2)}${pad(recue.getMonth() + 1)}`;
    compteurs[cle] = (compteurs[cle] || (recue.getMonth() === 7 ? 120 : recue.getMonth() === 8 ? 440 : recue.getMonth() === 9 ? 760 : 1080));
    compteurs[cle] += 1;
    return `INT-${cle}-${String(compteurs[cle]).padStart(4, '0')}`;
  }
  let numFacture = 2214;

  function montantDe(o, dureeReelle) {
    if (o.prio === 'contrat') return null;
    const pieces = o.pieces.reduce((s, p) => s + p[1], 0);
    return Math.round((TARIF.deplacement + TARIF.heure * dureeReelle + pieces) * 100) / 100;
  }

  function fabriquer(spec) {
    const o = OBJET[spec.objet];
    const debut = date(spec.jour, spec.heure);
    const duree = spec.duree || o.duree;
    const prio = spec.prio || o.prio;
    const client = spec.client;
    let recue;
    if (spec.recue) recue = spec.recue;
    else if (prio === 'urgente') recue = ajouterHeures(debut, -(1.5 + alea() * 4.5));
    else if (prio === 'contrat') recue = ajouterHeures(debut, -24 * (14 + Math.floor(alea() * 10)));
    else recue = ajouterHeures(debut, -24 * (1 + Math.floor(alea() * 6)) - alea() * 5);
    if (prio !== 'contrat' && recue.getHours() < 7) recue.setHours(7, 20 + Math.floor(alea() * 30));
    const canal = prio === 'contrat' ? 'Contrat' : (alea() < 0.7 ? 'Téléphone' : 'Courriel');
    const dureeReelle = spec.dureeReelle || Math.round((duree + (alea() - 0.4) * 0.5) * 4) / 4;
    return {
      ref: spec.ref || nouvelleRef(recue),
      client: client.id,
      objet: o.objet,
      cle: o.k,
      description: spec.description || o.desc,
      type: o.type,
      priorite: prio,
      statut: spec.statut,
      tech: spec.tech || null,
      jour: spec.statut === 'a_planifier' ? null : spec.jour,
      heure: spec.statut === 'a_planifier' ? null : spec.heure,
      duree,
      dureeReelle,
      recue,
      canal,
      demandeur: client.contact,
      rapport: ['terminee', 'cloturee'].includes(spec.statut) ? (spec.rapport || o.rapport) : null,
      pieces: o.pieces.map(([libelle, pu]) => ({ libelle, qte: 1, pu })),
      montant: montantDe(o, dureeReelle),
      facture: null,
      annulation: spec.annulation || null,
      historique: []
    };
  }

  function nomTech(id) { const t = TECHNICIENS.find(x => x.id === id); return t ? t.nom : ''; }
  const jourLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const heureFr = d => d.getMinutes() ? `${d.getHours()}\u00a0h\u00a0${pad(d.getMinutes())}` : `${d.getHours()}\u00a0h`;

  function construireHistorique(it) {
    const h = [];
    const via = it.canal === 'Contrat' ? 'Visite programmée au contrat d’entretien' : `Demande reçue par ${it.canal.toLowerCase()}`;
    h.push({ quand: it.recue, qui: it.canal === 'Contrat' ? 'Planification automatique' : UTILISATRICE.nom, quoi: via, detail: it.canal === 'Contrat' ? null : `Demandeur : ${it.demandeur}` });
    if (it.statut === 'annulee') {
      h.push({ quand: ajouterHeures(it.recue, 3), qui: UTILISATRICE.nom, quoi: 'Intervention annulée', detail: it.annulation });
      return h;
    }
    if (it.statut === 'a_planifier') return h;
    const debut = date(it.jour, it.heure);
    const planifie = new Date(Math.min(ajouterHeures(it.recue, 0.4).getTime(), ajouterHeures(debut, -0.6).getTime()));
    h.push({ quand: planifie, qui: UTILISATRICE.nom, quoi: `Planifiée pour ${nomTech(it.tech)}`, detail: `${jourLong.format(debut)} à ${heureFr(debut)}` });
    if (it.statut === 'planifiee') return h;
    h.push({ quand: debut, qui: nomTech(it.tech), quoi: 'Intervention démarrée sur place', detail: null });
    if (it.statut === 'en_cours') return h;
    const fin = ajouterHeures(debut, it.dureeReelle);
    h.push({ quand: fin, qui: nomTech(it.tech), quoi: 'Intervention terminée, rapport déposé', detail: `Durée sur place : ${dureeTexte(it.dureeReelle)}` });
    if (it.statut === 'terminee') return h;
    let valide = ajouterHeures(fin, alea() < 0.82 ? 1 + alea() * 6 : 22 + alea() * 40);
    if (valide.getHours() >= 18) { valide = new Date(valide); valide.setDate(valide.getDate() + 1); valide.setHours(8, 10 + Math.floor(alea() * 45)); }
    if (valide.getHours() < 8) valide.setHours(8, 10 + Math.floor(alea() * 45));
    while (valide.getDay() === 0 || valide.getDay() === 6) { valide.setDate(valide.getDate() + 1); valide.setHours(8, 20); }
    h.push({ quand: valide, qui: UTILISATRICE.nom, quoi: 'Rapport validé', detail: null });
    if (it.montant != null) {
      it.facture = `F-${String(valide.getFullYear()).slice(2)}${pad(valide.getMonth() + 1)}-${++numFacture}`;
      h.push({ quand: ajouterHeures(valide, 0.05), qui: 'Facturation', quoi: `Facture ${it.facture} préparée`, detail: null, montant: it.montant });
    } else {
      h.push({ quand: ajouterHeures(valide, 0.05), qui: 'Facturation', quoi: 'Visite comprise au contrat, rien à facturer', detail: null });
    }
    return h;
  }
  function dureeTexte(h) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (!hh) return `${mm}\u00a0min`;
    return mm ? `${hh}\u00a0h\u00a0${pad(mm)}` : `${hh}\u00a0h`;
  }

  const interventions = [];
  const C = id => CLIENTS.find(c => c.id === id);

  // 1. Historique : douze semaines de travail, du 17 août au 6 novembre.
  const CRENEAUX = [['08:00', 1.5], ['10:00', 2], ['14:00', 1.5], ['16:00', 1]];
  const FERIES = new Set(['2026-11-11']);
  const debutHisto = new Date(2026, 7, 17);
  const finHisto = new Date(2026, 10, 6);
  for (let d = new Date(debutHisto); d <= finHisto; d.setDate(d.getDate() + 1)) {
    const js = d.getDay();
    if (js === 0 || js === 6) continue;
    const cle = cleJour(d);
    const enConges = d < new Date(2026, 7, 31) ? ['jm', 'mf'] : (d >= new Date(2026, 9, 26) && d <= new Date(2026, 9, 30) ? ['tg'] : []);
    for (const t of TECHNICIENS) {
      if (enConges.includes(t.id)) continue;
      const n = alea() < 0.55 ? 3 : 4;
      const creneaux = n === 4 ? CRENEAUX : CRENEAUX.filter((_, i) => i !== Math.floor(alea() * 4));
      for (const [heure] of creneaux) {
        const comp = COMPETENCES[t.id];
        // La climatisation pèse plus lourd en fin d'été, le chauffage à l'automne.
        const saison = d < new Date(2026, 8, 21) ? { Climatisation: 1.8, Chauffage: 0.6 } : { Climatisation: 0.6, Chauffage: 1.4 };
        const candidats = OBJETS.filter(o => comp.includes(o.type)).map(o => ({ ...o, poids: o.poids * (saison[o.type] || 1) }));
        const o = choisirPondere(candidats);
        const client = o.prio === 'contrat' ? choisir(clientsAvecContrat) : choisir(CLIENTS);
        const annulee = alea() < 0.025;
        const statut = annulee ? 'annulee' : (d >= new Date(2026, 10, 6) && alea() < 0.45 ? 'terminee' : 'cloturee');
        const it = fabriquer({ objet: o.k, client, tech: t.id, jour: cle, heure, statut, annulation: annulee ? choisir(['Le client a trouvé l’origine de la panne : disjoncteur coupé.', 'Le client a reporté sa demande à l’année prochaine.', 'Doublon d’une demande déjà enregistrée.']) : null });
        interventions.push(it);
      }
    }
  }

  // 2. Aujourd'hui, lundi 9 novembre.
  const J = '2026-11-09';
  const aujourdhui = [
    { tech: 'kb', heure: '08:00', objet: 'entch', client: C('c01'), statut: 'cloturee', duree: 1.5, dureeReelle: 1.25 },
    { tech: 'kb', heure: '10:00', objet: 'ballon', client: C('c04'), statut: 'en_cours', duree: 1.5, recue: new Date(2026, 10, 9, 7, 12) },
    { tech: 'kb', heure: '14:00', objet: 'entch', client: C('c12'), statut: 'planifiee', duree: 1.5 },
    { tech: 'kb', heure: '16:00', objet: 'froid', client: C('c17'), statut: 'planifiee', duree: 1 },
    { tech: 'jm', heure: '08:30', objet: 'clim-err', client: C('c06'), statut: 'terminee', duree: 1.5, dureeReelle: 1.5, recue: new Date(2026, 10, 6, 17, 48) },
    { tech: 'jm', heure: '10:30', objet: 'entpac', client: C('c09'), statut: 'en_cours', duree: 2 },
    { tech: 'jm', heure: '14:00', objet: 'clim-bruit', client: C('c10'), statut: 'planifiee', duree: 2, description: 'Climatisation de la chambre 12 bruyante, deux clients se sont plaints ce week-end.' },
    { tech: 'sr', heure: '07:30', objet: 'evier', client: C('c08'), statut: 'terminee', duree: 1.5, dureeReelle: 1.25, recue: new Date(2026, 10, 9, 7, 2), description: 'Fuite sous l’évier de la plonge, le service de midi commence à 11 h 45.' },
    { tech: 'sr', heure: '09:30', objet: 'chasse', client: C('c07'), statut: 'en_cours', duree: 1.5, description: 'Chasse d’eau qui coule en continu dans les sanitaires des enfants.' },
    { tech: 'sr', heure: '13:30', objet: 'tache', client: C('c01'), statut: 'planifiee', duree: 1.5, description: 'Fuite en cave au pied de la colonne d’eau froide du bâtiment B.' },
    { tech: 'sr', heure: '15:30', objet: 'robinet', client: C('c14'), statut: 'planifiee', duree: 1.5 },
    { tech: 'mf', heure: '08:00', objet: 'entvmc', client: C('c02'), statut: 'terminee', duree: 2, dureeReelle: 2.25 },
    { tech: 'mf', heure: '11:00', objet: 'secu', client: C('c05'), statut: 'planifiee', duree: 1, recue: new Date(2026, 10, 9, 8, 41) },
    { tech: 'mf', heure: '14:00', objet: 'circ', client: C('c02'), statut: 'planifiee', duree: 2.5 },
    { tech: 'tg', heure: '09:00', objet: 'aero', client: C('c11'), statut: 'en_cours', duree: 3 },
    { tech: 'tg', heure: '14:00', objet: 'ballon', client: C('c13'), statut: 'planifiee', duree: 1 },
    { tech: 'tg', heure: '15:30', objet: 'froid', client: C('c15'), statut: 'planifiee', duree: 1.5, description: 'Le radiateur de la salle d’attente ne chauffe plus du tout.' }
  ];
  for (const s of aujourdhui) interventions.push(fabriquer({ ...s, jour: J }));

  // 3. Demandes reçues, pas encore placées.
  const aPlacer = [
    { objet: 'collectif', client: C('c03'), recue: new Date(2026, 10, 9, 8, 12), description: 'Plus de chauffage au 4e et au 5e étage, six appartements concernés. Le syndic a été appelé par les résidents dès 7 h.' },
    { objet: 'tache', client: C('c10'), prio: 'urgente', recue: new Date(2026, 10, 9, 9, 47), description: 'Fuite au plafond de la chambre 21, l’eau coule sur la moquette. La chambre est bloquée à la vente.' },
    { objet: 'robinet', client: C('c06'), recue: new Date(2026, 10, 6, 15, 20), description: 'Le robinet du point d’eau du préparatoire goutte en permanence.' },
    { objet: 'condensats', client: C('c09'), recue: new Date(2026, 10, 5, 11, 5), description: 'De l’eau coule le long du mur sous l’unité intérieure de la salle de réunion.' },
    { objet: 'entvmc', client: C('c16'), recue: new Date(2026, 9, 21, 9, 0), description: 'Visite annuelle prévue au contrat, à programmer avant le 30 novembre.' }
  ];
  for (const s of aPlacer) interventions.push(fabriquer({ ...s, statut: 'a_planifier', jour: J, heure: '08:00' }));

  // 4. Les jours qui viennent.
  const aVenir = [
    ['2026-11-10', 'kb', '08:00', 'entch', 'c05'], ['2026-11-10', 'kb', '10:00', 'fuitech', 'c15'], ['2026-11-10', 'jm', '09:00', 'entpac', 'c06'],
    ['2026-11-10', 'sr', '08:30', 'bouche', 'c18'], ['2026-11-10', 'sr', '14:00', 'chasse', 'c17'], ['2026-11-10', 'mf', '08:00', 'entvmc', 'c16'],
    ['2026-11-10', 'tg', '10:00', 'robinet', 'c04'], ['2026-11-12', 'kb', '08:00', 'entch', 'c12'], ['2026-11-12', 'jm', '14:00', 'entpac', 'c10'],
    ['2026-11-12', 'mf', '10:00', 'entch', 'c03'], ['2026-11-13', 'sr', '09:00', 'tache', 'c13'], ['2026-11-13', 'tg', '14:00', 'aero', 'c11'],
    ['2026-11-16', 'kb', '08:00', 'entch', 'c01'], ['2026-11-16', 'mf', '10:00', 'entvmc', 'c02'], ['2026-11-17', 'jm', '10:00', 'entpac', 'c09']
  ];
  for (const [jour, tech, heure, objet, cl] of aVenir) interventions.push(fabriquer({ jour, tech, heure, objet, client: C(cl), statut: 'planifiee' }));
  // Le reste de la semaine et la suivante se remplissent surtout de visites d'entretien.
  const occupe = new Set(aVenir.map(([j, t, h]) => `${j}|${t}|${h.slice(0, 2)}`));
  const futurs = [['2026-11-10', 3], ['2026-11-12', 3], ['2026-11-13', 2], ['2026-11-16', 2], ['2026-11-17', 2], ['2026-11-18', 1], ['2026-11-19', 1], ['2026-11-20', 1]];
  for (const [jour, n] of futurs) for (const t of TECHNICIENS) {
    const libres = CRENEAUX.filter(([h]) => ![...occupe].some(o => o.startsWith(`${jour}|${t.id}|`) && Math.abs(+o.split('|')[2] - +h.slice(0, 2)) < 2));
    for (let k = 0; k < n - (alea() < 0.3 ? 1 : 0) && libres.length; k++) {
      const [heure] = libres.splice(Math.floor(alea() * libres.length), 1)[0];
      occupe.add(`${jour}|${t.id}|${heure.slice(0, 2)}`);
      const cands = OBJETS.filter(o => COMPETENCES[t.id].includes(o.type) && o.prio !== 'urgente').map(o => ({ ...o, poids: o.poids * (o.prio === 'contrat' ? 3 : 1) }));
      const o = choisirPondere(cands);
      interventions.push(fabriquer({ jour, tech: t.id, heure, objet: o.k, client: o.prio === 'contrat' ? choisir(clientsAvecContrat) : choisir(CLIENTS), statut: 'planifiee' }));
    }
  }

  // Références attribuées dans l'ordre de réception, numérotées par mois.
  const parMois = {};
  interventions.slice().sort((a, b) => a.recue - b.recue).forEach(it => {
    const cle = `${String(it.recue.getFullYear()).slice(2)}${pad(it.recue.getMonth() + 1)}`;
    parMois[cle] = (parMois[cle] || 0) + 1;
    it.ref = `INT-${cle}-${String(parMois[cle]).padStart(4, '0')}`;
  });
  for (const it of interventions) it.historique = construireHistorique(it);
  // Une note humaine sur quelques dossiers en cours, comme dans la vraie vie.
  const lisette = interventions.find(i => i.client === 'c08' && i.jour === J);
  lisette.historique.push({ quand: new Date(2026, 10, 9, 9, 6), qui: 'Sébastien Roux', quoi: 'Note', detail: 'Siphon en PVC très ancien, j’ai prévenu Mme Garnier que l’évacuation de la plonge sera à refaire l’an prochain.' });
  const ferrand = interventions.find(i => i.client === 'c04' && i.jour === J);
  ferrand.historique.push({ quand: new Date(2026, 10, 9, 10, 22), qui: 'Karim Benali', quoi: 'Note', detail: 'Résistance à remplacer, j’en ai une dans le camion. Fin prévue vers 11 h 30.' });

  interventions.sort((a, b) => b.recue - a.recue);

  window.AGENCE = {
    MAINTENANT, UTILISATRICE, TECHNICIENS, CLIENTS, TARIF, interventions, OBJET, COMPETENCES, FERIES,
    outils: { cleJour, date, ajouterHeures, hhmm, dureeTexte, pad }
  };
})();
