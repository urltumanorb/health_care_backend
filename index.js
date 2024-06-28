// app.js
const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const pool = require('./db'); // 确保你已经配置好db.js

const app = new Koa();
const router = new Router();

// 使用 CORS 中间件并配置
app.use(cors({
    origin: '*', // 可以根据需要更改为特定的源，例如 http://localhost:3001
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser());

router.post('/api/register', async ctx => {
    const { username, password, phoneNumber, email } = ctx.request.body;

    try {
        // 检查手机号和邮箱是否已经存在
        const [phoneRows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
        const [emailRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (phoneRows.length > 0) {
            ctx.status = 400;
            ctx.body = { error: 'Phone number already exists' };
            return;
        }

        if (emailRows.length > 0) {
            ctx.status = 400;
            ctx.body = { error: 'Email already exists' };
            return;
        }

        // 插入新用户
        await pool.query(
            'INSERT INTO users (username, password, phone_number, email) VALUES (?, ?, ?, ?)',
            [username, password, phoneNumber, email]
        );

        ctx.status = 201;
        ctx.body = { message: 'User registered successfully' };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { error: err.message };
    }
});

router.get('/api/users', async ctx => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        ctx.body = rows;
    } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
    }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
