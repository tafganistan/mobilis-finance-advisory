// Données simulées, persistées dans localStorage.
// À remplacer par des appels à votre API (Laravel, Node, Supabase…) en production.
import { reactive, watch } from 'vue'
import { envoyerEmail } from './mail'

const KEY = 'mfa-db-v2'
const seed = {
  session: null,
  users: [
    { id: 1, role: 'prof', name: 'Professeur MFA', email: 'prof@mfa.com', password: 'prof123' },
    
  ],
  formations: [
    { id: 1, titre: 'Formation en présentiel', type: 'Présentiel', heures: 40, prix: 'Tarif communiqué à l’inscription', desc: 'Des cours en salle avec le formateur, en petit groupe, pour apprendre et pratiquer au même endroit.', points: ['Cours en salle avec le formateur', 'Petits groupes', 'Suivi personnalisé'] },
    { id: 2, titre: 'Formation en ligne (distanciel)', type: 'En ligne', heures: 40, prix: 'Tarif communiqué à l’inscription', desc: 'Suivez les sessions en direct depuis chez vous, avec le même accompagnement qu’en salle.', points: ['Sessions en visioconférence', 'Planning adapté', 'Devoirs et notes en ligne'] },
    { id: 3, titre: 'Formations vidéo pré-enregistrées', type: 'Vidéo', heures: 0, dispo: 'Disponible en janvier 2027', prix: '', desc: 'Des cours enregistrés à suivre quand vous voulez, à votre rythme.', points: ['Cours enregistrés', 'Apprentissage à votre rythme', 'Accès depuis tous vos appareils'] },
  ],
  inscriptions: [],
  sessions: [],
  devoirs: [],
  modules: [],
  notifications: [],
  outbox: [],
  coaching: [],
  messages: [],
}

// --- Persistance ---
// Les données partagées sont dans localStorage. La session de connexion est propre à chaque onglet
// (sessionStorage) : on peut ainsi être connecté en professeur dans un onglet et en étudiant dans un autre
// sans que l'un écrase l'autre. Les onglets se synchronisent entre eux (évènement « storage »).
const SESSION_KEY = 'mfa-session-v1'
const lire = (storage, key) => { try { return JSON.parse(storage.getItem(key)) } catch { return null } }
const { session: _ancienneSession, ...sauvegarde } = lire(localStorage, KEY) || {}
// Nettoyage des exemples fictifs préchargés dans les versions précédentes.
const donneesNettoyees = { ...seed, ...sauvegarde }
const demoEmails = new Set(['awa@mfa.com', 'moussa@mail.com'])
const demoNames = new Set(['Awa Koné', 'Moussa Traoré'])
donneesNettoyees.users = (donneesNettoyees.users || []).filter(u => u.role !== 'etudiant' || (!demoEmails.has(String(u.email || '').toLowerCase()) && !demoNames.has(u.name)))
const idsDemo = new Set((sauvegarde.users || []).filter(u => demoEmails.has(String(u.email || '').toLowerCase()) || demoNames.has(u.name)).map(u => u.id))
donneesNettoyees.sessions = (donneesNettoyees.sessions || []).filter(x => !idsDemo.has(x.etudiantId))
donneesNettoyees.devoirs = (donneesNettoyees.devoirs || []).filter(x => !idsDemo.has(x.etudiantId))
donneesNettoyees.coaching = (donneesNettoyees.coaching || []).filter(x => !idsDemo.has(x.etudiantId))
donneesNettoyees.messages = (donneesNettoyees.messages || []).filter(x => !idsDemo.has(x.to) && !idsDemo.has(x.expediteurId))
donneesNettoyees.notifications = (donneesNettoyees.notifications || []).filter(x => !idsDemo.has(x.userId))
donneesNettoyees.inscriptions = (donneesNettoyees.inscriptions || []).filter(x => !demoEmails.has(String(x.email || '').toLowerCase()) && !demoNames.has(x.nom))
const sessionRestaurable = lire(sessionStorage, SESSION_KEY)
const sessionValide = sessionRestaurable && donneesNettoyees.users.some(u => u.id === sessionRestaurable.id && u.role === sessionRestaurable.role) ? sessionRestaurable : null
export const db = reactive({ ...donneesNettoyees, session: sessionValide })

const serialiser = () => { const { session, ...donnees } = db; return JSON.stringify(donnees) }
function enregistrer() {
  try { const s = serialiser(); if (s !== localStorage.getItem(KEY)) localStorage.setItem(KEY, s) } catch (e) { console.warn('Sauvegarde impossible', e) }
}
watch(db, enregistrer, { deep: true })
watch(() => db.session, (v) => { try { v ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)) : sessionStorage.removeItem(SESSION_KEY) } catch {} }, { deep: true })
// Rafraîchir la page juste après une action ne doit rien perdre
window.addEventListener('pagehide', enregistrer)

