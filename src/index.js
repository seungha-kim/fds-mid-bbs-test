import '@babel/polyfill'

import axios from 'axios'
import {withLoading} from './loading'

const api = axios.create({
  baseURL: 'https://dull-room.glitch.me/'
})

api.interceptors.request.use(function (config) {
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
  commentItem: document.querySelector('#comment-item').content,
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

  const params = new URLSearchParams()

  postList.forEach(postItem => {
    params.append('id', postItem.userId)
  })

  const {data: userList} = await api.get('/users', {
    params
  })

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

    const user = userList.find(user => user.id === postItem.userId)
    authorEl.textContent = user ? user.username : '?'

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
  // 템플릿 복사
  const frag = document.importNode(templates.postDetail, true)

  // 요소 선택
  const titleEl = frag.querySelector('.title')
  const authorEl = frag.querySelector('.author')
  const bodyEl = frag.querySelector('.body')
  const deleteEl = frag.querySelector('.delete')
  const updateEl = frag.querySelector('.update')
  const backEl = frag.querySelector('.back')
  const commentListEl = frag.querySelector('.comment-list')
  const commentFormEl = frag.querySelector('.comment-form')

  // 필요한 데이터 불러오기
  const [
    {data: {title, body, userId}},
    {data: commentList}
  ] = await Promise.all([
    api.get(`/posts/${postId}`),
    api.get(`/posts/${postId}/comments`)
  ])

  const userIds = new Set(commentList.map(item => item.userId))
  userIds.add(userId)

  const params = new URLSearchParams()
  for (const userId of userIds) {
    params.append('id', userId)
  }

  const {data: userList} = await api.get('/users', {
    params
  })

  // 내용 채우기
  titleEl.textContent = title
  bodyEl.textContent = body

  const user = userList.find(item => item.id === userId)
  authorEl.textContent = user ? user.username : '?'
  commentList.forEach(commentItem => {
    const frag = document.importNode(templates.commentItem, true)

    const authorEl = frag.querySelector('.author')
    const bodyEl = frag.querySelector('.body')
    const deleteEl = frag.querySelector('.delete')
    if (commentItem.userId === userId) {
      deleteEl.classList.remove('hidden')
      deleteEl.addEventListener('click', async e => {
        await api.delete(`/comments/${commentItem.id}`)
        drawPostDetail(postId)
      })
    }

    const user = userList.find(item => item.id === commentItem.userId)

    authorEl.textContent = user ? user.username : '?'
    bodyEl.textContent = commentItem.body

    commentListEl.appendChild(frag)
  })

  // 이벤트 리스너 등록하기
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

  commentFormEl.addEventListener('submit', async e => {
    e.preventDefault()
    const body = e.target.elements.body.value
    await api.post(`/posts/${postId}/comments`, {
      body
    })
    drawPostDetail(postId)
  })

  // 문서에 삽입
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

// 로딩 인디케이터 적용
drawEditPostForm = withLoading(drawEditPostForm)
drawLoginForm = withLoading(drawLoginForm)
drawNewPostForm = withLoading(drawNewPostForm)
drawPostDetail = withLoading(drawPostDetail)
drawPostList = withLoading(drawPostList)

// 페이지 로드 시 그릴 화면 설정
if (localStorage.getItem('token')) {
  drawPostList()
} else {
  drawLoginForm()
}

