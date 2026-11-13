<script setup>
import { ref } from 'vue'
import Logo from '../components/Logo.vue'
import Icon from '../components/Icon.vue'
import { ic } from '../icons'
const open = ref(false)
const liens = [{ to: '/', label: 'Accueil' }, { to: '/formateur', label: 'Formateur' }, { to: '/news', label: 'News' }, { to: '/experience', label: 'Expérience' }, { to: '/inscription', label: 'Inscription' }]
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-700">
    <!-- halos décoratifs -->
    <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-navy-700/15 blur-3xl"></div>

    <header class="relative z-20 mx-auto max-w-6xl px-4 pt-4">
      <div class="flex items-center justify-between rounded-full border border-white bg-white/85 py-2.5 pl-5 pr-2.5 shadow-sm backdrop-blur">
        <router-link to="/" aria-label="Accueil"><Logo /></router-link>
        <nav class="hidden items-center gap-1 md:flex" aria-label="Menu principal">
          <router-link v-for="l in liens" :key="l.to" :to="l.to" exact-active-class="!bg-navy-900 !text-white"
            class="rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-navy-50 hover:text-navy-900">{{ l.label }}</router-link>
        </nav>
        <div class="flex items-center gap-2">
          <router-link to="/connexion" class="btn btn-gold gap-2">Espace membre <Icon :d="ic.arrow" class="h-4 w-4" /></router-link>
          <button class="grid h-10 w-10 place-items-center rounded-full bg-navy-50 text-navy-900 md:hidden" :aria-expanded="open" aria-label="Ouvrir le menu" @click="open = !open">
            <Icon :d="open ? ic.close : ic.menu" />
          </button>
        </div>
      </div>
      <nav v-if="open" class="mt-2 flex flex-col gap-1 rounded-3xl border border-white bg-white/95 p-2 shadow-lg md:hidden" aria-label="Menu mobile">
        <router-link v-for="l in liens" :key="l.to" :to="l.to" exact-active-class="!bg-navy-900 !text-white" class="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700" @click="open = false">{{ l.label }}</router-link>
      </nav>
    </header>

    <main class="relative z-10"><router-view /></main>

    <footer class="relative z-10 border-t border-slate-200/70 py-8 text-center text-xs text-slate-500">© 2026 Mobilis Finance Advisory · Ressources · Formation · Conseil</footer>
  </div>
</template>
