<template>
  <CategoryStoriesLayout v-if="categoryId" :category-id="categoryId" title="Short Stories" />
  <div v-else-if="loading" class="text-center py-4">Loading...</div>
  <div v-else class="text-center py-4">
    <p class="text-gray-600 mb-4">No short stories category found.</p>
    <p class="text-sm text-gray-500">Available categories: {{ availableCategories.join(', ') || 'None' }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseData } from '~/composables/useSupabaseData'
import type { Category } from '~/types'

const { getCategories } = useSupabaseData()
const categoryId = ref<string | null>(null)
const loading = ref(true)
const availableCategories = ref<string[]>([])

definePageMeta({
  title: 'Short Stories'
})

onMounted(async () => {
  try {
    const categories = await getCategories()
    console.log('Available categories:', categories)
    
    // Store available category names for debugging
    availableCategories.value = categories.map((c: any) => c.name)
    
    const shortStoriesCategory = categories.find(
      (c: any) => c.name.toLowerCase() === 'short story'
    )
    
    if (shortStoriesCategory) {
      categoryId.value = shortStoriesCategory.id
    } else {
      console.warn('Short Story category not found. Available categories:', availableCategories.value)
    }
  } catch (err) {
    console.error('Failed to fetch category:', err)
  } finally {
    loading.value = false
  }
})
</script> 