## MyStream

自定义 P2P 视频直播系统 (前端)

### Setup Local HTTPS Cert

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

### Build Setup

#### install dependencies

```bash
npm install
```

#### serve with hot reload at localhost:3000

```bash
npm run dev
```

#### build for production and launch server

```bash
npm run build
npm run start
```

#### generate static project

```bash
npm run generate
```

---

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
