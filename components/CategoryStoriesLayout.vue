<template>
  <div class="max-w-4xl mx-auto px-4">
    <header class="text-center my-8">
      <h1 class="text-3xl font-bold mb-4">{{ title }}</h1>
    </header>

    <div class="mb-8">
      <div v-if="user && userProfile?.role === 'admin'" class="text-center mb-6">
        <NuxtLink
          to="/stories/new"
          class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          New Story
        </NuxtLink>
      </div>

      <div v-if="loading" class="space-y-8">
        <StorySkeletonLoader v-for="n in itemsPerPage" :key="n" />
      </div>
      <div v-else-if="error" class="text-red-500 text-center py-4">
        {{ error }}
      </div>
      <div v-if="paginatedStories.length === 0 && !loading" class="text-center py-4">No stories found.</div>
      <div v-else class="space-y-8">
        <article
          v-for="story in paginatedStories"
          :key="story.id"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h2 class="text-2xl font-bold mb-2">
            <NuxtLink :to="`/stories/${story.id}`" class="text-black hover:text-accent">
              {{ story.title }}
            </NuxtLink>
          </h2>
          <div class="flex items-center text-gray-600 text-sm mb-4">
            <span>{{ formatDate(story.created_at) }}</span>
          </div>
          <div class="prose prose-sm line-clamp-3 mb-4" v-html="story.content"></div>
          <NuxtLink
            :to="`/stories/${story.id}`"
            class="text-accent hover:text-secondary font-medium"
          >
            Read more →
          </NuxtLink>
        </article>
      </div>
      <PaginationControls
        v-if="stories.length > itemsPerPage"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change-page="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// All composables are auto-imported by Nuxt
const props = defineProps<{
  categoryId: string | number
  title: string
}>()

const { getStoriesByCategory } = useSupabaseData()
const { getUserProfile } = useAuth()
const user = useSupabaseUser()

const stories = ref<any[]>([])
const userProfile = ref<any>(null)
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

const totalPages = computed(() => Math.ceil(stories.value.length / itemsPerPage))

const paginatedStories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return stories.value.slice(start, end)
})

function handlePageChange(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(async () => {
  try {
    loading.value = true
    
    // Get user profile if authenticated
    if (user.value) {
      try {
        userProfile.value = await getUserProfile()
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError)
        // Continue without user profile
      }
    }
    
    // Fetch stories for this category
    const data = await getStoriesByCategory(props.categoryId.toString())
    stories.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load stories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load stories'
  } finally {
    loading.value = false
  }
})
</script> 