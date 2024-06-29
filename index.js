// app.js
const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const pool = require('./db'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');


const app = new Koa();
const router = new Router();

// 使用 CORS 中间件并配置
app.use(cors({
    origin: '*', // 可以根据需要更改为特定的源，例如 http://localhost:3001
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser());

router.post('/api/register', async (ctx) => {
    const { username, password, phoneNumber, email } = ctx.request.body;
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
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
  
      await pool.query(
        'INSERT INTO users (username, password, phone_number, email, appointment_status) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, phoneNumber, email, appointmentStatus]
      );
  
      const [userRows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      const user = userRows[0];
  
      const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
  
      ctx.status = 201;
      ctx.body = { token, user };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  });

  router.post('/api/login', async (ctx) => {
    const { username, password } = ctx.request.body;
  
    try {
      const [userRows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  
      if (userRows.length === 0) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid username or password' };
        return;
      }
  
      const user = userRows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
  
      if (!isValidPassword) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid username or password' };
        return;
      }
  
      const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
  
      ctx.status = 200;
      ctx.body = { token, user };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  });

  // 获取用户信息的 API
router.get('/api/user/:id', async (ctx) => {
    const userId = ctx.params.id;
  
    try {
      const [rows] = await pool.query('SELECT username, last_name, first_name, phone_number, email, appointment_date FROM users WHERE id = ?', [userId]);

      if (rows.length > 0) {
        ctx.status = 200;
        ctx.body = rows[0];
      } else {
        ctx.status = 404;
        ctx.body = { error: 'User not found' };
      }
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  });
  
  // 提交预约的 API
  router.post('/api/appointment', async (ctx) => {
    const { userId, lastName, firstName, appointmentDate } = ctx.request.body;
  
    try {
      await pool.query(
        'UPDATE users SET last_name = ?, first_name = ?, appointment_date = ? WHERE id = ?',
        [lastName, firstName, appointmentDate, userId]
      );
      ctx.status = 200;
      ctx.body = { message: 'Appointment scheduled successfully' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  });

  // 更新用户信息的 API
router.put('/api/user/:id', async (ctx) => {
    const userId = ctx.params.id;
    const { username, phoneNumber, email, appointmentDate } = ctx.request.body;
  
    try {
      await pool.query(
        'UPDATE users SET username = ?, phone_number = ?, email = ?, appointment_date = ? WHERE id = ?',
        [username, phoneNumber, email, appointmentDate, userId]
      );
      ctx.status = 200;
      ctx.body = { message: 'Profile updated successfully' };
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  });
  
app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
