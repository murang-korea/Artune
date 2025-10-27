const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'artune_secret',
  resave: false,
  saveUninitialized: true
}));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// 간단한 유저 DB (메모리)
const users = [{ username: 'test', password: 'test' }];

// 간단한 게시물 DB (메모리)
let posts = [];
let postId = 1;

// ------------------- API ------------------- //

// 로그인
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if(user){
    req.session.user = { username };
    res.json({ ok: true });
  } else res.json({ ok: false, error: '아이디 또는 비밀번호 틀림' });
});

// 현재 로그인 사용자
app.get('/api/current-user', (req, res) => {
  res.json({ user: req.session.user || null });
});

// 게시물 업로드
app.post('/api/upload-post', upload.array('images', 10), (req, res) => {
  if(!req.session.user) return res.json({ ok:false, error:'로그인이 필요함' });
  const { title } = req.body;
  if(!title || req.files.length===0) return res.json({ ok:false, error:'제목/이미지 필요' });
  const newPost = {
    id: postId++,
    title,
    author: req.session.user.username,
    images: req.files.map(f => '/uploads/' + f.filename),
    created_at: new Date()
  };
  posts.unshift(newPost);
  res.json({ ok:true, postId: newPost.id });
});

// 게시물 리스트
app.get('/api/posts', (req, res) => {
  res.json({ ok:true, posts });
});

// 게시물 상세
app.get('/api/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts.find(p=>p.id===id);
  if(!post) return res.json({ ok:false, error:'게시물 없음' });
  res.json({ ok:true, post });
});

// ------------------- 정적 파일 ------------------- //
app.use(express.static(path.join(__dirname, 'public')));

// 모든 라우트 처리
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

// ------------------- 서버 시작 ------------------- //
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
