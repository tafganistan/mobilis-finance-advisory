<script setup>
// Visionneur de fichiers : image, PDF, vidéo, audio et texte s'affichent directement.
// Les autres formats (Word, PowerPoint…) proposent le téléchargement.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Icon from './Icon.vue'
import { ic } from '../icons'

const props = defineProps({ fichier: { type: Object, required: true } })
const emit = defineEmits(['close'])

const genre = ref('chargement') // chargement | image | pdf | video | audio | texte | autre | erreur
const url = ref('')
const texte = ref('')
let blobUrl = ''
let jeton = 0

const extension = (nom = '') => nom.toLowerCase().split('.').pop()
function detecter(f) {
  const t = (f.type || '').toLowerCase()
  const e = extension(f.nom)
  if (t.startsWith('image/')) return 'image'
  if (t === 'application/pdf' || e === 'pdf') return 'pdf'
  if (t.startsWith('video/')) return 'video'
  if (t.startsWith('audio/')) return 'audio'
  if (t.startsWith('text/') || ['txt', 'md', 'csv', 'json'].includes(e)) return 'texte'
  return 'autre'
}
function liberer() {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = ''
  url.value = ''
  texte.value = ''
}
async function charger(f) {
  const mon = ++jeton
  liberer()
  genre.value = 'chargement'
  const g = detecter(f)
  try {
    if (g === 'autre') { genre.value = g; return }
    const brut = await (await fetch(f.data)).blob()
    if (mon !== jeton) return
    if (g === 'texte') texte.value = await brut.text()
    else {
      const type = g === 'pdf' ? 'application/pdf' : f.type || brut.type
      blobUrl = URL.createObjectURL(new Blob([brut], { type }))
      url.value = blobUrl
    }
    genre.value = g
  } catch {
    if (mon === jeton) genre.value = 'erreur'
  }
}
function taille(n) {
  if (!n) return ''
  return n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1048576).toFixed(1)} Mo`
}
const onKey = (e) => { if (e.key === 'Escape') emit('close') }

watch(() => props.fichier, (f) => f && charger(f), { immediate: true })
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); jeton++; liberer() })
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" :aria-label="'Lecture de ' + fichier.nom" @click.self="emit('close')">
      <div class="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon :d="ic.file" /></span>
            <div class="min-w-0"><b class="block truncate text-sm text-navy-900">{{ fichier.nom }}</b><span class="text-[11px] text-slate-400">{{ taille(fichier.taille) }}</span></div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <a :href="fichier.data" :download="fichier.nom" class="btn btn-outline btn-sm gap-1.5 !rounded-xl"><Icon :d="ic.download" class="!h-4 !w-4" />Télécharger</a>
            <button type="button" class="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-navy-900" aria-label="Fermer" @click="emit('close')"><Icon :d="ic.close" class="!h-4 !w-4" /></button>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-4">
          <p v-if="genre === 'chargement'" class="grid min-h-64 place-items-center text-sm text-slate-500">Chargement du document…</p>
          <img v-else-if="genre === 'image'" :src="url" :alt="fichier.nom" class="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain" />
          <iframe v-else-if="genre === 'pdf'" :src="url" :title="'Lecture de ' + fichier.nom" class="h-[75vh] w-full rounded-xl bg-white"></iframe>
          <video v-else-if="genre === 'video'" :src="url" controls class="mx-auto max-h-[75vh] max-w-full rounded-xl bg-black"></video>
          <div v-else-if="genre === 'audio'" class="grid min-h-48 place-items-center"><audio :src="url" controls class="w-full max-w-xl"></audio></div>
          <pre v-else-if="genre === 'texte'" class="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white p-5 text-sm leading-6 text-slate-700">{{ texte }}</pre>
          <div v-else class="grid min-h-64 place-items-center rounded-xl bg-white p-6 text-center">
            <div>
              <span class="text-5xl">📄</span>
              <p class="mt-3 font-semibold text-navy-900">{{ fichier.nom }}</p>
              <p class="mx-auto mt-1 max-w-sm text-xs text-slate-500">{{ genre === 'erreur' ? 'Le document n’a pas pu être lu.' : 'Ce format (Word, PowerPoint…) ne peut pas être lu directement dans le navigateur. Téléchargez-le pour l’ouvrir.' }}</p>
              <a :href="fichier.data" :download="fichier.nom" class="btn mt-4 !rounded-xl">Télécharger le document</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
