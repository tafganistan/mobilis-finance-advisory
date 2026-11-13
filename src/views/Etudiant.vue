<script setup>
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { db, modifierProfilEtudiant, changerMotDePasseEtudiant, envoyerMessage, lireNotificationsType, typeNotif, rendusDe, dateFr as dateFrStore } from '../store'
import Donut from '../components/Donut.vue'
import BarChart from '../components/BarChart.vue'
import Topbar from '../components/Topbar.vue'
import SessionRow from '../components/SessionRow.vue'
import DevoirEtudiant from '../components/DevoirEtudiant.vue'
import FileViewer from '../components/FileViewer.vue'
import Icon from '../components/Icon.vue'
import { ic } from '../icons'
import { countries } from '../data/countries'

const me = computed(() => db.users.find((u) => u.id === db.session.id))
const profId = computed(() => db.users.find((u) => u.role === 'prof')?.id)
const tabs = [
  { label: 'Profil', icon: '▤', tone: 'from-indigo-500 to-violet-600', hint: 'Mes informations' },
  { label: 'Cours', icon: '▦', tone: 'from-indigo-500 to-violet-600', hint: 'Modules & contenus' },
  { label: 'Sessions', icon: '▣', tone: 'from-orange-400 to-rose-500', hint: 'Planning des cours' },
  { label: 'Devoirs', icon: '▤', tone: 'from-violet-500 to-purple-700', hint: 'Travaux & notes' },
  { label: 'Messages', icon: '✉', tone: 'from-sky-500 to-cyan-600', hint: 'Échanges directs' },
  { label: 'Analytics', icon: '▥', tone: 'from-amber-400 to-orange-600', hint: 'Indicateurs clés' },
  { label: 'E-mails', icon: '⌁', tone: 'from-slate-500 to-slate-700', hint: 'Mes notifications' },
]
const tab = ref('Profil')
const heures = (n) => Math.round((Number(n) || 0) * 100) / 100
const dateFr = (date) => dateFrStore(date) || 'Date à confirmer'
const aujourdhui = () => new Date().toLocaleDateString('sv-SE')
const sessions = computed(() => db.sessions.filter((s) => s.etudiantId === me.value.id).sort((a, b) => `${a.date} ${a.heure || ''}`.localeCompare(`${b.date} ${b.heure || ''}`)))
const devoirs = computed(() => db.devoirs.filter((d) => d.etudiantId === me.value.id))
const progression = computed(() => (me.value.total ? Math.round((me.value.done / me.value.total) * 100) : 0))
const heuresRestantes = computed(() => heures(Math.max(0, me.value.total - me.value.done)))
const notes = computed(() => devoirs.value.filter((d) => d.note !== null))
const moyenne = computed(() => (notes.value.length ? (notes.value.reduce((t, d) => t + d.note, 0) / notes.value.length).toFixed(1) : '—'))
const tauxRemise = computed(() => (devoirs.value.length ? Math.round((devoirs.value.filter((d) => rendusDe(d).length).length / devoirs.value.length) * 100) : 0))
const courbe = computed(() => notes.value.map((d) => ({ label: d.titre, value: d.note })))
const profil = reactive({ name: '', email: '', pays: '', telephone: '', formation: '' })
const profilFeedback = ref('')
const profilError = ref(false)
const passwordForm = reactive({ ancien: '', nouveau: '', confirmation: '' })
const passwordFeedback = ref('')
const passwordError = ref(false)
function sauvegarderMotDePasse() { if (passwordForm.nouveau !== passwordForm.confirmation) { passwordFeedback.value = 'La confirmation ne correspond pas au nouveau mot de passe.'; passwordError.value = true; return } const r = changerMotDePasseEtudiant(me.value.id, passwordForm.ancien, passwordForm.nouveau); passwordFeedback.value = r.message; passwordError.value = !r.ok; if (r.ok) Object.assign(passwordForm, { ancien: '', nouveau: '', confirmation: '' }) }
watch(me, (u) => { if (u) Object.assign(profil, { name: u.name || '', email: u.email || '', pays: u.pays || '', telephone: u.telephone || '', formation: u.formation || '' }) }, { immediate: true })
function sauvegarderProfil() { const r = modifierProfilEtudiant(me.value.id, profil); profilFeedback.value = r.message; profilError.value = !r.ok }
const notifications = computed(() => db.notifications.filter((n) => n.userId === me.value.id).slice().reverse())

