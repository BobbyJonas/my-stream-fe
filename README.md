## 项目名称

MyStream - 自定义 P2P 视频直播系统

## 环境准备

### 安装 mongoDB

#### macOS 系统

1. 安装 homebrew 包管理器

   ```zsh
   ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
   ```

2. 安装 mongoDB

   ```zsh
   brew tap mongodb/brew
   brew install mongodb-community@5.0
   ```

#### Linux 系统

TODO:

### Setup Local HTTPS Cert (macOS)

#### Install `mkcert`

```zsh
brew install mkcert
brew install nss # if you use Firefox
```

#### Add `mkcert` to your local root CAs

```zsh
mkcert -install
```

#### Generate local certificates

In Terminal, navigate to your site's root directory or whichever directory you'd like the certificates to be located at. And run:

```zsh
mkcert localhost
mv localhost-key.pem localhost.pem config
```

#### Add the following to your `nuxt.config.js`

```json
server: {
  https: {
    key: fs.readFileSync(path.resolve(__dirname, 'config/localhost-key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'config/localhost.pem'))
  }
}
```

https://web.dev/how-to-use-local-https/

## 项目启动

### 部署网址

本地：http://localhost:3000

<!-- 测试环境：https://ee-ops-navigate.test.gifshow.com/ -->

<!-- 生产环境：https://ee-ops.corp.kuaishou.com/ -->

### Build Setup

#### install dependencies

```zsh
npm install
```

#### serve with hot reload at localhost:3000

```zsh
npm run dev
```

#### build for production and launch server

```zsh
npm run build
npm run start
```

---

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
