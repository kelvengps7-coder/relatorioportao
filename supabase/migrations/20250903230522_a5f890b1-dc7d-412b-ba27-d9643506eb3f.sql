-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create publications table
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_exits INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on publications
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Create policies for publications (accessible to all authenticated users)
CREATE POLICY "Authenticated users can view publications" 
ON public.publications 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create publications" 
ON public.publications 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update publications" 
ON public.publications 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete publications" 
ON public.publications 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create movements table
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste')),
  quantity INTEGER NOT NULL,
  motivo TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create policies for movements
CREATE POLICY "Authenticated users can view movements" 
ON public.movements 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create movements" 
ON public.movements 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create orders table (pedidos)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  requester_name TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Authenticated users can view orders" 
ON public.orders 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" 
ON public.orders 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs (admin only)
CREATE POLICY "Authenticated users can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_publications_code ON public.publications(code);
CREATE INDEX idx_publications_category ON public.publications(category);
CREATE INDEX idx_movements_publication_id ON public.movements(publication_id);
CREATE INDEX idx_movements_created_at ON public.movements(created_at);
CREATE INDEX idx_orders_publication_id ON public.orders(publication_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);