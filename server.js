const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs-extra');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------- 기본 설정 ---------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'artune_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// --------------------- 데이터 파일 ---------------------
const usersFile = path.join(__dirname, 'data', 'users.json');
const postsFile = path.join(__dirname, 'data', 'posts.json');

// JSON 파일이 없으면 기본 생성
if (!fs.existsSync(usersFile)) fs.writeJsonSync(usersFile, [{ username: 'test', password: 'test' }]);
if (!fs.existsSync(postsFile)) fs.writeJsonSync(postsFile, []);

// --------------------- 업로드 설정 ---------------------
const uploadDir = path.join(__dirname, 'public', 'uploads');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// --------------------- 라우트 ---------------------

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await fs.readJson(usersFile);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ ok: false, error: '아이디 또는 비밀번호가 틀렸습니다.' });
  req.session.user = { username };
  res.json({ ok: true });
});

// 현재 로그인 상태 확인
app.get('/api/current-user', (req, res) => {
  res.json({ user: req.session.user || null });
});

// 로그아웃
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// 웹툰 업로드
app.post('/api/upload', upload.array('images', 10), async (req, res) => {
  if (!req.session.user) return res.json({ ok: false, error: '로그인이 필요합니다.' });
  const { title, description } = req.body;
  if (!title || req.files.length === 0) return res.json({ ok: false, error: '제목과 이미지는 필수입니다.' });

  const posts = await fs.readJson(postsFile);
  const newPost = {
    id: Date.now(),
    title,
    description,
    author: req.session.user.username,
    images: req.files.map(f => '/uploads/' + path.basename(f.path)),
    created_at: new Date()
  };
  posts.unshift(newPost);
  await fs.writeJson(postsFile, posts, { spaces: 2 });
  res.json({ ok: true });
});

// 웹툰 목록
app.get('/api/posts', async (req, res) => {
  const posts = await fs.readJson(postsFile);
  res.json({ ok: true, posts });
});

// 웹툰 상세
app.get('/api/posts/:id', async (req, res) => {
  const posts = await fs.readJson(postsFile);
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.json({ ok: false, error: '웹툰을 찾을 수 없습니다.' });
  res.json({ ok: true, post });
});

// --------------------- 서버 실행 ---------------------
app.listen(PORT, () => console.log(`✅ Artune 서버 실행 중: http://localhost:${PORT}`));
