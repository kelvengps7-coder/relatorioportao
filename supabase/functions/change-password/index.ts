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

    const { user_id, new_password } = await req.json();

    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: 'User ID e nova senha são obrigatórios' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Changing password for user:', user_id);

    // Change user password using admin API
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      password: new_password
    });

    if (error) {
      console.error('Error changing password:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao alterar senha' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Password changed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }),
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