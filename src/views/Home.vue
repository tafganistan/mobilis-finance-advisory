<script setup>
import { db } from '../store'
import { images } from '../config'
import { ic } from '../icons'
import Icon from '../components/Icon.vue'
import Illus from '../components/Illus.vue'
const icones = { Présentiel: ic.users, 'En ligne': ic.monitor, Vidéo: ic.video }
const piliers = [
  ['Ressources', 'Des contenus clairs et structurés pour progresser.'],
  ['Formation', 'Des parcours encadrés, en salle ou à distance.'],
  ['Conseil', 'Un accompagnement personnalisé du formateur.'],
]
</script>

<template>
  <!-- Hero -->
  <section class="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-2">
    <div>
      <span class="inline-flex items-center gap-2 rounded-full border border-navy-900/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700">
        <i class="h-2 w-2 rounded-full bg-gold-500"></i>Ressources · Formation · Conseil
      </span>
      <h1 class="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-navy-900 md:text-6xl">
        Deviens certifié <span class="text-gold-600 underline decoration-gold-500 decoration-4 underline-offset-8">international</span>,<br />ACCA
      </h1>
      <p class="mt-6 max-w-md text-slate-600">L’ACCA (Association of Chartered Certified Accountants) est une organisation professionnelle britannique qui délivre une certification internationale en comptabilité, finance et audit.</p>
      <div class="mt-8 flex flex-wrap items-center gap-5">
        <router-link to="/inscription" class="btn btn-gold gap-2.5 !px-6 !py-3.5 shadow-lg shadow-gold-500/30">Demander une inscription <Icon :d="ic.arrow" class="h-4 w-4" /></router-link>
        <a href="#formations" class="text-sm font-semibold text-navy-900 underline-offset-4 hover:underline">Voir les formations ›</a>
      </div>
      <div class="mt-10 flex w-fit items-center gap-3 rounded-2xl bg-white p-3 pr-6 shadow-lg shadow-navy-900/5">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-gold-100 text-gold-600"><Icon :d="ic.users" /></span>
        <span class="text-sm"><b class="block text-navy-900">3 formules</b><span class="text-xs text-slate-500">Présentiel, en ligne et vidéo</span></span>
      </div>
    </div>

    <!-- Mosaïque d'illustrations (remplacez via src/config.js) -->
    <div class="grid grid-cols-2 gap-4">
      <div class="row-span-2 min-h-[24rem] overflow-hidden rounded-[2rem] border-1 border-olive-200 img-home"></div>
      <div class="rounded-[2rem] bg-gold-500 p-6 text-navy-900">
        <Icon :d="ic.user" class="h-7 w-7" />
        <p class="mt-6 text-lg font-bold leading-snug">Coaching individuel</p>
        <p class="mt-1 text-sm">Un accompagnement 1:1 en dehors des heures de cours.</p>
      </div>
      <div class="rounded-[2rem] bg-navy-900 p-6 text-white">
        <p class="text-5xl font-bold text-gold-500">3</p>
        <p class="mt-3 text-sm text-white/80">formules adaptées à votre rythme et à votre lieu de vie.</p>
      </div>
    </div>
  </section>

  <!-- Bandeau piliers -->
  <section class="bg-navy-50/80 py-10">
    <div class="mx-auto grid max-w-6xl gap-6 px-4 text-center sm:grid-cols-3">
      <div v-for="[t, d] in piliers" :key="t"><p class="text-lg font-bold text-navy-900">{{ t }}</p><p class="mt-1 text-sm text-slate-600">{{ d }}</p></div>
    </div>
  </section>

  <!-- Présentation du cabinet -->
  <section class="mx-auto max-w-6xl px-4 py-20">
    <div class="grid items-center gap-10 rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-sm shadow-navy-900/5 md:p-10 lg:grid-cols-[.9fr_1.1fr]">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.2em] text-gold-600">Le cabinet · Mobilis Finance Advisory</p>
        <h2 class="mt-3 text-3xl font-bold leading-tight text-navy-900 md:text-4xl">Mobilis Finance Advisory, qui sommes-nous&nbsp;?</h2>
        <p class="mt-5 text-sm leading-7 text-slate-600">Mobilis Finance Advisory accompagne les entreprises, les organisations et les professionnels dans la structuration, la gestion et le pilotage de leurs activités financières et comptables. Notre approche associe expertise technique, conseil opérationnel et transmission des compétences.</p>
        <p class="mt-3 text-sm leading-7 text-slate-600">Nous plaçons la fiabilité de l’information, la maîtrise des risques et l’amélioration de la performance au cœur de nos interventions.</p>
        <router-link to="/experience" class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-gold-600">Découvrir notre expertise <Icon :d="ic.arrow" class="h-4 w-4" /></router-link>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <article v-for="(service, i) in [
          ['Conseil financier', 'Diagnostic financier, analyse de rentabilité et aide à la décision.'],
          ['Comptabilité & reporting', 'Organisation comptable, révision et production de reportings.'],
          ['Audit & contrôle interne', 'Évaluation des procédures, maîtrise des risques et contrôle.'],
          ['Gestion & pilotage', 'Budgets, tableaux de bord et suivi de la performance.'],
          ['Fiscalité', 'Assistance à la conformité et accompagnement des obligations fiscales.'],
          ['Formation professionnelle', 'Renforcement des capacités en finance, comptabilité et préparation ACCA.']
        ]" :key="service[0]" class="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-gold-100 text-sm font-bold text-gold-600">0{{ i + 1 }}</span>
          <h3 class="mt-4 text-sm font-bold text-navy-900">{{ service[0] }}</h3>
          <p class="mt-2 text-xs leading-5 text-slate-500">{{ service[1] }}</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Formations -->
  <section id="formations" class="mx-auto max-w-6xl scroll-mt-6 px-4 py-20">
    <p class="text-xs font-semibold uppercase tracking-widest text-gold-600">Formations</p>
    <h2 class="mt-2 text-3xl font-bold text-navy-900 md:text-4xl">Choisissez votre façon d’apprendre</h2>
    <div class="mt-10 grid gap-6 md:grid-cols-3">
      <article v-for="f in db.formations" :key="f.id" class="flex flex-col rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-sm shadow-navy-900/5 transition hover:-translate-y-1 hover:shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-gold-500"><Icon :d="icones[f.type]" class="h-6 w-6" /></span>
          <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="f.dispo ? 'bg-gold-100 text-gold-600' : 'bg-navy-50 text-navy-700'">{{ f.dispo || 'Inscriptions ouvertes' }}</span>
        </div>
        <h3 class="mt-6 text-xl font-bold text-navy-900">{{ f.titre }}</h3>
        <p class="mt-2 text-sm text-slate-600">{{ f.desc }}</p>
        <ul class="mt-5 flex-1 space-y-2 text-sm">
          <li v-for="p in f.points" :key="p" class="flex items-center gap-2"><Icon :d="ic.check" class="h-4 w-4 text-gold-600" />{{ p }}</li>
        </ul>
        <router-link :to="{ path: '/inscription', query: f.type === 'Vidéo' ? {} : { type: f.type } }" class="btn btn-outline mt-7 gap-2">
          {{ f.type === 'Vidéo' ? 'Me tenir informé' : 'S’inscrire' }} <Icon :d="ic.arrow" class="h-4 w-4" />
        </router-link>
      </article>
    </div>
  </section>
</template>

<style scoped>
  .img-home {
    background-image: url('/images/2087d394-cc76-458e-bcbb-7dab3798de5f.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    width: 100%;
    height: 100%;
    margin: 0;
  }
</style>
