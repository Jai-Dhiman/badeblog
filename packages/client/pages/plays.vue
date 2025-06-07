<template>
  <CategoryStoriesLayout v-if="categoryId" :category-id="categoryId" title="Plays" />
  <div v-else class="text-center py-4">Loading...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseData } from '~/composables/useSupabaseData'

const { getCategories } = useSupabaseData()
const categoryId = ref<string | null>(null)

definePageMeta({
  title: 'Plays'
})

onMounted(async () => {
  try {
    const categories = await getCategories()
    const playsCategory = categories.find(
      (c: any) => c.name.toLowerCase() === 'plays'
    )
    if (playsCategory) {
      categoryId.value = playsCategory.id
    }
  } catch (err) {
    console.error('Failed to fetch category:', err)
  }
})
</script>