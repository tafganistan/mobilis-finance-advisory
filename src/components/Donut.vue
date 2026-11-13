<script setup>
import { computed } from 'vue'
const p = defineProps({ value: { type: Number, default: 0 } })
const c = 2 * Math.PI * 40
const dash = computed(() => `${(c * Math.min(100, p.value)) / 100} ${c}`)
</script>
<template>
  <div class="relative h-32 w-32">
    <svg viewBox="0 0 100 100" class="-rotate-90" role="img" :aria-label="value + ' %'">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#eef2f8" stroke-width="12" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#c9a227" stroke-width="12" stroke-linecap="round" :stroke-dasharray="dash" />
    </svg>
    <span class="absolute inset-0 grid place-items-center text-xl font-bold text-navy-900">{{ value }} %</span>
  </div>
</template>
