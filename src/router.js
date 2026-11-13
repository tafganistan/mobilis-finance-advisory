import { createRouter, createWebHistory } from 'vue-router'
import { db } from './store'
import PublicLayout from './views/PublicLayout.vue'
import Home from './views/Home.vue'
import News from './views/News.vue'
import Experience from './views/Experience.vue'
import Formateur from './views/Formateur.vue'
import Inscription from './views/Inscription.vue'
import Login from './views/Login.vue'
import Prof from './views/Prof.vue'
import Etudiant from './views/Etudiant.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  routes: [
    { path: '/', component: PublicLayout, children: [
      { path: '', component: Home },
      { path: 'news', component: News },
      { path: 'experience', component: Experience },
      { path: 'formateur', component: Formateur },
      { path: 'inscription', component: Inscription },
    ] },
    { path: '/connexion', component: Login },
    { path: '/professeur', component: Prof, meta: { role: 'prof' } },
    { path: '/etudiant', component: Etudiant, meta: { role: 'etudiant' } },
  ],
})

// Contrôle d'accès selon le rôle
router.beforeEach((to) => {
  const need = to.meta.role
  if (need && db.session?.role !== need) return '/connexion'
})
export default router
