# PiWar Click Game Api

## 介绍

一个简单的点击游戏，使用 Node+TypeScript+Express+Mysql+Redis+RabbitMQ 实现开发

## 准备环境

- Node 14.x
- TypeScript 4.x
- Express 4.x
- Mysql 8.x
- Redis 7.x
- RabbitMQ 3.x

## **RabbitMQ 安装**

1、安装 erlang

```bash
# 终端输入
brew install erlang

```

2、安装 RabbitMQ

```bash
# 终端输入
brew install rabbitmq

```

3、配置 RabbitMQ 环境变量

```bash
# 终端输入
vi ~/.bash_profile

# 添加以下内容
export PATH=$PATH:/usr/local/sbin

# 或者
vim ~/.bash_profile

export RABBIT_HOME=/usr/local/Cellar/rabbitmq/3.12.12
export PATH=$PATH:$RABBIT_HOME/sbin

# 更新配置 终端输入
source ~/.bash_profile
```

4、安装 RabiitMQ 的可视化监控插件

```bash
# 终端输入
sudo sbin/rabbitmq-plugins enable rabbitmq_management

```

5、 关于 RabbitMQ

```bash
# 终端输入 1、后台启动
sudo rabbitmq-server -detached

# 2、查看状态
sudo rabbitmqctl status

# 3、停止服务
sudo rabbitmqctl stop



```

6、访问可视化监控插件的界面 http://localhost:15672/ 登录 RabbitMQ
默认的用户名密码都是 guest，登录后可以在 Admin 那一列菜单内添加自己的用户

7、生成加密私钥

```bash
# 终端输入
openssl genpkey -algorithm RSA -out private_key.pem -aes256 -pass pass:JL125800..
openssl rsa -pubout -in private_key.pem -out public_key.pem

# 查看私钥
cat public_key.pem

# 将私钥解密并转换为不加密的 PKCS#1 格式
openssl rsa -in private_key.pem -out private_key_pkcs1.pem
```

## 安装 ts-node

yarn global add ts-node

## 启动

```bash
# 安装依赖

sudo chown -R wuwei:wuwei /opt/NodeApp/Pi-war-api
npm install
yarn

# 安装运行环境
# 1.启动mysql
brew services start mysql
# 2.启动redis
brew services start redis
# 3.启动rabbitmq
cd /opt/homebrew/Cellar/rabbitmq/3.13.3
sudo sbin/rabbitmq-plugins enable rabbitmq_management
sudo rabbitmq-server -detached

# 启动以下服务
#1.启动api
yarn start
#2.启动websocket
yarn wssever


```
# memes-api
# ts-node-v2-examples
# ts-node-v2-examples
