# Docker Cho Junior Theo Kiểu Senior Dạy Kèm

Tài liệu này được viết theo một mục tiêu rất rõ: đọc xong bạn không chỉ biết `docker` là gì, mà còn biết khi nào nên dùng, dùng như thế nào, và cách đọc hoặc tự viết `Dockerfile` và `docker-compose.yml` một cách có tư duy.

Nếu coi đây là một buổi senior dạy junior, thì thông điệp quan trọng nhất là:

`Docker không phải phép màu. Docker là cách đóng gói môi trường chạy để code của mình chạy giống nhau ở local, CI và server.`

---

## 1. Docker là gì

Docker giúp bạn đóng gói:

- source code
- dependencies
- runtime
- command để chạy app

thành một gói có thể build và chạy ở mọi nơi.

Bạn hãy hình dung:

- `image` là một "bản đóng gói đã build xong"
- `container` là "một instance đang chạy của image"
- `volume` là nơi giữ dữ liệu để xóa container xong dữ liệu vẫn còn
- `network` là cách các container nói chuyện với nhau

Ví dụ rất đời thường:

- Bạn code ở máy A, chạy được
- Đồng đội clone về máy B, lại lỗi vì khác version Node/Postgres
- Lên server C, lại lỗi tiếp vì config khác

Docker ra đời để giải quyết bài toán "cùng một môi trường" đó.

---

## 2. Khi nào nên dùng Docker

Nên dùng Docker khi:

- app của bạn cần môi trường ổn định và lặp lại được
- dự án có nhiều service như API, DB, Redis, Kafka
- bạn muốn local dev giống production hơn
- team có nhiều người, mỗi người một máy
- bạn muốn CI build và run test trong môi trường nhất quán

Ví dụ nên dùng:

1. Dự án NestJS + Postgres + Redis.
   Không ai muốn mỗi người tự cài Postgres/Redis bằng tay, khác version, khác config.

2. Hệ thống microservices.
   Mỗi service có runtime riêng, Docker giúp spin up nhanh.

3. App cần deploy lên server hoặc Kubernetes.
   Docker image là đơn vị deploy rất thông dụng.

---

## 3. Khi nào không nên làm quá

Không phải lúc nào cũng phải Docker hóa mọi thứ.

Không nên làm quá mức khi:

- bạn đang học một app rất nhỏ, chỉ cần chạy 1 script
- bạn chưa hiểu app đang chạy thế nào mà đã lao vào Docker
- bạn dùng Docker để "che" một app đang config loạn

Senior sẽ ưu tiên:

1. Hiểu app chạy bằng tay thế nào
2. Sau đó mới đóng gói vào Docker

Nếu app chạy bằng tay còn mơ hồ, Docker chỉ làm bài toán rối hơn.

---

## 4. Docker giải bài toán gì trong thực tế

Hãy lấy repo này làm ví dụ.

Hệ thống hiện tại có:

- `apps/api`: NestJS backend
- `apps/web`: Next.js frontend
- `Postgres`
- `Redis`
- `Kafka`
- `Keycloak`

Nếu không có Docker, bạn phải:

- cài Postgres
- cài Redis
- cài Kafka
- cài Keycloak
- tạo DB
- set env
- đảm bảo các port không trùng
- đảm bảo version đúng

Nếu có Docker Compose, bạn có thể dùng một lệnh để dựng toàn bộ stack local.

Đó là lý do Docker rất hợp cho hệ thống có nhiều thành phần.

---

## 5. Các khái niệm bạn phải thuộc lòng

### 5.1 Image

Image là kết quả của quá trình build.
Nó là gói read-only chứa:

- OS base nhẹ
- runtime
- code
- dependency
- startup command

Ví dụ:

```bash
docker build -t studybase-api .
```

Lệnh này build một image tên `studybase-api`.

### 5.2 Container

Container là image đang chạy.

Ví dụ:

```bash
docker run -p 3001:3001 studybase-api
```

Lệnh này lấy image `studybase-api` ra chạy thành container.

### 5.3 Volume

Volume dùng để giữ dữ liệu bên ngoài container.

Ví dụ với Postgres:

- Nếu không có volume: xóa container là mất DB
- Nếu có volume: xóa container, dữ liệu DB vẫn còn

