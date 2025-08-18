<template>
<section id="edit-a-book" class="component">
    <section class="loader" v-if="isLoading.page">
    </section>

    <section class="retrieve-fail feedback fail" v-else-if="!feedback.page.success">
        <p>{{ feedback.page.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <section class="buttons">
            <button type="button" @click="goBack">Go Back</button>
        </section>

        <!-- This is the form -->
         <form @submit.prevent="updateBook">
            <ul>
                <li>
                    <label for="title">Book Title: </label>
                    <input type="text" name="title" id="title" v-model="bookInformation.title" placeholder="required" required />
                </li>
                <li>
                    <label for="plot-description">Plot Description: </label>
                    <textarea name="plot-description" id="plot-description" v-model="bookInformation.plot_description" placeholder="optional">
                    </textarea>
                </li>
                <li>
                    <label for="extra-information">Extra Information: </label>
                    <textarea name="extra-information" id="extra-information" v-model="bookInformation.extra_information" placeholder="optional">
                    </textarea>
                </li>
                <li>
                    <label for="release-date">Release Date: </label>
                    <input type="date" name="release-date" id="release-date" v-model="bookInformation.release_date" placeholder="optional" />
                </li>
                <li>
                    <label for="end-date">End Date: </label>
                    <input type="date" name="end-date" id="end-date" v-model="bookInformation.end_date" placeholder="optional" />
                </li>
                <li>
                    <label for="image">Book Image: </label>
                    <input type="file" name="image" id="image" accept="image/*" @change="handleImageChange" />
                    <!-- Preview image if available -->
                    <div v-if="bookInformation.img.previewUrl || bookInformation.img.s3">
                        <p>Image Preview:</p>
                        <img
                            :src="bookInformation.img.previewUrl || bookInformation.img.s3"
                            :alt="bookInformation.title"
                            style="max-width: 200px; max-height: 200px;"
                        />
                    </div>
                </li>
                <li>
                    <button type="submit" :disabled="isLoading.update" :class="{ 'button-loading': isLoading.update }">
                        <span v-if="!isLoading.update">Update Book</span>
                        <span v-else>Updating book..</span>
                    </button>

                    <button type="button" @click="resetImage">
                        <span>Reset Image to Original</span>
                    </button>

                    <button type="button" @click="deleteBook" :disabled="isLoading.delete" :class="{ 'button-loading': isLoading.delete }">
                        <span v-if="!isLoading.delete">Delete Book</span>
                        <span v-else>Deleting book..</span>
                    </button>
                </li>
            </ul>
        </form>

        <!-- Feedback message from update -->
        <section class="feedback fail" v-if="feedback.update.message && !feedback.update.success">
            <p>{{ feedback.update.message }}</p>
        </section>

        <!-- Feedback message from delete -->
        <section class="feedback fail" v-if="feedback.delete.message && !feedback.delete.success">
            <p>{{ feedback.delete.message }}</p>
        </section>
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const user = useUserStore();
const feedback = reactive({ 
    page: { message: '', success: false },
    update: { message: '', success: false }, 
    delete: { message: '', success: false }, 
});
const isLoading = reactive({ page: false, update: false, delete: false });
const bookInformation = reactive({
    id: null,
    title: null,
    img: {
        s3: null,
        input: null, // If this is NOT NULL, this image will be stored in the database instead of img.DB
        db: null,
        previewUrl: null
    },
    plot_description: null,
    extra_information: null,
    release_date: null,
    end_date: null
});

/*
When page loads, the <img> uses the public s3Url.
When a user picks a new file, the <img> switches to previewUrl immediately.
*/
const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Revoke the previous preview to avoid memory leaks
    if (bookInformation.img.previewUrl) {
        URL.revokeObjectURL(bookInformation.img.previewUrl);
    }

    bookInformation.img.input = file;
    bookInformation.img.previewUrl = URL.createObjectURL(file);
}

// Reset image (User doesn't want to use their new image anymore)
const resetImage = () => {
    // Revoke old preview URL
    if (bookInformation.img.previewUrl) {
        URL.revokeObjectURL(bookInformation.img.previewUrl);
    }

    // Reset reactive fields
    bookInformation.img.input = null;
    bookInformation.img.previewUrl = null;
}

// Retrieve the book instance
const retrieveABook = async () => {
    const bookId = Number(route.params.book_id);
    isLoading.page = true;

    try {
        const bookResponse = await axios.get(`/api/book/edit/retrieve-book/${user.user.id}/${bookId}`);
        console.log(bookResponse.data.message);
        console.log(`Book Response data information:`, bookResponse);

        feedback.page.success = true;
        feedback.page.message = bookResponse.data.message;

        // Store the data in bookInformation
        bookInformation.id = bookResponse.data.book.id;
        bookInformation.title = bookResponse.data.book.title;
        bookInformation.plot_description = bookResponse.data.book.plot_description;
        bookInformation.extra_information = bookResponse.data.book.extra_information;
        bookInformation.release_date = bookResponse.data.book.release_date;
        bookInformation.end_date = bookResponse.data.book.end_date;

        // Store images 
        bookInformation.img.s3 = bookResponse.data.book.img.s3;
        bookInformation.img.db = bookResponse.data.book.img.db;

    } catch (error) {
        console.error(`An error occured while retrieving the user's book`);
        feedback.page.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.page.message = error.response.data.message;

            // Go back to the books page if it doesn't exist
            if (error.response.status === 404) {
                router.push({ name: 'books' });
            }

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.page.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        isLoading.page = false;
    }
}

// Go back to the previous page
const goBack = () => {
    router.back();
}

// Update the book
const updateBook = async () => {
    const answer = window.confirm(`Are you sure you want to make changes for this book?`);
    if (!answer) return;

    isLoading.update = true;

    try {
        let newImageLocation = null;

        // Delete the current image from S3 and upload the new one (IF there's a new image uploaded)
        if (bookInformation.img.input && bookInformation.img.previewUrl) {
            // Step 1: Get the signed upload URL
            const newImageFile = bookInformation.img.input;
            const uploadUrlBody = {
                file_name: `${Date.now()}-${newImageFile.name}`,
                content_type: newImageFile.type,
                old_image_location: bookInformation.img.db
            }
            const replaceUrlResponse = await axios.post(`/api/book/edit/replace-upload-url/${user.user.id}`, uploadUrlBody);
            console.log(replaceUrlResponse.data.message);
            console.log(`Replace URL Response data information:`, replaceUrlResponse);

            // Step 2: Upload the new file to the S3 bucket via signed URL
            await axios.put(replaceUrlResponse.data.new_image.signed_url, newImageFile, {
                headers: { 
                    'Content-Type': uploadUrlBody.content_type 
                },
                withCredentials: false // disables cookies for S3 PUT
            });
            console.log(`Successfuly uploaded the image (${replaceUrlResponse.data.new_image.location}) to the S3 bucket!`);
            newImageLocation = replaceUrlResponse.data.new_image.location;

            // Step 3: Delete the old image via the presigned DELETE URL
            await axios.delete(replaceUrlResponse.data.old_image_signed_delete_url, { withCredentials: false });
            console.log('Successfully deleted the old image from S3!');
        }

        let plotDesc = bookInformation.plot_description;
        if (plotDesc) {
            plotDesc = plotDesc.trim() === '' ? null : plotDesc;
        }

        // Temporary function: If content is not empty but only has spaces instead of letters, then just make it null
        const bodyContent = (content) => {
            if (content == null) return null;

            if (typeof content === 'string') {
                // If it's empty or whitespace-only, return null; otherwise return original (untrimmed)
                return content.trim() === '' ? null : content;
            }
            return content; // non-strings pass through unchanged
        }

        const body = {
            title: bookInformation.title,
            plot_description: bodyContent(bookInformation.plot_description),
            extra_information: bodyContent(bookInformation.extra_information),
            release_date: bookInformation.release_date == '' ? null : bookInformation.release_date,
            end_date: bookInformation.end_date == '' ? null : bookInformation.end_date,
            image: newImageLocation ? newImageLocation : bookInformation.img.db     // If there's a new image, send that one instead of the current one
        }
        const updateResponse = await axios.post(`/api/book/edit/update-book/${user.user.id}/${bookInformation.id}`, body);
        console.log(updateResponse.data.message);
        console.log(`Update Data Response data information:`, updateResponse);

        alert(updateResponse.data.message);
        
        feedback.update.message = updateResponse.data.message;
        feedback.update.success = true;

        // Reroute to the view page of this book
        router.push({ name: 'view-book', params: { book_id: bookInformation.id }, query: { name: bookInformation.title } });

    } catch (error) {
        console.error(`An error occured while updating the user's book`);
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

    } finally {
        isLoading.update = false;
    }
}

// Delete the book
const deleteBook = async () => {
    const answer1 = window.confirm(`Are you sure you want to delete this book?`);
    if (!answer1) return;

    const answer2 = window.confirm(`This is the final warning. Are you sure you want to delete this book?`);
    if (!answer2) return; 

    isLoading.delete = true;

    try {
        const body = {
            title: bookInformation.title,
            image_location: bookInformation.img.db
        }
        const response = await axios.post(`/api/book/edit/delete-book/${user.user.id}/${bookInformation.id}`, body);
        console.log(response.data.message);
        console.log(`Delete Data Response data information:`, response);
        
        feedback.delete.message = response.data.message;
        feedback.delete.success = true;

        // Should return a signed delete url
        // Delete the image via the presigned DELETE URL
        await axios.delete(response.data.image_signed_delete_url, { withCredentials: false });
        console.log('Successfully deleted the image from S3!');

        alert(feedback.delete.message);

        // Reroute to the books page
        router.push({ name: 'books'});

    } catch (error) {
        console.error(`An error occured while deleting the user's book`);
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

    } finally {
        isLoading.delete = false;
    }
}

// Automatically trigger retrieveABook
onMounted(async () => {
    await retrieveABook();
});

</script>

<style scoped>
#variables p {
    border: 1px solid black;
}

#variables span {
    font-weight: bold;
}
</style>