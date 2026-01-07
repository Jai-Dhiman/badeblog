<template>
  <div class="max-w-4xl mx-auto px-4">
    <header class="text-center my-8">
      <h1 class="text-3xl font-bold mb-4">My Ideas My Words</h1>
      <p class="text-xl text-gray-600">
        A place to share and preserve stories and other literary work
      </p>
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

      <div v-if="user && userProfile?.role === 'admin'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Subscribers</h3>
          <p class="text-3xl font-bold text-primary mb-4">{{ subscriberCount }}</p>

          <div class="mt-4">
            <h4 class="text-md font-semibold mb-2">Subscriber List</h4>
            <div class="max-h-60 overflow-y-auto">
              <ul class="space-y-1">
                <li v-for="email in subscribers" :key="email" class="text-sm text-gray-600">
                  {{ email }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Recent Comments</h3>
          <div v-if="recentComments.length > 0">
            <div
              v-for="comment in recentComments"
              :key="comment.id"
              class="mb-3 p-2 bg-white rounded"
            >
              <p class="text-sm text-gray-600">
                {{ comment.attributes['user-info'].name }} on
                {{ new Date(comment.attributes['created-at']).toLocaleDateString() }} to
                {{ comment.attributes['story-info'].title }}
              </p>
              <p class="mt-1">{{ comment.attributes.content }}</p>
            </div>
          </div>
          <p v-else class="text-gray-500">No recent comments</p>
        </div>
      </div>

      <div v-if="!user || userProfile?.role !== 'admin'" class="mt-8 mb-8">
        <SubscriptionForm />
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
            <span class="mx-2">•</span>
            <span>{{ story.categories?.name || 'Uncategorized' }}</span>
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
import { ref, computed, onMounted } from 'vue'

const { getStories, getSubscribers, getRecentComments } = useSupabaseData()
const { getUserProfile, user, initAuth } = useAuth()
const route = useRoute()

const stories = ref<any[]>([])
const userProfile = ref<any>(null)
const loading = ref(true)
const error = ref('')
const currentPage = ref(1)
const itemsPerPage = 5
const subscriberCount = ref(0)
const subscribers = ref<string[]>([])
const recentComments = ref<any[]>([])

const totalPages = computed(() => Math.ceil(stories.value.length / itemsPerPage))

const paginatedStories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return stories.value.slice(start, end)
})

const fetchAdminStats = async () => {
  if (user.value && userProfile.value?.role === 'admin') {
    try {
      const [subscribersResponse, commentsResponse] = await Promise.all([
        getSubscribers(),
        getRecentComments(),
      ])
      subscriberCount.value = subscribersResponse.count
      subscribers.value = subscribersResponse.subscribers
      recentComments.value = commentsResponse.data
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }
}

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
  // Handle unsubscribe query parameters
  if (route.query.unsubscribed === 'true') {
    alert('You have been successfully unsubscribed.')
  } else if (route.query.unsubscribe_error) {
    alert('There was an error processing your unsubscribe request.')
  }

  try {
    loading.value = true
    
    // Get user profile if authenticated
    if (user.value) {
      try {
        userProfile.value = await getUserProfile()
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError)
        // Continue without user profile for now
      }
    }
    
    // Fetch stories from Supabase
    const data = await getStories('published')
    stories.value = data || []
    
    // Fetch admin stats if user is admin
    await fetchAdminStats()
    
  } catch (err) {
    console.error('Failed to load stories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load stories'
  } finally {
    loading.value = false
  }
})
</script> 