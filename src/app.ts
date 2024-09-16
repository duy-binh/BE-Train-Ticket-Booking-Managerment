import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import cookieParser from 'cookie-parser';  // Nhập khẩu cookie-parser

dotenv.config();
connectDB();

const app = express();

// Cấu hình CORS
const allowedOrigins = ['https://user.example.com', 'https://dashboard.example.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Cho phép yêu cầu từ origin hợp lệ
    } else {
      callback(new Error('Not allowed by CORS')); // Từ chối yêu cầu từ origin không hợp lệ
    }
  },
  credentials: true,
}));

// Cấu hình cookie-parser
app.use(cookieParser());  // Thêm middleware cookie-parser

app.use(express.json());

app.use('/api/auth', userRoutes); // Định nghĩa route

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(errorHandler); // Middleware xử lý lỗi

export default app;
