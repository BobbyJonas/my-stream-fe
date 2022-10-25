### config 目录

此目录存放一系列配置文件

#### `pipe` 目录

存放 devOps 流水线相关的脚本

#### `cert` 目录

存放 HTTPS 证书文件，目前有以下 2 个文件：

- `localhost-cert.pem`
- `localhost-key.pem`

出于安全隐私问题未上传。

> **[注意]**
>
> 后续需要更改 HTTPS 证书的话，请替换当前目录下的上述两个文件，
>
> 并在以下文件中修改目录引用:
>
> - Nuxt App 服务配置: `nuxt.config.ts` (67 行)
> - Socket-io 服务配置: `src/api/modules/socket-io/index.ts` (20 行)
