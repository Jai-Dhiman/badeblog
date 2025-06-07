<template>
  <div class="max-w-4xl mx-auto p-4">
    <div v-if="showSuccess" :class="['success-alert', { 'fade-out': fadeOut }]">
      Notification sent successfully!
    </div>
    <h1 class="text-2xl font-bold mb-6">Edit Story</h1>
    <div class="space-y-6">
      <div>
        <label class="block mb-2 text-lg">Title</label>
        <input v-model="title" type="text" class="w-full p-3 border rounded-lg text-lg" required />
      </div>
      <div>
        <label class="block mb-2 text-lg">Category</label>
        <select v-model="categoryId" class="w-full p-3 border rounded-lg text-lg" required>
          <option value="">Select a category</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div
        v-if="editorError"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        {{ editorError }}
      </div>
      <div>
        <label class="block mb-2 text-lg">Content</label>
        <RichTextEditor v-model="content" class="mb-6" @error="handleEditorError" />
      </div>
      <div class="flex gap-4">
        <button
          type="button"
          @click="handleSubmit('draft')"
          class="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600 transition-colors"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : 'Save as Draft' }}
        </button>

        <button
          type="button"
          @click="handleSubmit('published')"
          class="bg-primary text-white px-6 py-3 rounded-lg text-lg hover:bg-opacity-90 transition-colors"
          :disabled="loading"
        >
          {{ loading ? 'Publishing...' : 'Publish Story' }}
        </button>
        <button
          type="button"
          @click="confirmDelete"
          class="bg-red-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-red-600 transition-colors"
          :disabled="loading"
        >
          Delete Story
        </button>
      </div>
      <div class="mt-4">
        <button
          @click="showNotificationModal = true"
          v-if="storyId"
          class="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600 transition-colors"
        >
          Send to Subscribers
        </button>
      </div>

      <NotificationModal
        :show="showNotificationModal"
        :story-id="storyId"
        @close="showNotificationModal = false"
        @sent="handleNotificationSent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Add admin middleware
definePageMeta({
  middleware: 'admin'
})

import RichTextEditor from '~/components/RichTextEditor.vue'
import NotificationModal from '~/components/NotificationModal.vue'

const { getStory, updateStory, getCategories, deleteStory } = useSupabaseData()
const router = useRouter()
const route = useRoute()

const title = ref('')
const content = ref('')
const categoryId = ref<string>()
const categories = ref<any[]>([])
const loading = ref(true)
const editorError = ref<string>('')
const storyId = ref<string>('')
const showNotificationModal = ref(false)
const showSuccess = ref(false)
const fadeOut = ref(false)

const handleNotificationSent = () => {
  showNotificationModal.value = false
  showSuccess.value = true

  setTimeout(() => {
    fadeOut.value = true
  }, 2000)

  setTimeout(() => {
    showSuccess.value = false
    fadeOut.value = false
  }, 2300)
}

function handleEditorError(error: unknown) {
  console.error('Editor error:', error)
  editorError.value = error instanceof Error
    ? error.message
    : 'There was an error loading the editor. Please refresh the page.'
}

onMounted(async () => {
  try {
    loading.value = true
    storyId.value = String(route.params.id)

    const [storyData, categoriesData] = await Promise.all([
      getStory(storyId.value),
      getCategories(),
    ])

    title.value = storyData.title
    content.value = storyData.content || ''
    categoryId.value = storyData.category_id
    categories.value = categoriesData || []
  } catch (err) {
    console.error('Failed to load story or categories:', err)
    editorError.value = 'Failed to load story data'
  } finally {
    loading.value = false
  }
})

async function handleSubmit(status: 'draft' | 'published') {
  if (!categoryId.value) return

  loading.value = true

  try {
    const storyData = {
      title: title.value,
      content: content.value,
      category_id: categoryId.value,
      status: status,
    }

    await updateStory(storyId.value, storyData)
    router.push(status === 'draft' ? '/drafts' : '/')
  } catch (err) {
    console.error('Failed to update story:', err)
    editorError.value = 'Failed to update story'
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
    loading.value = true
    try {
      await deleteStory(storyId.value)
      router.push('/')
    } catch (error) {
      console.error('Failed to delete story:', error)
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.success-alert {
  @apply bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 transition-opacity duration-300;
}

.fade-out {
  opacity: 0;
}
</style> 