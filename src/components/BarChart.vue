<script setup>
defineProps({ items: { type: Array, default: () => [] }, max: { type: Number, default: 20 }, suffix: { type: String, default: '' } })
</script>
<template>
  <p v-if="!items.length" class="text-sm text-slate-500">Pas encore de données.</p>
  <div v-else class="flex h-44 items-end gap-3">
    <div v-for="(it, i) in items" :key="i" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
      <span class="text-xs font-semibold text-navy-900">{{ it.value }}{{ suffix }}</span>
      <div class="w-full rounded-t-md bg-gold-500" :style="{ height: Math.min(100, (it.value / max) * 100) * 0.7 + '%' }"></div>
      <span class="w-full truncate text-center text-[11px] text-slate-500" :title="it.label">{{ it.label }}</span>
    </div>
  </div>
</template>
