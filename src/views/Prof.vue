<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { db, decider, ajouterEtudiant, ajouterSession, dateFr, ajouterDevoir, noter, envoyerMessage, majHeures, repondreCoaching, ajouterModule, modifierModule, supprimerModule, ajouterCours, supprimerCours, modifierProfilEtudiant, supprimerEtudiant, definirPosition, marquerMessagesLus, lireNotificationsType, typeNotif, rendusDe } from '../store'
import Donut from '../components/Donut.vue'
import BarChart from '../components/BarChart.vue'
import Topbar from '../components/Topbar.vue'
import FileViewer from '../components/FileViewer.vue'
import Icon from '../components/Icon.vue'
import SessionRow from '../components/SessionRow.vue'
import { ic } from '../icons'
import { countries } from '../data/countries'

const tabs = [
  { label: 'Les modules', icon: '▦', tone: 'from-indigo-500 to-violet-600', hint: 'Cours & ressources' },
  { label: 'Inscriptions', icon: '✚', tone: 'from-cyan-500 to-blue-600', hint: 'Nouvelles demandes' },
  { label: 'Étudiants', icon: '♙', tone: 'from-emerald-500 to-teal-600', hint: 'Suivi apprenants' },
  { label: 'Sessions', icon: '▣', tone: 'from-orange-400 to-rose-500', hint: 'Planning des cours' },
  { label: 'Devoirs', icon: '▤', tone: 'from-violet-500 to-purple-700', hint: 'Corrections & notes' },
  { label: 'Messages', icon: '✉', tone: 'from-sky-500 to-cyan-600', hint: 'Échanges directs' },
  { label: 'Analytics', icon: '▥', tone: 'from-amber-400 to-orange-600', hint: 'Indicateurs clés' },
  { label: 'E-mails', icon: '⌁', tone: 'from-slate-500 to-slate-700', hint: 'Journal des envois' },
]
const tab = ref('Les modules')
const etudiants = computed(() => db.users.filter((u) => u.role === 'etudiant'))
const nom = (id) => db.users.find((u) => u.id === id)?.name ?? '—'
const enAttente = computed(() => db.inscriptions.filter((i) => i.statut === 'en attente').length)
const nouvel = reactive({ name: '', email: '', formation: '' })
const devoir = reactive({ etudiantId: '', titre: '', delai: '', coursRef: '', description: '' })
const corr = reactive({})
const rep = reactive({})
const moy = (l) => (l.length ? +(l.reduce((t, d) => t + d.note, 0) / l.length).toFixed(1) : 0)
const moyenneGenerale = computed(() => moy(db.devoirs.filter((d) => d.note !== null)))
const tauxRemise = computed(() => (db.devoirs.length ? Math.round((db.devoirs.filter((d) => d.rendu).length / db.devoirs.length) * 100) : 0))
const heuresFaites = computed(() => etudiants.value.reduce((t, e) => t + e.done, 0))
const heuresTotal = computed(() => etudiants.value.reduce((t, e) => t + e.total, 0))
const progressions = computed(() => etudiants.value.map((e) => ({ label: e.name.split(' ')[0], value: e.total ? Math.round((e.done / e.total) * 100) : 0 })))
const moyennes = computed(() => etudiants.value.map((e) => ({ label: e.name.split(' ')[0], value: moy(db.devoirs.filter((d) => d.etudiantId === e.id && d.note !== null)) })))
const parStatut = computed(() => ['en attente', 'acceptée', 'refusée'].map((k) => ({ label: k, value: db.inscriptions.filter((i) => i.statut === k).length })))
const reset = (o) => Object.keys(o).forEach((k) => (o[k] = k === 'mode' ? 'Visio' : ''))
const add = (o, fn) => { fn({ ...o }); reset(o) }

// ---------- Sessions : programmer / voir par cours ----------
const sessionVide = () => ({ etudiantId: '', titre: '', date: '', heure: '', duree: 1, mode: 'Visio', lien: '' })
const session = reactive(sessionVide())
const progSel = ref(null) // { moduleId, coursId } : cours en cours de programmation
const voirSel = ref(null) // { moduleId, coursId } : cours dont on consulte les sessions
const sessionErreur = ref('')
const sessionToast = ref('')
const aujourdhui = new Date().toLocaleDateString('sv-SE')
const heures = (n) => Math.round((Number(n) || 0) * 100) / 100
const refCours = (m, c) => `${m.id}:${c.id}`
const parDate = (a, b) => `${a.date} ${a.heure || ''}`.localeCompare(`${b.date} ${b.heure || ''}`)
const sessionsDuCours = (m, c) => db.sessions.filter((s) => s.coursRef === refCours(m, c))
const trouverCours = (sel) => { const m = db.modules.find((x) => x.id === sel?.moduleId); const c = m?.cours?.find((x) => x.id === sel?.coursId); return m && c ? { module: m, cours: c } : null }
const coursProg = computed(() => trouverCours(progSel.value))
const coursVoir = computed(() => trouverCours(voirSel.value))
const refsConnues = computed(() => new Set(db.modules.flatMap((m) => (m.cours || []).map((c) => refCours(m, c)))))
const sessionsAutres = computed(() => db.sessions.filter((s) => !refsConnues.value.has(s.coursRef)).sort(parDate))
const sessionsAVenir = computed(() => db.sessions.filter((s) => s.date >= aujourdhui).sort(parDate))
const prochaines = computed(() => sessionsAVenir.value.slice(0, 5))
const groupesVoir = computed(() => {
  if (!coursVoir.value) return []
  const groupes = new Map()
  sessionsDuCours(coursVoir.value.module, coursVoir.value.cours).sort(parDate).forEach((s) => { if (!groupes.has(s.etudiantId)) groupes.set(s.etudiantId, []); groupes.get(s.etudiantId).push(s) })
  return [...groupes].map(([id, sessions]) => { const e = db.users.find((u) => u.id === id); return { id, nom: e?.name ?? '—', restantes: e ? e.total - e.done : 0, sessions } })
})
function ouvrirProg(m, c) { Object.assign(session, sessionVide(), { titre: c.titre, duree: c.duree || 1 }); sessionErreur.value = ''; progSel.value = { moduleId: m.id, coursId: c.id } }
function changerDuree(delta) { session.duree = Math.max(0.5, heures((Number(session.duree) || 0) + delta)) }
function enregistrerSession() {
  if (!session.etudiantId) { sessionErreur.value = 'Choisissez l’étudiant concerné.'; return }
  if (!coursProg.value) return
  const { module, cours } = coursProg.value
  ajouterSession({ ...session, coursRef: refCours(module, cours) })
  sessionToast.value = `Session « ${session.titre} » programmée pour ${nom(session.etudiantId)} le ${dateFr(session.date)} à ${session.heure}.`
  setTimeout(() => (sessionToast.value = ''), 6000)
  progSel.value = null
}

// Modules et cours
const moduleForm = reactive({ titre: '', description: '' })
const coursForm = reactive({ titre: '', description: '', duree: 1 })
const selectedModuleId = ref(null)
const modulesOuverts = ref([])
function toggleModuleOuvert(id) { modulesOuverts.value = modulesOuverts.value.includes(id) ? modulesOuverts.value.filter(x => x !== id) : [...modulesOuverts.value, id] }
const editingModuleId = ref(null)
const selectedModule = computed(() => db.modules.find((m) => m.id === selectedModuleId.value) || null)
function saveModule() { if (editingModuleId.value) modifierModule(editingModuleId.value, moduleForm); else ajouterModule(moduleForm); reset(moduleForm); editingModuleId.value = null }
function editModule(m) { editingModuleId.value = m.id; moduleForm.titre = m.titre; moduleForm.description = m.description || ''; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function removeModule(m) { if (confirm(`Supprimer le module « ${m.titre} » et ses cours ?`)) { supprimerModule(m.id); if (selectedModuleId.value === m.id) selectedModuleId.value = null; if (editingModuleId.value === m.id) { editingModuleId.value = null; reset(moduleForm) } } }
async function filesToData(files) { return Promise.all([...files].map(file => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve({ nom: file.name, type: file.type || 'application/octet-stream', taille: file.size, data: r.result }); r.onerror = reject; r.readAsDataURL(file) }))) }
const coursFiles = ref([])
async function onCoursFiles(e) { coursFiles.value = await filesToData(e.target.files) }
function saveCours() { if (!selectedModule.value) return; ajouterCours(selectedModule.value.id, { ...coursForm, devoirs: coursFiles.value }); reset(coursForm); coursForm.duree = 1; coursFiles.value = [] }
function removeCours(c) { if (confirm(`Supprimer le cours « ${c.titre} » ?`)) supprimerCours(selectedModuleId.value, c.id) }