// ---------- Sessions : chapitres → cours → (session | devoirs) ----------
const modules = computed(() => db.modules)
const nbCours = computed(() => modules.value.reduce((n, m) => n + (m.cours?.length || 0), 0))
const sessionsAVenir = computed(() => sessions.value.filter((s) => s.date >= aujourdhui()))
const chapitreOuvert = ref(null) // id du chapitre déplié
const coursSel = ref(null) // { moduleId, coursId }
const vueCours = ref('') // 'session' | 'devoirs'
const fichierVu = ref(null)
const refCours = (m, c) => `${m.id}:${c.id}`
const sessionsDuCours = (m, c) => sessions.value.filter((s) => s.coursRef === refCours(m, c) || (!s.coursRef && s.titre?.trim().toLowerCase() === c.titre.trim().toLowerCase()))
const devoirsDuCours = (m, c) => devoirs.value.filter((d) => d.coursRef === refCours(m, c))
const devoirsARendre = (m, c) => devoirsDuCours(m, c).filter((d) => !rendusDe(d).length).length
const prochaineSession = (m, c) => sessionsDuCours(m, c).find((s) => s.date >= aujourdhui()) || null
const sessionsDuChapitre = (m) => (m.cours || []).reduce((n, c) => n + sessionsDuCours(m, c).length, 0)
const estCoursSel = (m, c) => coursSel.value?.moduleId === m.id && coursSel.value?.coursId === c.id
function toggleChapitre(m) { chapitreOuvert.value = chapitreOuvert.value === m.id ? null : m.id; coursSel.value = null; vueCours.value = '' }
function choisirCours(m, c) { if (estCoursSel(m, c)) { coursSel.value = null } else { coursSel.value = { moduleId: m.id, coursId: c.id } } vueCours.value = '' }
function basculerVue(v) { vueCours.value = vueCours.value === v ? '' : v }
function changerTab(label) { tab.value = label; coursSel.value = null; vueCours.value = ''; profilFeedback.value = '' }
const nomFichier = (f) => f?.nom || 'Document pédagogique'
const nomCours = (r) => { const [mid, cid] = String(r || '').split(':').map(Number); const m = db.modules.find((x) => x.id === mid); const c = m?.cours?.find((x) => x.id === cid); return c ? `${m.titre} · ${c.titre}` : '' }

// ---------- Messages : conversation individuelle avec le professeur ----------
const nouveauMessage = ref('')
const chatZone = ref(null)
const messages = computed(() => db.messages.filter((m) => m.to === me.value.id || (m.to === profId.value && m.expediteurId === me.value.id)).slice().sort((a, b) => a.id - b.id))
const conversation = computed(() => { let prev = ''; return messages.value.map((m) => { const nouveauJour = m.date !== prev; prev = m.date; return { ...m, nouveauJour } }) })
const messagesNonLus = computed(() => db.notifications.filter((n) => n.userId === me.value.id && !n.lu && typeNotif(n) === 'message').length)
const pastilles = computed(() => ({ Messages: messagesNonLus.value }))
function descendre() { nextTick(() => { if (chatZone.value) chatZone.value.scrollTop = chatZone.value.scrollHeight }) }
function envoyer() { const t = nouveauMessage.value.trim(); if (!t || !profId.value) return; envoyerMessage(profId.value, t, me.value.id); nouveauMessage.value = ''; descendre() }
// Conversation ouverte : les nouveaux messages du professeur sont aussitôt « lus »
watch([tab, messagesNonLus], () => { if (tab.value === 'Messages' && messagesNonLus.value) lireNotificationsType(me.value.id, 'message') }, { immediate: true })
watch(() => messages.value.length, descendre)
watch(tab, (t) => { if (t === 'Messages') descendre() })
</script>