// Recharge les données partagées depuis localStorage (modifiées par un autre onglet)
export function synchroniser(brut = localStorage.getItem(KEY)) {
  let data
  try { data = JSON.parse(brut) } catch { return }
  if (!data) return
  Object.keys(seed).forEach((k) => { if (k !== 'session' && k in data) db[k] = data[k] })
}
window.addEventListener('storage', (e) => { if (e.key === KEY && e.newValue) synchroniser(e.newValue) })

const nid = (list) => Math.max(0, ...list.map((x) => x.id)) + 1
const today = () => new Date().toLocaleDateString('sv-SE') // date locale AAAA-MM-JJ

export function login(email, password) {
  const u = db.users.find((x) => x.email === email.trim() && x.password === password)
  db.session = u ? { id: u.id, role: u.role, name: u.name } : null
  return db.session
}
export const logout = () => (db.session = null)

const prof = () => db.users.find((u) => u.role === 'prof')
const maintenant = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

// --- Notifications : e-mail (outbox) + notification interne ---
export function envoyerMail(to, sujet, corps) {
  const m = { id: nid(db.outbox), to, sujet, corps, date: maintenant() }
  db.outbox.push(m)
  envoyerEmail(m)
}
export function notifier(userId, sujet, corps, type = 'general', ref = null) {
  const u = db.users.find((x) => x.id === userId)
  if (!u) return
  db.notifications.push({ id: nid(db.notifications), userId, sujet, corps, date: today(), lu: false, type, ref })
  envoyerMail(u.email, sujet, corps)
}
export const lireNotifications = (userId) => db.notifications.filter((n) => n.userId === userId).forEach((n) => (n.lu = true))
// Type d'une notification (les anciennes notifications n'ont pas de champ « type »)
export const typeNotif = (n) => n.type || (n.sujet === 'Nouvelle demande d’inscription' ? 'inscription' : 'general')
export const lireNotificationsType = (userId, type) => db.notifications.filter((n) => n.userId === userId && !n.lu && typeNotif(n) === type).forEach((n) => (n.lu = true))

// --- Inscriptions ---
export function demanderInscription(data) {
  const id = nid(db.inscriptions)
  db.inscriptions.push({ id, ...data, statut: 'en attente' })
  envoyerMail(data.email, 'Demande d’inscription reçue', `Bonjour ${data.nom}, nous avons bien reçu votre demande pour « ${data.formation} ». Le formateur vous répondra rapidement.`)
  notifier(prof().id, 'Nouvelle demande d’inscription', `${data.nom} demande la formation « ${data.formation} ».`, 'inscription', id)
}
export function decider(id, accepte) {
  synchroniser() // repart de l'état le plus récent (autre onglet ouvert)
  const i = db.inscriptions.find((x) => x.id === id)
  if (!i || i.statut !== 'en attente') return // décision déjà prise : on ne la modifie pas
  i.statut = accepte ? 'acceptée' : 'refusée'
  if (accepte && !db.users.some((u) => u.email === i.email)) {
    const f = db.formations.find((x) => x.titre === i.formation)
    db.users.push({ id: nid(db.users), role: 'etudiant', name: i.nom, email: i.email, password: 'mfa1234', pays: i.pays || '', telephone: i.telephone || '', formation: i.formation, total: f?.heures ?? 0, done: 0 })
  }
  // La demande est traitée : sa notification ne doit plus apparaître comme « non lue »
  db.notifications.forEach((n) => { if (typeNotif(n) === 'inscription' && (n.ref === id || (n.ref == null && n.corps.includes(i.nom)))) n.lu = true })
  envoyerMail(i.email, accepte ? 'Inscription acceptée' : 'Inscription refusée',
    accepte ? `Bonjour ${i.nom}, votre inscription à « ${i.formation} » est acceptée. Connectez-vous avec ${i.email} et le mot de passe provisoire mfa1234.`
            : `Bonjour ${i.nom}, nous ne pouvons pas donner suite à votre demande pour « ${i.formation} ».`)
}
export function ajouterEtudiant(d) {
  const f = db.formations.find((x) => x.titre === d.formation)
  db.users.push({ id: nid(db.users), role: 'etudiant', password: 'mfa1234', total: f?.heures ?? 0, done: 0, ...d })
  envoyerMail(d.email, 'Votre compte MFA', `Bonjour ${d.name}, votre compte est créé. Mot de passe provisoire : mfa1234.`)
}


