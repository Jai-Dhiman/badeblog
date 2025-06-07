<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Drafts</h1>

    <div v-if="loading" class="text-center py-4">Loading...</div>

    <div v-else-if="drafts.length === 0" class="text-center py-4">No drafts found</div>

    <div v-else class="space-y-4">
      <div
        v-for="story in drafts"
        :key="story.id"
        class="bg-white p-6 border rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <h2 class="text-xl font-semibold">{{ story.title }}</h2>
        <p class="text-gray-600 mt-2">
          {{ story.categories?.name || 'Unknown Category' }}
        </p>
        <div class="mt-4 flex gap-2">
          <NuxtLink
            :to="`/stories/${story.id}/edit`"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Edit
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Add admin middleware
definePageMeta({
  middleware: 'admin'
})

const { getDrafts } = useSupabaseData()

const drafts = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const draftsData = await getDrafts()
    drafts.value = draftsData || []
  } catch (error) {
    console.error('Failed to load drafts:', error)
  } finally {
    loading.value = false
  }
})
</script> 