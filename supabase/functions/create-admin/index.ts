import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if admin user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser.users.some(user => user.email === 'admin@congregacao.local');

    if (adminExists) {
      return new Response(
        JSON.stringify({ message: 'Admin user already exists' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create admin user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@congregacao.local',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        full_name: 'Administrador',
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      throw createError;
    }

    console.log('Admin user created successfully:', userData.user?.id);

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        user_id: userData.user?.id,
        email: 'admin@congregacao.local',
        password: 'admin123'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in create-admin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});