export function supprimerEtudiant(id) {
  const u = db.users.find((x) => x.id === id && x.role === 'etudiant')
  if (!u) return
  db.users = db.users.filter((x) => x.id !== id)
  db.devoirs = db.devoirs.filter((d) => d.etudiantId !== id)
  db.sessions = db.sessions.filter((x) => x.etudiantId !== id)
  db.coaching = db.coaching.filter((c) => c.etudiantId !== id)
  db.messages = db.messages.filter((m) => m.to !== id && m.expediteurId !== id)
  db.notifications = db.notifications.filter((n) => n.userId !== id && !(n.type === 'message' && n.ref === id))
}
// Position de l'étudiant dans le parcours : « idModule:idCours » (null = pas commencé)
export function definirPosition(etudiantId, coursRef) {
  const u = db.users.find((x) => x.id === etudiantId && x.role === 'etudiant')
  if (u) u.position = coursRef || null
}

export function modifierProfilEtudiant(id, data) {
  const u = db.users.find((x) => x.id === id && x.role === 'etudiant')
  if (!u) return { ok: false, message: 'Compte étudiant introuvable.' }
  const email = String(data.email || '').trim().toLowerCase()
  if (db.users.some((x) => x.id !== id && x.email.toLowerCase() === email)) return { ok: false, message: 'Cette adresse e-mail est déjà utilisée.' }
  Object.assign(u, { name: String(data.name || '').trim(), email, pays: String(data.pays || '').trim(), telephone: String(data.telephone || '').trim() })
  if (db.session?.id === id) Object.assign(db.session, { name: u.name })
  return { ok: true, message: 'Vos informations ont été mises à jour.' }
}
export function changerMotDePasseEtudiant(id, ancien, nouveau) {
  const u = db.users.find((x) => x.id === id && x.role === 'etudiant')
  if (!u) return { ok: false, message: 'Compte étudiant introuvable.' }
  if (u.password !== ancien) return { ok: false, message: 'Le mot de passe actuel est incorrect.' }
  if (String(nouveau || '').length < 8) return { ok: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }
  u.password = String(nouveau)
  return { ok: true, message: 'Mot de passe modifié. Utilisez désormais ce nouveau mot de passe pour vous connecter.' }
}

