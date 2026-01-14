import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

// Logout Helper
export async function handleLogout() {
  try {
    await supabase.auth.signOut();
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Ensure user profile exists
export async function ensureProfile(user) {
  if (!user) return null;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        is_author: false,
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      console.error('Error ensuring profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    throw error;
  }
}

// Get user role from profile
export async function getUserRole(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to handle no rows gracefully

    if (error) {
      console.error('Error fetching user role:', error);
      return 'user'; // Default to user
    }

    const role = data?.role || 'user';
    console.log('User ID:', userId, 'Role:', role);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

// Auth Guard - Redirect to login if not authenticated
export function RequireAuth({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    
    // Ensure profile exists
    if (session.user) {
      await ensureProfile(session.user);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}

// Redirect authenticated users to dashboard
export function RedirectIfAuthenticated({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

    const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const role = await getUserRole(session.user.id);
      // Redirect to appropriate dashboard based on role
      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        // Authors and regular users go to user dashboard
        navigate('/user/dashboard');
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}

// Require user role (not author/admin)
export function RequireUser({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

    const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const role = await getUserRole(session.user.id);
    
    // Only allow users, redirect admins to admin dashboard
    // Authors stay on user dashboard with author tab
    if (role === 'admin') {
      navigate('/dashboard');
      return;
    }

    setAuthorized(true);
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

// Require author/admin role
export function RequireAuthor({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const role = await getUserRole(session.user.id);
    
    // Only allow authors/admins, redirect users
    if (role === 'user') {
      navigate('/user/dashboard');
      return;
    }

    setAuthorized(true);
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

// Require admin role only
export function RequireAdmin({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const role = await getUserRole(session.user.id);
    
    // Only allow admin, redirect authors to user dashboard
    if (role === 'author') {
      navigate('/user/dashboard');
      return;
    }
    
    // Redirect regular users to user dashboard
    if (role === 'user') {
      navigate('/user/dashboard');
      return;
    }

    setAuthorized(true);
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
