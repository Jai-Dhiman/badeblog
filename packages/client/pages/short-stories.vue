<template>
  <CategoryStoriesLayout v-if="categoryId" :category-id="categoryId" title="Short Stories" />
  <div v-else class="text-center py-4">Loading...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseData } from '~/composables/useSupabaseData'
import type { Category } from '~/types'

const { getCategories } = useSupabaseData()
const categoryId = ref<string | null>(null)

definePageMeta({
  title: 'Short Stories'
})

onMounted(async () => {
  try {
    const categories = await getCategories()
    const shortStoriesCategory = categories.find(
      (c: any) => c.name.toLowerCase() === 'short stories'
    )
    if (shortStoriesCategory) {
      categoryId.value = shortStoriesCategory.id
    }
  } catch (err) {
    console.error('Failed to fetch category:', err)
  }
})
</script> 