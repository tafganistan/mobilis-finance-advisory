<script setup>
import { ref } from 'vue'
import Icon from '../components/Icon.vue'
import { ic } from '../icons'

// Fiches de démonstration : remplacez les noms, portraits et parcours par les profils validés.
const currentExpert = ref(0)
const experts = [
  {
    id: 1,
    name: 'Marie Posson',
    role: 'Professionnel de la comptabilité',
    image: '/images/2087d394-cc76-458e-bcbb-7dab3798de5f.png',
    bio: 'Une expérience de terrain au service de la transmission des bonnes pratiques comptables et financières. Ajoutez ici les fonctions exercées, les secteurs d’activité et les réalisations marquantes.',
    items: ['Reporting financier', 'Fiscalité', 'Contrôle de gestion', 'Normes comptables'],
    tag: 'Profil à compléter',
  },
  {
    id: 2,
    name: 'Fred Alberic',
    role: 'Intervenant en finance',
    image: '/images/pot-1.png',
    bio: 'Découvrez son parcours professionnel, ses domaines de spécialisation et les enseignements tirés de ses expériences. Ce texte est un emplacement à personnaliser avec sa biographie validée.',
    items: ['Analyse financière', 'Conseil & stratégie', 'Gestion des risques', 'Parcours ACCA'],
    tag: 'Portrait à ajouter',
  },
  {
    id: 3,
    name: 'Stephanie Kampou',
    role: 'Experte en finance',
    image: '/images/pot-2.png',
    bio: 'Découvrez son parcours professionnel, ses domaines de spécialisation et les enseignements tirés de ses expériences. Ce texte est un emplacement à personnaliser avec sa biographie validée.',
    items: ['Analyse financière', 'Conseil & stratégie', 'Gestion des risques', 'Parcours ACCA'],
    tag: 'Portrait à ajouter',
  },
]

const previousExpert = () => {
  currentExpert.value = Math.max(0, currentExpert.value - 1)
}

