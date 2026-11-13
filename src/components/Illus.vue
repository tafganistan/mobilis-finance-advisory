<script setup>
defineProps({ src: { type: String, default: '' }, alt: { type: String, default: 'Illustration' } })
</script>
<template>
  <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
  <div v-else role="img" :aria-label="alt" class="grid h-full w-full place-items-center bg-gradient-to-br from-navy-700 to-navy-900">
    <div class="flex items-end gap-2.5"><i class="h-8 w-3.5 rounded bg-gold-500"></i><i class="h-14 w-3.5 rounded bg-gold-500"></i><i class="h-20 w-3.5 rounded bg-gold-500"></i><i class="h-28 w-3.5 rounded bg-gold-500"></i></div>
  </div>
</template>
