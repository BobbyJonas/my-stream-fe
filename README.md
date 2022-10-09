## 项目名称

MyStream - 自定义 P2P 视频直播系统

## 环境准备

### 安装 Docker

https://www.docker.com

### 配置 mongoDB

```zsh
docker pull mongo:5.0.13

docker run -d --name mongodb -v /home/mongo/db:/data/db -p 27017:27017 mongo:5.0.13
```

### 配置本地 SSL

开启本地 HTTPS 需要额外生成本地 SSL 证书，并在项目中进行引用。

- [macOS 推荐] 使用 `mkcert` ([项目链接](https://github.com/FiloSottile/mkcert/releases))
- 使用系统自带的 OpenSSL

> 相关链接: https://web.dev/how-to-use-local-https/

#### 使用 `mkcert` (仅 macOS)

> 1. 安装 `mkcert`
>
>    ```zsh
>    brew install mkcert
>    brew install nss # if you use Firefox
>    ```
>
> 2. 添加 `mkcert` 到你本地 CA 中
>
>    ```zsh
>    mkcert -install
>    ```
>
> 3. 生成本地证书
>
>    在终端中 `cd` 到本项目的根目录，然后执行
>
>    ```zsh
>    mkcert localhost
>    mv localhost-key.pem localhost.pem config/cert
>    ```
>
> 4. [可选] 更改证书引用路径
>
>    如果证书名字有更改的话，在 `nuxt.config.js` 和 `src/api/modules/socket-io/index.ts` 中更改引用路径

#### 使用 OpenSSL

```zsh
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=Example-Root-CA"
openssl x509 -outform pem -in RootCA.pem -out RootCA.crt

mv RootCA.crt ./config/cert/localhost-cert.crt
mv RootCA.key ./config/cert/localhost-key.key
rm RootCA.pem
```

同样地，检查下列文件中的证书引用路径是否正确。

- `nuxt.config.js`
- `src/api/modules/socket-io/index.ts`

## 项目启动

### 部署网址

#### 本地

- `dev` 启动: http://localhost:3000

- `dev:https` 启动: https://localhost:3000

**注意**: 非 https 环境下，无法正常使用 WebRTC.

#### 测试环境

https://mystream-dev.jonaspete.com

### 构建命令

#### 安装依赖

```zsh
npm i
```

#### 开发

- http: `npm run dev`

- https: `npm run dev:https`

#### 生产环境

构建: `npm run build`

启动服务

- http: `npm run start`

- https: `npm run start:https`

---

App built by Nuxt.

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