// Lecture et correction des devoirs rendus
const devoirOuvert = ref(null)
const devoirsRendus = computed(() => db.devoirs.filter(d => d.rendu))
const renduIdx = ref(0)
const rendusOuvert = computed(() => (devoirOuvert.value ? rendusDe(devoirOuvert.value) : []))
const renduVu = computed(() => rendusOuvert.value[Math.min(renduIdx.value, rendusOuvert.value.length - 1)] || null)
const fichierUrl = computed(() => renduVu.value?.fichier?.data || '')
const fichierImage = computed(() => /^image\//.test(renduVu.value?.fichier?.type || ''))
const fichierPdf = computed(() => renduVu.value?.fichier?.type === 'application/pdf' || renduVu.value?.fichier?.nom?.toLowerCase().endsWith('.pdf'))
function ouvrirDevoir(d) { devoirOuvert.value = d; renduIdx.value = Math.max(0, rendusDe(d).length - 1) }
const coursOptions = computed(() => db.modules.flatMap((m) => (m.cours || []).map((c) => ({ ref: `${m.id}:${c.id}`, label: `${m.titre} · ${c.titre}` }))))
const nomCours = (r) => coursOptions.value.find((c) => c.ref === r)?.label || ''
const devoirChatEtudiantId = ref(null)
const devoirConsignes = ref([])
const devoirConsignesInput = ref(null)
async function choisirDevoirConsignes(e) { devoirConsignes.value = await filesToData(e.target.files); }
function publierDevoirChat() { if (!devoir.etudiantId || !devoir.titre.trim() || !devoir.delai) return; ajouterDevoir({ ...devoir, etudiantId: Number(devoir.etudiantId), consignes: devoirConsignes.value }); devoirChatEtudiantId.value = Number(devoir.etudiantId); reset(devoir); devoirConsignes.value = []; if (devoirConsignesInput.value) devoirConsignesInput.value.value = '' }
const etudiantsDevoirsChat = computed(() => etudiants.value.map(e => ({ ...e, nb: db.devoirs.filter(d => d.etudiantId === e.id).length, rendus: db.devoirs.filter(d => d.etudiantId === e.id && d.rendu).length })).sort((a,b) => a.name.localeCompare(b.name)))
const devoirsChat = computed(() => db.devoirs.filter(d => d.etudiantId === devoirChatEtudiantId.value).slice().sort((a,b) => `${a.delai} ${a.id}`.localeCompare(`${b.delai} ${b.id}`)))
function corriger(d) { noter(d.id, corr[d.id + 'n'], corr[d.id + 'a'] || ''); devoirOuvert.value = null }

// ---------- Pastilles de notifications non lues ----------
const profId = computed(() => db.session?.id)
const inscriptionsNonLues = computed(() => db.notifications.filter((n) => n.userId === profId.value && !n.lu && typeNotif(n) === 'inscription').length)
const messagesNonLus = computed(() => db.messages.filter((m) => m.to === profId.value && m.lu === false).length)
const pastilles = computed(() => ({ Inscriptions: inscriptionsNonLues.value, Messages: messagesNonLus.value }))
// Ouvrir la rubrique Inscriptions marque ses notifications comme lues
watch([tab, inscriptionsNonLues], () => { if (tab.value === 'Inscriptions' && inscriptionsNonLues.value) lireNotificationsType(profId.value, 'inscription') }, { immediate: true })

// ---------- Utilitaires d'affichage ----------
const initiales = (n = '') => n.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()
function choisirTab(label) { tab.value = label; devoirOuvert.value = null; suiviId.value = null; progSel.value = null; voirSel.value = null }

// ---------- Modules : visionneur de fichiers ----------
const fichierVu = ref(null)

// ---------- Étudiants : modifier / supprimer ----------
const editionId = ref(null)
const edition = reactive({ name: '', email: '', pays: '', telephone: '', formation: '' })
const editionErreur = ref('')
function ouvrirEdition(e) { Object.assign(edition, { name: e.name || '', email: e.email || '', pays: e.pays || '', telephone: e.telephone || '', formation: e.formation || '' }); editionErreur.value = ''; editionId.value = e.id }
function sauverEdition() { const r = modifierProfilEtudiant(editionId.value, edition); if (r.ok) editionId.value = null; else editionErreur.value = r.message }
function retirerEtudiant(e) {
  if (!confirm(`Supprimer l'étudiant « ${e.name} » ?\nSes devoirs, sessions, messages et demandes de coaching seront aussi supprimés.`)) return
  supprimerEtudiant(e.id)
  if (suiviId.value === e.id) suiviId.value = null
  if (chatId.value === e.id) chatId.value = null
  if (editionId.value === e.id) editionId.value = null
}

// ---------- Étudiants : suivi de progression + devoir ----------
const suiviId = ref(null)
const suivi = computed(() => etudiants.value.find((e) => e.id === suiviId.value) || null)
const parcours = computed(() => db.modules.flatMap((m, mi) => (m.cours || []).map((c, ci) => ({ ref: `${m.id}:${c.id}`, module: m, cours: c, mi, ci }))))
const sessionActuelle = computed(() => db.sessions.filter(s => s.etudiantId === suiviId.value && s.coursRef && !(s.clicProf && s.clicEtudiant)).sort((a,b) => `${b.date} ${b.heure || ''}`.localeCompare(`${a.date} ${a.heure || ''}`))[0] || null)
const posIndex = computed(() => { const ref = sessionActuelle.value?.coursRef || suivi.value?.position; return ref ? parcours.value.findIndex((p) => p.ref === ref) : -1 })
const posActuelle = computed(() => (posIndex.value >= 0 ? parcours.value[posIndex.value] : null))
function statutCours(m, c) {
  const i = parcours.value.findIndex((p) => p.ref === `${m.id}:${c.id}`)
  return posIndex.value < 0 ? 'à venir' : i < posIndex.value ? 'terminé' : i === posIndex.value ? 'en cours' : 'à venir'
}
const devoirsSuivi = computed(() => db.devoirs.filter((d) => d.etudiantId === suiviId.value))
const devoirEtu = reactive({ titre: '', description: '', delai: '', coursRef: '' })
const consigne = ref(null)
const consigneInput = ref(null)
const devoirFeedback = ref('')
function ouvrirSuivi(e) { suiviId.value = e.id; reset(devoirEtu); consigne.value = null; devoirFeedback.value = '' }
async function choisirConsigne(e) { consigne.value = (await filesToData(e.target.files))[0] || null }
function envoyerDevoirSuivi() {
  const nomEtu = suivi.value.name
  ajouterDevoir({ ...devoirEtu, etudiantId: suiviId.value, consigne: consigne.value })
  reset(devoirEtu)
  consigne.value = null
  if (consigneInput.value) consigneInput.value.value = ''
  devoirFeedback.value = `Devoir envoyé à ${nomEtu}.`
  setTimeout(() => (devoirFeedback.value = ''), 4000)
}

// ---------- Messages : chat ----------
const chatId = ref(null)
const chatRecherche = ref('')
const chatTexte = ref('')
const chatZone = ref(null)
const conversation = (id) => db.messages.filter((m) => m.to === id || (m.expediteurId === id && m.to === profId.value)).slice().sort((a, b) => a.id - b.id)
const contacts = computed(() => etudiants.value
  .map((e) => { const conv = conversation(e.id); return { ...e, dernier: conv[conv.length - 1] || null, nonLus: conv.filter((m) => m.expediteurId === e.id && m.lu === false).length } })
  .filter((c) => c.name.toLowerCase().includes(chatRecherche.value.trim().toLowerCase()))
  .sort((a, b) => (b.dernier?.id || 0) - (a.dernier?.id || 0)))
const chatEtudiant = computed(() => etudiants.value.find((e) => e.id === chatId.value) || null)
const chatMessages = computed(() => { let prev = ''; return chatEtudiant.value ? conversation(chatId.value).map((m) => { const nouveauJour = m.date !== prev; prev = m.date; return { ...m, nouveauJour } }) : [] })
const chatNonLus = computed(() => chatMessages.value.filter((m) => m.expediteurId === chatId.value && m.lu === false).length)
function descendreChat() { nextTick(() => { if (chatZone.value) chatZone.value.scrollTop = chatZone.value.scrollHeight }) }
function ouvrirChat(id) { chatId.value = id; marquerMessagesLus(id); descendreChat() }
function envoyerChat() { const t = chatTexte.value.trim(); if (!t || !chatId.value) return; envoyerMessage(chatId.value, t); chatTexte.value = ''; descendreChat() }
// Conversation ouverte : un message reçu pendant la lecture est tout de suite marqué comme lu
watch([chatNonLus, tab], () => { if (tab.value === 'Messages' && chatId.value && chatNonLus.value) { marquerMessagesLus(chatId.value); descendreChat() } })
watch(tab, (t) => { if (t === 'Messages') descendreChat() })
watch(() => chatMessages.value.length, descendreChat)
</script>

<template>
  <Topbar />
  <main class="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(201,162,39,.10),_transparent_35%),linear-gradient(180deg,#f4f7fb_0%,#eef2f8_100%)] px-4 py-7 sm:px-6">
    <div class="mx-auto max-w-7xl">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p class="text-xs font-bold uppercase tracking-[.24em] text-amber-700">Tableau de bord · MFA</p><h1 class="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Espace professeur</h1><p class="mt-2 text-sm text-slate-500">Pilotez vos formations, vos apprenants et vos ressources pédagogiques.</p></div>
        <div class="flex gap-2"><span class="rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm shadow-sm"><b class="block text-xl text-navy-900">{{ etudiants.length }}</b><span class="text-xs text-slate-500">Étudiants</span></span><span class="rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm shadow-sm"><b class="block text-xl text-amber-700">{{ enAttente }}</b><span class="text-xs text-slate-500">À traiter</span></span></div>
      </section>

      <!-- Menu d'applications inspiré de la référence -->
      <nav class="mb-8 rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-[0_18px_55px_rgba(15,39,72,.07)] backdrop-blur-xl sm:p-5" aria-label="Rubriques professeur">
        <div class="mb-4 flex items-center justify-between"><div><h2 class="font-semibold text-navy-900">Vos applications</h2><p class="text-xs text-slate-500">Sélectionnez un espace de travail</p></div><span class="hidden rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 sm:inline">ESPACE PROFESSEUR</span></div>
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          <button v-for="t in tabs" :key="t.label" @click="choisirTab(t.label)" class="group flex min-w-0 flex-col items-center rounded-2xl border p-3 text-center transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-lg" :class="tab === t.label ? 'border-amber-300 bg-white shadow-[0_8px_25px_rgba(201,162,39,.16)] ring-2 ring-amber-100' : 'border-transparent bg-white/45'">
            <span class="relative grid h-12 w-12 place-items-center rounded-[17px] bg-gradient-to-br text-2xl font-semibold text-white shadow-md transition group-hover:scale-105" :class="t.tone">{{ t.icon }}<span v-if="pastilles[t.label]" class="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[11px] font-bold leading-none text-white shadow" :aria-label="pastilles[t.label] + ' non lu(s)'">{{ pastilles[t.label] > 99 ? '99+' : pastilles[t.label] }}</span></span><span class="mt-2 text-xs font-bold text-navy-900">{{ t.label }}</span><span class="mt-1 hidden text-[10px] text-slate-400 xl:block">{{ t.hint }}</span>
          </button>
        </div>
      </nav>

      <!-- MODULES -->
      <section v-if="tab === 'Les modules'" class="space-y-6">
        <div class="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
          <form class="rounded-[1.75rem] border border-white bg-white/85 p-6 shadow-sm" @submit.prevent="saveModule">
            <div class="mb-5"><span class="text-xs font-bold uppercase tracking-widest text-indigo-600">Bibliothèque pédagogique</span><h2 class="mt-1 text-xl font-bold text-navy-900">{{ editingModuleId ? 'Modifier le module' : 'Créer un module' }}</h2><p class="mt-1 text-sm text-slate-500">Organisez vos cours et leurs documents au même endroit.</p></div>
            <label class="mb-3 block text-xs font-semibold text-slate-600">Nom du module<input v-model="moduleForm.titre" required class="input mt-1.5 !rounded-xl !py-3" placeholder="Ex. : Analyse financière" /></label>
            <label class="mb-4 block text-xs font-semibold text-slate-600">Description<textarea v-model="moduleForm.description" rows="3" class="input mt-1.5 !rounded-xl" placeholder="Présentez les objectifs de ce module…" /></label>
            <div class="flex flex-wrap gap-2"><button class="btn !rounded-xl">{{ editingModuleId ? 'Enregistrer les modifications' : 'Ajouter le module' }}</button><button v-if="editingModuleId" type="button" class="btn btn-outline !rounded-xl" @click="editingModuleId = null; reset(moduleForm)">Annuler</button></div>
          </form>
          <div class="rounded-[1.75rem] border border-white bg-gradient-to-br from-[#142f51] to-[#244d78] p-6 text-white shadow-lg"><div class="flex items-start justify-between"><div><p class="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Votre espace de cours</p><h2 class="mt-2 text-2xl font-bold">Construisez un parcours clair</h2></div><span class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">▦</span></div><p class="mt-3 max-w-lg text-sm leading-6 text-blue-100">Chaque module peut contenir plusieurs cours. Ajoutez à chaque cours une durée, une description et autant de documents pédagogiques que nécessaire.</p><div class="mt-7 grid grid-cols-2 gap-3"><div class="rounded-2xl bg-white/10 p-4"><b class="text-3xl">{{ db.modules.length }}</b><p class="mt-1 text-xs text-blue-100">Modules créés</p></div><div class="rounded-2xl bg-white/10 p-4"><b class="text-3xl">{{ db.modules.reduce((n,m) => n + m.cours.length, 0) }}</b><p class="mt-1 text-xs text-blue-100">Cours disponibles</p></div></div></div>
        </div>
        <div class="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <div class="rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-sm"><div class="mb-4 flex items-center justify-between"><h2 class="font-bold text-navy-900">Liste des modules</h2><span class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{{ db.modules.length }}</span></div>
            <p v-if="!db.modules.length" class="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucun module pour le moment. Créez votre premier module ci-dessus.</p>
            <button v-for="m in db.modules" :key="m.id" @click="selectedModuleId = m.id" class="mb-2 w-full rounded-2xl border p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50" :class="selectedModuleId === m.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-white'"><div class="flex items-center justify-between gap-2"><b class="text-sm text-navy-900">{{ m.titre }}</b><span class="text-xs text-slate-400">{{ m.cours.length }} cours</span></div><p class="mt-1 line-clamp-2 text-xs text-slate-500">{{ m.description || 'Aucune description' }}</p><div class="mt-3 flex gap-2"><span class="text-xs font-semibold text-indigo-600">Ouvrir →</span><span class="flex-1"></span><span role="button" class="text-xs text-slate-500 hover:text-indigo-700" @click.stop="editModule(m)">✎ Modifier</span><span role="button" class="text-xs text-rose-500 hover:text-rose-700" @click.stop="removeModule(m)">⌫ Supprimer</span></div></button>
          </div>
          <div class="rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-sm">
            <div v-if="selectedModule"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-indigo-600">Contenu du module</p><h2 class="mt-1 text-xl font-bold text-navy-900">{{ selectedModule.titre }}</h2><p class="mt-1 text-sm text-slate-500">{{ selectedModule.description }}</p></div><span class="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">{{ selectedModule.cours.length }} cours</span></div>
              <form class="mt-5 rounded-2xl bg-slate-50 p-4" @submit.prevent="saveCours"><h3 class="mb-3 text-sm font-bold text-navy-900">Ajouter un cours</h3><div class="grid gap-3 sm:grid-cols-2"><input v-model="coursForm.titre" required class="input" placeholder="Titre du cours"/><input v-model.number="coursForm.duree" type="number" min="1" required class="input" placeholder="Durée (heures)"/><textarea v-model="coursForm.description" rows="2" class="input sm:col-span-2" placeholder="Description du cours"/><label class="sm:col-span-2"><span class="mb-1 block text-xs font-semibold text-slate-600">Documents et devoirs (PDF, Word, image, PowerPoint)</span><input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.ppt,.pptx" class="block w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500" @change="onCoursFiles"/><span class="mt-1 block text-[11px] text-slate-400">{{ coursFiles.length }} fichier(s) sélectionné(s)</span></label></div><button class="btn mt-3 !rounded-xl" :disabled="!coursForm.titre">Ajouter le cours</button></form>
              <div class="mt-5 space-y-3"><p v-if="!selectedModule.cours.length" class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Les cours de ce module apparaîtront ici.</p><article v-for="(c,idx) in selectedModule.cours" :key="c.id" class="rounded-2xl border border-slate-100 bg-white p-4"><div class="flex items-start justify-between gap-3"><div class="flex gap-3"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">{{ String(idx+1).padStart(2,'0') }}</span><div><h3 class="font-bold text-navy-900">{{ c.titre }}</h3><p class="mt-1 text-xs text-slate-500">{{ c.description }}</p><p class="mt-2 text-xs font-semibold text-indigo-600">◷ {{ c.duree }} heure(s) · {{ c.devoirs.length }} ressource(s)</p></div></div><button class="text-xs text-rose-500" @click="removeCours(c)">Supprimer</button></div><div v-if="c.devoirs.length" class="mt-3 flex flex-wrap gap-2"><div v-for="(f,i) in c.devoirs" :key="i" class="inline-flex items-center overflow-hidden rounded-xl bg-slate-50 text-xs font-medium text-slate-600"><button type="button" class="inline-flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700" :title="'Lire ' + f.nom" @click="fichierVu = f"><Icon :d="ic.eye" class="!h-4 !w-4" />{{ f.nom }}</button><a :href="f.data" :download="f.nom" class="border-l border-slate-200 px-2.5 py-2 hover:bg-indigo-50 hover:text-indigo-700" :title="'Télécharger ' + f.nom" :aria-label="'Télécharger ' + f.nom"><Icon :d="ic.download" class="!h-4 !w-4" /></a></div></div></article></div>
            </div><div v-else class="grid min-h-80 place-items-center text-center"><div><span class="text-5xl text-slate-200">▦</span><h2 class="mt-3 font-bold text-navy-900">Sélectionnez un module</h2><p class="mt-1 text-sm text-slate-500">Choisissez un module dans la liste pour consulter et gérer ses cours.</p></div></div>
          </div>
        </div>
      </section>

      <!-- INSCRIPTIONS -->
      <section v-if="tab === 'Inscriptions'" class="space-y-5"><div class="grid gap-4 sm:grid-cols-3"><div class="rounded-3xl bg-gradient-to-br from-[#142f51] to-[#2d5681] p-5 text-white"><p class="text-xs text-blue-100">Demandes reçues</p><b class="mt-2 block text-3xl">{{ db.inscriptions.length }}</b><p class="mt-1 text-xs text-blue-100">Toutes formations confondues</p></div><div class="rounded-3xl border border-white bg-white/85 p-5"><p class="text-xs text-slate-500">En attente</p><b class="mt-2 block text-3xl text-amber-600">{{ enAttente }}</b><p class="mt-1 text-xs text-slate-400">À examiner</p></div><div class="rounded-3xl border border-white bg-white/85 p-5"><p class="text-xs text-slate-500">Acceptées</p><b class="mt-2 block text-3xl text-emerald-600">{{ db.inscriptions.filter(i => i.statut === 'acceptée').length }}</b><p class="mt-1 text-xs text-slate-400">Comptes créés</p></div></div>
        <div class="overflow-hidden rounded-[1.75rem] border border-white bg-white/85 shadow-sm"><div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><div><h2 class="font-bold text-navy-900">Demandes d'inscription</h2><p class="text-xs text-slate-500">Examinez les profils et confirmez leur accès à la formation.</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{{ db.inscriptions.length }} dossiers</span></div><div class="overflow-x-auto"><table class="w-full"><thead class="bg-slate-50/80"><tr><th class="th">Candidat</th><th class="th">Formation</th><th class="th">Statut</th><th class="th text-right">Décision</th></tr></thead><tbody><tr v-for="i in db.inscriptions" :key="i.id"><td class="td"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-blue-50 font-bold text-blue-700">{{ i.nom.split(' ').map(x=>x[0]).slice(0,2).join('') }}</span><div><b class="text-navy-900">{{ i.nom }}</b><span class="block text-xs text-slate-500">{{ i.email }}</span><span class="block text-[11px] text-slate-400">{{ i.pays }} · {{ i.telephone }}</span></div></div></td><td class="td">{{ i.formation }}</td><td class="td"><span class="rounded-full px-3 py-1 text-xs font-semibold" :class="i.statut === 'acceptée' ? 'bg-emerald-50 text-emerald-700' : i.statut === 'refusée' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'">{{ i.statut }}</span></td><td class="td text-right whitespace-nowrap"><template v-if="i.statut === 'en attente'"><button class="btn btn-sm mr-2 !rounded-xl" @click="decider(i.id,true)">Accepter</button><button class="btn btn-outline btn-sm !rounded-xl" @click="decider(i.id,false)">Refuser</button></template><span v-else class="text-xs text-slate-400">Décision enregistrée</span></td></tr></tbody></table></div><p class="px-5 py-3 text-xs text-slate-400">Un compte étudiant est créé à l’acceptation (mot de passe provisoire : mfa1234).</p></div>
      </section>

      <!-- ETUDIANTS -->
      <section v-if="tab === 'Étudiants'" class="space-y-5">
        <template v-if="suivi">
          <div class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm sm:p-6">
            <button type="button" class="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700" @click="suiviId = null"><Icon :d="ic.back" class="!h-4 !w-4" />Retour à la liste des étudiants</button>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-center gap-4">
                <span class="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">{{ initiales(suivi.name) }}</span>
                <div><p class="text-xs font-bold uppercase tracking-widest text-emerald-600">Progression de l'étudiant</p><h2 class="mt-1 text-2xl font-bold text-navy-900">{{ suivi.name }}</h2><p class="text-sm text-slate-500">{{ suivi.formation }}</p></div>
              </div>
              <div class="min-w-52 rounded-2xl bg-slate-50 p-4">
                <div class="flex items-center justify-between text-xs"><span class="font-semibold text-slate-600">Heures réalisées</span><b class="text-navy-900">{{ suivi.done }} / {{ suivi.total }} h</b></div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" :style="{ width: (suivi.total ? Math.min(100, suivi.done / suivi.total * 100) : 0) + '%' }"></div></div>
              </div>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Chapitre actuel</p><b class="mt-1 block text-navy-900">{{ posActuelle ? 'Chapitre ' + String(posActuelle.mi + 1).padStart(2, '0') + ' · ' + posActuelle.module.titre : 'Pas encore commencé' }}</b></div>
              <div class="rounded-2xl border border-amber-100 bg-amber-50/60 p-4"><p class="text-[11px] font-bold uppercase tracking-wider text-amber-700">Cours actuel</p><b class="mt-1 block text-navy-900">{{ posActuelle ? 'Cours ' + String(posActuelle.ci + 1).padStart(2, '0') + ' · ' + posActuelle.cours.titre : '—' }}</b></div>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div><h3 class="text-lg font-bold text-navy-900">Parcours de formation</h3><p class="mt-1 text-xs text-slate-500">Les cours avant le cours actuel sont considérés comme terminés.</p></div>
                <span v-if="sessionActuelle" class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Cours actuel déduit de la dernière session non terminée</span>
              </div>
              <p v-if="!parcours.length" class="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucun cours n'a encore été créé. Ajoutez des modules et des cours dans la rubrique « Les modules ».</p>
              <div v-for="(m, mi) in db.modules" :key="m.id" class="mt-5">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Chapitre {{ String(mi + 1).padStart(2, '0') }} · {{ m.titre }}</h4>
                <p v-if="!m.cours.length" class="mt-2 text-xs text-slate-400">Aucun cours dans ce chapitre.</p>
                <ul class="mt-2 space-y-2">
                  <li v-for="(c, ci) in m.cours" :key="c.id" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3" :class="statutCours(m, c) === 'en cours' ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white'">
                    <div class="flex min-w-0 items-center gap-3">
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold" :class="statutCours(m, c) === 'terminé' ? 'bg-emerald-50 text-emerald-700' : statutCours(m, c) === 'en cours' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'">{{ statutCours(m, c) === 'terminé' ? '✓' : String(ci + 1).padStart(2, '0') }}</span>
                      <div class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ c.titre }}</b><span class="text-[11px] text-slate-400">{{ c.duree }} h</span></div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="rounded-full px-2.5 py-1 text-[10px] font-bold" :class="statutCours(m, c) === 'terminé' ? 'bg-emerald-50 text-emerald-700' : statutCours(m, c) === 'en cours' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'">{{ statutCours(m, c) }}</span>
                      
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div class="space-y-5">
              <form class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm" @submit.prevent="envoyerDevoirSuivi">
                <div class="mb-4"><p class="text-xs font-bold uppercase tracking-widest text-violet-600">Nouveau devoir</p><h3 class="mt-1 text-lg font-bold text-navy-900">Ajouter un devoir</h3><p class="text-xs text-slate-500">L'étudiant sera notifié par e-mail et dans son espace.</p></div>
                <div class="space-y-3">
                  <label class="block text-xs font-semibold text-slate-700">Titre du devoir <span class="text-rose-500">*</span><input v-model="devoirEtu.titre" required class="input mt-1.5 !rounded-xl" placeholder="Ex. : Ratios de liquidité" /></label>
                  <label class="block text-xs font-semibold text-slate-700">Cours associé <span class="font-normal text-slate-400">(l'étudiant le verra dans ce cours)</span><select v-model="devoirEtu.coursRef" class="input mt-1.5 !rounded-xl"><option value="">Aucun cours</option><option v-for="c in coursOptions" :key="c.ref" :value="c.ref">{{ c.label }}</option></select></label>
                  <label class="block text-xs font-semibold text-slate-700">Description du devoir <span class="text-rose-500">*</span><textarea v-model="devoirEtu.description" required rows="4" class="input mt-1.5 !rounded-xl" placeholder="Consignes, attendus, critères d'évaluation…"></textarea></label>
                  <label class="block text-xs font-semibold text-slate-700">Date limite <span class="text-rose-500">*</span><input v-model="devoirEtu.delai" type="date" required class="input mt-1.5 !rounded-xl" /></label>
                  <label class="block text-xs font-semibold text-slate-700">Fichier du devoir<input ref="consigneInput" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.ppt,.pptx" class="mt-1.5 block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500" @change="choisirConsigne" /></label>
                </div>
                <p v-if="devoirFeedback" class="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{{ devoirFeedback }}</p>
                <button class="btn mt-4 w-full !rounded-xl">Envoyer le devoir</button>
              </form>
              <div class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm">
                <h3 class="font-bold text-navy-900">Devoirs de {{ suivi.name.split(' ')[0] }}</h3>
                <p v-if="!devoirsSuivi.length" class="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucun devoir pour cet étudiant.</p>
                <ul class="mt-3 space-y-2">
                  <li v-for="d in devoirsSuivi" :key="d.id" class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ d.titre }}</b><span class="text-[11px] text-slate-400">Échéance : {{ d.delai }}</span></div>
                    <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" :class="d.note !== null ? 'bg-emerald-50 text-emerald-700' : d.rendu ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'">{{ d.note !== null ? 'Corrigé · ' + d.note + '/20' : d.rendu ? 'À corriger' : 'En attente' }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
