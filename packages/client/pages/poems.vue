<template>
  <CategoryStoriesLayout v-if="categoryId" :category-id="categoryId" title="Poems" />
  <div v-else class="text-center py-4">Loading...</div>
</template>

<script setup lang="ts">
const { getCategories } = useSupabaseData()
const categoryId = ref<string | null>(null)

definePageMeta({
  title: 'Poems'
})

onMounted(async () => {
  try {
    const categories = await getCategories()
    const poemsCategory = categories.find(
      (c: any) => c.name.toLowerCase() === 'poems'
    )
    if (poemsCategory) {
      categoryId.value = poemsCategory.id
    }
  } catch (err) {
    console.error('Failed to fetch category:', err)
  }
})
</script> 