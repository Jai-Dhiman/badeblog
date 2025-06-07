<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">Supabase Connection Test</h1>
    
    <div class="space-y-6">
      <!-- User Info -->
      <div class="p-4 bg-gray-100 rounded">
        <h2 class="text-lg font-semibold mb-2">Current User</h2>
        <pre class="text-sm">{{ JSON.stringify(user, null, 2) }}</pre>
      </div>

      <!-- Stories Test -->
      <div class="p-4 bg-gray-100 rounded">
        <h2 class="text-lg font-semibold mb-2">Stories Data</h2>
        <button @click="testStories" class="bg-blue-500 text-white px-4 py-2 rounded mb-2">
          Test Stories
        </button>
        <pre class="text-sm">{{ JSON.stringify(storiesData, null, 2) }}</pre>
        <div v-if="storiesError" class="text-red-500 mt-2">
          Error: {{ storiesError }}
        </div>
      </div>

      <!-- Categories Test -->
      <div class="p-4 bg-gray-100 rounded">
        <h2 class="text-lg font-semibold mb-2">Categories Data</h2>
        <button @click="testCategories" class="bg-green-500 text-white px-4 py-2 rounded mb-2">
          Test Categories
        </button>
        <pre class="text-sm">{{ JSON.stringify(categoriesData, null, 2) }}</pre>
        <div v-if="categoriesError" class="text-red-500 mt-2">
          Error: {{ categoriesError }}
        </div>
      </div>

      <!-- Direct Supabase Test -->
      <div class="p-4 bg-gray-100 rounded">
        <h2 class="text-lg font-semibold mb-2">Direct Supabase Query</h2>
        <button @click="testDirectQuery" class="bg-purple-500 text-white px-4 py-2 rounded mb-2">
          Test Direct Query
        </button>
        <pre class="text-sm">{{ JSON.stringify(directQueryData, null, 2) }}</pre>
        <div v-if="directQueryError" class="text-red-500 mt-2">
          Error: {{ directQueryError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { getStories, getCategories } = useSupabaseData()

const storiesData = ref(null)
const storiesError = ref(null)
const categoriesData = ref(null)
const categoriesError = ref(null)
const directQueryData = ref(null)
const directQueryError = ref(null)

const testStories = async () => {
  try {
    storiesError.value = null
    storiesData.value = await getStories()
  } catch (error) {
    storiesError.value = error.message
    console.error('Stories error:', error)
  }
}

const testCategories = async () => {
  try {
    categoriesError.value = null
    categoriesData.value = await getCategories()
  } catch (error) {
    categoriesError.value = error.message
    console.error('Categories error:', error)
  }
}

const testDirectQuery = async () => {
  try {
    directQueryError.value = null
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .limit(1)
    
    if (error) throw error
    directQueryData.value = data
  } catch (error) {
    directQueryError.value = error.message
    console.error('Direct query error:', error)
  }
}
</script> 