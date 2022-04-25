import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'

const app = createApp(App)
app.mount('#app')
app.use(ElementPlus, {})