### 5.4 Network

Container trong cùng Docker network có thể gọi nhau bằng tên service.

Ví dụ trong Compose:

- API gọi Postgres qua hostname `postgres`
- API gọi Redis qua hostname `redis`
- API gọi Kafka qua hostname `kafka`

Đó là lý do trong Docker, `localhost` thường không dùng để nói giữa các container.

`localhost` bên trong container là chính nó, không phải máy host và cũng không phải container khác.

---

## 6. Các lệnh Docker cơ bản bạn phải biết

### 6.1 Build image

```bash
docker build -t my-app .
```

Ý nghĩa:

- `docker build`: build image
- `-t my-app`: đặt tên image
- `.`: build context là thư mục hiện tại

### 6.2 Chạy container

```bash
docker run -p 3000:3000 my-app
```

Ý nghĩa:

- `-p 3000:3000`: map cổng host 3000 vào cổng 3000 trong container

### 6.3 Xem container đang chạy

```bash
docker ps
```

### 6.4 Xem log

```bash
docker logs <container_id>
```

Hoặc:

```bash
docker logs -f <container_id>
```

`-f` nghĩa là follow log theo thời gian thực.

### 6.5 Vào bên trong container

```bash
docker exec -it <container_id> sh
```

Đây là lệnh senior dùng rất nhiều để debug.

### 6.6 Xóa container đã dừng

```bash
docker rm <container_id>
```

### 6.7 Xóa image

```bash
docker rmi my-app
```

---

## 7. Dockerfile là gì và đọc như thế nào

`Dockerfile` là công thức để build image.

Bạn đọc từ trên xuống dưới.
Mỗi lệnh tạo ra một layer.

Một Dockerfile đơn giản cho Node.js có thể như sau:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Giải thích từng dòng

```dockerfile
FROM node:20-alpine
```

Ý nghĩa:

- Lấy image gốc là Node.js version 20
- Bản Alpine nhẹ hơn, thích hợp cho nhiều use case thông thường

```dockerfile
WORKDIR /app
```

Ý nghĩa:

- Mọi lệnh sau đó sẽ làm việc trong thư mục `/app`
- Bạn không cần viết lại đường dẫn dài dòng

```dockerfile
COPY package.json package-lock.json ./
```

Ý nghĩa:

- Copy file khai báo dependencies vào image trước
- Đây là kỹ thuật quan trọng để tận dụng build cache

```dockerfile
RUN npm ci
```

Ý nghĩa:

- Cài dependencies
- `npm ci` ưu tiên cho build reproducible hơn `npm install`
- Nếu lockfile đổi thì mới cần cài lại

```dockerfile
COPY . .
```

Ý nghĩa:

- Sau khi install dependency xong mới copy source code
- Nếu code đổi mà dependency không đổi, layer cài dependency vẫn được dùng lại

```dockerfile
EXPOSE 3000
```

Ý nghĩa:

- Tài liệu hóa rằng app sẽ lắng nghe cổng 3000
- Không tự động mở cổng ra ngoài

```dockerfile
CMD ["npm", "start"]
```

Ý nghĩa:

- Lệnh mặc định khi container start

---

## 8. Một sai lầm junior rất hay mắc khi viết Dockerfile

### Sai lầm 1: Copy hết source quá sớm

Sai:

```dockerfile
COPY . .
RUN npm install
```

Vấn đề:

- Mỗi lần sửa 1 file nhỏ, Docker phải cài lại dependency

Đúng hơn:

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

### Sai lầm 2: Không dùng lockfile

Nếu không copy `package-lock.json`, mỗi lần build có thể lấy dependency khác nhau.

### Sai lầm 3: Không có `.dockerignore`

Nếu không có `.dockerignore`, bạn có thể gửi vào build context cả:

- `.git`
- `node_modules`
- logs
- `.next`
- `dist`

Điều này làm build chậm và image bẩn.

---

## 9. Multi-stage build là gì

Khi app bắt đầu phức tạp hơn, một Dockerfile tốt thường có nhiều stage.

Ví dụ:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

### Vì sao phải tách stage

`deps` stage:

- cài dependency

`builder` stage:

- build source code thành artifact

`runner` stage:

- chỉ giữ những gì cần để chạy

