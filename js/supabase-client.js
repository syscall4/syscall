// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tus credenciales de Supabase
const supabaseUrl = 'https://swsrywvjskhshlbtbzrx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3c3J5d3Zqc2toc2hsYnRienJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDcxMDksImV4cCI6MjA4ODU4MzEwOX0.u9JCI1eyR4yNdTGb9o17vHTDGZJDrO7W62KlkMATd1M'
const supabase = createClient(supabaseUrl, supabaseKey)

// ===== CONFIGURACIÓN DE YOUTUBE =====
const YOUTUBE_CONFIG = {
    CHANNEL_ID: 'UCud7gxsaKCpU144Vvbk3zcg',
    CHANNEL_URL: 'https://youtube.com/@syscall.sc4',
    CACHE_DURATION: 3600000 // 1 hora
}

// Cache para YouTube
let youtubeCache = {
    videoId: null,
    title: null,
    date: null,
    timestamp: null
}

// ===== FUNCIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando syscall...')

    try {
        // Mostrar loaders
        showLoaders()

        // Cargar todos los datos
        await Promise.allSettled([
            loadArticles(),
            loadLatestVideo()
        ])

        // Inicializar componentes
        initMobileMenu()
        initSearch()
        updateWeeklySyscall()

        console.log('✅ Todos los contenidos cargados correctamente')
        setTimeout(hideLoaders, 1000)

    } catch (error) {
        console.error('❌ Error general:', error)
    }
})

// ===== FUNCIONES AUXILIARES =====
function showLoaders() {
    document.querySelectorAll('.loader').forEach(loader => {
        if (loader) loader.style.display = 'block'
    })
}

function hideLoaders() {
    document.querySelectorAll('.loader').forEach(loader => {
        if (loader) loader.style.display = 'none'
    })
}

function cleanHtml(html) {
    if (!html) return ''
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
}

