<template>
<section id="view-book-note" class="component">
    <h2>Notes</h2>

    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.page.success">
        <p>{{ feedback.page.message }}</p>
    </section>

    <!-- Show if retrieval of notes was a success -->
    <section class="retrieve-success" v-else>
        <section class="add-note-button">
            <button type="button" @click="decideToAddNewNote">
                <span v-if="!newNote.add_state">Add a new note</span>
                <span v-else>Cancel</span>
            </button>
        </section>

        <section id="add-note" v-if="newNote.add_state" ref="decideAddNoteScroll">  
            <!-- Show only if user decides to add a note -->
            <form @submit.prevent="addNote">
                <ul>
                    <li>
                        <label for="title-add">Title: </label>
                        <input type="text" name="title-add" id="title-add" v-model="newNote.note.title" placeholder="Required" required />
                    </li>
                    <li>
                        <label for="content-add">Content: </label>
                        <textarea name="content-add" id="content-add" v-model="newNote.note.content" placeholder="Required" required>
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

            <section class="feedback fail" v-if="!feedback.add.message">
                <p>{{ feedback.add.message }}</p>
            </section>
        </section>

        <section class="no-list" v-if="notes.length <= 0">
            <p>No notes found. Add one!</p>
        </section>

        <section class="note-lists" ref="addScroll" v-else>
            <section class="note-instance" :id="`note-${note.id}`" v-for="note in notes" :key="note.id">
                <!-- Show when viewing a note -->
                <section :id="`view-note-instance-${note.id}`" v-if="!note.update_state" class="note-information">
                    <h3>{{ note.title }}</h3>
                    <p>{{ note.content }}</p>
                </section>
                
                <!-- Show when updating a note -->
                <section class="update-note" :id="`update-note-instance-${note.id}`" v-if="note.update_state">
                    <form @submit.prevent="">
                        <ul>
                            <li>
                                <label for="title-update">Title: </label>
                                <input type="text" name="title-update" id="title-update" v-model="note.title" placeholder="required" required />
                            </li>
                            <li>
                                <label for="content-update">Content: </label>
                                <textarea name="content-update" id="content-update" v-model="note.content" placeholder="required" required>
                                </textarea>
                            </li>
                            <li>
                                <section class="feedback fail" :id="`update-note-instance-feedback-${note.id}`" v-if="feedback.update.message && !feedback.update.success">
                                    <p>{{ feedback.update.message }}</p>
                                </section>
                            </li>
                            <li>
                                <button type="submit" @click="updateNote(note)" :disabled="isLoading.update === note.id" :class="{ 'button-loading': isLoading.update === note.id }">
                                    <span v-if="isLoading.update !== note.id">Update</span>
                                    <span v-else>Updating..</span>
                                </button>
                            </li>
                        </ul>
                    </form>

                </section>

                <section class="buttons">
                    <!-- Last Update -->
                    <p>Last Update: {{ note.timestamp }}</p>
                    <!-- Button for starting an update on a note -->
                    <button @click="decidedToUpdateNote(note)">
                        <span v-if="!note.update_state">Update</span>
                        <span v-else>Cancel</span>
                    </button>
                    <!-- Button should only be disabled while loading for the selected note -->
                    <button type="button" @click="deleteNote(note)" :disabled="isLoading.delete === note.id" :class="{ 'button-loading': isLoading.delete === note.id }">
                        <span v-if="isLoading.delete !== note.id">Delete</span>
                        <span v-else>Deleting...</span>
                    </button>
                </section>
                
            </section>
        </section>
    </section>
</section>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { onBeforeRouteUpdate } from 'vue-router';
import axios from 'axios';

const props = defineProps({
    bookId: { type: [String, Number], required: true },
    name: { type: String, default: '' },
});
const user = useUserStore();
const isLoading = reactive({ page: false, add: false, delete: null, update: null });
const feedback = reactive({
    page: { message: '', success: false },
    add: { message: '', success: false },
    delete: { message: '', success: false },
    update: { message: '', success: false }
});
const decideAddNoteScroll = ref(null);
const addScroll = ref(null);
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
        notes.value = noteResponse.data.notes.map(note => ({
            ...note,          // keep existing properties: title, content, timestamp
            update_state: false  // new property for deciding to update one note instance
        }));

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
const decideToAddNewNote = async () => {
    newNote.add_state = !newNote.add_state

    // Ensure the update state of all notes are cancelled if this new note is active
    notes.value.forEach(noteItem => {
        noteItem.update_state = false
    });

    await nextTick();
    decideAddNoteScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });
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

        await nextTick();
        addScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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

// Decided to update a note instance
const decidedToUpdateNote = async (note) => {
    if (!note.update_state) {
        // OPEN: snapshot originals
        note._backup = { title: note.title, content: note.content };

        // close others
        notes.value.forEach(n => { if (n.id !== note.id) n.update_state = false; });

        note.update_state = true;

        if (newNote.add_state) {
        newNote.add_state = false;
        newNote.note.title = null;
        newNote.note.content = null;
        }

        await nextTick();
        document.getElementById(`update-note-instance-${note.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } else {
        // CANCEL: restore originals
        if (note._backup) {
            note.title = note._backup.title;
            note.content = note._backup.content;
            note._backup = null;
        }
        note.update_state = false;

        // On cancel, revert to normal
        feedback.update.success = false;
        feedback.update.message = '';
    }
}

// Update a note
const updateNote = async (note) => {

    isLoading.update = note.id;

    try {
        const body = {
            title: note.title,
            content: note.content,
            name: props.name
        }
        const response = await axios.post(`/api/book/update-note/${user.user.id}/${props.bookId}/${note.id}`, body);
        console.log(response.data.message);
        console.log(`Update Response data information:`, response);

        feedback.update.success = true;
        feedback.update.message = response.data.message;

        alert(feedback.update.message);

        // Refresh notes
        await retrieveAllNotes(props.bookId);

        await nextTick(); 
        const el =
        document.getElementById(`note-${note.id}`) ||
        document.getElementById(`view-note-instance-${note.id}`) ||
        document.getElementById(`update-note-instance-${note.id}`);

        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Ensure feedbacks are gone after refresh
        feedback.update.success = false;
        feedback.update.message = '';

    } catch (error) {
        console.error(`An error occured while updating note #${note.id} (${note.title}) for the user's book`);
        feedback.update.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.update.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.update.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

        await nextTick();
        document
        .getElementById(`update-note-instance-feedback-${note.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } finally {
        isLoading.update = null;
    }
}

// Delete a note
const deleteNote = async (note) => {
    const answer = window.confirm(`Are you sure you want to delete this note (${note.title})`);
    if (!answer) return;

    isLoading.delete = note.id;

    try {
        const response = await axios.post(`/api/book/delete-note/${user.user.id}/${props.bookId}/${note.id}`, { name: props.name });
        console.log(response.data.message);
        console.log(`Delete Response data information:`, response);

        feedback.delete.success = true;
        feedback.delete.message = response.data.message;

        alert(feedback.delete.message);

        // Refresh notes
        await retrieveAllNotes(props.bookId);

        await nextTick();
        addScroll.value?.scrollIntoView({ behavior: "smooth", block: "center" });
        
    } catch (error) {
        console.error(`An error occured while deleting note #${note.id} (${note.title}) for the user's book`);
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