<script setup>
import { images } from '../config'
import { ic } from '../icons'
import Icon from '../components/Icon.vue'
import Illus from '../components/Illus.vue'

// À personnaliser : nom, titre et présentation du formateur
const formateur = {
  nom: 'Franck AGOU',
  titre: 'Formateur · Expert international certifié ACCA',
  bio: 'Présentez ici le parcours du formateur, son expérience dans le domaine de la finance et sa méthode pédagogique. Ce texte est à remplacer par votre présentation.',
}
const piliers = [
  ['Ressources', 'Des supports clairs pour progresser.'],
  ['Formation', 'Des cours en salle ou à distance.'],
  ['Conseil', 'Un accompagnement sur mesure.'],
]
</script>

<template>
  <section class="relative mx-auto max-w-6xl px-4 pt-14 text-center">
    <!-- arches décoratives -->
    <div class="pointer-events-none absolute left-4 top-40 hidden h-56 w-36 rounded-t-full border border-slate-300/70 lg:block"></div>
    <div class="pointer-events-none absolute right-4 top-6 hidden h-64 w-40 rounded-b-full border border-slate-300/70 lg:block"></div>

    <div class="relative mx-auto w-72">
      <!-- Photo en arche (remplacez via src/config.js) -->
      <div class="h-[26rem] overflow-hidden rounded-t-[9rem] bg-navy-50 img-teach"> </div>
      <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f6f8fb] to-transparent"></div>

      <!-- badge circulaire -->
      <router-link to="/inscription" class="absolute -right-24 -top-2 hidden h-28 w-28 sm:block" aria-label="Me contacter : aller à l’inscription">
        <svg viewBox="0 0 100 100" class="h-full w-full animate-[spin_16s_linear_infinite] motion-reduce:animate-none" aria-hidden="true">
          <defs><path id="rond" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
          <text font-size="10.5" font-weight="600" letter-spacing="2.2" fill="#0f2748"><textPath href="#rond">PARLONS-EN · PARLONS-EN · </textPath></text>
        </svg>
        <span class="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-gold-500 text-navy-900"><Icon :d="ic.arrow" /></span>
      </router-link>
    </div>

    <h1 class="relative -mt-10 text-5xl font-bold tracking-tight text-navy-900 md:text-7xl">{{ formateur.nom }}</h1>
    <p class="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-600">{{ formateur.titre }}</p>
    <p class="mx-auto mt-6 max-w-xl text-slate-600">{{ formateur.bio }}</p>
    <router-link to="/inscription" class="btn btn-gold mt-8 gap-2.5 !px-6 !py-3.5">Rejoindre ma formation <Icon :d="ic.arrow" class="h-4 w-4" /></router-link>
  </section>

  <section class="mt-16 bg-navy-50/80 py-10">
    <div class="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
      <div v-for="[t, d] in piliers" :key="t" class="text-center"><p class="text-lg font-bold text-navy-900">{{ t }}</p><p class="mt-1 text-sm text-slate-600">{{ d }}</p></div>
    </div>
  </section>
</template>
<style scoped>
  .img-teach {
    background-image: url('/images/portrait_sans_fond_1230x1278.png');
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    width: 100%;
    margin: 0;
  }
</style>
