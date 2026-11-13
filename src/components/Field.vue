<script setup>
import Icon from './Icon.vue'
import { ic } from '../icons'
defineProps({ label: String, icon: String, chevron: Boolean })
</script>
<template>
  <label class="block">
    <span class="mb-1.5 block text-xs font-semibold tracking-wide text-navy-900">{{ label }}</span>
    <span class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-navy-700/40 focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/20">
      <span class="text-gold-600"><Icon :d="icon" /></span>
      <slot />
      <Icon v-if="chevron" :d="ic.chevron" class="pointer-events-none -ml-8 h-4 w-4 text-slate-400" />
    </span>
  </label>
</template>
