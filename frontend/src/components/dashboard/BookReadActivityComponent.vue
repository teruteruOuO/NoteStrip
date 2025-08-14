<template>
<section id="book-read-activity" class="component">
    <section class="buttons">
        <button type="button" @click="changeDays(7)" id="7-days">
            Last 7 Days
        </button>
        <button type="button" @click="changeDays(15)" id="15-days">
            Last 15 Days
        </button>
        <button type="button" @click="changeDays(30)" id="30-days">
            Last 30 Days
        </button>
    </section>

    <section class="chart-wrapper" :key="bookReadActivity.chart_key">
        <Line :data="chartData" :options="chartOptions" :height="360" />
    </section>
</section>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { reactive, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Line } from 'vue-chartjs';

const user = useUserStore();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ page: false });
const bookReadActivity = reactive({
    labels: [],
    data: [],
    last_nth_day: 7,
    chart_key: 0
});

// Retrieve book read activity
const retrieveBookReadActivity = async (days) => {
    isLoading.page = true;

    try {
        const response = await axios.get(`/api/dashboard/read-activity/${user.user.id}`, { params: { days }});
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        feedback.success = true;
        feedback.message = response.data.message;

        // reset before repopulating
        bookReadActivity.labels.length = 0;
        bookReadActivity.data.length = 0;

        // Retrieve values and store them into variables
        const readActivity = response.data.read_activity;
        
        readActivity.forEach(activity => {
            bookReadActivity.labels.push(activity.day_label);   // Store the labels here
            bookReadActivity.data.push(activity.read_count);    // Store the count here
        });

    } catch (error) {
        console.error(`An error occured while retrieving the user's book read activity`);
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

        alert(feedback.message);

    } finally {
        isLoading.page = false;
    }
}

// Change "last nth days"
const changeDays = async (days) => {
    bookReadActivity.last_nth_day = days;
    await retrieveBookReadActivity(bookReadActivity.last_nth_day);
    bookReadActivity.chart_key++; // remount once per range change
}

// Chart Settings
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)
ChartJS.defaults.font.family = "'Courier New', 'Segoe UI', system-ui, -apple-system, sans-serif";
ChartJS.defaults.font.size = 11;

 const chartData = computed(() => ({
    labels: [...bookReadActivity.labels],
    datasets: [
        { 
            label: 'Daily Read Count', 
            backgroundColor: '#f87979', 
            data: [...bookReadActivity.data] 
        }
    ]
}));

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: true,
    plugins: {
    title: {
        display: true,
        text: `Daily Read Count (Last ${bookReadActivity.last_nth_day} Days)`,
        align: 'center',
        font: { size: 16, weight: '600' }
        },
        legend: { 
            labels: { font: { size: 12 } } 
        },
        tooltip: { 
            titleFont: { size: 12 }, 
            bodyFont: { size: 12 } 
        }
    },
    scales: {
        y: {
            ticks: {
                stepSize: 1,
                callback(value) { return Number.isInteger(value) ? value : ''; }
            },
            title: { display: true, text: 'Number of Reads' }
        }
    }
}));


// Automatically trigger retrieveBookReadActivity on page load and then reload every few seconds
let intervalId = null;
onMounted(() => {
    retrieveBookReadActivity(bookReadActivity.last_nth_day);    // Initial fetch
    intervalId = setInterval(() => retrieveBookReadActivity(bookReadActivity.last_nth_day), 1000 * 10);     // Fetch every 10 seconds
});
onUnmounted(() => {
    clearInterval(intervalId);
});
</script>