<script setup>
import { computed, ref } from 'vue'
import { soumettreDevoir, rendusDe, dateFr } from '../store'
import FileViewer from './FileViewer.vue'
import Icon from './Icon.vue'
import { ic } from '../icons'

// Un devoir vu par l'étudiant : consigne (avec visionneur), ses envois, et le formulaire « Envoyer le devoir ».
// Il peut envoyer plusieurs fois le même devoir.
const props = defineProps({ devoir: { type: Object, required: true } })
const d = computed(() => props.devoir)
const envois = computed(() => rendusDe(d.value))

const TAILLE_MAX = 2 * 1024 * 1024 // 2 Mo : les fichiers sont stockés dans le navigateur (localStorage)
const EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp']
const description = ref('')
const fichier = ref(null)
const champFichier = ref(null)
const erreur = ref('')
const succes = ref('')
const envoi = ref(false)
const fichierVu = ref(null)

const taille = (n) => (!n ? '' : n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1048576).toFixed(1)} Mo`)
const statut = computed(() => {
  if (d.value.note !== null && d.value.note !== undefined) return { label: `Corrigé · ${d.value.note}/20`, cls: 'bg-emerald-50 text-emerald-700' }
  if (envois.value.length) return { label: `${envois.value.length} envoi(s)`, cls: 'bg-amber-50 text-amber-700' }
  return { label: 'À rendre', cls: 'bg-slate-100 text-slate-600' }
})

function choisir(e) {
  erreur.value = ''
  succes.value = ''
  const f = e.target.files?.[0] || null
  if (!f) { fichier.value = null; return }
  const ext = f.name.toLowerCase().split('.').pop()
  if (!EXTENSIONS.includes(ext)) { erreur.value = 'Format non accepté. Utilisez PDF, Word, PowerPoint ou une image.'; e.target.value = ''; fichier.value = null; return }
  if (f.size > TAILLE_MAX) { erreur.value = `Ce fichier est trop lourd (${taille(f.size)}). Taille maximale : 2 Mo.`; e.target.value = ''; fichier.value = null; return }
  fichier.value = f
}
function envoyer() {
  if (!fichier.value || !description.value.trim() || envoi.value) return
  const f = fichier.value
  envoi.value = true
  const lecteur = new FileReader()
  lecteur.onload = () => {
    soumettreDevoir(d.value.id, { description: description.value.trim(), fichier: { nom: f.name, type: f.type || 'application/octet-stream', taille: f.size, data: lecteur.result } })
    description.value = ''
    fichier.value = null
    if (champFichier.value) champFichier.value.value = ''
    envoi.value = false
    succes.value = 'Votre devoir a bien été envoyé à votre professeur.'
    setTimeout(() => (succes.value = ''), 5000)
  }
  lecteur.onerror = () => { envoi.value = false; erreur.value = 'Le fichier n’a pas pu être lu. Réessayez.' }
  lecteur.readAsDataURL(f)
}
</script>

<template>
  <article class="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_6px_20px_rgba(15,39,72,.05)]">
    <header class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/70 to-white px-5 py-4">
      <div class="flex items-start gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-md"><Icon :d="ic.file" /></span>
        <div><h4 class="font-bold text-navy-900">{{ d.titre }}</h4><p class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Icon :d="ic.calendar" class="!h-3.5 !w-3.5 text-violet-500" />À rendre avant le {{ dateFr(d.delai) || 'date à confirmer' }}</p></div>
      </div>
      <span class="rounded-full px-3 py-1 text-xs font-bold" :class="statut.cls">{{ statut.label }}</span>
    </header>

    <div class="space-y-5 p-5">
      <!-- Consigne du professeur -->
      <div>
        <p v-if="d.description" class="whitespace-pre-line rounded-2xl bg-violet-50/60 p-4 text-sm leading-6 text-slate-600">{{ d.description }}</p>
        <div v-if="d.consignes?.length || d.consigne" class="mt-3 flex flex-wrap items-center gap-2">
          <div v-for="(f, i) in (d.consignes?.length ? d.consignes : [d.consigne])" :key="i" class="inline-flex items-center overflow-hidden rounded-xl bg-violet-50 text-xs font-semibold text-violet-700">
            <button type="button" class="inline-flex items-center gap-2 px-3 py-2.5 transition hover:bg-violet-100" @click="fichierVu = f"><Icon :d="ic.eye" class="!h-4 !w-4" />Lire · {{ f.nom }}</button>
            <a :href="f.data" :download="f.nom" class="border-l border-violet-100 px-3 py-2.5 transition hover:bg-violet-100" :aria-label="'Télécharger ' + f.nom"><Icon :d="ic.download" class="!h-4 !w-4" /></a>
          </div>
        </div>
        <p v-if="!d.description && !d.consigne && !d.consignes?.length" class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Votre professeur n’a pas ajouté de consigne détaillée pour ce devoir.</p>
      </div>

      <!-- Note -->
      <p v-if="d.note !== null && d.note !== undefined" class="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><b>Note : {{ d.note }}/20</b><span v-if="d.appreciation"> — {{ d.appreciation }}</span></p>

      <!-- Mes envois -->
      <div v-if="envois.length">
        <h5 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Mes envois ({{ envois.length }})</h5>
        <ul class="space-y-2">
          <li v-for="(r, i) in envois" :key="r.id + '-' + i" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div class="min-w-0"><b class="text-sm text-navy-900">Envoi n° {{ i + 1 }}</b><span v-if="r.date" class="ml-2 text-[11px] text-slate-400">{{ dateFr(r.date) }}<span v-if="r.heure"> · {{ r.heure }}</span></span><p v-if="r.description" class="mt-1 line-clamp-2 text-xs text-slate-600">{{ r.description }}</p></div>
            <button v-if="r.fichier" type="button" class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50" @click="fichierVu = r.fichier"><Icon :d="ic.eye" class="!h-4 !w-4" />{{ r.fichier.nom }}</button>
          </li>
        </ul>
      </div>

      <!-- Formulaire d'envoi -->
      <form class="rounded-2xl border border-slate-200 bg-slate-50/50 p-5" @submit.prevent="envoyer">
        <div class="mb-4"><h5 class="font-bold text-navy-900">Envoyer le devoir</h5><p class="text-xs text-slate-500">Vous pouvez envoyer plusieurs fichiers pour un même devoir.</p></div>
        <label class="mb-4 block"><span class="field-label">Description du devoir <span class="text-rose-500">*</span></span><textarea v-model="description" required rows="3" class="field" placeholder="Décrivez votre travail, vos remarques…"></textarea></label>
        <div class="mb-4">
          <span class="field-label">Fichier <span class="text-rose-500">*</span> <span class="font-normal normal-case tracking-normal text-slate-400">(Word, PowerPoint, PDF ou image · 2 Mo max)</span></span>
          <label class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed bg-white p-4 transition hover:border-gold-500 hover:bg-amber-50/40 focus-within:ring-4 focus-within:ring-gold-500/20" :class="fichier ? 'border-emerald-300' : 'border-slate-300'">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :class="fichier ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'"><Icon :d="fichier ? ic.check : ic.download" :class="fichier ? '' : 'rotate-180'" /></span>
            <span class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ fichier ? fichier.name : 'Choisir un fichier' }}</b><span class="text-xs text-slate-500">{{ fichier ? taille(fichier.size) + ' · prêt à être envoyé' : 'Cliquez pour parcourir vos fichiers' }}</span></span>
            <input ref="champFichier" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" class="sr-only" @change="choisir" />
          </label>
        </div>
        <p v-if="erreur" class="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{{ erreur }}</p>
        <p v-if="succes" class="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">{{ succes }}</p>
        <button class="btn btn-gold w-full gap-2 !rounded-xl sm:w-auto sm:!px-6" :disabled="!fichier || !description.trim() || envoi"><Icon :d="ic.send" class="!h-4 !w-4" />{{ envoi ? 'Envoi…' : 'Envoyer le devoir' }}</button>
      </form>
    </div>
    <FileViewer v-if="fichierVu" :fichier="fichierVu" @close="fichierVu = null" />
  </article>
</template>
