## 项目名称

MyStream - 自定义 P2P 视频直播系统

## 环境准备

### 配置 mongoDB

在 Docker [[下载网址](https://www.docker.com/products/docker-desktop/)] 下进行安装

```zsh
docker pull mongo:5.0.13

docker run -d --name mongodb -v /home/mongo/db:/data/db -p 27017:27017 mongo:5.0.13
```

### 配置本地 SSL

开启本地 HTTPS 需要额外生成本地 SSL 证书，并在项目中进行引用。

<details>
<summary>使用 <code>mkcert</code> (仅 macOS)</summary>

1. 安装 `mkcert`

   ```zsh
   brew install mkcert
   brew install nss # if you use Firefox
   ```

2. 添加 `mkcert` 到你本地 CA 中

   ```zsh
   mkcert -install
   ```

3. 生成本地证书

   在终端中 `cd` 到本项目的根目录，然后执行

   ```zsh
   mkcert localhost
   mv localhost-key.pem localhost.pem config/cert
   ```

4. [可选] 更改证书引用路径

   如果证书名字有更改的话，在 `nuxt.config.js` 和 `src/api/modules/socket-io/index.ts` 中更改引用路径

</details>

<details>
<summary>使用 OpenSSL</summary>

```zsh
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=Example-Root-CA"
openssl x509 -outform pem -in RootCA.pem -out RootCA.crt

mv RootCA.crt ./config/cert/localhost-cert.crt
mv RootCA.key ./config/cert/localhost-key.key
rm RootCA.pem
```

把证书设置为本地信任，然后检查下列文件中证书引用路径是否正确。

- `nuxt.config.js`
- `src/api/modules/socket-io/index.ts`

</details>

> 相关链接: <https://web.dev/how-to-use-local-https/>

## 项目启动

### 部署网址

#### 本地

- `dev` 启动: <http://localhost:3000>

- `dev:https` 启动: <https://localhost:3000>

> **注意**: 非 https 环境下，无法正常使用 WebRTC.

#### 测试环境

<https://mystream-dev.jonaspete.com>

### 构建命令

#### 安装依赖

```zsh
npm i
```

#### 本地调试 (https)

```zsh
npm run dev:https
```

#### 生产环境

构建并启动服务 (http)

```zsh
npm run build
npm run start
```

---

## 引用

> file-icon-vectors: https://github.com/dmhendricks/file-icon-vectors

App built by NuxtJS.

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
