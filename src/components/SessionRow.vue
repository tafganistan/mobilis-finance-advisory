<script setup>
import { computed } from 'vue'
import { marquerClicSession, dateFr } from '../store'
import Icon from './Icon.vue'
import { ic } from '../icons'

// Une session : date (jour mois année), horaire, durée, mode et lien pour rejoindre.
// role = 'prof' ou 'etudiant' : c'est celui qui clique sur le lien. Quand les deux ont cliqué,
// la durée de la session est décomptée des heures restantes de l'étudiant.
const props = defineProps({
  session: { type: Object, required: true },
  role: { type: String, required: true },
  nomEtudiant: { type: String, default: '' },
})
const s = computed(() => props.session)
const jour = computed(() => s.value.date?.slice(8, 10))
const mois = computed(() => (s.value.date ? new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(`${s.value.date}T12:00:00`)).replace('.', '') : ''))
const aujourdhui = () => new Date().toLocaleDateString('sv-SE')
const statut = computed(() => {
  if (s.value.heuresDecomptees) return { label: 'Effectuée', cls: 'bg-emerald-50 text-emerald-700' }
  if (s.value.date < aujourdhui()) return { label: 'Passée', cls: 'bg-slate-100 text-slate-500' }
  if (s.value.date === aujourdhui()) return { label: 'Aujourd’hui', cls: 'bg-amber-100 text-amber-800' }
  return { label: 'À venir', cls: 'bg-indigo-50 text-indigo-700' }
})
const duree = computed(() => s.value.duree ?? 1)
const autreRole = computed(() => (props.role === 'prof' ? 'étudiant' : 'professeur'))
const moiClique = computed(() => (props.role === 'prof' ? s.value.clicProf : s.value.clicEtudiant))
const autreClique = computed(() => (props.role === 'prof' ? s.value.clicEtudiant : s.value.clicProf))
const rejoindre = () => marquerClicSession(s.value.id, props.role)
</script>

<template>
  <article class="flex flex-wrap items-stretch gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,39,72,.04)] transition hover:border-amber-200 hover:shadow-md">
    <div class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 text-center">
      <div><b class="block text-2xl leading-none text-orange-700">{{ jour }}</b><span class="mt-1 block text-[10px] font-bold uppercase tracking-wider text-orange-500">{{ mois }}</span></div>
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <b class="text-sm text-navy-900">{{ nomEtudiant || s.titre }}</b>
        <span class="rounded-full px-2.5 py-0.5 text-[10px] font-bold" :class="statut.cls">{{ statut.label }}</span>
        <span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">{{ s.mode }}</span>
      </div>
      <p v-if="nomEtudiant" class="mt-0.5 truncate text-xs text-slate-500">{{ s.titre }}</p>
      <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
        <span class="inline-flex items-center gap-1.5"><Icon :d="ic.calendar" class="!h-4 !w-4 text-amber-600" />{{ dateFr(s.date) }}</span>
        <span class="inline-flex items-center gap-1.5"><Icon :d="ic.clock" class="!h-4 !w-4 text-amber-600" />{{ s.heure }} · {{ duree }} h</span>
      </p>
      <p v-if="s.lien && !s.heuresDecomptees" class="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" :class="moiClique ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ moiClique ? '✓ Vous avez rejoint' : 'Vous n’avez pas encore rejoint' }}</span>
        <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5" :class="autreClique ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ autreClique ? '✓ ' : '' }}{{ autreRole.charAt(0).toUpperCase() + autreRole.slice(1) }} {{ autreClique ? 'a rejoint' : 'en attente' }}</span>
      </p>
      <p v-if="s.heuresDecomptees" class="mt-2 text-[11px] font-semibold text-emerald-700">✓ {{ duree }} h décomptée(s) des heures de l’étudiant</p>
    </div>
    <a v-if="s.lien" :href="s.lien" target="_blank" rel="noopener noreferrer" class="btn btn-sm w-full gap-1.5 self-center !rounded-xl sm:w-auto" @click="rejoindre">{{ role === 'prof' ? 'Entrer dans la formation' : 'Rejoindre la formation' }}<Icon :d="ic.external" class="!h-3.5 !w-3.5" /></a>
  </article>
</template>
