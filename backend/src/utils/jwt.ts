import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成JWT令牌
export const generateToken = (userId: string, role: UserRole): string => {
  const payload: JwtPayload = {
    userId,
    role
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// 验证JWT令牌
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// 从请求头中提取令牌
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// 检查令牌是否即将过期（在30分钟内过期）
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const thirtyMinutes = 30 * 60;
    
    return decoded.exp - now < thirtyMinutes;
  } catch (error) {
    return true;
  }
};

// 刷新令牌
export const refreshToken = (oldToken: string): string => {
  try {
    const decoded = verifyToken(oldToken);
    return generateToken(decoded.userId, decoded.role);
  } catch (error) {
    throw new Error('Cannot refresh invalid token');
  }
};