Lợi ích:

- image nhẹ hơn
- sạch hơn
- ít file thừa hơn
- an toàn hơn

---

## 10. Docker Compose là gì

Nếu Dockerfile là công thức cho 1 app, thì `docker-compose.yml` là nơi bạn mô tả nhiều service cùng lúc.

Ví dụ:

```yaml
services:
  api:
    build: .
    ports:
      - "3001:3001"

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
```

Ý nghĩa:

- `api` là service build từ source code
- `postgres` là service dùng image có sẵn
- Hai service này lên cùng nhau trong cùng một network

Compose rất hợp cho:

- local dev full stack
- integration test
- hệ thống có DB/cache/message broker đi kèm

---

## 11. Ví dụ Compose thực tế và giải thích code senior đang viết

Mình viết một ví dụ rất sát với repo này, nhưng có rút gọn để dễ học:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/appdb
    ports:
      - "3001:3001"

volumes:
  postgres_data:
```

### Giải thích từng khối

```yaml
services:
```

Ý nghĩa:

- Bắt đầu khai báo danh sách service

```yaml
  postgres:
    image: postgres:16-alpine
```

Ý nghĩa:

- Dùng image Postgres có sẵn
- Không cần viết Dockerfile riêng cho Postgres trong use case local đơn giản

```yaml
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

Ý nghĩa:

- Truyền biến môi trường cho container Postgres
- Đây là cách image Postgres biết cần tạo DB nào, user nào

```yaml
    ports:
      - "5432:5432"
```

Ý nghĩa:

- Map cổng từ host vào container
- Máy bạn có thể dùng DB tool kết nối vào `localhost:5432`

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Ý nghĩa:

- Không để dữ liệu DB mất khi recreate container

```yaml
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
```

Ý nghĩa:

- Service `api` sẽ được build từ source code của repo
- `context: .` nghĩa là build context là root repo
- `dockerfile: apps/api/Dockerfile` nghĩa là dùng file Dockerfile này để build

```yaml
    depends_on:
      - postgres
```

Ý nghĩa:

- Compose sẽ start `postgres` trước `api`

Nhưng senior cảnh báo ngay:

`depends_on` không có nghĩa là Postgres đã ready.

Nó chỉ nghĩa là container Postgres được start trước.
DB vẫn có thể chưa sẵn sàng nhận kết nối.

```yaml
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/appdb
```

Ý nghĩa:

- API sẽ kết nối DB qua hostname `postgres`
- Đây là tên service trong Docker network

Đây là điểm rất quan trọng:

- Trong container, dùng `postgres`
- Trên máy host, dùng `localhost`

Nếu nhầm 2 cái này, bạn sẽ debug rất lâu.

---

## 12. Trường hợp thực tế nên dùng Docker

### Trường hợp 1: Team có 3 người, máy mỗi người khác nhau

Dùng Docker để:

- đồng bộ môi trường
- tránh "máy em chạy, máy anh lỗi"
- spin up DB/cache nhanh

### Trường hợp 2: App cần Postgres + Redis + Kafka

Dùng Docker Compose để:

- dựng nhiều service bằng 1 lệnh
- dễ test integration local

### Trường hợp 3: CI cần build và test ổn định

Dùng Docker để:

- build app trong môi trường có kiểm soát
- tránh CI chạy khác local

### Trường hợp 4: Deploy lên server/container platform

Dùng Docker image làm artifact deploy:

- build 1 lần
- deploy nhiều nơi
- ít sai lệch môi trường

---

## 13. Trình tự học và dùng Docker như senior

Đây là trình tự senior khuyên junior:

1. Chạy app bằng tay trước
   Bạn phải biết app cần gì để chạy.

2. Viết Dockerfile cho app đơn lẻ
   Chỉ đóng gói 1 service trước.

3. Thêm Compose cho DB/cache phụ trợ
   Lúc này mới bắt đầu local full stack.

4. Tối ưu build cache
   Sắp xếp `COPY`, lockfile, multi-stage.

5. Thêm readiness và healthcheck
   Đây là bước chuyển từ "chạy được" sang "ổn định hơn".

6. Phân biệt local và production
   Local có thể để nhanh.
   Production phải kỷ luật hơn.

---

