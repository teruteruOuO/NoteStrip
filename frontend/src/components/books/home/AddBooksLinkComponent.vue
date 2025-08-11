<template>
<section id="add-books-link" class="component">
    <p><RouterLink :to="{ name: 'add-book' }">Add a Book!</RouterLink></p>
</section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>