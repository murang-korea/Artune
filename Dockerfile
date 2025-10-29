# Node.js 18 버전 기반 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 앱 소스 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 앱 실행 명령어
CMD ["npm", "start"]
