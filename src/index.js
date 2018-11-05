import "@babel/polyfill"; // 이 라인을 지우지 말아주세요!

import axios from 'axios'

const api = axios.create({
  baseURL: 'https://dull-room.glitch.me/'
})

// Axios Interceptor - 그때그때 다른 설정 사용하기
// axios에는 매번 요청이 일어나기 직전에 **설정 객체를 가로채서** 원하는대로 편집할 수 있는 기능이 있습니다.
api.interceptors.request.use(function (config) {
  // localStorage에 token이 있으면 요청에 헤더 설정, 없으면 아무것도 하지 않음
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});

const templates = {
  loginForm: document.querySelector('#login-form').content,
  postList: document.querySelector('#post-list').content,
  postItem: document.querySelector('#post-item').content,
  postForm: document.querySelector('#post-form').content,
  postDetail: document.querySelector('#post-detail').content,
}

const rootEl = document.querySelector('.root')

async function drawLoginForm() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.loginForm, true)

  // 2. 내용 채우기
  const formEl = frag.querySelector('.login-form')

  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    const username = e.target.elements.username.value
    const password = e.target.elements.password.value

    const res = await api.post('/users/login', {
      username,
      password
    })

    localStorage.setItem('token', res.data.token)
    drawPostList()
  })

  // 3. 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

async function drawPostList() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.postList, true)

  // 2. 내용 채우기
  const listEl = frag.querySelector('.post-list')
  const logoutEl = frag.querySelector('.logout')
  const createEl = frag.querySelector('.create')

  const {data: postList} = await api.get('/posts')

  postList.forEach(postItem => {
    // 1. 템플릿 복사
    const frag = document.importNode(templates.postItem, true)

    // 2. 내용 채우기
    const idEl = frag.querySelector('.id')
    const titleEl = frag.querySelector('.title')
    const authorEl = frag.querySelector('.author')

    idEl.textContent = postItem.id
    titleEl.textContent = postItem.title
    titleEl.addEventListener('click', e => {
      drawPostDetail(postItem.id)
    })

    // TODO
    authorEl.textContent = 'TODO'

    // 3. 문서에 삽입
    listEl.appendChild(frag)
  })

  logoutEl.addEventListener('click', e => {
    localStorage.removeItem('token')
    drawLoginForm()
  })

  createEl.addEventListener('click', e => {
    drawNewPostForm()
  })

  // 3. 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

async function drawPostDetail(postId) {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.postDetail, true)

  // 2. 내용 채우기
  const titleEl = frag.querySelector('.title')
  const authorEl = frag.querySelector('.author')
  const bodyEl = frag.querySelector('.body')
  const deleteEl = frag.querySelector('.delete')
  const updateEl = frag.querySelector('.update')
  const backEl = frag.querySelector('.back')

  const {data: {title, body}} = await api.get(`/posts/${postId}`)

  titleEl.textContent = title
  bodyEl.textContent = body

  // TODO
  authorEl.textContent = 'TODO'

  backEl.addEventListener('click', e => {
    drawPostList()
  })

  updateEl.addEventListener('click', e => {
    drawEditPostForm(postId)
  })

  deleteEl.addEventListener('click', async e => {
    await api.delete(`/posts/${postId}`)
    drawPostList()
  })

  // 3. 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

async function drawNewPostForm() {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.postForm, true)

  // 2. 내용 채우기
  const formEl = frag.querySelector('.post-form')
  const backEl = frag.querySelector('.back')

  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    const title = e.target.elements.title.value
    const body = e.target.elements.body.value
    await api.post('/posts', {
      title,
      body
    })
    drawPostList()
  })

  backEl.addEventListener('click', e => {
    e.preventDefault()
    drawPostList()
  })

  // 3. 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

async function drawEditPostForm(postId) {
  // 1. 템플릿 복사
  const frag = document.importNode(templates.postForm, true)

  // 2. 내용 채우기
  const formEl = frag.querySelector('.post-form')
  const titleEl = frag.querySelector('.title')
  const bodyEl = frag.querySelector('.body')
  const backEl = frag.querySelector('.back')

  const {data: {title, body}} = await api.get(`/posts/${postId}`)
  titleEl.value = title
  bodyEl.value = body

  formEl.addEventListener('submit', async e => {
    e.preventDefault()
    const title = e.target.elements.title.value
    const body = e.target.elements.body.value
    await api.patch(`/posts/${postId}`, {
      title,
      body
    })
    drawPostList()
  })

  backEl.addEventListener('click', e => {
    e.preventDefault()
    drawPostList()
  })

  // 3. 문서에 삽입
  rootEl.textContent = ''
  rootEl.appendChild(frag)
}

if (localStorage.getItem('token')) {
  drawPostList()
} else {
  drawLoginForm()
}