const nextExpert = () => {
  currentExpert.value = Math.min(experts.length - 1, currentExpert.value + 1)
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pt-14">
    <section class="mx-auto mb-10 max-w-3xl text-center">
      <span class="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-gold-600">
        <span class="h-1.5 w-1.5 rounded-full bg-gold-500"></span> Rencontres & expertise
      </span>
      <h1 class="mt-5 text-3xl font-bold tracking-tight text-navy-900 md:text-5xl">Témoignages des certifiés ACCA</h1>
      <p class="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">Des professionnels de la finance et de la comptabilité témoignent de l'impact de la certification ACCA dans leur parcours.</p>
    </section>

    <div class="mb-4 flex items-center justify-end gap-3" aria-label="Commandes du carrousel">
      <span class="mr-1 text-xs font-semibold tabular-nums text-slate-400">{{ String(currentExpert + 1).padStart(2, '0') }} / {{ String(experts.length).padStart(2, '0') }}</span>
      <button type="button" @click="previousExpert" :disabled="currentExpert === 0" aria-label="Expert précédent" class="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-navy-900 transition hover:border-gold-500 hover:text-gold-600 disabled:cursor-not-allowed disabled:opacity-35">
        <Icon :d="ic.back" class="h-4 w-4" />
      </button>
      <button type="button" @click="nextExpert" :disabled="currentExpert === experts.length - 1" aria-label="Expert suivant" class="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-navy-900 transition hover:border-gold-500 hover:text-gold-600 disabled:cursor-not-allowed disabled:opacity-35">
        <Icon :d="ic.back" class="h-4 w-4 rotate-180" />
      </button>
    </div>

    <section class="overflow-hidden" aria-label="Carrousel horizontal des experts" aria-roledescription="carrousel">
      <div class="flex transition-transform duration-500 ease-in-out" :style="{ transform: `translateX(-${currentExpert * 100}%)` }">
      <article v-for="(expert, index) in experts" :key="expert.id" class="relative isolate min-h-[390px] w-full shrink-0 overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-br from-white via-[#f3f4f8] to-[#dfe3ec] shadow-[0_18px_55px_-35px_rgba(15,23,42,.35)] md:min-h-[350px]">
        <div class="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl"></div>
        <div class="absolute left-7 top-6 z-20 flex items-center gap-2 text-[10px] font-medium text-slate-500 md:left-9 md:top-7">
          <span class="font-semibold text-navy-900">MFA</span><span class="text-slate-300">/</span><span>Expertise {{ String(index + 1).padStart(2, '0') }}</span>
        </div>
        <div class="absolute right-7 top-6 z-20 hidden text-[10px] font-semibold tracking-wide text-slate-400 sm:block">MOBILIS FINANCE ADVISORY</div>

        <div class="relative grid min-h-[390px] grid-cols-1 items-center px-6 pb-7 pt-16 md:min-h-[350px] md:grid-cols-[1fr_1.05fr_1fr] md:px-8 md:py-10">
          <!-- Indicateurs à gauche, comme les raccourcis de la maquette -->
          <div class="order-2 z-10 grid grid-cols-2 gap-x-3 gap-y-4 md:order-1 md:grid-cols-2 md:gap-x-5 md:gap-y-5">
            <div v-for="(item, i) in expert.items.slice(0, 2)" :key="item" class="flex flex-col items-center text-center md:items-start md:text-left">
              <span class="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm" :class="i === 0 ? 'bg-[#3159e8]' : 'bg-[#8b35d8]'">
                <Icon :d="i === 0 ? ic.cap : ic.monitor" class="h-4 w-4" />
              </span>
              <span class="mt-2 max-w-[130px] text-[10px] font-medium leading-4 text-slate-600">{{ item }}</span>
            </div>
            <div v-for="(item, i) in expert.items.slice(2, 4)" :key="item" class="flex flex-col items-center text-center md:items-start md:text-left">
              <span class="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm" :class="i === 0 ? 'bg-[#273b42]' : 'bg-[#33343a]'">
                <Icon :d="i === 0 ? ic.check : ic.users" class="h-4 w-4" />
              </span>
              <span class="mt-2 max-w-[130px] text-[10px] font-medium leading-4 text-slate-600">{{ item }}</span>
            </div>
          </div>

          <!-- Portrait central, détaché sur un disque sombre comme la référence -->
          <div class="relative order-1 mx-auto flex h-[245px] w-full max-w-[270px] items-end justify-center md:order-2 md:h-[300px] md:max-w-none">
            <div class="absolute bottom-5 left-1/2 h-[205px] w-[205px] -translate-x-1/2 rounded-full bg-[#202126] md:bottom-4 md:h-[245px] md:w-[245px]"></div>
            <template v-if="expert.image">
              <img :src="expert.image" :alt="`Portrait provisoire de ${expert.name}`" class="relative z-10 h-full max-w-full object-contain object-bottom" />
            </template>
            <div v-else class="relative z-10 mb-5 grid h-44 w-44 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-xl md:mb-4 md:h-52 md:w-52">
              <div class="text-center"><Icon :d="ic.user" class="mx-auto h-14 w-14 opacity-80" /><span class="mt-2 block text-[9px] font-semibold uppercase tracking-[.16em]">Portrait à ajouter</span></div>
            </div>
          </div>

          <!-- Présentation à droite -->
          <div class="order-3 z-10 mt-5 text-center md:mt-0 md:pl-3 md:text-left">
            <span class="inline-flex rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-gold-600">{{ expert.tag }}</span>
            <h2 class="mt-3 text-2xl font-bold leading-tight tracking-tight text-navy-900 md:text-[1.8rem]">{{ expert.name }}</h2>
            <p class="mt-1 text-xs font-semibold text-slate-600">{{ expert.role }}</p>
            <p class="mx-auto mt-3 max-w-sm text-xs leading-6 text-slate-500 md:mx-0">{{ expert.bio }}</p>
            <div class="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span class="rounded-full bg-navy-900 px-3 py-1.5 text-[9px] font-bold tracking-wider text-white">ACCA · statut à confirmer</span>
              <span class="rounded-full border border-white bg-white/70 px-3 py-1.5 text-[9px] font-semibold text-slate-500">Finance & comptabilité</span>
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#3159e8]/70 via-gold-500/70 to-[#8b35d8]/70"></div>
      </article>
      </div>
    </section>

  </div>
</template>