// --- Sessions, devoirs, messages ---
export const dateFr = (date) => (date ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) : '')
const arrondi = (n) => Math.round(n * 100) / 100
export function ajouterSession(s) {
  const lien = /^https?:\/\//i.test((s.lien || '').trim()) ? s.lien.trim() : ''
  const duree = Math.max(0.5, Number(s.duree) || 1)
  const e = { id: nid(db.sessions), ...s, lien, duree, etudiantId: Number(s.etudiantId), clicProf: false, clicEtudiant: false, heuresDecomptees: false }
  db.sessions.push(e)
  notifier(e.etudiantId, 'Nouvelle session programmée', `${e.titre} le ${dateFr(e.date)} à ${e.heure} (${e.mode}, ${duree} h).${lien ? ' Lien pour rejoindre : ' + lien : ''}`)
}
// Quand le professeur ET l'étudiant ont cliqué sur le lien de la session, la durée de la session
// (en heures) est retirée des heures restantes de l'étudiant — une seule fois par session.
export function marquerClicSession(id, role) {
  synchroniser() // un autre onglet a peut-être déjà enregistré le clic de l'autre personne
  const s = db.sessions.find((x) => x.id === id)
  if (!s) return
  if (role === 'prof') s.clicProf = true
  else s.clicEtudiant = true
  if (s.clicProf && s.clicEtudiant && !s.heuresDecomptees) {
    const u = db.users.find((x) => x.id === s.etudiantId && x.role === 'etudiant')
    s.heuresDecomptees = true
    if (u) {
      u.done = Math.min(u.total, arrondi(u.done + (Number(s.duree) || 0)))
      notifier(u.id, 'Session comptabilisée', `« ${s.titre} » du ${dateFr(s.date)} : ${s.duree} h décomptée(s). Il vous reste ${arrondi(u.total - u.done)} h.`)
    }
  }
}
export function ajouterDevoir(d) {
  db.devoirs.push({ id: nid(db.devoirs), ...d, consignes: d.consignes || (d.consigne ? [d.consigne] : []), etudiantId: Number(d.etudiantId), rendu: '', rendus: [], note: null, appreciation: '' })
  notifier(Number(d.etudiantId), 'Nouveau devoir', `${d.titre} — à rendre avant le ${d.delai}.`)
}
// Envois de l'étudiant pour un devoir (plusieurs possibles). Les anciens devoirs n'avaient qu'un seul envoi à plat.
export const rendusDe = (d) => (d.rendus?.length ? d.rendus : d.rendu ? [{ id: 0, description: d.commentaireEtudiant || '', fichier: d.fichier || null, date: '', heure: '' }] : [])
export function soumettreDevoir(id, { description, fichier }) {
  const d = db.devoirs.find((x) => x.id === id)
  if (!d) return
  d.rendus = rendusDe(d).slice() // migre un ancien envoi unique
  d.rendus.push({ id: nid(d.rendus), description: description || '', fichier, date: today(), heure: new Date().toTimeString().slice(0, 5) })
  // Champs « dernier envoi » conservés pour les écrans qui ne lisent qu'un envoi
  d.rendu = fichier?.nom || 'Fichier déposé'
  d.fichier = fichier
  d.commentaireEtudiant = description || ''
  notifier(prof().id, 'Devoir rendu', `${db.users.find((u) => u.id === d.etudiantId)?.name} a rendu « ${d.titre} » (envoi n° ${d.rendus.length}).`)
}
export function noter(id, note, appreciation) {
  const d = db.devoirs.find((x) => x.id === id)
  d.note = Number(note)
  d.appreciation = appreciation
  notifier(d.etudiantId, 'Devoir corrigé', `${d.titre} : ${d.note}/20. ${appreciation}`)
}
export function envoyerMessage(to, texte, expediteurId = null) {
  const versProf = Number(to) === prof()?.id
  db.messages.push({ id: nid(db.messages), to: Number(to), expediteurId, texte, date: today(), heure: new Date().toTimeString().slice(0, 5), lu: !versProf })
  if (versProf) notifier(Number(to), 'Nouveau message d’un étudiant', texte, 'message', expediteurId)
  else notifier(Number(to), 'Nouveau message du professeur', texte, 'message')
}
// Le professeur ouvre la conversation : messages et notifications de cet étudiant passent en « lus »
export function marquerMessagesLus(etudiantId) {
  const pid = prof()?.id
  db.messages.forEach((m) => { if (m.to === pid && m.expediteurId === etudiantId && m.lu === false) m.lu = true })
  db.notifications.forEach((n) => { if (n.userId === pid && n.type === 'message' && n.ref === etudiantId && !n.lu) n.lu = true })
}
export const majHeures = (id, done) => (db.users.find((u) => u.id === id).done = Number(done))

// --- Modules pédagogiques et cours ---
export function ajouterModule(data) {
  db.modules.push({ id: nid(db.modules), titre: data.titre, description: data.description || '', cours: [] })
}
export function modifierModule(id, data) {
  const m = db.modules.find((x) => x.id === id)
  if (m) Object.assign(m, { titre: data.titre, description: data.description || '' })
}
export function supprimerModule(id) { db.modules = db.modules.filter((m) => m.id !== id) }
export function ajouterCours(moduleId, data) {
  const m = db.modules.find((x) => x.id === moduleId)
  if (m) m.cours.push({ id: nid(m.cours), titre: data.titre, description: data.description || '', duree: Number(data.duree) || 0, devoirs: data.devoirs || [] })
}
export function supprimerCours(moduleId, coursId) {
  const m = db.modules.find((x) => x.id === moduleId)
  if (m) m.cours = m.cours.filter((c) => c.id !== coursId)
}

// --- Coaching individuel ---
export function demanderCoaching(etudiantId, d) {
  db.coaching.push({ id: nid(db.coaching), etudiantId, ...d, statut: 'en attente', reponse: '' })
  notifier(prof().id, 'Demande de coaching', `${db.users.find((u) => u.id === etudiantId)?.name} souhaite un coaching le ${d.date} à ${d.heure} : ${d.sujet}`)
}
export function repondreCoaching(id, accepte, reponse) {
  const c = db.coaching.find((x) => x.id === id)
  c.statut = accepte ? 'confirmée' : 'refusée'
  c.reponse = reponse
  if (accepte) db.sessions.push({ id: nid(db.sessions), etudiantId: c.etudiantId, titre: 'Coaching : ' + c.sujet, date: c.date, heure: c.heure, mode: 'Coaching' })
  notifier(c.etudiantId, accepte ? 'Coaching confirmé' : 'Coaching refusé', `${accepte ? 'Confirmé' : 'Refusé'} pour le ${c.date} à ${c.heure}. ${reponse}`)
}
