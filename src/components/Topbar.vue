<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, logout, lireNotifications } from '../store'
import Logo from './Logo.vue'
const router = useRouter()
const out = () => { logout(); router.push('/') }
const ouvert = ref(false)
const mes = computed(() => db.notifications.filter((n) => n.userId === db.session?.id).slice().reverse())
const nonLues = computed(() => mes.value.filter((n) => !n.lu).length)
const roleLabel = computed(() => db.session?.role === 'prof' ? 'Professeur MFA' : (db.session?.name || 'Espace étudiant'))
function toggle() { if (!ouvert.value) lireNotifications(db.session.id); ouvert.value = !ouvert.value }
</script>
<template>
  <header class="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-[0_8px_30px_rgba(15,39,72,.06)] backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <router-link to="/" aria-label="Accueil" class="shrink-0"><Logo /></router-link>
      <div class="flex items-center gap-2 sm:gap-4">
        <span class="hidden text-sm font-semibold tracking-wide text-slate-700 sm:inline">{{ roleLabel }}</span>
        <button class="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-navy-900 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-500 hover:bg-gold-100" :aria-expanded="ouvert" aria-label="Notifications" @click="toggle">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
          <span v-if="nonLues" class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">{{ nonLues }}</span>
        </button>
        <button class="btn btn-gold gap-2 !px-4 !py-2.5 text-xs sm:text-sm" @click="out">Se déconnecter <span aria-hidden="true">↗</span></button>
      </div>
    </div>
    <div v-if="ouvert" class="absolute right-4 top-full mt-2 max-h-96 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
      <div class="mb-2 flex items-center justify-between px-2"><b class="text-sm text-navy-900">Notifications</b><span class="text-xs text-slate-400">{{ mes.length }} au total</span></div>
      <p v-if="!mes.length" class="p-4 text-sm text-slate-500">Aucune notification.</p>
      <div v-for="n in mes" :key="n.id" class="rounded-2xl p-3 text-sm" :class="n.lu ? 'bg-slate-50' : 'bg-amber-50'"><b class="text-navy-900">{{ n.sujet }}</b><p class="mt-1 text-slate-600">{{ n.corps }}</p><p class="mt-2 text-[11px] text-slate-400">{{ n.date }}</p></div>
    </div>
  </header>
</template>
