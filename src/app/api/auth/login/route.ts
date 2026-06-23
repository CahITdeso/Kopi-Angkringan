import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const users: any = await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (Array.isArray(users) && users.length > 0) {
      const user = users[0];
      return Response.json({ 
        success: true, 
        user: { id: user.id, nama: user.nama, username: user.username, role: user.role } 
      });
    }
    return Response.json({ success: false, message: 'Username atau password salah' });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}