// ===== MENÚ HAMBURGUESA =====
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            menuToggle.classList.toggle('active');
            navList.classList.toggle('active');
            document.body.style.overflow = navList.classList.contains('active') ? 'hidden' : '';
        });

        navList.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.classList.remove('active');
                navList.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navList.contains(e.target) && navList.classList.contains('active')) {
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.classList.remove('active');
                navList.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ===== CARGAR GRID DE ARTÍCULOS =====
async function loadArticles() {
    try {
        console.log('🔍 Cargando artículos del grid...')

        const container = document.getElementById('articles-grid-container')
        if (!container) return

        const { data: articles, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(6)

        if (error) throw error

        if (!articles || articles.length === 0) {
            container.innerHTML = '<div class="no-articles">No hay artículos publicados aún</div>'
            return
        }

        console.log(`✅ Cargados ${articles.length} artículos`)

        container.innerHTML = articles.map(article => {
            const date = article.published_at
                ? new Date(article.published_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
                : 'Fecha no disponible'

            let excerpt = article.excerpt || article.subtitle
            if (!excerpt && article.content) {
                excerpt = cleanHtml(article.content).substring(0, 120) + '...'
            }

            const categoryIcon = getCategoryIcon(article.category)

            const defaultImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M4 6H20M4 12H20M4 18H20' stroke='%233b82f6' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E`

            return `
                <article class="article-card">
                    <div class="article-image">
                        <img 
                            src="${article.featured_image || defaultImage}" 
                            alt="${article.title}"
                            loading="lazy"
                            onerror="this.src='${defaultImage}'"
                        >
                        <span class="article-image-badge">${article.category || 'general'}</span>
                    </div>
                    <div class="article-content">
                        <div class="article-meta">
                            <span>📅 ${date}</span>
                            <span>${categoryIcon} ${article.category || 'general'}</span>
                        </div>
                        <h3><a href="/post.html?slug=${article.slug}">${article.title}</a></h3>
                        <p class="article-excerpt">${excerpt || 'Sin descripción'}</p>
                        <div class="article-footer">
                            <a href="/post.html?slug=${article.slug}" class="read-more">Leer</a>
                            ${article.reading_time ? `<span class="article-stats">⏱️ ${article.reading_time} min</span>` : ''}
                        </div>
                    </div>
                </article>
            `
        }).join('')

    } catch (error) {
        console.error('❌ Error en loadArticles:', error)
        const container = document.getElementById('articles-grid-container')
        if (container) {
            container.innerHTML = '<div class="no-articles" style="color: #ef4444;">Error al cargar los artículos</div>'
        }
    }
}

function getCategoryIcon(category) {
    const icons = {
        'seguridad': '🔒',
        'actualidad': '📰',
        'hardware': '🖥️',
        'conceptos': '📚',
        'kernel': '⎈',
        'memoria': '🧠',
        'procesos': '⚙️',
        'arquitectura': '🏗️',
        'tutoriales': '📝',
        'noticias': '📡',
        'video': '🎬'
    }
    return icons[category?.toLowerCase()] || '📄'
}

// ===== CARGAR ÚLTIMO VIDEO =====
async function loadLatestVideo() {
    try {
        const container = document.getElementById('latest-video-container')
        if (!container) return

        container.innerHTML = '<div class="loader" role="status"></div>'

        // Usar RSS feed
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CONFIG.CHANNEL_ID}`)
        
        if (!response.ok) throw new Error('Error en RSS')
        
        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
            const latestVideo = data.items[0]
            
            let videoId = ''
            if (latestVideo.link && latestVideo.link.includes('v=')) {
                videoId = latestVideo.link.split('v=')[1].split('&')[0]
            }
            
            if (videoId) {
                const videoData = {
                    videoId: videoId,
                    title: latestVideo.title,
                    date: new Date(latestVideo.pubDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                }
                
                renderVideoEmbed(videoData, container)
                return
            }
        }
        
        renderVideoPlaceholder(container)

    } catch (error) {
        console.error('Error cargando video:', error)
        renderVideoPlaceholder(document.getElementById('latest-video-container'))
    }
}

function renderVideoEmbed(video, container) {
    const embedUrl = `https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1&iv_load_policy=3&color=white&autohide=1&controls=1&playsinline=1`

    container.innerHTML = `
        <div class="video-embed-wrapper">
            <div class="embed-container">
                <iframe 
                    src="${embedUrl}"
                    title="${video.title}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    loading="lazy">
                </iframe>
            </div>
            <div class="video-info-bar">
                <div class="video-title">
                    <h3>${video.title}</h3>
                    <p><span>${video.date}</span></p>
                </div>
                <div class="video-actions">
                    <a href="https://youtu.be/${video.videoId}" target="_blank" class="video-button small">
                        Ver en YouTube →
                    </a>
                </div>
            </div>
        </div>
    `
}

function renderVideoPlaceholder(container) {
    container.innerHTML = `
        <div class="video-placeholder">
            <div class="placeholder-thumbnail">
                <div class="placeholder-icon">🎬</div>
                <span class="placeholder-badge">syscall</span>
            </div>
            <div class="placeholder-info">
                <div class="placeholder-text">
                    <h3>Contenido en YouTube</h3>
                    <p>Visita nuestro canal para ver los últimos videos</p>
                </div>
                <a href="https://youtube.com/@syscall.sc4" target="_blank" class="video-button">
                    Ver canal →
                </a>
            </div>
        </div>
    `
}

// ===== BARRA DE BÚSQUEDA =====
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const searchWrapper = document.getElementById('search-wrapper');
    
    if (!searchInput || !searchButton || !searchResults) return;
    
    let searchTimeout;
    let currentSearchTerm = '';
    
    async function performSearch(query) {
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchResults.innerHTML = '<div class="search-loading"><div class="loader-small"></div></div>';
        searchResults.classList.add('active');
        
        try {
            const { data: results, error } = await supabase
                .from('articles')
                .select(`
                    title,
                    slug,
                    excerpt,
                    category,
                    published_at,
                    featured_image
                `)
                .eq('is_published', true)
                .or(`title.ilike.%${query}%, excerpt.ilike.%${query}%, category.ilike.%${query}%`)
                .order('published_at', { ascending: false })
                .limit(5);
            
            if (error) throw error;
            
            if (results && results.length > 0) {
                searchResults.innerHTML = results.map(item => {
                    const date = item.published_at 
                        ? new Date(item.published_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short'
                        })
                        : '';
                    
                    const categoryIcon = getCategoryIcon(item.category);
                    
                    return `
                        <a href="/post.html?slug=${item.slug}" class="search-result-item">
                            <div class="search-result-thumb">
                                <img 
                                    src="${item.featured_image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%25\' height=\'100%25\' viewBox=\'0 0 24 24\' fill=\'%233b82f6\'%3E%3Cpath d=\'M4 6H20M4 12H20M4 18H20\' stroke=\'%233b82f6\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E'}" 
                                    alt="${item.title}"
                                    loading="lazy"
                                >
                            </div>
                            <div class="search-result-info">
                                <h4>${highlightText(item.title, query)}</h4>
                                <div class="search-result-meta">
                                    <span>${date}</span>
                                    <span>${categoryIcon} ${item.category || 'general'}</span>
                                </div>
                                ${item.excerpt ? `<p class="search-result-excerpt">${highlightText(item.excerpt.substring(0, 60), query)}...</p>` : ''}
                            </div>
                        </a>
                    `;
                }).join('');
            } else {
                searchResults.innerHTML = `
                    <div class="no-results">
                        No se encontraron resultados para "${query}"
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            searchResults.innerHTML = `
                <div class="no-results">
                    Error al buscar. Intenta de nuevo.
                </div>
            `;
        }
    }
    
    function highlightText(text, query) {
        if (!text || !query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: var(--blue-soft); color: var(--blue-primary); padding: 0 2px; border-radius: 4px;">$1</mark>');
    }
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            currentSearchTerm = '';
            return;
        }
        
        if (query === currentSearchTerm) return;
        
        searchTimeout = setTimeout(() => {
            currentSearchTerm = query;
            performSearch(query);
        }, 300);
    });
    
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            performSearch(query);
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                performSearch(query);
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.blur();
        }
    });
}

