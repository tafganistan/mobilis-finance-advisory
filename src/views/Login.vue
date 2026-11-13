<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../store'
import Logo from '../components/Logo.vue'
const router = useRouter()
const email = ref(''), password = ref(''), error = ref(''), visible = ref(false)
function submit() { const s = login(email.value, password.value); if (!s) return (error.value = 'Identifiant ou mot de passe incorrect.'); router.push(s.role === 'prof' ? '/professeur' : '/etudiant') }
</script>
<template>
  <main class="relative grid min-h-screen overflow-hidden bg-[#eef2f8] px-4 py-10 lg:grid-cols-2 lg:px-0">
    <div class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl"></div><div class="pointer-events-none absolute -bottom-40 right-0 h-[34rem] w-[34rem] rounded-full bg-blue-300/30 blur-3xl"></div>
    <section class="relative hidden flex-col justify-between overflow-hidden bg-[#102744] px-12 py-12 text-white lg:flex xl:px-20">
      <div class="absolute -right-24 -top-20 h-96 w-96 rounded-full border border-white/10"></div><div class="absolute -bottom-44 -left-20 h-[34rem] w-[34rem] rounded-full border border-white/10"></div>
      <router-link to="/" class="relative"><span class="inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg"><Logo /></span></router-link>
      <div class="relative max-w-xl"><p class="mb-5 text-xs font-bold uppercase tracking-[.32em] text-amber-300">Mobilis Finance Advisory</p><h1 class="text-5xl font-semibold leading-[1.12] xl:text-6xl">Apprenez.<br/><span class="text-amber-300">Progressez.</span><br/>Allez plus loin.</h1><p class="mt-6 max-w-md text-base leading-7 text-slate-300">Retrouvez votre espace de formation, vos cours, vos ressources et votre accompagnement personnalisé.</p></div>
      <p class="relative text-xs text-slate-400">© 2026 Mobilis Finance Advisory · Ressources · Formation · Conseil</p>
    </section>
    <section class="relative grid place-items-center px-1 py-6 lg:px-10 xl:px-20">
      <div class="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 p-7 shadow-[0_25px_80px_rgba(15,39,72,.12)] backdrop-blur-2xl sm:p-10">
        <router-link to="/" class="lg:hidden"><Logo /></router-link>
        <div class="mb-8 mt-7 lg:mt-0"><span class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">✦</span><p class="mt-6 text-xs font-bold uppercase tracking-[.25em] text-amber-700">Espace sécurisé</p><h2 class="mt-2 text-3xl font-bold tracking-tight text-navy-900">Bon retour parmi nous</h2><p class="mt-2 text-sm text-slate-500">Connectez-vous pour accéder à votre espace.</p></div>
        <form class="space-y-4" @submit.prevent="submit"><label class="block text-sm font-semibold text-slate-700">Adresse e-mail<input v-model="email" type="email" required autocomplete="username" placeholder="nom@exemple.com" class="input mt-2 !rounded-xl !py-3.5" /></label><label class="block text-sm font-semibold text-slate-700">Mot de passe<span class="relative mt-2 block"><input v-model="password" :type="visible ? 'text' : 'password'" required autocomplete="current-password" placeholder="Votre mot de passe" class="input !rounded-xl !py-3.5 pr-16"/><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500" @click="visible = !visible">{{ visible ? 'Masquer' : 'Afficher' }}</button></span></label><p v-if="error" class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ error }}</p><button class="btn btn-gold mt-2 w-full !rounded-xl !py-3.5">Se connecter <span class="ml-2">→</span></button></form>
        <div class="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-6 text-slate-600"><b class="text-navy-900">Accès de démonstration</b><br/>Professeur : prof@mfa.com / prof123<br/>Étudiant : awa@mfa.com / awa123</div>
        <router-link to="/" class="mt-6 block text-center text-sm font-medium text-slate-500 transition hover:text-navy-900">← Retour au site</router-link>
      </div>
    </section>
  </main>
</template>
