# SmartScreenUI - Docker 部署指南

## 使用 Docker Compose（推荐）

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

访问：http://your-server-ip:8080

## 使用 Docker 命令

```bash
# 构建镜像
docker build -t smartscreen-ui .

# 运行容器
docker run -d -p 8080:80 --name smartscreen smartscreen-ui

# 停止和删除
docker stop smartscreen
docker rm smartscreen
```

## 导出镜像（可选）

```bash
# 导出镜像
docker save -o smartscreen-ui.tar smartscreen-ui

# 在目标服务器导入
docker load -i smartscreen-ui.tar
```