<template>
  <Topbar />
  <main class="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(201,162,39,.10),_transparent_35%),linear-gradient(180deg,#f4f7fb_0%,#eef2f8_100%)] px-4 py-7 sm:px-6">
    <div class="mx-auto max-w-7xl">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p class="text-xs font-bold uppercase tracking-[.24em] text-amber-700">Tableau de bord · MFA</p><h1 class="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Espace étudiant</h1><p class="mt-2 text-sm text-slate-500">Retrouvez vos cours, vos échanges et le suivi de votre formation.</p></div>
        <div class="rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm shadow-sm"><b class="block text-lg text-navy-900">{{ me.name }}</b><span class="text-xs text-slate-500">{{ me.formation }}</span></div>
      </section>

      <nav class="mb-8 rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-[0_18px_55px_rgba(15,39,72,.07)] backdrop-blur-xl sm:p-5" aria-label="Rubriques étudiant">
        <div class="mb-4 flex items-center justify-between"><div><h2 class="font-semibold text-navy-900">Vos applications</h2><p class="text-xs text-slate-500">Sélectionnez votre espace de travail</p></div><span class="hidden rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 sm:inline">ESPACE ÉTUDIANT</span></div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <button v-for="t in tabs" :key="t.label" @click="changerTab(t.label)" class="group flex min-w-0 flex-col items-center rounded-2xl border p-3 text-center transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-lg" :class="tab === t.label ? 'border-amber-300 bg-white shadow-[0_8px_25px_rgba(201,162,39,.16)] ring-2 ring-amber-100' : 'border-transparent bg-white/45'"><span class="relative grid h-12 w-12 place-items-center rounded-[17px] bg-gradient-to-br text-2xl font-semibold text-white shadow-md transition group-hover:scale-105" :class="t.tone">{{ t.icon }}<span v-if="pastilles[t.label]" class="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[11px] font-bold leading-none text-white shadow" :aria-label="pastilles[t.label] + ' non lu(s)'">{{ pastilles[t.label] > 99 ? '99+' : pastilles[t.label] }}</span></span><span class="mt-2 text-xs font-bold text-navy-900">{{ t.label }}</span><span class="mt-1 hidden text-[10px] text-slate-400 xl:block">{{ t.hint }}</span></button>
        </div>
      </nav>

      <section v-if="tab === 'Profil'" class="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <div class="rounded-[1.75rem] bg-gradient-to-br from-[#142f51] to-[#244d78] p-7 text-white shadow-lg"><span class="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-3xl">♙</span><p class="mt-6 text-xs font-bold uppercase tracking-[.2em] text-amber-300">Mon espace personnel</p><h2 class="mt-2 text-2xl font-bold">Bonjour {{ me.name.split(' ')[0] }} !</h2><p class="mt-2 text-sm leading-6 text-blue-100">Gardez vos coordonnées à jour pour faciliter le suivi de votre formation et les communications avec MFA.</p><div class="mt-7 grid grid-cols-2 gap-3"><div class="rounded-2xl bg-white/10 p-4"><b class="text-2xl">{{ progression }}%</b><p class="mt-1 text-xs text-blue-100">Progression</p></div><div class="rounded-2xl bg-white/10 p-4"><b class="text-2xl">{{ moyenne }}<small v-if="notes.length" class="text-sm">/20</small></b><p class="mt-1 text-xs text-blue-100">Moyenne</p></div></div></div>
        <form class="rounded-[1.75rem] border border-white bg-white/90 p-6 shadow-sm sm:p-7" @submit.prevent="sauvegarderProfil"><div class="mb-5"><p class="text-xs font-bold uppercase tracking-widest text-indigo-600">Informations personnelles</p><h2 class="mt-1 text-xl font-bold text-navy-900">Modifier mon profil</h2><p class="mt-1 text-sm text-slate-500">Ces informations correspondent à celles fournies lors de votre inscription.</p></div><div class="grid gap-4 sm:grid-cols-2"><label class="text-xs font-semibold text-slate-600">Nom complet<input v-model="profil.name" required autocomplete="name" class="input mt-1.5 !rounded-xl"/></label><label class="text-xs font-semibold text-slate-600">Adresse e-mail<input v-model="profil.email" type="email" required autocomplete="email" class="input mt-1.5 !rounded-xl"/></label><label class="text-xs font-semibold text-slate-600">Pays<select v-model="profil.pays" required class="input mt-1.5 !rounded-xl"><option value="" disabled>Choisissez votre pays</option><option v-for="p in countries" :key="p.iso" :value="p.name">{{ p.name }}</option></select></label><label class="text-xs font-semibold text-slate-600">Téléphone<input v-model="profil.telephone" type="tel" required autocomplete="tel" class="input mt-1.5 !rounded-xl"/></label><label class="text-xs font-semibold text-slate-600 sm:col-span-2">Formation<select v-model="profil.formation" disabled class="input mt-1.5 !rounded-xl !bg-slate-100 !text-slate-500"><option v-for="f in db.formations" :key="f.id" :value="f.titre">{{ f.titre }}</option></select></label></div><p v-if="profilFeedback" class="mt-4 rounded-xl px-4 py-3 text-sm" :class="profilError?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'">{{ profilFeedback }}</p><button class="btn mt-5 !rounded-xl">Enregistrer mes modifications</button></form>
        <form class="rounded-[1.75rem] border border-white bg-white/90 p-6 shadow-sm xl:col-span-2" @submit.prevent="sauvegarderMotDePasse"><div><p class="text-xs font-bold uppercase tracking-widest text-indigo-600">Sécurité du compte</p><h2 class="mt-1 text-xl font-bold text-navy-900">Modifier mon mot de passe</h2><p class="mt-1 text-sm text-slate-500">Votre nouveau mot de passe remplacera définitivement l’ancien accès.</p></div><div class="mt-4 grid gap-4 sm:grid-cols-3"><label class="text-xs font-semibold text-slate-600">Mot de passe actuel<input v-model="passwordForm.ancien" type="password" autocomplete="current-password" required class="input mt-1.5 !rounded-xl"/></label><label class="text-xs font-semibold text-slate-600">Nouveau mot de passe<input v-model="passwordForm.nouveau" type="password" autocomplete="new-password" minlength="8" required class="input mt-1.5 !rounded-xl"/></label><label class="text-xs font-semibold text-slate-600">Confirmer le nouveau mot de passe<input v-model="passwordForm.confirmation" type="password" autocomplete="new-password" minlength="8" required class="input mt-1.5 !rounded-xl"/></label></div><p v-if="passwordFeedback" class="mt-4 rounded-xl px-4 py-3 text-sm" :class="passwordError?'bg-rose-50 text-rose-700':'bg-emerald-50 text-emerald-700'">{{ passwordFeedback }}</p><button class="btn mt-4 !rounded-xl">Mettre à jour mon mot de passe</button></form>
      </section>

      <section v-else-if="tab === 'Sessions'" class="space-y-6">
        <div class="rounded-[1.75rem] bg-gradient-to-br from-[#10284a] via-[#1b3f6b] to-[#2c6a8f] p-6 text-white shadow-lg sm:p-8">
          <p class="text-xs font-bold uppercase tracking-[.22em] text-amber-300">Votre planning</p><h2 class="mt-2 text-3xl font-bold">Mes sessions programmées</h2><p class="mt-2 text-sm leading-6 text-blue-100">Retrouvez les rendez-vous planifiés par votre professeur, classés par date.</p>
          <div class="mt-5 flex flex-wrap gap-3"><span class="rounded-2xl bg-white/10 px-4 py-3"><b class="block text-2xl">{{ sessions.length }}</b><small class="text-blue-100">Sessions au total</small></span><span class="rounded-2xl bg-white/10 px-4 py-3"><b class="block text-2xl">{{ sessionsAVenir.length }}</b><small class="text-blue-100">À venir</small></span></div>
        </div>
        <div v-if="!sessions.length" class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center"><span class="text-4xl">▣</span><h3 class="mt-3 font-bold text-navy-900">Aucune session programmée</h3><p class="mt-1 text-sm text-slate-500">Votre professeur affichera ici les prochaines séances.</p></div>
        <div v-else class="space-y-3"><article v-for="s in sessions" :key="s.id" class="rounded-[1.5rem] border border-white bg-white/90 p-5 shadow-sm"><div class="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p class="text-[11px] font-bold uppercase tracking-wider text-amber-700">{{ s.date >= aujourdhui() ? 'Session à venir' : 'Session passée' }}</p><h3 class="mt-1 text-lg font-bold text-navy-900">{{ nomCours(s.coursRef) || s.titre }}</h3></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{{ s.mode || 'Session' }}</span></div><SessionRow :session="s" role="etudiant" /></article></div>
      </section>

      <section v-else-if="tab === 'Cours'" class="space-y-6">
        <!-- Bandeau -->
        <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#10284a] via-[#1b3f6b] to-[#2c6a8f] p-6 text-white shadow-[0_18px_55px_rgba(15,39,72,.18)] sm:p-8">
          <div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"></div>
          <div class="relative flex flex-wrap items-end justify-between gap-6">
            <div class="max-w-xl">
              <p class="text-xs font-bold uppercase tracking-[.22em] text-amber-300">Parcours pédagogique</p>
              <h2 class="mt-2 text-3xl font-bold tracking-tight">Ma bibliothèque de cours</h2>
              <p class="mt-2 text-sm leading-6 text-blue-100">Explorez les modules de votre formation, ouvrez chaque module pour retrouver ses cours et leurs ressources.</p>
            </div>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="k in [{ l: 'Chapitres', v: modules.length }, { l: 'Cours', v: nbCours }, { l: 'Sessions à venir', v: sessionsAVenir.length }, { l: 'Heures restantes', v: heuresRestantes + ' h' }]" :key="k.l" class="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"><b class="block text-2xl leading-none">{{ k.v }}</b><span class="mt-1.5 block text-[11px] text-blue-100">{{ k.l }}</span></div>
            </div>
          </div>
        </div>

        <div v-if="!modules.length" class="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-2xl text-amber-600">▦</span>
          <h3 class="mt-4 font-bold text-navy-900">Vos chapitres arrivent bientôt</h3>
          <p class="mt-1 text-sm text-slate-500">Les chapitres de votre formation seront affichés ici dès qu'ils seront ajoutés par votre professeur.</p>
        </div>

        <article v-for="(m, index) in modules" :key="m.id" class="overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-sm">
          <!-- Chapitre -->
          <button type="button" class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50/70" :aria-expanded="chapitreOuvert === m.id" @click="toggleChapitre(m)">
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="min-w-0 flex-1"><b class="block text-lg text-navy-900">{{ m.titre }}</b><span v-if="m.description" class="mt-0.5 line-clamp-1 text-xs text-slate-500">{{ m.description }}</span>
              <span class="mt-1.5 flex flex-wrap gap-2 text-[11px]"><span class="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600">{{ m.cours?.length || 0 }} cours</span><span v-if="sessionsDuChapitre(m)" class="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">{{ sessionsDuChapitre(m) }} session(s) programmée(s)</span></span>
            </span>
            <Icon :d="ic.chevron" class="!h-5 !w-5 text-slate-400 transition-transform duration-200" :class="chapitreOuvert === m.id ? 'rotate-180' : ''" />
          </button>

          <div v-if="chapitreOuvert === m.id" class="border-t border-slate-100">
            <p v-if="!m.cours?.length" class="px-5 py-6 text-sm text-slate-400">Les cours de ce chapitre seront bientôt disponibles.</p>
            <ul v-else class="divide-y divide-slate-100">
              <li v-for="(c, ci) in m.cours" :key="c.id">
                <!-- Cours -->
                <button type="button" class="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left transition hover:bg-amber-50/40" :class="estCoursSel(m, c) ? 'bg-amber-50/60' : ''" :aria-expanded="estCoursSel(m, c)" @click="choisirCours(m, c)">
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold" :class="estCoursSel(m, c) ? 'bg-gold-500 text-navy-900' : 'bg-slate-100 text-slate-500'">{{ String(ci + 1).padStart(2, '0') }}</span>
                  <span class="min-w-0 flex-1"><b class="block truncate text-sm text-navy-900">{{ c.titre }}</b>
                    <span class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400"><span>◷ {{ c.duree }} h</span>
                      <span v-if="prochaineSession(m, c)" class="inline-flex items-center gap-1 font-semibold text-amber-700"><Icon :d="ic.calendar" class="!h-3.5 !w-3.5" />{{ dateFr(prochaineSession(m, c).date) }} · {{ prochaineSession(m, c).heure }}</span>
                      <span v-else-if="sessionsDuCours(m, c).length">{{ sessionsDuCours(m, c).length }} session(s)</span>
                      <span v-if="devoirsARendre(m, c)" class="font-semibold text-violet-600">{{ devoirsARendre(m, c) }} devoir(s) à rendre</span>
                    </span>
                  </span>
                  <span class="text-xs font-bold text-indigo-700">{{ estCoursSel(m, c) ? 'Fermer ↑' : 'Ouvrir →' }}</span>
                </button>

                <!-- Détail du cours -->
                <div v-if="estCoursSel(m, c)" class="space-y-4 bg-slate-50/70 px-5 pb-5 pt-1">
                  <p v-if="c.description" class="whitespace-pre-line text-sm leading-6 text-slate-600">{{ c.description }}</p>
                  <div v-if="c.devoirs?.length" class="flex flex-wrap gap-2">
                    <div v-for="(f, i) in c.devoirs" :key="i" class="inline-flex items-center overflow-hidden rounded-xl bg-white text-xs font-medium text-slate-600 shadow-sm">
                      <button type="button" class="inline-flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700" :title="'Lire ' + nomFichier(f)" @click="fichierVu = f"><Icon :d="ic.eye" class="!h-4 !w-4" />{{ nomFichier(f) }}</button>
                      <a :href="f.data" :download="f.nom" class="border-l border-slate-100 px-2.5 py-2 hover:bg-indigo-50 hover:text-indigo-700" :aria-label="'Télécharger ' + nomFichier(f)"><Icon :d="ic.download" class="!h-4 !w-4" /></a>
                    </div>
                  </div>

                  <!-- Les deux boutons -->
                  <div class="grid gap-3 sm:grid-cols-2">
                    <button type="button" class="flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md" :class="vueCours === 'session' ? 'border-gold-500 bg-amber-50 shadow-md' : 'border-transparent bg-white shadow-sm'" @click="basculerVue('session')">
                      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow"><Icon :d="ic.calendar" class="!h-6 !w-6" /></span>
                      <span class="min-w-0"><b class="block text-sm text-navy-900">Voir la date de la session</b><span class="text-xs text-slate-500">{{ sessionsDuCours(m, c).length ? sessionsDuCours(m, c).length + ' session(s) programmée(s)' : 'Aucune session pour l’instant' }}</span></span>
                    </button>
                    <button type="button" class="flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md" :class="vueCours === 'devoirs' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-transparent bg-white shadow-sm'" @click="basculerVue('devoirs')">
                      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow"><Icon :d="ic.file" class="!h-6 !w-6" /></span>
                      <span class="min-w-0"><b class="block text-sm text-navy-900">Voir les devoirs</b><span class="text-xs text-slate-500">{{ devoirsDuCours(m, c).length ? devoirsDuCours(m, c).length + ' devoir(s)' + (devoirsARendre(m, c) ? ' · ' + devoirsARendre(m, c) + ' à rendre' : '') : 'Aucun devoir pour l’instant' }}</span></span>
                    </button>
                  </div>

                  <!-- Bouton 1 : programme de la session + lien de l'appel -->
                  <div v-if="vueCours === 'session'" class="rounded-2xl border border-amber-100 bg-white p-4">
                    <h4 class="font-bold text-navy-900">Programme de la session</h4>
                    <div v-if="sessionsDuCours(m, c).length" class="mt-3 space-y-3">
                      <p class="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">Cliquez sur « Rejoindre la formation » pour entrer dans la salle. Quand vous et votre professeur avez rejoint la session, sa durée est retirée de vos heures restantes ({{ heuresRestantes }} h actuellement).</p>
                      <SessionRow v-for="s in sessionsDuCours(m, c)" :key="s.id" :session="s" role="etudiant" />
                    </div>
                    <p v-else class="mt-3 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucune session n'a encore été programmée pour ce cours. Vous serez notifié dès que votre professeur en programmera une.</p>
                  </div>

                  <!-- Bouton 2 : devoirs, visionneur et formulaire d'envoi -->
                  <div v-if="vueCours === 'devoirs'" class="space-y-4">
                    <p v-if="!devoirsDuCours(m, c).length" class="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Votre professeur n'a pas encore ajouté de devoir pour ce cours.</p>
                    <DevoirEtudiant v-for="d in devoirsDuCours(m, c)" :key="d.id" :devoir="d" />
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </article>
        <FileViewer v-if="fichierVu" :fichier="fichierVu" @close="fichierVu = null" />
      </section>

      <section v-else-if="tab === 'Devoirs'" class="space-y-5">
        <div class="rounded-[1.75rem] bg-gradient-to-r from-[#33245f] to-[#6842a1] p-6 text-white"><p class="text-xs font-bold uppercase tracking-widest text-violet-200">Travaux & évaluations</p><h2 class="mt-1 text-2xl font-bold">Mes devoirs</h2><p class="mt-1 text-sm text-violet-100">Lisez les consignes, déposez vos travaux et consultez les retours de votre professeur.</p><div class="mt-5 grid max-w-sm grid-cols-2 gap-3"><div class="rounded-2xl bg-white/10 p-3"><b class="text-2xl">{{ devoirs.length }}</b><p class="text-xs text-violet-100">Devoirs reçus</p></div><div class="rounded-2xl bg-white/10 p-3"><b class="text-2xl">{{ notes.length }}</b><p class="text-xs text-violet-100">Devoirs corrigés</p></div></div></div>
        <div v-if="!devoirs.length" class="rounded-3xl bg-white p-8 text-center text-sm text-slate-500">Aucun devoir pour le moment.</div>
        <div v-for="d in devoirs" :key="d.id"><p v-if="nomCours(d.coursRef)" class="mb-1.5 ml-2 text-xs font-bold text-violet-600">{{ nomCours(d.coursRef) }}</p><DevoirEtudiant :devoir="d" /></div>
      </section>

      <section v-else-if="tab === 'Messages'" class="space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><p class="text-xs font-bold uppercase tracking-widest text-sky-600">Communication</p><h2 class="mt-1 text-2xl font-bold text-navy-900">Messagerie</h2><p class="mt-1 text-sm text-slate-500">Discutez directement avec votre professeur.</p></div>
          <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">{{ messages.length }} message(s)</span>
        </div>
        <div class="flex h-[72vh] min-h-[520px] flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white/90 shadow-[0_18px_55px_rgba(15,39,72,.08)]">
          <div class="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
            <span class="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm font-bold text-white">PM<span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span></span>
            <div class="min-w-0"><b class="block truncate text-sm text-navy-900">Professeur MFA</b><span class="block truncate text-[11px] text-slate-400">Votre formateur · {{ me.formation }}</span></div>
          </div>
          <div ref="chatZone" class="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f7fb] p-4 sm:p-5">
            <div v-if="!conversation.length" class="grid h-full place-items-center text-center"><div><span class="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-sky-50 text-3xl text-sky-600">✉</span><h3 class="mt-4 font-bold text-navy-900">Démarrez la conversation</h3><p class="mt-1 text-sm text-slate-500">Une question sur votre formation ? Écrivez à votre professeur ci-dessous.</p></div></div>
            <template v-for="m in conversation" :key="m.id">
              <div v-if="m.nouveauJour" class="text-center"><span class="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400 shadow-sm">{{ dateFr(m.date) }}</span></div>
              <div class="flex" :class="m.expediteurId === me.id ? 'justify-end' : 'justify-start'">
                <div class="max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm" :class="m.expediteurId === me.id ? 'rounded-tr-md bg-navy-900 text-white' : 'rounded-tl-md bg-white text-slate-700'">
                  <p class="whitespace-pre-wrap break-words text-sm leading-6">{{ m.texte }}</p>
                  <span class="mt-1 block text-right text-[10px]" :class="m.expediteurId === me.id ? 'text-blue-200' : 'text-slate-400'">{{ m.heure || '' }}</span>
                </div>
              </div>
            </template>
          </div>
          <form class="flex items-end gap-2 border-t border-slate-100 bg-white p-3" @submit.prevent="envoyer">
            <textarea v-model="nouveauMessage" rows="1" class="input max-h-32 min-h-[44px] flex-1 resize-none !rounded-2xl" placeholder="Écrivez votre message…" aria-label="Votre message" @keydown.enter.exact.prevent="envoyer"></textarea>
            <button class="btn !h-11 !w-11 shrink-0 !rounded-2xl !p-0 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Envoyer le message" :disabled="!nouveauMessage.trim()"><Icon :d="ic.send" /></button>
          </form>
        </div>
      </section>

      <section v-else-if="tab === 'Analytics'" class="space-y-5"><div class="rounded-[1.75rem] bg-gradient-to-r from-[#263b68] to-[#5366a7] p-6 text-white"><p class="text-xs font-bold uppercase tracking-widest text-indigo-200">Tableau de progression</p><h2 class="mt-1 text-2xl font-bold">Mes résultats en un coup d'œil</h2><p class="mt-1 text-sm text-indigo-100">Suivez votre investissement et vos résultats pédagogiques.</p></div><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><div v-for="item in [{l:'Progression',v:progression+' %',s:'Avancement de la formation'},{l:'Heures réalisées',v:heures(me.done)+' h',s:'Sur '+me.total+' h prévues'},{l:'Heures restantes',v:heuresRestantes+' h',s:'À suivre pour terminer la formation'},{l:'Moyenne générale',v:moyenne+(notes.length?'/20':''),s:'Devoirs corrigés'},{l:'Devoirs remis',v:tauxRemise+' %',s:'Taux de remise'}]" :key="item.l" class="rounded-3xl border border-white bg-white/90 p-5 shadow-sm"><p class="text-xs text-slate-500">{{ item.l }}</p><b class="mt-2 block text-3xl text-navy-900">{{ item.v }}</b><p class="mt-1 text-xs text-slate-400">{{ item.s }}</p></div></div><div class="grid gap-5 lg:grid-cols-3"><div class="rounded-[1.75rem] border border-white bg-white p-5"><h3 class="font-bold text-navy-900">Progression de la formation</h3><div class="mt-4 flex justify-center"><Donut :value="progression"/></div></div><div class="rounded-[1.75rem] border border-white bg-white p-5 lg:col-span-2"><h3 class="mb-4 font-bold text-navy-900">Évolution de mes notes</h3><BarChart :items="courbe" :max="20"/></div></div></section>

      <section v-else-if="tab === 'E-mails'" class="space-y-5"><div class="rounded-[1.75rem] bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white"><p class="text-xs font-bold uppercase tracking-widest text-slate-300">Centre de notifications</p><h2 class="mt-1 text-2xl font-bold">Mes notifications</h2><p class="mt-1 text-sm text-slate-300">Retrouvez les informations importantes liées à votre formation.</p><b class="mt-4 block text-3xl">{{ notifications.length }} <span class="text-sm font-normal text-slate-300">notification(s)</span></b></div><div v-if="!notifications.length" class="rounded-3xl bg-white p-8 text-center text-sm text-slate-500">Aucune notification pour le moment.</div><article v-for="n in notifications" :key="n.id" class="rounded-2xl border border-white bg-white/90 p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><div><b class="text-sm text-navy-900">{{ n.sujet }}</b><p class="mt-1 text-sm leading-6 text-slate-600">{{ n.corps }}</p></div><span class="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold text-indigo-700">{{ n.lu?'Lue':'Nouvelle' }}</span></div><p class="mt-3 text-xs text-slate-400">{{ dateFr(n.date) }}</p></article></section>
    </div>
  </main>
</template>
