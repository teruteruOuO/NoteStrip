<template>
<section id="view-book-note" class="component">
    <h2>Notes ({{ props.name }} {{ props.bookId }})</h2>

    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.page.success">
        <p>{{ feedback.page.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <section class="buttons">
            <button @click="decideToAddNewNote">
                <span v-if="!newNote.add_state">Add a new note</span>
                <span v-else>Cancel</span>
            </button>
        </section>

        <section id="add-book" v-if="newNote.add_state">  
            <!-- Show only if user decides to add a note -->
            <form @submit.prevent="addNote">
                <ul>
                    <li>
                        <label for="title-add">Note Title: </label>
                        <input type="text" name="title-add" id="title-add" v-model="newNote.note.title" placeholder="required" required />
                    </li>
                    <li>
                        <label for="content-add">Note Content: </label>
                        <textarea name="content-add" id="content-add" v-model="newNote.note.content" placeholder="required" required>
                        </textarea>
                    </li>
                    <li>
                        <button type="submit" :disabled="isLoading.add" :class="{ 'button-loading': isLoading.add }">
                            <span v-if="!isLoading.form">Add Note</span>
                            <span v-else>Adding note..</span>
                        </button>
                    </li>
                </ul>
            </form>

            <section class="feedback fail" v-if="!feedback.add.success">
                <p>{{ feedback.add.message }}</p>
            </section>
        </section>

        <section class="no-lists" v-if="notes.length <= 0">
            <p>No notes found. Add one!</p>
        </section>

        <section class="have-lists" v-else>
            <section v-for="note in notes" :key="note.id">
                <p>Title: {{ note.title }}</p>
                <p>Content: {{ note.content }}</p>
                <p>Date Added: {{ note.timestamp }}</p>
                <p>
                    <!-- Button should only be disabled while loading for the selected note -->
                    <button type="button" @click="deleteNote(note.id)" :disabled="isLoading.delete === note.id" :class="{ 'button-loading': isLoading.delete === note.id }">
                        <span v-if="isLoading.delete !== note.id">Delete Note</span>
                        <span v-else>Deleting note..</span>
                    </button>
                </p>
            </section>
        </section>
    </section>
</section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { onBeforeRouteUpdate } from 'vue-router';
import axios from 'axios';

const props = defineProps({
    bookId: { type: [String, Number], required: true },
    name: { type: String, default: '' },
});
const user = useUserStore();
const isLoading = reactive({ page: false, add: false, delete: null });
const feedback = reactive({
    page: { message: '', success: false },
    add: { message: '', success: false },
    delete: { message: '', success: false },
});
const notes = ref([]);
const newNote = reactive({
    add_state: false,
    note: { title: null, content: null }
});

// Retrieve all notes pertaining to this book
const retrieveAllNotes = async (book_id) => {
    isLoading.page = true;

    try {
        const noteResponse = await axios.get(`/api/book/view-notes/${user.user.id}/${book_id}`);
        console.log(noteResponse.data.message);
        console.log(`Note Response data information:`, noteResponse);

        feedback.page.success = true;
        feedback.page.message = noteResponse.data.message;

        // Store notes in variable
        notes.value = noteResponse.data.notes;

    } catch (error) {
        console.error(`An error occured while retrieving the user's notes for this book`);
        feedback.page.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.page.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.page.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.page = false;
    }
}

// Decide to write a new note
const decideToAddNewNote = () => {
    newNote.add_state = !newNote.add_state
}

// Add a new note
const addNote = async () => {
    isLoading.add = true;

    try {
        const body = {
            title: newNote.note.title.trim() == '' ? null : newNote.note.title,
            content: newNote.note.content.trim() == '' ? null : newNote.note.content,
            name: props.name 
        }
        const response = await axios.post(`/api/book/add-note/${user.user.id}/${props.bookId}`, body);
        console.log(response.data.message);
        console.log(`Add Response data information:`, response);

        feedback.add.success = true;
        feedback.add.message = response.data.message;
        
        // Reset form
        newNote.add_state = false;
        newNote.note.title = null;
        newNote.note.content = null;

        // Remove the feedback message after 5 seconds
        setTimeout(() => {
            feedback.add.message = '';
            feedback.add.success = false;
        }, 5000);

        // Ajax call on retrieveAllNotes
        await retrieveAllNotes(props.bookId);

    } catch (error) {
        console.error(`An error occured while adding the user's notes for this book`);
        feedback.add.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.add.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.add.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }
    } finally {
        isLoading.add = false;
    }
}

// Delete a note
const deleteNote = async (note_id) => {
    isLoading.delete = note_id;

    try {
        const response = await axios.post(`/api/book/delete-note/${user.user.id}/${props.bookId}/${note_id}`, { name: props.name });
        console.log(response.data.message);
        console.log(`Delete Response data information:`, response);

        feedback.delete.success = true;
        feedback.delete.message = response.data.message;

        alert(feedback.delete.message);

        // Refresh notes
        await retrieveAllNotes(props.bookId);
        
    } catch (error) {
        console.error(`An error occured while deleting note #${note_id} for the user's book`);
        feedback.delete.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.delete.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.delete.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

        alert(feedback.delete.message);

    } finally {
        isLoading.delete = null;
    }
}

onMounted(async () => {
    await retrieveAllNotes(props.bookId);
});

// React to param changes with onBeforeRouteUpdate
onBeforeRouteUpdate((to) => {
    const nextId = to.params.bookId;
    if (nextId) retrieveAllNotes(nextId);
});
</script>