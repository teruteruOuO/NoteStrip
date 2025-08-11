<template>
<section id="add-book-for-user" class="component">
    <form @submit.prevent="addBook">
        <ul>
            <li>
                <label for="title">Book Title: </label>
                <input type="text" name="title" id="title" v-model="bookInstance.title" placeholder="required" required />
            </li>
            <li>
                <label for="plot-description">Plot Description: </label>
                <textarea name="plot-description" id="plot-description" v-model="bookInstance.plot_description" placeholder="optional">
                </textarea>
            </li>
            <li>
                <label for="extra-information">Extra Information: </label>
                <textarea name="extra-information" id="extra-information" v-model="bookInstance.extra_information" placeholder="optional">
                </textarea>
            </li>
            <li>
                <label for="release-date">Release Date: </label>
                <input type="date" name="release-date" id="release-date" v-model="bookInstance.release_date" placeholder="optional" />
            </li>
            <li>
                <label for="end-date">End Date: </label>
                <input type="date" name="end-date" id="end-date" v-model="bookInstance.end_date" placeholder="optional" />
            </li>
            <li>
                <label for="image">Book Image: </label>
                <input type="file" name="image" id="image" accept="image/*" @change="handleImageChange" required />
            </li>
            <li>
                <button type="submit" :disabled="isLoading.form" :class="{ 'button-loading': isLoading.form }">
                    <span v-if="!isLoading.form">Add Book</span>
                    <span v-else>Adding book..</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="output">
        <p>{{ bookInstance.title }}</p>
        <p>{{ bookInstance.plot_description }}</p>
        <p>{{ bookInstance.extra_information }}</p>
        <p>{{ bookInstance.release_date }}</p>
        <p>{{ bookInstance.end_date }}</p>

        <!-- Preview image if available -->
        <div v-if="bookInstance.image.preview">
            <p>Image Preview:</p>
            <img :src="bookInstance.image.preview" alt="Book Preview" />
        </div>
    </section>

    <section class="feedback" :class="{ 'success': feedback.success, 'fail': !feedback.success }" v-if="feedback.message">
        <p>{{ feedback.message }}</p>
    </section>
</section>    
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = useUserStore();
const isLoading = reactive({ form: false });
const feedback = reactive({ message: '', success: false });
const bookInstance = reactive({
    title: '',
    image: { file: null, preview: null },
    plot_description: '',
    extra_information: '',
    release_date: '',
    end_date: ''
});

// Shows the most recent picked picture and previews it
const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
        bookInstance.image.file = file;
        bookInstance.image.preview = URL.createObjectURL(file);
    }
}

// Add the book
const addBook = async () => {
    if (!bookInstance.image.file) return;
    isLoading.form = true;

    try {
        // Step 1: Get the signed upload URL
        const imageFile = bookInstance.image.file;
        const uploadUrlBody = {
            file_name: `${Date.now()}-${imageFile.name}`,
            content_type: imageFile.type
        }
        const uploadUrlResponse = await axios.post(`/api/book/upload-url/${user.user.id}`, uploadUrlBody);
        console.log(uploadUrlResponse.data.message);
        console.log(`Upload URL Response data information:`, uploadUrlResponse);

        // Step 2: Upload file to the S3 bucket via signed URL
        await axios.put(uploadUrlResponse.data.signed_url, imageFile, {
            headers: { 
                'Content-Type': uploadUrlBody.content_type 
            },
            withCredentials: false // disables cookies for S3 PUT
        });
        console.log(`Successfuly uploaded the image (${uploadUrlResponse.data.image_location}) to the S3 bucket!`);

        // Step 3: Store the book's information to the database
        const body = {
            title: bookInstance.title,
            image: uploadUrlResponse.data.image_location,
            plot_description: bookInstance.plot_description.trim() == '' ? null : bookInstance.plot_description,
            extra_information: bookInstance.extra_information.trim() == '' ? null : bookInstance.extra_information,
            release_date: bookInstance.release_date == '' ? null : bookInstance.release_date,
            end_date: bookInstance.end_date == '' ? null : bookInstance.end_date,
        }
        const storeDataResponse = await axios.post(`/api/book/add-book/${user.user.id}`, body);
        console.log(storeDataResponse.data.message);
        console.log(`Store Data Response data information:`, storeDataResponse);

        alert(storeDataResponse.data.message);
        
        feedback.message = storeDataResponse.data.message;
        feedback.success = true;

        router.push({ name: 'books' });

    } catch (error) {
        console.error(`An error occured while adding the user's book`);
        feedback.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        isLoading.form = false;
    }
}
</script>