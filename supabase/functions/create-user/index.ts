import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { password, full_name, username, role, email, is_active } = await req.json();

    if (!password || !full_name || !username || !role) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos obrigatórios devem ser preenchidos' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validar email se fornecido
    const userEmail = email || `${username}@congregacao.local`;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Validar role
    const validRoles = ['admin', 'estoquista', 'visualizador'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Nível de acesso inválido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Creating user:', { email: userEmail, full_name, username, role });

    // Check if username or email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .or(`username.eq.${username}${email ? `,email.eq.${email}` : ''}`)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Nome de usuário ou email já está em uso' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Create the user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password,
      user_metadata: {
        full_name,
        username,
        role
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      let errorMessage = 'Erro ao criar usuário';
      if (authError.message.includes('Password')) {
        errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Auth user created:', authUser.user?.id);

    // Create profile entry
    const profileData = {
      user_id: authUser.user!.id,
      full_name,
      username,
      role,
      created_by: authUser.user!.id
    };

    // Adicionar email apenas se foi fornecido
    if (email) {
      (profileData as any).email = email;
    }

    // Adicionar is_active apenas se a coluna existir
    if (is_active !== undefined) {
      (profileData as any).is_active = is_active;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Profile error:', profileError);
      // If profile creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil do usuário' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('User created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: authUser.user!.id,
          full_name,
          username,
          role
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});