// ===== SYSCOLL DE LA SEMANA =====
const syscallsOfTheWeek = [
    { name: 'execve()', description: 'ejecuta un programa', link: '/syscalls/execve' },
    { name: 'fork()', description: 'crea un nuevo proceso', link: '/syscalls/fork' },
    { name: 'open()', description: 'abre un archivo', link: '/syscalls/open' },
    { name: 'read()', description: 'lee datos de un archivo', link: '/syscalls/read' },
    { name: 'write()', description: 'escribe datos en un archivo', link: '/syscalls/write' },
    { name: 'close()', description: 'cierra un archivo', link: '/syscalls/close' },
    { name: 'mmap()', description: 'mapea archivos en memoria', link: '/syscalls/mmap' },
    { name: 'brk()', description: 'cambia la asignación de memoria', link: '/syscalls/brk' },
    { name: 'socket()', description: 'crea un socket', link: '/syscalls/socket' },
    { name: 'connect()', description: 'conecta un socket', link: '/syscalls/connect' },
    { name: 'bind()', description: 'asigna un nombre a un socket', link: '/syscalls/bind' },
    { name: 'listen()', description: 'escucha conexiones en un socket', link: '/syscalls/listen' },
    { name: 'accept()', description: 'acepta una conexión', link: '/syscalls/accept' },
    { name: 'kill()', description: 'envía una señal a un proceso', link: '/syscalls/kill' },
    { name: 'signal()', description: 'maneja señales', link: '/syscalls/signal' },
    { name: 'pipe()', description: 'crea una tubería', link: '/syscalls/pipe' },
    { name: 'dup()', description: 'duplica un descriptor', link: '/syscalls/dup' },
    { name: 'chdir()', description: 'cambia el directorio de trabajo', link: '/syscalls/chdir' },
    { name: 'mkdir()', description: 'crea un directorio', link: '/syscalls/mkdir' },
    { name: 'rmdir()', description: 'elimina un directorio', link: '/syscalls/rmdir' },
    { name: 'unlink()', description: 'elimina un archivo', link: '/syscalls/unlink' },
    { name: 'mount()', description: 'monta un sistema de archivos', link: '/syscalls/mount' },
    { name: 'umount()', description: 'desmonta un sistema de archivos', link: '/syscalls/umount' },
    { name: 'getpid()', description: 'obtiene el ID del proceso', link: '/syscalls/getpid' },
    { name: 'getppid()', description: 'obtiene el ID del proceso padre', link: '/syscalls/getppid' },
    { name: 'getuid()', description: 'obtiene el ID del usuario', link: '/syscalls/getuid' },
    { name: 'setuid()', description: 'establece el ID del usuario', link: '/syscalls/setuid' },
    { name: 'chmod()', description: 'cambia permisos de archivo', link: '/syscalls/chmod' },
    { name: 'chown()', description: 'cambia propietario de archivo', link: '/syscalls/chown' },
    { name: 'stat()', description: 'obtiene información de archivo', link: '/syscalls/stat' },
    { name: 'lseek()', description: 'reposiciona el offset de archivo', link: '/syscalls/lseek' },
    { name: 'fsync()', description: 'sincroniza archivo con disco', link: '/syscalls/fsync' },
    { name: 'ioctl()', description: 'controla dispositivos', link: '/syscalls/ioctl' },
    { name: 'select()', description: 'monitorea múltiples descriptores', link: '/syscalls/select' },
    { name: 'poll()', description: 'espera eventos en descriptores', link: '/syscalls/poll' },
    { name: 'epoll()', description: 'monitorea múltiples descriptores (Linux)', link: '/syscalls/epoll' },
    { name: 'inotify()', description: 'monitorea cambios en archivos', link: '/syscalls/inotify' },
    { name: 'ptrace()', description: 'permite rastrear procesos', link: '/syscalls/ptrace' }
];