## 14. Cách dùng Docker hằng ngày

### Build lại image

```bash
docker compose build
```

### Dựng stack

```bash
docker compose up
```

### Dựng stack ở background

```bash
docker compose up -d
```

### Xem log

```bash
docker compose logs -f api
```

### Vào container API

```bash
docker compose exec api sh
```

### Tắt stack

```bash
docker compose down
```

### Tắt stack và xóa volume

```bash
docker compose down -v
```

Cẩn thận:

- `down -v` sẽ xóa dữ liệu volume local
- với Postgres, nghĩa là DB có thể bị mất

---

## 15. Những lưu ý mà senior sẽ nhắc junior liên tục

### 15.1 Docker không thay thế hiểu biết hệ thống

Bạn vẫn phải biết:

- app chạy bằng lệnh nào
- app đọc env nào
- app nối DB/cache ra sao

### 15.2 Không hard-code secrets trong Dockerfile

Secret nên đưa qua:

- env file local
- CI variables
- secret manager

### 15.3 Không nhầm `localhost`

Nhớ quy tắc:

- host máy bạn: `localhost`
- giữa container với nhau: tên service như `postgres`, `redis`, `api`

### 15.4 `depends_on` không đủ

Nếu hệ thống có nhiều service, cần thêm:

- healthcheck
- retry kết nối
- readiness strategy

### 15.5 Docker tốt là Docker dễ debug

Nếu image bạn build xong mà không dễ debug, đội sẽ rất khó vận hành.
Hãy biết:

- xem log
- vào shell
- xem env
- test kết nối nội bộ

---

## 16. Đọc nhanh Docker trong repo này theo góc nhìn junior

Repo này đang có:

- [`docker-compose.yml`](/Users/vietnguyenduc/Documents/Code/Study/study_economy/docker-compose.yml)
- [`apps/api/Dockerfile`](/Users/vietnguyenduc/Documents/Code/Study/study_economy/apps/api/Dockerfile)
- [`apps/web/Dockerfile`](/Users/vietnguyenduc/Documents/Code/Study/study_economy/apps/web/Dockerfile)

Ý nghĩa tổng quát:

- Compose dùng để dựng cả stack local
- Dockerfile API dùng để build NestJS app thành image
- Dockerfile Web dùng để build Next.js app thành image

Nội dung học sau tài liệu này:

1. Bạn đọc Dockerfile từ trên xuống
2. Bạn tự hỏi mỗi dòng đang giải bài toán gì
3. Bạn check xem layer nào dùng cho build, layer nào dùng cho run
4. Bạn check xem env nào dùng cho host, env nào dùng cho container network

Nếu bạn giữ được 4 câu hỏi đó, bạn sẽ đọc Docker nhanh hơn rất nhiều.

---

## 17. Một ví dụ tư duy để bạn tự đánh giá Dockerfile của chính mình

Khi viết xong Dockerfile, hãy tự hỏi:

1. Dockerfile này build có lặp lại được không?
2. Có dùng lockfile chưa?
3. Có tối ưu cache chưa?
4. Có copy file thừa vào image không?
5. Runtime image có gọn không?
6. Startup command có rõ ràng không?
7. Nếu DB chưa ready thì app sẽ ra sao?
8. Nếu đồng đội mới clone repo, họ có chạy được không?

Nếu trả lời yếu ở 3 câu trở lên, Docker của bạn chưa ổn.

---

## 18. Kết luận

Nếu học Docker theo kiểu senior dạy junior, thì thứ tự đúng nên là:

1. Hiểu bài toán môi trường chạy
2. Hiểu image, container, volume, network
3. Hiểu Dockerfile và cache
4. Hiểu Compose và quan hệ giữa các service
5. Biết khi nào dùng `localhost`, khi nào dùng tên service
6. Biết debug bằng log, exec, ps
7. Biết phân biệt local convenience và production discipline

Nếu bạn muốn nhớ 1 câu duy nhất, hãy nhớ câu này:

`Docker không chỉ để chạy app. Docker là cách đóng gói và quản lý môi trường chạy một cách có kỷ luật.`

Khi bạn hiểu tới đây, bạn đã đi qua mức "chỉ biết dùng lệnh" và bắt đầu có tư duy của người làm hệ thống.