<form class="rounded-[1.75rem] border border-white bg-white/85 p-5 shadow-sm" @submit.prevent="add(nouvel,ajouterEtudiant)"><div class="mb-4"><h2 class="font-bold text-navy-900">Ajouter un étudiant</h2><p class="text-xs text-slate-500">Créez un accès et associez-le à une formation.</p></div><div class="grid gap-3 sm:grid-cols-4"><input v-model="nouvel.name" required placeholder="Nom complet" class="input !rounded-xl"/><input v-model="nouvel.email" type="email" required placeholder="Adresse e-mail" class="input !rounded-xl"/><select v-model="nouvel.formation" required class="input !rounded-xl"><option value="" disabled>Formation</option><option v-for="f in db.formations.filter(x=>x.heures)" :key="f.id">{{ f.titre }}</option></select><button class="btn !rounded-xl">+ Ajouter l'étudiant</button></div></form>
        <div class="grid gap-4 sm:grid-cols-3"><div class="rounded-3xl bg-white/90 p-5 shadow-sm"><p class="text-xs text-slate-500">Étudiants actifs</p><b class="mt-1 block text-3xl text-navy-900">{{ etudiants.length }}</b></div><div class="rounded-3xl bg-white/90 p-5 shadow-sm"><p class="text-xs text-slate-500">Heures effectuées</p><b class="mt-1 block text-3xl text-navy-900">{{ heuresFaites }} h</b></div><div class="rounded-3xl bg-white/90 p-5 shadow-sm"><p class="text-xs text-slate-500">Progression globale</p><b class="mt-1 block text-3xl text-navy-900">{{ heuresTotal ? Math.round(heuresFaites/heuresTotal*100) : 0 }} %</b></div></div>
        <div class="overflow-hidden rounded-[1.75rem] border border-white bg-white/85 shadow-sm"><div class="border-b border-slate-100 px-5 py-4"><h2 class="font-bold text-navy-900">Suivi des étudiants</h2><p class="text-xs text-slate-500">Ajustez les heures réalisées et visualisez les progressions.</p></div><div class="overflow-x-auto"><table class="w-full"><thead class="bg-slate-50"><tr><th class="th">Étudiant</th><th class="th">Formation</th><th class="th">Progression</th><th class="th">Heures réalisées</th><th class="th">Restantes</th><th class="th text-right">Actions</th></tr></thead><tbody><tr v-for="e in etudiants" :key="e.id"><td class="td"><b class="text-navy-900">{{ e.name }}</b><span class="block text-xs text-slate-500">{{ e.email }}</span></td><td class="td">{{ e.formation }}</td><td class="td min-w-36"><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" :style="{width:(e.total?Math.min(100,e.done/e.total*100):0)+'%'}"></div></div><span class="mt-1 block text-[11px] text-slate-400">{{ e.total ? Math.round(e.done/e.total*100) : 0 }} %</span></td><td class="td"><input type="number" min="0" :max="e.total" :value="e.done" class="input !w-24 !rounded-lg" @change="majHeures(e.id,$event.target.value)"/> / {{ e.total }} h</td><td class="td font-semibold text-navy-900">{{ heures(e.total-e.done) }} h</td><td class="td"><div class="flex items-center justify-end gap-2"><button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100" :title="'Voir la progression de ' + e.name" :aria-label="'Voir la progression de ' + e.name" @click="ouvrirSuivi(e)"><Icon :d="ic.cap" /></button><button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100" :title="'Modifier ' + e.name" :aria-label="'Modifier ' + e.name" @click="ouvrirEdition(e)"><Icon :d="ic.pencil" /></button><button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-100" :title="'Supprimer ' + e.name" :aria-label="'Supprimer ' + e.name" @click="retirerEtudiant(e)"><Icon :d="ic.trash" /></button></div></td></tr></tbody></table></div></div>
        </template>
      </section>

      <!-- SESSIONS -->
      <section v-if="tab === 'Sessions'" class="space-y-6">
        <!-- Bandeau -->
        <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#10284a] via-[#1b3f6b] to-[#2c6a8f] p-6 text-white shadow-[0_18px_55px_rgba(15,39,72,.18)] sm:p-8">
          <div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"></div>
          <div class="relative flex flex-wrap items-end justify-between gap-6">
            <div class="max-w-xl">
              <p class="text-xs font-bold uppercase tracking-[.22em] text-amber-300">Organisation pédagogique</p>
              <h2 class="mt-2 text-3xl font-bold tracking-tight">Planning des sessions</h2>
              <p class="mt-2 text-sm leading-6 text-blue-100">Pour chaque cours, programmez une session avec l'étudiant concerné ou consultez les jours déjà planifiés.</p>
            </div>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="k in [{ l: 'Sessions', v: db.sessions.length }, { l: 'À venir', v: sessionsAVenir.length }, { l: 'Visio', v: db.sessions.filter((s) => s.mode === 'Visio').length }, { l: 'Présentiel', v: db.sessions.filter((s) => s.mode === 'Présentiel').length }]" :key="k.l" class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><b class="block text-2xl leading-none">{{ k.v }}</b><span class="mt-1.5 block text-[11px] text-blue-100">{{ k.l }}</span></div>
            </div>
          </div>
        </div>

        <p v-if="sessionToast" class="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status"><Icon :d="ic.check" class="!h-4 !w-4" />{{ sessionToast }}</p>

        <div class="grid items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
          <!-- Liste des modules et de leurs cours -->
          <div class="space-y-5">
            <div v-if="!db.modules.length" class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
              <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-2xl text-amber-600">▦</span>
              <h3 class="mt-4 font-bold text-navy-900">Aucun module pour le moment</h3>
              <p class="mt-1 text-sm text-slate-500">Créez des modules et des cours dans la rubrique « Les modules » pour pouvoir y programmer des sessions.</p>
              <button type="button" class="btn mt-5 !rounded-xl" @click="choisirTab('Les modules')">Aller aux modules</button>
            </div>
            <article v-for="(m, mi) in db.modules" :key="m.id" class="overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-sm">
              <button type="button" class="flex w-full items-start gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 text-left transition hover:bg-indigo-50/50" :aria-expanded="modulesOuverts.includes(m.id)" @click="toggleModuleOuvert(m.id)">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">{{ String(mi + 1).padStart(2, '0') }}</span>
                <div class="min-w-0 flex-1"><h3 class="font-bold text-navy-900">{{ m.titre }}</h3><p v-if="m.description" class="mt-0.5 line-clamp-1 text-xs text-slate-500">{{ m.description }}</p></div>
                <span class="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{{ m.cours.length }} cours</span><span class="ml-1 text-slate-400 transition-transform" :class="modulesOuverts.includes(m.id) ? 'rotate-180' : ''">⌄</span>
              </button>
              <div v-if="modulesOuverts.includes(m.id)">
              <p v-if="!m.cours.length" class="px-5 py-6 text-sm text-slate-400">Aucun cours dans ce module.</p>
              <ul v-else class="divide-y divide-slate-100">
                <li v-for="(c, ci) in m.cours" :key="c.id" class="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-amber-50/30">
                  <div class="flex min-w-0 items-center gap-3">
                    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">{{ String(ci + 1).padStart(2, '0') }}</span>
                    <div class="min-w-0">
                      <b class="block truncate text-sm text-navy-900">{{ c.titre }}</b>
                      <span class="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-slate-400"><span>◷ {{ c.duree }} h</span><span :class="sessionsDuCours(m, c).length ? 'font-semibold text-amber-700' : ''">{{ sessionsDuCours(m, c).length ? sessionsDuCours(m, c).length + ' session(s) programmée(s)' : 'Aucune session' }}</span></span>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn btn-gold btn-sm gap-1.5 !rounded-xl" @click="ouvrirProg(m, c)"><Icon :d="ic.calendarPlus" class="!h-4 !w-4" />Programmer la session</button>
                    <button type="button" class="btn btn-outline btn-sm gap-1.5 !rounded-xl" @click="voirSel = { moduleId: m.id, coursId: c.id }"><Icon :d="ic.eye" class="!h-4 !w-4" />Voir les sessions</button>
                  </div>
                </li>
              </ul>
              </div>
            </article>
          </div>

          <!-- Agenda -->
          <aside class="space-y-5 xl:sticky xl:top-24">
            <div class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm">
              <div class="mb-4 flex items-center justify-between"><div><h3 class="font-bold text-navy-900">Prochaines sessions</h3><p class="text-xs text-slate-500">Toutes formations confondues</p></div><span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{{ sessionsAVenir.length }}</span></div>
              <p v-if="!prochaines.length" class="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-400">Aucune session à venir.</p>
              <div class="space-y-3"><SessionRow v-for="s in prochaines" :key="s.id" :session="s" role="prof" :nom-etudiant="nom(s.etudiantId)" /></div>
            </div>
            <div v-if="sessionsAutres.length" class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm">
              <div class="mb-4"><h3 class="font-bold text-navy-900">Autres sessions</h3><p class="text-xs text-slate-500">Sessions sans cours rattaché</p></div>
              <div class="space-y-3"><SessionRow v-for="s in sessionsAutres" :key="s.id" :session="s" role="prof" :nom-etudiant="nom(s.etudiantId)" /></div>
            </div>
          </aside>
        </div>

        <!-- Fenêtre : programmer la session -->
        <div v-if="coursProg" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Programmer une session" @click.self="progSel = null">
          <form class="w-full max-w-2xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl" @submit.prevent="enregistrerSession">
            <div class="flex items-start justify-between gap-4 bg-gradient-to-r from-[#10284a] to-[#2c6a8f] px-6 py-5 text-white">
              <div class="flex items-center gap-4"><span class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Icon :d="ic.calendarPlus" class="!h-6 !w-6" /></span><div><p class="text-xs font-bold uppercase tracking-widest text-amber-300">Programmer la session</p><h2 class="text-lg font-bold">{{ coursProg.cours.titre }}</h2><p class="text-xs text-blue-100">{{ coursProg.module.titre }}</p></div></div>
              <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20" aria-label="Fermer" @click="progSel = null"><Icon :d="ic.close" class="!h-4 !w-4" /></button>
            </div>
            <div class="space-y-6 p-6">
              <div>
                <div class="mb-3 flex items-center gap-2"><span class="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">1</span><h3 class="text-sm font-bold text-navy-900">Étudiant concerné <span class="text-rose-500">*</span></h3></div>
                <p v-if="!etudiants.length" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Aucun étudiant inscrit pour le moment.</p>
                <div class="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="radiogroup" aria-label="Étudiant concerné">
                  <button v-for="e in etudiants" :key="e.id" type="button" role="radio" :aria-checked="session.etudiantId === e.id" class="flex items-center gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/30" :class="session.etudiantId === e.id ? 'border-gold-500 bg-amber-50 shadow-sm ring-2 ring-amber-100' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'" @click="session.etudiantId = e.id">
                    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold" :class="session.etudiantId === e.id ? 'bg-gold-500 text-navy-900' : 'bg-white text-slate-600 ring-1 ring-slate-200'">{{ session.etudiantId === e.id ? '✓' : initiales(e.name) }}</span>
                    <span class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ e.name }}</b><span class="block truncate text-[11px] text-slate-500">{{ heures(e.total - e.done) }} h restantes</span></span>
                  </button>
                </div>
              </div>
              <div>
                <div class="mb-3 flex items-center gap-2"><span class="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">2</span><h3 class="text-sm font-bold text-navy-900">Date, heure et durée</h3></div>
                <label class="mb-4 block"><span class="field-label">Titre de la session <span class="text-rose-500">*</span></span><input v-model="session.titre" required class="field" placeholder="Ex. : Lecture du bilan" /></label>
                <div class="grid gap-4 sm:grid-cols-3">
                  <label class="block"><span class="field-label">Date <span class="text-rose-500">*</span></span><span class="relative block"><Icon :d="ic.calendar" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input v-model="session.date" type="date" required :min="aujourdhui" class="field field-icon" /></span><span v-if="session.date" class="mt-1.5 block text-xs font-semibold text-amber-700">{{ dateFr(session.date) }}</span></label>
                  <label class="block"><span class="field-label">Heure <span class="text-rose-500">*</span></span><span class="relative block"><Icon :d="ic.clock" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input v-model="session.heure" type="time" required class="field field-icon" /></span></label>
                  <div><span class="field-label">Durée (heures) <span class="text-rose-500">*</span></span>
                    <div class="flex items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-1 transition focus-within:border-gold-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-gold-500/20">
                      <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-white hover:shadow-sm" aria-label="Diminuer la durée" @click="changerDuree(-0.5)"><Icon :d="ic.minus" class="!h-4 !w-4" /></button>
                      <input v-model.number="session.duree" type="number" min="0.5" step="0.5" required aria-label="Durée en heures" class="w-full min-w-0 bg-transparent text-center text-sm font-bold text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition hover:bg-white hover:shadow-sm" aria-label="Augmenter la durée" @click="changerDuree(0.5)"><Icon :d="ic.plus" class="!h-4 !w-4" /></button>
                    </div>
                  </div>
                </div>
                <fieldset class="mt-4"><legend class="field-label">Mode</legend>
                  <div class="grid grid-cols-2 gap-3">
                    <label v-for="m in [{ v: 'Visio', i: ic.video }, { v: 'Présentiel', i: ic.users }]" :key="m.v" class="cursor-pointer">
                      <input v-model="session.mode" type="radio" name="mode-session" :value="m.v" class="peer sr-only" />
                      <span class="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white peer-checked:border-gold-500 peer-checked:bg-amber-50 peer-checked:text-amber-800 peer-focus-visible:ring-4 peer-focus-visible:ring-gold-500/30"><Icon :d="m.i" class="!h-4 !w-4" />{{ m.v }}</span>
                    </label>
                  </div>
                </fieldset>
              </div>
              <div>
                <div class="mb-3 flex items-center gap-2"><span class="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">3</span><h3 class="text-sm font-bold text-navy-900">Accès à la formation <span class="font-normal text-slate-400">(facultatif)</span></h3></div>
                <label class="block"><span class="field-label">Lien de la session</span><span class="relative block"><Icon :d="ic.link" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input v-model="session.lien" type="url" pattern="https?://.+" title="Le lien doit commencer par http:// ou https://" class="field field-icon" placeholder="https://meet.google.com/…" /></span><span class="mt-1.5 block text-[11px] text-slate-400">Quand vous et l'étudiant cliquez sur ce lien, la durée de la session est décomptée de ses heures restantes.</span></label>
              </div>
              <p v-if="sessionErreur" class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{{ sessionErreur }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <p class="text-xs text-slate-400"><span class="text-rose-500">*</span> Champs obligatoires</p>
              <div class="flex gap-2"><button type="button" class="btn btn-outline !rounded-xl" @click="progSel = null">Annuler</button><button class="btn btn-gold gap-2 !rounded-xl !px-6"><Icon :d="ic.check" class="!h-4 !w-4" />Programmer la session</button></div>
            </div>
          </form>
        </div>

        <!-- Fenêtre : voir les sessions du cours, par étudiant -->
        <div v-if="coursVoir" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Sessions du cours" @click.self="voirSel = null">
          <div class="w-full max-w-2xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-4 bg-gradient-to-r from-[#33245f] to-[#6842a1] px-6 py-5 text-white">
              <div class="flex items-center gap-4"><span class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Icon :d="ic.calendar" class="!h-6 !w-6" /></span><div><p class="text-xs font-bold uppercase tracking-widest text-violet-200">Sessions du cours</p><h2 class="text-lg font-bold">{{ coursVoir.cours.titre }}</h2><p class="text-xs text-violet-100">{{ coursVoir.module.titre }} · {{ groupesVoir.reduce((n, g) => n + g.sessions.length, 0) }} session(s)</p></div></div>
              <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20" aria-label="Fermer" @click="voirSel = null"><Icon :d="ic.close" class="!h-4 !w-4" /></button>
            </div>
            <div class="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              <div v-if="!groupesVoir.length" class="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Icon :d="ic.calendar" /></span><p class="mt-3 text-sm font-semibold text-slate-700">Aucune session programmée pour ce cours</p><button type="button" class="btn btn-gold btn-sm mt-4 gap-1.5 !rounded-xl" @click="ouvrirProg(coursVoir.module, coursVoir.cours); voirSel = null"><Icon :d="ic.calendarPlus" class="!h-4 !w-4" />Programmer la session</button></div>
              <section v-for="g in groupesVoir" :key="g.id">
                <div class="mb-3 flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">{{ initiales(g.nom) }}</span><div class="min-w-0 flex-1"><b class="block truncate text-navy-900">{{ g.nom }}</b><span class="text-xs text-slate-500">{{ g.sessions.length }} session(s) · {{ heures(g.restantes) }} h restantes</span></div></div>
                <div class="space-y-3"><SessionRow v-for="s in g.sessions" :key="s.id" :session="s" role="prof" /></div>
              </section>
            </div>
            <div v-if="groupesVoir.length" class="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4"><button type="button" class="btn btn-gold btn-sm gap-1.5 !rounded-xl" @click="ouvrirProg(coursVoir.module, coursVoir.cours); voirSel = null"><Icon :d="ic.calendarPlus" class="!h-4 !w-4" />Programmer une session</button></div>
          </div>
        </div>
      </section>

      <!-- DEVOIRS -->
      <section v-if="tab === 'Devoirs'" class="space-y-5">
        <div class="rounded-[1.75rem] bg-gradient-to-r from-[#33245f] to-[#6842a1] p-6 text-white"><p class="text-xs font-bold uppercase tracking-widest text-violet-200">Espace pédagogique privé</p><h2 class="mt-1 text-2xl font-bold">Devoirs & corrections</h2><p class="mt-1 text-sm text-violet-100">Sélectionnez un étudiant pour retrouver tous les devoirs envoyés et les travaux remis.</p><div class="mt-5 flex gap-3"><span class="rounded-2xl bg-white/10 px-4 py-3"><b class="block text-2xl">{{ db.devoirs.length }}</b><small class="text-violet-100">Devoirs</small></span><span class="rounded-2xl bg-white/10 px-4 py-3"><b class="block text-2xl">{{ devoirsRendus.length }}</b><small class="text-violet-100">Rendus reçus</small></span></div></div>
        <div class="grid min-h-[650px] overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-[0_18px_55px_rgba(15,39,72,.08)] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside class="border-b border-slate-100 bg-slate-50/70 lg:border-b-0 lg:border-r"><div class="border-b border-slate-100 p-5"><h3 class="font-bold text-navy-900">Mes étudiants</h3><p class="mt-1 text-xs text-slate-500">Historique individuel des devoirs</p></div><div class="max-h-[650px] space-y-1 overflow-y-auto p-3"><button v-for="e in etudiantsDevoirsChat" :key="e.id" type="button" class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white" :class="devoirChatEtudiantId===e.id?'bg-white shadow-sm ring-1 ring-violet-100':''" @click="devoirChatEtudiantId=e.id; devoir.etudiantId=e.id; devoirOuvert=null"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">{{ initiales(e.name) }}</span><span class="min-w-0 flex-1"><b class="block truncate text-sm text-navy-900">{{ e.name }}</b><small class="text-slate-400">{{ e.nb }} devoir(s) · {{ e.rendus }} rendu(s)</small></span><span v-if="e.rendus" class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700">{{ e.rendus }}</span></button><p v-if="!etudiantsDevoirsChat.length" class="p-4 text-sm text-slate-500">Aucun étudiant inscrit.</p></div></aside>
          <div class="flex min-w-0 flex-col">
            <template v-if="devoirChatEtudiantId">
              <header class="flex items-center gap-3 border-b border-slate-100 bg-white p-5"><span class="grid h-11 w-11 place-items-center rounded-full bg-violet-100 font-bold text-violet-700">{{ initiales(nom(devoirChatEtudiantId)) }}</span><div><b class="block text-sm text-navy-900">{{ nom(devoirChatEtudiantId) }}</b><small class="text-slate-400">Conversation de devoirs · {{ devoirsChat.length }} élément(s)</small></div></header>
              <div class="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#f4f7fb] p-4 sm:p-5">
                <div v-if="!devoirsChat.length" class="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Aucun devoir dans cet historique. Vous pouvez envoyer le premier devoir ci-dessous.</div>
                <article v-for="d in devoirsChat" :key="d.id" class="rounded-2xl border border-white bg-white p-4 shadow-sm"><div class="flex flex-wrap items-start justify-between gap-3"><div><span class="text-[10px] font-bold uppercase tracking-wider text-violet-600">{{ d.rendu ? 'Travail remis par l’étudiant' : 'Devoir envoyé par le professeur' }}</span><h4 class="mt-1 font-bold text-navy-900">{{ d.titre }}</h4><p v-if="nomCours(d.coursRef)" class="mt-1 text-xs font-semibold text-violet-600">{{ nomCours(d.coursRef) }}</p><p class="mt-1 text-xs text-slate-400">Échéance : {{ d.delai }}</p></div><span class="rounded-full px-3 py-1 text-[10px] font-bold" :class="d.note!==null?'bg-emerald-50 text-emerald-700':d.rendu?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-500'">{{ d.note!==null?'Corrigé · '+d.note+'/20':d.rendu?'À corriger':'En attente' }}</span></div><p v-if="d.description" class="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{{ d.description }}</p><div v-if="(d.consignes?.length || d.consigne)" class="mt-3 flex flex-wrap gap-2"><button v-for="(f,i) in (d.consignes?.length ? d.consignes : [d.consigne])" :key="i" type="button" class="rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700" @click="fichierVu=f">📎 {{ f.nom }}</button></div><div v-if="rendusDe(d).length" class="mt-3 space-y-2"><div v-for="(r,i) in rendusDe(d)" :key="i" class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/70 p-3"><div><b class="text-xs text-navy-900">Rendu étudiant · envoi {{ i+1 }}</b><p class="mt-1 whitespace-pre-wrap text-xs text-slate-600">{{ r.description || 'Commentaire non renseigné' }}</p></div><button v-if="r.fichier" type="button" class="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-indigo-700" @click="ouvrirDevoir(d); renduIdx=i">Voir le fichier ↗ {{ r.fichier.nom }}</button></div></div><div class="mt-3 flex flex-wrap justify-end gap-2"><button v-if="d.rendu" type="button" class="btn btn-outline btn-sm !rounded-xl" @click="ouvrirDevoir(d)">Ouvrir la copie & corriger</button><span v-if="d.note!==null" class="self-center text-xs font-semibold text-emerald-700">Note : {{ d.note }}/20 · {{ d.appreciation }}</span></div></article>
              </div>
              <form class="border-t border-slate-100 bg-white p-4" @submit.prevent="publierDevoirChat"><div class="mb-3"><p class="text-xs font-bold uppercase tracking-wider text-violet-600">Nouveau devoir à envoyer</p><p class="text-xs text-slate-500">Le devoir sera associé à {{ nom(devoirChatEtudiantId) }}.</p></div><div class="grid gap-3 sm:grid-cols-2"><input v-model="devoir.titre" required placeholder="Titre / consigne du devoir" class="input !rounded-xl"/><input v-model="devoir.delai" type="date" required class="input !rounded-xl"/><select v-model="devoir.coursRef" class="input !rounded-xl"><option value="">Cours associé (facultatif)</option><option v-for="c in coursOptions" :key="c.ref" :value="c.ref">{{ c.label }}</option></select><textarea v-model="devoir.description" rows="2" placeholder="Instructions et commentaire du professeur…" class="input !rounded-xl"/></div><label class="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 hover:border-violet-300"><span class="text-xl">📎</span><span class="min-w-0 flex-1"><b class="block text-sm text-navy-900">Ajouter un ou plusieurs fichiers</b><small class="text-slate-500">Word, PDF, PowerPoint ou images</small></span><input ref="devoirConsignesInput" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" class="max-w-[180px] text-xs" @change="choisirDevoirConsignes"/></label><p v-if="devoirConsignes.length" class="mt-2 text-xs text-emerald-700">{{ devoirConsignes.length }} fichier(s) prêt(s) : {{ devoirConsignes.map(f=>f.nom).join(', ') }}</p><button class="btn mt-3 !rounded-xl" :disabled="!devoir.titre.trim() || !devoir.delai">Envoyer le devoir à l’étudiant</button></form>
            </template><div v-else class="grid flex-1 place-items-center p-8 text-center"><div><span class="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-50 text-3xl text-violet-600">▤</span><h3 class="mt-4 font-bold text-navy-900">Sélectionnez un étudiant</h3><p class="mt-1 text-sm text-slate-500">Son historique de devoirs et les rendus s’afficheront ici.</p></div></div>
          </div>
        </div>
        <div v-if="devoirOuvert" class="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-sm"><button class="mb-4 text-sm font-semibold text-indigo-700" @click="devoirOuvert=null">← Fermer la copie</button><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-violet-600">Copie de l'étudiant</p><h2 class="mt-1 text-2xl font-bold text-navy-900">{{ devoirOuvert.titre }}</h2><p class="mt-1 text-sm text-slate-500">{{ nom(devoirOuvert.etudiantId) }} · Échéance : {{ devoirOuvert.delai }}</p></div></div><div class="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><div class="min-h-72 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div v-if="rendusOuvert.length>1" class="mb-3 flex flex-wrap gap-2"><button v-for="(r,i) in rendusOuvert" :key="i" type="button" class="rounded-full border px-3 py-1 text-xs" @click="renduIdx=i">Envoi {{ i+1 }}</button></div><div class="mb-3 flex items-center justify-between"><b class="text-sm">Visionneur de fichier</b><a v-if="renduVu?.fichier" :href="fichierUrl" :download="renduVu.fichier.nom" class="text-xs font-semibold text-indigo-700">Télécharger ↧</a></div><img v-if="fichierImage" :src="fichierUrl" class="mx-auto max-h-[560px] object-contain"/><iframe v-else-if="fichierPdf" :src="fichierUrl" class="h-[560px] w-full rounded-xl bg-white" title="Aperçu du rendu PDF"/><div v-else-if="renduVu?.fichier" class="rounded-xl bg-white p-6 text-center"><p class="font-semibold">{{ renduVu.fichier.nom }}</p><a :href="fichierUrl" :download="renduVu.fichier.nom" class="btn mt-3 !rounded-xl">Télécharger</a></div><p v-else class="text-sm text-slate-500">{{ devoirOuvert.rendu }}</p></div><div class="space-y-4"><div class="rounded-2xl bg-blue-50 p-4"><b class="text-sm text-navy-900">Commentaire de l’étudiant</b><p class="mt-2 whitespace-pre-wrap text-sm text-slate-600">{{ renduVu?.description || 'Aucun commentaire ajouté.' }}</p></div><form class="rounded-2xl border p-4" @submit.prevent="corriger(devoirOuvert)"><b class="text-sm">Correction et note /20</b><label class="mt-3 block text-xs font-semibold">Note sur 20<input v-model="corr[devoirOuvert.id+'n']" type="number" min="0" max="20" step="0.5" required class="input mt-1.5 !rounded-xl"/></label><label class="mt-3 block text-xs font-semibold">Commentaire du professeur<textarea v-model="corr[devoirOuvert.id+'a']" rows="4" class="input mt-1.5 !rounded-xl" placeholder="Appréciation pédagogique…"/></label><button class="btn mt-4 w-full !rounded-xl">Enregistrer la note</button></form></div></div></div>
        <FileViewer v-if="fichierVu" :fichier="fichierVu" @close="fichierVu=null" />
      </section>

      <section v-if="tab === 'Messages'" class="space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><p class="text-xs font-bold uppercase tracking-widest text-sky-600">Communication</p><h2 class="mt-1 text-2xl font-bold text-navy-900">Messagerie</h2><p class="mt-1 text-sm text-slate-500">Choisissez un étudiant dans le menu pour démarrer ou reprendre la conversation.</p></div>
          <span class="rounded-full px-3 py-1.5 text-xs font-bold" :class="messagesNonLus ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'">{{ messagesNonLus }} message(s) non lu(s)</span>
        </div>
        <div class="grid h-[72vh] min-h-[520px] grid-rows-[minmax(0,1fr)] overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-[0_18px_55px_rgba(15,39,72,.08)] md:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="min-h-0 flex-col border-r border-slate-100 bg-slate-50/70" :class="chatId ? 'hidden md:flex' : 'flex'">
            <div class="border-b border-slate-100 p-4"><input v-model="chatRecherche" type="search" class="input !rounded-xl" placeholder="Rechercher un étudiant…" aria-label="Rechercher un étudiant" /></div>
            <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              <p v-if="!contacts.length" class="p-4 text-sm text-slate-500">Aucun étudiant trouvé.</p>
              <button v-for="c in contacts" :key="c.id" type="button" class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white" :class="chatId === c.id ? 'bg-white shadow-sm ring-1 ring-sky-100' : ''" @click="ouvrirChat(c.id)">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white">{{ initiales(c.name) }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2"><b class="truncate text-sm text-navy-900">{{ c.name }}</b><span class="shrink-0 text-[10px] text-slate-400">{{ c.dernier ? (c.dernier.heure || c.dernier.date.slice(5)) : '' }}</span></div>
                  <p class="mt-0.5 truncate text-xs" :class="c.nonLus ? 'font-semibold text-slate-700' : 'text-slate-500'">{{ c.dernier ? (c.dernier.expediteurId === c.id ? '' : 'Vous : ') + c.dernier.texte : 'Aucun message' }}</p>
                </div>
                <span v-if="c.nonLus" class="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white" :aria-label="c.nonLus + ' message(s) non lu(s)'">{{ c.nonLus }}</span>
              </button>
            </div>
          </aside>
          <div class="min-h-0 min-w-0 flex-col" :class="chatId ? 'flex' : 'hidden md:flex'">
            <template v-if="chatEtudiant">
              <div class="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
                <button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 md:hidden" aria-label="Retour à la liste" @click="chatId = null"><Icon :d="ic.back" class="!h-4 !w-4" /></button>
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white">{{ initiales(chatEtudiant.name) }}</span>
                <div class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ chatEtudiant.name }}</b><span class="block truncate text-[11px] text-slate-400">{{ chatEtudiant.formation }}</span></div>
              </div>
              <div ref="chatZone" class="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f7fb] p-4 sm:p-5">
                <p v-if="!chatMessages.length" class="rounded-2xl bg-white p-5 text-center text-sm text-slate-500">Aucun message pour le moment. Écrivez le premier ci-dessous.</p>
                <template v-for="m in chatMessages" :key="m.id">
                  <div v-if="m.nouveauJour" class="text-center"><span class="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">{{ dateFr(m.date) }}</span></div>
                  <div class="flex" :class="m.expediteurId === chatId ? 'justify-start' : 'justify-end'">
                    <div class="max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm" :class="m.expediteurId === chatId ? 'rounded-tl-md bg-white text-slate-700' : 'rounded-tr-md bg-navy-900 text-white'">
                      <p class="whitespace-pre-wrap break-words text-sm leading-6">{{ m.texte }}</p>
                      <span class="mt-1 block text-right text-[10px]" :class="m.expediteurId === chatId ? 'text-slate-400' : 'text-blue-200'">{{ m.heure || '' }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <form class="flex items-end gap-2 border-t border-slate-100 bg-white p-3" @submit.prevent="envoyerChat">
                <textarea v-model="chatTexte" rows="1" class="input max-h-32 min-h-[44px] flex-1 resize-none !rounded-2xl" placeholder="Écrivez votre message…" aria-label="Votre message" @keydown.enter.exact.prevent="envoyerChat"></textarea>
                <button class="btn !h-11 !w-11 shrink-0 !rounded-2xl !p-0 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Envoyer le message" :disabled="!chatTexte.trim()"><Icon :d="ic.send" /></button>
              </form>
            </template>
            <div v-else class="grid flex-1 place-items-center p-8 text-center">
              <div><span class="grid mx-auto h-16 w-16 place-items-center rounded-3xl bg-sky-50 text-3xl text-sky-600">✉</span><h3 class="mt-4 font-bold text-navy-900">Sélectionnez un étudiant</h3><p class="mt-1 text-sm text-slate-500">Choisissez un étudiant dans le menu de gauche pour entamer la conversation.</p></div>
            </div>
          </div>
        </div>
      </section>

      <!-- COACHING -->

      <!-- ANALYTICS -->
      <section v-if="tab === 'Analytics'" class="space-y-5"><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><div v-for="item in [{l:'Étudiants',v:etudiants.length,s:'Apprenants inscrits'},{l:'Moyenne générale',v:moyenneGenerale+'/20',s:'Résultats évalués'},{l:'Devoirs rendus',v:tauxRemise+' %',s:'Taux de remise'},{l:'Heures effectuées',v:heures(heuresFaites)+' h',s:'Sur '+heuresTotal+' h prévues'},{l:'Heures restantes',v:heures(heuresTotal-heuresFaites)+' h',s:'Tous étudiants confondus'}]" :key="item.l" class="rounded-3xl border border-white bg-white/90 p-5 shadow-sm"><p class="text-xs text-slate-500">{{ item.l }}</p><b class="mt-2 block text-3xl text-navy-900">{{ item.v }}</b><p class="mt-1 text-xs text-slate-400">{{ item.s }}</p></div></div><div class="grid gap-5 lg:grid-cols-3"><div class="rounded-[1.75rem] border border-white bg-white p-5 lg:col-span-3"><div class="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 class="font-bold text-navy-900">Heures restantes par étudiant</h2><p class="text-xs text-slate-500">Mis à jour automatiquement quand le professeur et l'étudiant rejoignent une session.</p></div></div><p v-if="!etudiants.length" class="text-sm text-slate-400">Aucun étudiant.</p><div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div v-for="e in etudiants" :key="e.id" class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div class="flex items-center justify-between gap-2"><b class="truncate text-sm text-navy-900">{{ e.name }}</b><span class="shrink-0 text-xs text-slate-400">{{ heures(e.done) }} / {{ e.total }} h</span></div><div class="mt-3 flex items-end justify-between"><span class="text-3xl font-bold leading-none text-navy-900">{{ heures(e.total - e.done) }}<small class="ml-1 text-sm font-semibold text-slate-400">h restantes</small></span></div><div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" :style="{ width: (e.total ? Math.min(100, (e.total - e.done) / e.total * 100) : 0) + '%' }"></div></div></div></div></div><div class="rounded-[1.75rem] border border-white bg-white p-5"><h2 class="font-bold text-navy-900">Volume horaire réalisé</h2><div class="mt-4 flex justify-center"><Donut :value="heuresTotal?Math.round(heuresFaites/heuresTotal*100):0"/></div></div><div class="rounded-[1.75rem] border border-white bg-white p-5 lg:col-span-2"><h2 class="mb-4 font-bold text-navy-900">Progression par étudiant</h2><BarChart :items="progressions" :max="100" suffix=" %"/></div><div class="rounded-[1.75rem] border border-white bg-white p-5 lg:col-span-2"><h2 class="mb-4 font-bold text-navy-900">Moyenne par étudiant</h2><BarChart :items="moyennes" :max="20"/></div><div class="rounded-[1.75rem] border border-white bg-white p-5"><h2 class="mb-4 font-bold text-navy-900">Demandes d'inscription</h2><BarChart :items="parStatut" :max="Math.max(1,...parStatut.map(x=>x.value))"/></div></div></section>

      <!-- EMAILS -->
      <section v-if="tab === 'E-mails'" class="space-y-4"><div class="rounded-[1.75rem] bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white"><p class="text-xs font-bold uppercase tracking-widest text-slate-300">Centre de messagerie</p><h2 class="mt-1 text-2xl font-bold">Journal des e-mails</h2><p class="mt-1 text-sm text-slate-300">Suivez les notifications et les communications générées par la plateforme.</p><b class="mt-4 block text-3xl">{{ db.outbox.length }} <span class="text-sm font-normal text-slate-300">messages journalisés</span></b></div><div class="overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-sm"><p class="border-b border-slate-100 px-5 py-4 text-xs text-slate-500">Les e-mails partent réellement si <code>VITE_MAIL_API</code> est configuré (voir src/mail.js).</p><div class="overflow-x-auto"><table class="w-full"><thead class="bg-slate-50"><tr><th class="th">Date</th><th class="th">Destinataire</th><th class="th">Objet</th><th class="th">Message</th></tr></thead><tbody><tr v-for="m in [...db.outbox].reverse()" :key="m.id"><td class="td whitespace-nowrap">{{ m.date }}</td><td class="td">{{ m.to }}</td><td class="td font-semibold text-navy-900">{{ m.sujet }}</td><td class="td text-slate-600">{{ m.corps }}</td></tr></tbody></table></div></div></section>
    </div>
  </main>
    <div v-if="editionId" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Modifier l'étudiant" @click.self="editionId = null">
      <form class="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl" @submit.prevent="sauverEdition">
        <div class="mb-5 flex items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-widest text-indigo-600">Étudiant</p><h2 class="mt-1 text-xl font-bold text-navy-900">Modifier les informations</h2></div><button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Fermer" @click="editionId = null"><Icon :d="ic.close" class="!h-4 !w-4" /></button></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-xs font-semibold text-slate-700">Nom complet <span class="text-rose-500">*</span><input v-model="edition.name" required class="input mt-1.5 !rounded-xl" /></label>
          <label class="block text-xs font-semibold text-slate-700">Adresse e-mail <span class="text-rose-500">*</span><input v-model="edition.email" type="email" required class="input mt-1.5 !rounded-xl" /></label>
          <label class="block text-xs font-semibold text-slate-700">Pays<select v-model="edition.pays" class="input mt-1.5 !rounded-xl"><option value="">Non renseigné</option><option v-for="p in countries" :key="p.iso" :value="p.name">{{ p.name }}</option></select></label>
          <label class="block text-xs font-semibold text-slate-700">Téléphone<input v-model="edition.telephone" type="tel" class="input mt-1.5 !rounded-xl" /></label>
          <label class="block text-xs font-semibold text-slate-700 sm:col-span-2">Formation<select v-model="edition.formation" class="input mt-1.5 !rounded-xl"><option v-for="f in db.formations.filter((x) => x.heures)" :key="f.id" :value="f.titre">{{ f.titre }}</option></select></label>
        </div>
        <p v-if="editionErreur" class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ editionErreur }}</p>
        <div class="mt-5 flex justify-end gap-2"><button type="button" class="btn btn-outline !rounded-xl" @click="editionId = null">Annuler</button><button class="btn !rounded-xl">Enregistrer</button></div>
      </form>
    </div>
    <FileViewer v-if="fichierVu" :fichier="fichierVu" @close="fichierVu = null" />
</template>