function updateWeeklySyscall() {
    const container = document.querySelector('.weekly-syscall');
    if (!container) return;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekNumber = Math.floor(startOfWeek.getTime() / (1000 * 60 * 60 * 24 * 7));
    const syscallIndex = weekNumber % syscallsOfTheWeek.length;
    const syscall = syscallsOfTheWeek[syscallIndex];
    
    container.innerHTML = `
        <div class="weekly-syscall-container">
            <span class="weekly-label"># syscall de la semana</span>
            <code class="weekly-code">${syscall.name}</code>
            <span class="weekly-description">${syscall.description}</span>
            <a href="${syscall.link}" class="weekly-link">aprender más →</a>
        </div>
    `;
}

// ===== FUNCIONES EXPORTADAS =====
export async function loadSingleArticle(slug) {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single()

        if (error) return null

        if (data) {
            supabase
                .from('articles')
                .update({ views_count: (data.views_count || 0) + 1 })
                .eq('id', data.id)
                .then()
                .catch(() => {})
        }

        return data
    } catch (error) {
        return null
    }
}

export async function searchArticles(query) {
    try {
        if (!query || query.length < 2) return []

        const { data, error } = await supabase
            .from('articles')
            .select('title, slug, excerpt, featured_image, category, published_at')
            .eq('is_published', true)
            .ilike('title', `%${query}%`)
            .order('published_at', { ascending: false })
            .limit(10)

        return data || []
    } catch (error) {
        return []
    }
}

export async function loadArticlesByCategory(category, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .eq('category', category)
            .order('published_at', { ascending: false })
            .limit(limit)

        return data || []
    } catch (error) {
        return []
    }
}

export async function loadRelatedArticles(articleId, category, tags = [], limit = 3) {
    try {
        let query = supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .neq('id', articleId)

        if (category) query = query.eq('category', category)
        if (tags && tags.length > 0) query = query.overlaps('tags', tags)

        const { data, error } = await query
            .order('published_at', { ascending: false })
            .limit(limit)

        return data || []
    } catch (error) {
        return []
    }
}

console.log('✅ Cliente de Supabase inicializado correctamente')
