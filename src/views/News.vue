<script setup>
import { ref, computed } from 'vue'
import Icon from '../components/Icon.vue'
import { ic } from '../icons'

const articles = [
  { id: 1, category: 'Finance & gestion', date: 'À publier', read: '5 min', title: 'Piloter la performance financière de son organisation', excerpt: 'Les bons indicateurs permettent de mieux comprendre les résultats, d’anticiper les écarts et de prendre des décisions éclairées.', body: 'Une information financière fiable aide les dirigeants à suivre la rentabilité, maîtriser les coûts et définir des priorités. La mise en place d’un tableau de bord adapté transforme les données comptables en véritables outils de pilotage.' },
  { id: 2, category: 'Comptabilité', date: 'À publier', read: '4 min', title: 'La fiabilité comptable, un levier de confiance', excerpt: 'Une organisation comptable rigoureuse facilite le suivi des opérations et renforce la qualité de l’information financière.', body: 'La fiabilité des comptes repose sur des procédures claires, une bonne organisation documentaire et des contrôles réguliers. Ces pratiques contribuent à sécuriser les opérations et à disposer d’une vision fidèle de l’activité.' },
  { id: 3, category: 'Certification ACCA', date: 'À publier', read: '6 min', title: 'Pourquoi développer ses compétences en finance et comptabilité ?', excerpt: 'Les compétences techniques et la maîtrise des normes ouvrent de nouvelles perspectives aux professionnels.', body: 'Se former tout au long de sa carrière permet de consolider ses fondamentaux, de suivre les évolutions du métier et de renforcer sa capacité à intervenir dans des environnements exigeants.' },
]
const selected = ref(articles[0])
const activeCategory = ref('Toutes')
const categories = ['Toutes', 'Finance & gestion', 'Comptabilité', 'Certification ACCA']
const filtered = computed(() => activeCategory.value === 'Toutes' ? articles : articles.filter(a => a.category === activeCategory.value))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pb-20 pt-12">
    <section class="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-xl shadow-navy-900/5">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 md:px-8">
        <div class="flex items-center gap-2 text-xs font-semibold text-navy-900"><span class="h-2 w-2 rounded-full bg-gold-500"></span> MOBILIS FINANCE ADVISORY <span class="font-normal text-slate-400">/ JOURNAL</span></div>
        <span class="text-[11px] text-slate-400">Actualités · Analyses · Ressources</span>
      </div>
      <div class="grid lg:grid-cols-[.82fr_1.35fr_.82fr]">
        <aside class="border-b border-slate-100 p-6 md:p-8 lg:border-b-0 lg:border-r">
          <p class="text-[10px] font-bold uppercase tracking-[.22em] text-gold-600">Le journal MFA</p>
          <h1 class="mt-4 text-3xl font-bold leading-tight tracking-tight text-navy-900">L’actualité de la finance, autrement.</h1>
          <p class="mt-5 text-sm leading-7 text-slate-500">Décryptages, conseils pratiques et actualités autour de la finance, de la comptabilité, de l’audit et du développement des compétences.</p>
          <div class="mt-8 border-t border-slate-100 pt-5"><p class="text-xs font-semibold text-navy-900">Explorer les sujets</p>
            <div class="mt-3 flex flex-wrap gap-2 lg:flex-col">
              <button v-for="c in categories" :key="c" @click="activeCategory = c" class="rounded-full border px-3 py-2 text-left text-xs transition lg:rounded-xl" :class="activeCategory === c ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:border-gold-500 hover:text-navy-900'">{{ c }}</button>
            </div>
          </div>
        </aside>

        <section class="min-w-0 p-6 md:p-8">
          <div class="flex items-center justify-between"><p class="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">À la une</p><span class="text-[10px] text-slate-400">{{ String(selected.id).padStart(2, '0') }} / 03</span></div>
          <div class="mt-5 flex min-h-[300px] flex-col justify-between rounded-[1.6rem] bg-gradient-to-br from-navy-900 via-[#17375f] to-[#31547b] p-7 text-white md:p-9">
            <div class="flex items-center justify-between"><span class="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wide">{{ selected.category }}</span><Icon :d="ic.arrow" class="h-5 w-5 text-gold-500" /></div>
            <div class="mt-12"><p class="text-xs text-white/50">{{ selected.date }} · {{ selected.read }} de lecture</p><h2 class="mt-3 max-w-lg text-2xl font-bold leading-tight md:text-3xl">{{ selected.title }}</h2><p class="mt-3 max-w-lg text-sm leading-6 text-white/70">{{ selected.excerpt }}</p></div>
          </div>
          <div class="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-5"><p class="text-[10px] font-bold uppercase tracking-widest text-gold-600">L’essentiel</p><p class="mt-2 text-sm leading-7 text-slate-600">{{ selected.body }}</p></div>
        </section>

        <aside class="border-t border-slate-100 bg-slate-50/50 p-6 md:p-8 lg:border-l lg:border-t-0">
          <p class="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Dernières publications</p>
          <div class="mt-5 space-y-2">
            <button v-for="a in filtered" :key="a.id" @click="selected = a" class="group w-full rounded-2xl border p-4 text-left transition" :class="selected.id === a.id ? 'border-gold-500/50 bg-white shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-white'">
              <span class="text-[10px] font-semibold text-gold-600">{{ a.category }}</span><span class="mt-2 block text-sm font-bold leading-snug text-navy-900">{{ a.title }}</span><span class="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>{{ a.date }}</span><span class="text-navy-700 group-hover:translate-x-1">Lire <span aria-hidden="true">→</span></span></span>
            </button>
            <p v-if="!filtered.length" class="text-sm text-slate-500">Aucun article dans cette rubrique.</p>
          </div>
          <div class="mt-8 rounded-2xl bg-gold-100/70 p-5"><p class="text-sm font-bold text-navy-900">Une question métier ?</p><p class="mt-2 text-xs leading-5 text-slate-600">Échangez avec notre équipe sur vos enjeux en finance et comptabilité.</p><router-link to="/inscription" class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-navy-900">Nous contacter <span>↗</span></router-link></div>
        </aside>
      </div>
    </section>
    <section class="mt-14"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-xs font-bold uppercase tracking-[.2em] text-gold-600">Toutes les actualités</p><h2 class="mt-2 text-2xl font-bold text-navy-900">À lire et à partager</h2></div><span class="text-xs text-slate-400">{{ filtered.length }} article(s)</span></div>
      <div class="mt-6 grid gap-5 md:grid-cols-3"><button v-for="a in filtered" :key="a.id" @click="selected = a" class="rounded-[1.6rem] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span class="text-[10px] font-bold uppercase tracking-wider text-gold-600">{{ a.category }}</span><h3 class="mt-4 text-lg font-bold leading-snug text-navy-900">{{ a.title }}</h3><p class="mt-3 text-sm leading-6 text-slate-500">{{ a.excerpt }}</p><span class="mt-6 inline-flex items-center gap-2 text-xs font-bold text-navy-900">Découvrir <span>→</span></span></button></div>
    </section>
    <p class="mt-8 text-center text-[11px] text-slate-400">Les contenus présentés sont des exemples éditoriaux à valider et compléter avant publication.</p>
  </div>
</template>
