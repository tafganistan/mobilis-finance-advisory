<script setup>
import { ref, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { demanderInscription } from '../store'
import { countries } from '../data/countries'
import { images } from '../config'
import { ic } from '../icons'
import Field from '../components/Field.vue'
import Icon from '../components/Icon.vue'
import Illus from '../components/Illus.vue'

const route = useRoute()
const titres = { Présentiel: 'Formation en présentiel', 'En ligne': 'Formation en ligne (distanciel)' }
const f = reactive({ nom: '', email: '', pays: '', tel: '', type: titres[route.query.type] ? route.query.type : '' })
const indicatif = ref('CI') // l'indicatif suit le pays choisi, mais reste modifiable
watch(() => f.pays, (v) => v && (indicatif.value = v))
const envoye = ref(false)
const inp = 'w-full min-w-0 appearance-none bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400 invalid:text-slate-400'

function envoyer() {
  const pays = countries.find((c) => c.iso === f.pays)
  const ind = countries.find((c) => c.iso === indicatif.value)
  demanderInscription({ nom: f.nom.trim(), email: f.email.trim(), pays: pays.name, telephone: `${ind.dial} ${f.tel.trim()}`, formation: titres[f.type] })
  envoye.value = true
}
const etapes = ['Envoyez votre demande', 'Le formateur l’étudie', 'Vous recevez la réponse par e-mail']
</script>

<template>
  <section class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-2">
    <div>
      <p class="text-xs font-semibold uppercase tracking-widest text-gold-600">Inscription</p>
      <h1 class="mt-2 text-4xl font-bold leading-tight tracking-tight text-navy-900 md:text-5xl">Démarrez votre formation</h1>
      <ol class="mt-8 space-y-4">
        <li v-for="(e, i) in etapes" :key="e" class="flex items-center gap-4 text-sm font-medium text-navy-900">
          <span class="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-sm font-bold text-gold-500">{{ i + 1 }}</span>{{ e }}
        </li>
      </ol>
      <div class="mt-10 hidden h-64 w-56 overflow-hidden rounded-t-[7rem] lg:block"><Illus :src="images.inscription" alt="Illustration de la page d’inscription" /></div>
    </div>

    <div class="rounded-[2rem] border border-white bg-white/90 p-7 shadow-xl shadow-navy-900/5 backdrop-blur md:p-9">
      <div v-if="envoye" class="py-10 text-center">
        <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-100 text-gold-600"><Icon :d="ic.check" class="h-8 w-8" /></span>
        <h2 class="mt-5 text-2xl font-bold text-navy-900">Demande envoyée</h2>
        <p class="mx-auto mt-2 max-w-xs text-sm text-slate-600">Le formateur étudie votre demande. Vous recevrez une réponse par e-mail.</p>
        <router-link to="/" class="btn btn-outline mt-6">Retour à l’accueil</router-link>
      </div>

      <form v-else class="space-y-5" @submit.prevent="envoyer">
        <h2 class="text-xl font-bold text-navy-900">Demande d’inscription</h2>
        <Field label="Nom complet" :icon="ic.user"><input v-model="f.nom" required autocomplete="name" placeholder="Ex. Awa Koné" :class="inp" /></Field>
        <Field label="Adresse e-mail" :icon="ic.mail"><input v-model="f.email" type="email" required autocomplete="email" placeholder="vous@exemple.com" :class="inp" /></Field>
        <Field label="Pays" :icon="ic.globe" chevron>
          <select v-model="f.pays" required :class="inp">
            <option value="" disabled>Sélectionnez votre pays</option>
            <option v-for="c in countries" :key="c.iso" :value="c.iso" class="text-navy-900">{{ c.flag }} {{ c.name }}</option>
          </select>
        </Field>
        <Field label="Numéro de téléphone" :icon="ic.phone">
          <select v-model="indicatif" aria-label="Indicatif du pays" class="w-24 shrink-0 appearance-none rounded-lg bg-navy-50 px-2 py-1 text-sm font-medium text-navy-900 outline-none">
            <option v-for="c in countries" :key="c.iso" :value="c.iso">{{ c.flag }} {{ c.dial }}</option>
          </select>
          <input v-model="f.tel" type="tel" inputmode="tel" required pattern="[0-9 ]{6,15}" autocomplete="tel-national" placeholder="07 00 00 00 00" :class="inp" />
        </Field>
        <Field label="Type de formation" :icon="ic.cap" chevron>
          <select v-model="f.type" required :class="inp">
            <option value="" disabled>Choisissez un type</option>
            <option value="Présentiel" class="text-navy-900">Présentiel</option>
            <option value="En ligne" class="text-navy-900">En ligne</option>
          </select>
        </Field>
        <button class="btn btn-gold w-full gap-2.5 !py-3.5 shadow-lg shadow-gold-500/30">Envoyer ma demande <Icon :d="ic.arrow" class="h-4 w-4" /></button>
      </form>
    </div>
  </section>
</template>
